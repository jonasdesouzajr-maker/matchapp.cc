// ============================================================
// MatchApp — gemini-proxy Edge Function
// ------------------------------------------------------------
// WHY THIS FILE EXISTS
// Every AI match and every "Ask AI" search was silently falling
// back to offline mode. Root cause: Google shut down Gemini 1.0,
// 1.5, and 2.0 Flash between early and mid-2026 — any call to a
// retired model name returns 404, and the frontend was written to
// treat any proxy failure as "AI unavailable, use the fallback."
// If this function was pointed at one of those retired models
// (likely, given when it was first built), it has been 404-ing on
// every single call ever since, invisibly.
//
// THE FIX
// This version tries a short chain of currently-supported models,
// newest-and-cheapest first, and only falls through to the next
// one on an actual failure — so a future Google deprecation alone
// doesn't take the feature down again.
//
// PROMPT ENGINEERING NOW LIVES HERE, NOT IN THE BROWSER
// The AI Concierge's actual instructions — how it should behave,
// what tone to use, how results are structured — used to be built
// as a plain-text string in discover.js, fully visible to anyone
// who opened browser DevTools. That's the one part of this feature
// that's genuinely worth keeping server-side: it's the "how" behind
// the AI Concierge, not public information about the product. The
// client now sends structured parameters (question, language,
// country, age) and this function assembles the actual prompt.
// Everything else about MatchApp — its UI, its catalog, its
// features — is necessarily visible in the browser, because that's
// how the web works; see the accompanying note in supabase/README.md.
// ============================================================

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANG_NAMES: Record<string, string> = {
  en: "English", "pt-BR": "Brazilian Portuguese", es: "Spanish", fr: "French",
  de: "German", it: "Italian", tr: "Turkish", ru: "Russian", ar: "Arabic",
  hi: "Hindi", id: "Indonesian", ja: "Japanese", ko: "Korean", zh: "Chinese",
};

const DISCOVER_MAX = 12;

function detectAudioIntent(q: string): boolean {
  return /\b(podcast|playlist|song|songs|music|album|albums|single|singles|audiobook|spotify|listen|radio show)\b/i.test(q);
}

// Builds the AI Concierge's actual conversational prompt server-side.
function buildDiscoverPrompt(question: string, langCode: string, country: string, age: string, history?: Array<{role: string, text: string}>): string {
  const lang = LANG_NAMES[langCode] || "English";
  const audioIntent = detectAudioIntent(question);

  let personal = "";
  if (country) personal += ` The viewer is in ${country}; prefer titles genuinely available there.`;
  if (age) personal += ` The viewer is ${age} years old; keep suggestions age-appropriate.`;

  // Prior turns, so follow-ups ("what about something funnier?") make sense.
  let context = "";
  if (history && history.length) {
    const transcript = history
      .slice(-8) // keep the last few turns; enough for context without bloating the prompt
      .map((h) => `${h.role === "user" ? "User" : "You"}: ${h.text}`)
      .join("\n");
    context =
      `Here is the conversation so far:\n${transcript}\n\n` +
      `This is a follow-up in that ongoing conversation — take the earlier turns into account, ` +
      `and don't repeat titles you already recommended unless the user asks about them specifically.\n\n`;
  }

  return (
    context +
    `You are the friendly, knowledgeable AI concierge inside MatchApp, a streaming discovery app. ` +
    `A user just asked you: "${question}"\n\n` +
    `Respond exactly like a real, warm, well-informed person would in a chat — not a search engine. ` +
    `Write 2-4 natural sentences that directly answer what they asked, using your own knowledge of movies, ` +
    `TV series, documentaries, K-dramas, anime, telenovelas, podcasts, music and audiobooks. ` +
    `Be specific and genuinely helpful, the way you'd explain it to a friend.${personal}\n\n` +
    (audioIntent
      ? `This question is about audio content (podcasts, music, playlists, or audiobooks) — only suggest audio titles.`
      : `This question is about something to watch — only suggest movies, series, documentaries or similar visual titles, not podcasts or music, unless the user explicitly asked for audio.`) +
    `\n\nCRITICAL: Write your "answer" field in ${lang}, matching the language the user asked in. ` +
    `Then list 3 to ${DISCOVER_MAX} real, existing titles that back up your answer, best match first. ` +
    `If the question is conversational rather than a request for titles, still answer warmly and you may ` +
    `return an empty results array.\n` +
    `Output valid JSON ONLY, no markdown fences, no text outside the JSON: ` +
    `{"answer":"Your natural 2-4 sentence conversational reply in ${lang}.","results":[{"title":"Exact Title","year":"YYYY","type":"movie|series|documentary|podcast|music","platform":"Where to watch or listen","synopsis":"One or two sentences, in ${lang}."}]}`
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY secret is not set on this Edge Function." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    let prompt: string;

    if (body && body.mode === "discover" && typeof body.question === "string") {
      // AI Concierge path: build the real prompt here, server-side.
      prompt = buildDiscoverPrompt(
        body.question,
        typeof body.lang === "string" ? body.lang : "en",
        typeof body.country === "string" ? body.country : "",
        typeof body.age === "string" || typeof body.age === "number" ? String(body.age) : "",
        Array.isArray(body.history) ? body.history : []
      );
    } else if (typeof body?.prompt === "string") {
      // Legacy path: the main questionnaire match engine still sends a
      // pre-built prompt directly. Kept for backward compatibility.
      prompt = body.prompt;
    } else {
      return new Response(
        JSON.stringify({ error: "Request body must include either a string 'prompt' field, or mode:'discover' with a 'question' field." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    let lastError: string | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          // Surface which model actually answered — useful for debugging
          // in the browser console without needing Supabase log access.
          return new Response(JSON.stringify({ ...data, _servedByModel: model }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        // 404 = model retired/unknown; try the next one in the chain.
        // Any other status (401, 429, 500...) is not a model problem,
        // so stop and report it immediately instead of silently retrying.
        if (geminiRes.status === 404) {
          lastError = `${model}: 404 (model unavailable)`;
          continue;
        }

        const errBody = await geminiRes.text();
        return new Response(
          JSON.stringify({ error: `Gemini API error on ${model}: ${geminiRes.status}`, detail: errBody }),
          { status: geminiRes.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      } catch (e) {
        lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    // Every model in the chain failed.
    return new Response(
      JSON.stringify({ error: "All Gemini models in the fallback chain failed.", detail: lastError }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
