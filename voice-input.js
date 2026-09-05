/* ============================================================
   © 2026 MatchApp.cc — All Rights Reserved.
   Proprietary source code. Not licensed for reproduction, scraping,
   or reuse in competing products. See /terms.html Section 4.
   ============================================================ */

/* ============================================================
   MatchApp — VOICE INPUT (speak to the AI concierge)
   ------------------------------------------------------------
   Lets visitors speak their question instead of typing it, in
   whichever language the UI is currently set to. Purely client-side
   via the browser's built-in Web Speech API — MatchApp's servers
   never receive or store audio, only the transcribed text the
   browser produces.

   HONEST LIMITATION: SpeechRecognition is supported in Chrome, Edge,
   and Safari (desktop + iOS 14.5+), but Firefox has never shipped a
   native implementation. Rather than show a mic button that silently
   fails there, this module hides it entirely on unsupported browsers.
   ============================================================ */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const VOICE_INPUT_SUPPORTED = !!SR;

const SPEECH_LANG_MAP = {
    'en': 'en-US', 'pt-BR': 'pt-BR', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'tr': 'tr-TR', 'ru': 'ru-RU', 'ar': 'ar-SA', 'hi': 'hi-IN',
    'id': 'id-ID', 'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN'
};

/**
 * Wires a microphone button to an input field.
 * @param {string} inputId - id of the text input to populate
 * @param {string} micBtnId - id of the mic button
 * @param {function} onFinalTranscript - called with the final transcript once speech ends
 */
function initVoiceInput(inputId, micBtnId, onFinalTranscript) {
    const input = document.getElementById(inputId);
    const micBtn = document.getElementById(micBtnId);
    if (!input || !micBtn) return;

    if (!VOICE_INPUT_SUPPORTED) {
        micBtn.style.display = 'none';
        return;
    }
    micBtn.style.display = 'inline-flex';

    let recognition = null;
    let listening = false;
    const originalPlaceholder = input.getAttribute('placeholder') || '';

    function tr(key, fallback) {
        return (typeof t === 'function' && t(key)) || fallback;
    }

    function stopListening() {
        if (recognition) { try { recognition.stop(); } catch (e) {} }
        listening = false;
        micBtn.classList.remove('mic-listening');
        input.placeholder = originalPlaceholder;
    }

    micBtn.addEventListener('click', () => {
        if (listening) { stopListening(); return; }

        recognition = new SR();
        recognition.lang = SPEECH_LANG_MAP[window.MATCH_LANG] || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            listening = true;
            micBtn.classList.add('mic-listening');
            input.value = '';
            if (window.autoGrowComposer) window.autoGrowComposer();
            input.placeholder = tr('voice.listening', '🎙️ Listening... speak now');
        };

        recognition.onresult = (e) => {
            let interim = '', final = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += transcript;
                else interim += transcript;
            }
            input.value = final || interim;
            // Keep the composer growing in real time as speech streams in.
            if (window.autoGrowComposer) window.autoGrowComposer();
            if (final.trim()) {
                stopListening();
                if (onFinalTranscript) onFinalTranscript(final.trim());
            }
        };

        recognition.onerror = (e) => {
            stopListening();
            if (e.error === 'not-allowed' || e.error === 'permission-denied' || e.error === 'service-not-allowed') {
                if (window.showToast) showToast(tr('voice.micDenied', '🎙️ Microphone access was blocked — check your browser permissions.'), true);
            } else if (e.error === 'no-speech') {
                if (window.showToast) showToast(tr('voice.noSpeech', "Didn't catch that — try again."), true);
            }
            // network/aborted errors fail quietly; the mic button just resets
        };

        recognition.onend = () => stopListening();

        try { recognition.start(); }
        catch (e) { stopListening(); }
    });
}

window.initVoiceInput = initVoiceInput;
window.VOICE_INPUT_SUPPORTED = VOICE_INPUT_SUPPORTED;