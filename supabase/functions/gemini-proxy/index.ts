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
// ============================================================

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Request body must include a string 'prompt' field." }),
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
