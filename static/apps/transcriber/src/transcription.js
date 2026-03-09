/**
 * Transcription via Whisper API and language management
 */

let transcriptionLanguage = 'en'; // Default to English
let isProcessingWithWhisper = false;
let currentTranscript = '';
let transcriptionSegments = [];

// Load user's language preference from localStorage
function loadUserLanguagePreference() {
    const saved = localStorage.getItem('transcription_language');
    if (saved) {
        transcriptionLanguage = saved;
        updateLanguageButtonActive();
    }
}

// Save user's language preference to localStorage
function saveUserLanguagePreference(language) {
    transcriptionLanguage = language;
    localStorage.setItem('transcription_language', language);
}

// Update language button active state
function updateLanguageButtonActive() {
    const languageBtns = document.querySelectorAll('.language-btn');
    languageBtns.forEach(btn => {
        if (btn.getAttribute('data-language') === transcriptionLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Get current transcription language
function getTranscriptionLanguage() {
    return transcriptionLanguage;
}

// Set transcription language
function setTranscriptionLanguage(language) {
    transcriptionLanguage = language;
    saveUserLanguagePreference(language);
    updateLanguageButtonActive();
}

// Get transcription state
function getTranscriptionState() {
    return {
        transcriptionLanguage,
        currentTranscript,
        transcriptionSegments,
        isProcessingWithWhisper
    };
}

// Update transcription state
function updateTranscriptionState(state) {
    if (state.currentTranscript !== undefined) currentTranscript = state.currentTranscript;
    if (state.transcriptionSegments !== undefined) transcriptionSegments = state.transcriptionSegments;
    if (state.isProcessingWithWhisper !== undefined) isProcessingWithWhisper = state.isProcessingWithWhisper;
}

// Send audio to Whisper API for transcription
async function sendAudioToWhisper(audioBlob, language = 'en') {
    try {
        isProcessingWithWhisper = true;
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Transcribing...';

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', language);

        const response = await fetch(
            'https://llm.netlight.ai/v1/audio/transcriptions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        isProcessingWithWhisper = false;

        // Update transcript
        currentTranscript = result.text || '';
        transcriptionSegments = result.segments || [];

        const display = document.getElementById('transcriptionDisplay');
        display.textContent = currentTranscript || '';
        display.classList.remove('empty');
        display.scrollTop = display.scrollHeight;

        status.textContent = 'Transcription complete';

        return { text: result.text, segments: result.segments };
    } catch (error) {
        console.error('Error transcribing audio:', error);
        isProcessingWithWhisper = false;
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Transcription failed: ' + error.message;
        return null;
    }
}

// Get current transcript
function getCurrentTranscript() {
    return currentTranscript;
}

// Set current transcript
function setCurrentTranscript(transcript) {
    currentTranscript = transcript;
}

// Get transcription segments
function getTranscriptionSegments() {
    return transcriptionSegments;
}

// Set transcription segments
function setTranscriptionSegments(segments) {
    transcriptionSegments = segments;
}

export {
    loadUserLanguagePreference,
    saveUserLanguagePreference,
    updateLanguageButtonActive,
    getTranscriptionLanguage,
    setTranscriptionLanguage,
    getTranscriptionState,
    updateTranscriptionState,
    sendAudioToWhisper,
    getCurrentTranscript,
    setCurrentTranscript,
    getTranscriptionSegments,
    setTranscriptionSegments
};
