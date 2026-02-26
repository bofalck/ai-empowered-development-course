/**
 * Main application entry point
 * Orchestrates all modules and initializes the application
 */

// Import all modules
import { checkAuth, logout, getCurrentUser } from './src/auth.js';
import { loadTheme, setTheme } from './src/theme.js';
import { loadControlPanelVisibility, toggleControlPanel, initControlPanelDragging, loadControlPanelPosition } from './src/ui-state.js';
import { loadUserLanguagePreference, setTranscriptionLanguage, updateLanguageButtonActive } from './src/transcription.js';
import { startRecording, pauseRecording, resumeRecording, stopRecording, clearRecording, setRecordingMode } from './src/recording.js';
import { loadMeetings } from './src/database.js';

// Import global state and functions from original main.js that haven't been modularized yet
// (These will be gradually moved to modular files)
import('./main.js').then(mainModule => {
    // After loading the original main.js, we import specific functions we still need
    const {
        initRecordingControls,
        saveMeeting,
        renderMeetingHistory,
        renderAnalysisColumn,
        showTagSelection,
        getMeeting,
        getAnalysisBody,
        setupMeetingInfoListeners,
        reanalyzeMeeting,
        viewMeetingTranscript,
        closeMeetingTranscript,
        handleEditTranscriptClick,
        saveTranscriptEdit
    } = mainModule;

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Check authentication
        if (!checkAuth()) {
            return; // Redirect to login
        }

        // 2. Load and apply saved preferences
        loadTheme();
        loadControlPanelVisibility();
        initControlPanelDragging();
        loadControlPanelPosition();
        loadUserLanguagePreference();

        // 3. Load data
        const meetings = await loadMeetings();

        // 4. Wire up UI event listeners

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        // Theme buttons
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const themeName = btn.getAttribute('data-theme');
                setTheme(themeName);
            });
        });

        // Control panel toggle
        const toggleBtn = document.getElementById('toggleControlPanel');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleControlPanel);
        }

        // Recording mode and language controls
        initRecordingControls();

        // Recording buttons
        const micBtn = document.getElementById('micButton');
        const pauseBtn = document.getElementById('pauseButton');
        const saveMeetingBtn = document.getElementById('saveMeetingBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (micBtn) {
            micBtn.addEventListener('click', async () => {
                if (getCurrentRecordingState().isRecording) {
                    // Need to pass transcription language
                    await stopRecording();
                } else if (getCurrentRecordingState().isPaused) {
                    resumeRecording();
                } else {
                    await startRecording();
                }
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', pauseRecording);
        }

        if (saveMeetingBtn) {
            saveMeetingBtn.addEventListener('click', saveMeeting);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', clearRecording);
        }

        // Modal controls
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const transcriptModal = document.getElementById('transcriptModal');
        const editTranscriptBtn = document.getElementById('editTranscriptBtn');
        const saveEditBtn = document.getElementById('saveEditBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeMeetingTranscript);
        }

        if (transcriptModal) {
            transcriptModal.addEventListener('click', (e) => {
                if (e.target === transcriptModal) {
                    closeMeetingTranscript();
                }
            });
        }

        if (editTranscriptBtn) {
            editTranscriptBtn.addEventListener('click', handleEditTranscriptClick);
        }

        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', saveTranscriptEdit);
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                const editArea = document.getElementById('modalEditArea');
                if (editArea) {
                    editArea.classList.add('hidden');
                }
            });
        }

        // Meeting search
        const searchInput = document.getElementById('meetingsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // This still needs to be updated to use the new modular functions
                renderMeetingHistory();
            });
        }

        // Render meetings list
        renderMeetingHistory();
    });
});

// Helper to get current recording state (temporary until fully modularized)
function getCurrentRecordingState() {
    // This will be replaced once recording module is fully integrated
    return {
        isRecording: false,
        isPaused: false
    };
}
