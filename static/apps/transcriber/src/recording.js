/**
 * Recording management and audio capture
 */

import { saveMeetingToSupabase } from './database.js';
import { sendAudioToWhisper } from './transcription.js';

// Recording state
let isRecording = false;
let isPaused = false;
let currentTranscript = '';
let transcriptionSegments = [];
let recordingStartTime = null;
let timerInterval = null;
let isRestarting = false;
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recordingMode = 'microphone'; // 'microphone' or 'screen_audio'
let screenStream = null;

// Get recording state
function getRecordingState() {
    return {
        isRecording,
        isPaused,
        currentTranscript,
        transcriptionSegments,
        recordingMode
    };
}

// Update recording state
function updateRecordingState(state) {
    if (state.isRecording !== undefined) isRecording = state.isRecording;
    if (state.isPaused !== undefined) isPaused = state.isPaused;
    if (state.currentTranscript !== undefined) currentTranscript = state.currentTranscript;
    if (state.transcriptionSegments !== undefined) transcriptionSegments = state.transcriptionSegments;
    if (state.recordingMode !== undefined) recordingMode = state.recordingMode;
}

// Start recording
async function startRecording() {
    isRecording = true;
    isPaused = false;
    currentTranscript = '';
    transcriptionSegments = [];
    recordingStartTime = Date.now();
    audioChunks = [];

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Stop';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = false;

    const status = document.getElementById('recordingStatus');
    status.classList.add('recording');

    // Start audio recording based on recording mode
    try {
        let stream;

        if (recordingMode === 'screen_audio') {
            // Screen + Audio mode
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: true,
                    video: true
                });
                stream = screenStream;
                status.textContent = 'Capturing (Screen + Audio)';
                console.log('Screen + Audio recording started');
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    status.textContent = 'Screen capture cancelled';
                    isRecording = false;
                    recordBtn.textContent = 'Record Meeting';
                    pauseBtn.disabled = true;
                    status.classList.remove('recording');
                    return;
                }
                throw err;
            }
        } else {
            // Microphone-only mode (default)
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream = audioStream;
            status.textContent = 'Listening (Microphone)';
            console.log('Microphone recording started');
        }

        // Extract audio track and create MediaRecorder
        if (recordingMode === 'screen_audio' && stream.getAudioTracks().length > 0) {
            // audioTrack used for potential future features
        } else if (recordingMode === 'microphone') {
            // audioTrack used for potential future features
        }

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
    } catch (err) {
        console.error('Error starting recording:', err);
        status.textContent = 'Error: ' + err.message;
        isRecording = false;
        recordBtn.textContent = 'Record Meeting';
        pauseBtn.disabled = true;
        status.classList.remove('recording');
        return;
    }

    // Start timer
    timerInterval = setInterval(updateTimer, 100);
}

// Pause recording
function pauseRecording() {
    isPaused = true;
    isRecording = false;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Resume';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.textContent = 'Paused';
    status.classList.remove('recording');

    try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.pause();
        }
    } catch (err) {
        console.error('Error pausing:', err);
    }
    clearInterval(timerInterval);
}

// Resume recording
function resumeRecording() {
    isPaused = false;
    isRecording = true;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Stop';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = false;

    const status = document.getElementById('recordingStatus');
    if (recordingMode === 'screen_audio') {
        status.textContent = 'Capturing (Screen + Audio)';
    } else {
        status.textContent = 'Listening (Microphone)';
    }
    status.classList.add('recording');

    try {
        if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
    } catch (err) {
        console.error('Error resuming:', err);
    }

    // Restart timer from where it was
    timerInterval = setInterval(updateTimer, 100);
}

// Stop recording
async function stopRecording(transcriptionLanguage) {
    isRecording = false;
    isPaused = false;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Record Meeting';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.classList.remove('recording');

    try {
        // Stop MediaRecorder
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        // Stop all streams
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }

        console.log('Recording stopped, audio chunks:', audioChunks.length);
    } catch (err) {
        console.error('Error stopping recording:', err);
    }

    clearInterval(timerInterval);

    // Trigger Whisper transcription if we have audio data
    if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        status.textContent = 'Transcribing...';
        await sendAudioToWhisper(audioBlob, transcriptionLanguage);
    } else {
        status.textContent = 'Ready to record';
    }
}

// Update timer display
function updateTimer() {
    if (!recordingStartTime) return;

    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const timerDisplay = document.getElementById('recordingTimer');
    timerDisplay.textContent =
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
}

// Clear recording state
function clearRecording() {
    isRecording = false;
    isPaused = false;
    currentTranscript = '';
    transcriptionSegments = [];
    recordingStartTime = null;
    timerInterval = null;
    isRestarting = false;
    mediaRecorder = null;
    audioChunks = [];
    audioStream = null;
    screenStream = null;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Record Meeting';
    recordBtn.classList.remove('recording');

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.textContent = 'Ready';
    status.classList.remove('recording');

    const timerDisplay = document.getElementById('recordingTimer');
    timerDisplay.textContent = '00:00:00';
}

// Set recording mode
function setRecordingMode(mode) {
    recordingMode = mode;
    localStorage.setItem('recording_mode', mode);
}

// Get recording mode
function getRecordingMode() {
    return recordingMode;
}

export {
    getRecordingState,
    updateRecordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    updateTimer,
    clearRecording,
    setRecordingMode,
    getRecordingMode
};
