import { createClient } from '@supabase/supabase-js';
import { getTheme, restoreSession, isLoggedIn } from './auth.js';

// Supabase client
const supabaseUrl = 'https://xqpqcuvvjgnjtqmhrtku.supabase.co';
const supabaseKey = 'sb_publishable_XsrMMvQjHZcj6Cql1xA5Fw_nF9nfubb';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if in client-side only mode (not authenticated)
let isClientSideOnly = false;

// OpenAI API key (loaded at startup from server config endpoint)
let openaiApiKey = '';

// Recording state
let isRecording = false;
let isPaused = false;
let currentTranscript = '';
let transcriptionSegments = [];
let savedMeetings = [];
let recordingStartTime = null;
let timerInterval = null;
let isRestarting = false;
let currentAnalysis = null;
const pendingDeletions = new Map(); // itemIndex → { timeoutId, intervalId }
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let currentViewingMeetingId = null;
let currentSuggestedTags = [];
let currentSelectedTags = [];
let recordingLengthWarning = false;
let searchQuery = '';
let currentUser = null;

// Phase 2: Whisper API + Screen Capture
let recordingMode = 'microphone'; // 'microphone' or 'screen_audio'
let transcriptionLanguage = 'en'; // Default to English
let isProcessingWithWhisper = false; // Flag while sending to Whisper API
let screenStream = null; // For screen capture mode
let audioContext = null; // Web Audio context for mixing system + mic streams
let mixedStream = null;  // Mixed output stream (system audio + mic)

// Recording Segments Management
let recordingSegments = []; // Array of {number, startTime, endTime, transcript, audioBlob}
let currentSegmentNumber = 1;
const MAX_SEGMENT_DURATION_MINUTES = 50; // Auto-save at 50 minutes

// Audio Device Management
let audioDevices = [];
let selectedAudioDeviceId = 'default';
const AUDIO_CONSTRAINT_PROFILES = {
    default: { audio: true },
    microphone: { audio: { echoCancellation: true, noiseSuppression: true } },
    headphones: { audio: { echoCancellation: false, noiseSuppression: false } }
};

// ===== THEMED MODAL DIALOGS =====

let modalResolve = null;

function showModal(type, title, message, defaultValue = '') {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('hidden');

    return new Promise((resolve) => {
        modalResolve = resolve;

        if (type === 'alert') {
            const modal = document.getElementById('alertModal');
            document.getElementById('alertTitle').textContent = title;
            document.getElementById('alertMessage').textContent = message;
            modal.classList.remove('hidden');
        } else if (type === 'confirm') {
            const modal = document.getElementById('confirmModal');
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            modal.classList.remove('hidden');
        } else if (type === 'prompt') {
            const modal = document.getElementById('promptModal');
            document.getElementById('promptTitle').textContent = title;
            document.getElementById('promptMessage').textContent = message;
            const input = document.getElementById('promptInput');
            input.value = defaultValue;
            input.focus();
            modal.classList.remove('hidden');
        }
    });
}

function closeAlert() {
    const modal = document.getElementById('alertModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    if (modalResolve) modalResolve(undefined);
}

function acceptConfirm() {
    const modal = document.getElementById('confirmModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    if (modalResolve) modalResolve(true);
}

function cancelConfirm() {
    const modal = document.getElementById('confirmModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    if (modalResolve) modalResolve(false);
}

async function acceptPrompt() {
    const input = document.getElementById('promptInput');
    const value = input.value;
    const modal = document.getElementById('promptModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    if (modalResolve) modalResolve(value);
}

function cancelPrompt() {
    const modal = document.getElementById('promptModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    if (modalResolve) modalResolve(null);
}

// Keyboard support for modals
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('modalOverlay');
    if (overlay.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        // Close alert modal
        const alertModal = document.getElementById('alertModal');
        if (!alertModal.classList.contains('hidden')) {
            closeAlert();
            return;
        }

        // Cancel confirm modal
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal.classList.contains('hidden')) {
            cancelConfirm();
            return;
        }

        // Cancel prompt modal
        const promptModal = document.getElementById('promptModal');
        if (!promptModal.classList.contains('hidden')) {
            cancelPrompt();
            return;
        }
    }

    if (e.key === 'Enter') {
        // Accept confirm modal
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal.classList.contains('hidden')) {
            acceptConfirm();
            return;
        }

        // Accept prompt modal
        const promptModal = document.getElementById('promptModal');
        if (!promptModal.classList.contains('hidden')) {
            acceptPrompt();
            return;
        }
    }
});

// Wrapper functions to replace alert/confirm/prompt
async function showAlert(message, title = 'Alert') {
    await showModal('alert', title, message);
}

async function showConfirm(message, title = 'Confirm') {
    return await showModal('confirm', title, message);
}

async function showPrompt(message, defaultValue = '', title = 'Enter Value') {
    return await showModal('prompt', title, message, defaultValue);
}

// ===== SESSION MANAGEMENT =====

function getSession() {
    // Check for parent's authState first (when in iframe)
    const authState = localStorage.getItem('authState');
    if (authState) {
        try {
            return JSON.parse(authState).user;
        } catch (e) {
            // Fall back to transcriber session
        }
    }
    // Fall back to transcriber-specific session
    const data = localStorage.getItem('transcriber_session');
    return data ? JSON.parse(data) : null;
}

function clearSession() {
    localStorage.removeItem('transcriber_session');
}

function logout() {
    clearSession();
    const isInIframe = window.parent !== window;
    if (isInIframe) {
        // In iframe - send message to parent to close app
        window.parent.postMessage({ action: 'closeApp' }, '*');
    } else {
        // Not in iframe - redirect to login
        window.location.href = 'login.html';
    }
}

// Check if user is logged in
async function checkAuth() {
    // Restore session from parent (portfolio)
    await restoreSession();

    const isAuthenticated = isLoggedIn();
    if (!isAuthenticated) {
        // In guest mode - client-side only
        isClientSideOnly = true;
        return false;
    }

    // Authenticated user
    isClientSideOnly = false;
    const session = getSession();
    if (session) {
        currentUser = session;
    }
    return true;
}

// Load user's language preference from localStorage
function loadUserLanguagePreference() {
    const saved = localStorage.getItem('transcription_language');
    if (saved) {
        transcriptionLanguage = saved;
        const select = document.getElementById('transcriptionLanguage');
        if (select) {
            select.value = saved;
        }
        updateLanguageButtonActive();
    }
}

// Load control panel visibility preference from localStorage
function loadControlPanelVisibility() {
    const saved = localStorage.getItem('control_panel_visible');
    const isVisible = saved === null ? true : saved === 'true'; // Default to visible
    setControlPanelVisibility(isVisible);

    // Set initial hint text
    const toggleHint = document.getElementById('toggleHint');
    if (toggleHint) {
        toggleHint.textContent = isVisible ? 'Hide Controls' : 'Show Controls';
    }
}

// Set control panel visibility and save preference
function setControlPanelVisibility(isVisible) {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        if (isVisible) {
            floatingPanel.classList.remove('hidden');
        } else {
            floatingPanel.classList.add('hidden');
        }
    }
    localStorage.setItem('control_panel_visible', isVisible.toString());
}

// Toggle control panel visibility
function toggleControlPanel() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        const isCurrentlyHidden = floatingPanel.classList.contains('hidden');
        const willBeVisible = isCurrentlyHidden;

        setControlPanelVisibility(willBeVisible); // Show if hidden, hide if shown

        // Update toggle hint text
        const toggleHint = document.getElementById('toggleHint');
        if (toggleHint) {
            toggleHint.textContent = isCurrentlyHidden ? 'Hide Controls' : 'Show Controls';
        }
    }
}

// Dragging state
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Initialize dragging for control panel
function initControlPanelDragging() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    floatingPanel.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    // Double-click to reset position
    floatingPanel.addEventListener('dblclick', resetControlPanelPosition);
}

// Start dragging
function startDragging(e) {
    isDragging = true;
    const floatingPanel = document.querySelector('.floating-control-panel');

    const rect = floatingPanel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    floatingPanel.classList.add('dragging');
}

// Handle dragging
function handleDrag(e) {
    if (!isDragging) return;

    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;

    // Keep within viewport
    const minX = 0;
    const maxX = window.innerWidth - floatingPanel.offsetWidth;
    const minY = 0;
    const maxY = window.innerHeight - floatingPanel.offsetHeight;

    const constrainedX = Math.max(minX, Math.min(newX, maxX));
    const constrainedY = Math.max(minY, Math.min(newY, maxY));

    floatingPanel.style.left = constrainedX + 'px';
    floatingPanel.style.top = constrainedY + 'px';
    floatingPanel.style.transform = 'none';
    floatingPanel.style.bottom = 'auto';
    floatingPanel.style.right = 'auto';

    // Save position to sessionStorage
    saveControlPanelPosition(constrainedX, constrainedY);
}

// Stop dragging
function stopDragging() {
    isDragging = false;
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        floatingPanel.classList.remove('dragging');
    }
}

// Save control panel position to sessionStorage
function saveControlPanelPosition(x, y) {
    sessionStorage.setItem('control_panel_position', JSON.stringify({ x, y }));
}

// Load control panel position from sessionStorage
function loadControlPanelPosition() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    const saved = sessionStorage.getItem('control_panel_position');
    if (saved) {
        try {
            const { x, y } = JSON.parse(saved);
            floatingPanel.style.left = x + 'px';
            floatingPanel.style.top = y + 'px';
            floatingPanel.style.transform = 'none';
            floatingPanel.style.bottom = 'auto';
            floatingPanel.style.right = 'auto';
        } catch (e) {
            console.error('Error loading control panel position:', e);
        }
    }
}

// Reset control panel position to bottom center
function resetControlPanelPosition() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    floatingPanel.style.left = '50%';
    floatingPanel.style.top = 'auto';
    floatingPanel.style.bottom = 'var(--spacing-lg)';
    floatingPanel.style.transform = 'translateX(-50%)';
    floatingPanel.style.right = 'auto';

    // Clear position from sessionStorage
    sessionStorage.removeItem('control_panel_position');
}

// Update language button active state based on current transcriptionLanguage
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

// Save user's language preference to localStorage
function saveUserLanguagePreference(language) {
    transcriptionLanguage = language;
    localStorage.setItem('transcription_language', language);
}

// Normalize action items to object format with text, assigned_to, and completed fields
function normalizeActionItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
        // Handle both old format (strings) and new format (objects)
        if (typeof item === 'string') {
            return { text: item, assigned_to: null, completed: false };
        }
        return {
            text: item.text || '',
            assigned_to: item.assigned_to || null,
            completed: item.completed || false
        };
    });
}

// ===== HELPER FUNCTIONS =====

// Create recording unicorn image
function createRecordingUnicornSvg() {
    return `<img src="/images/unicorn-recording.png" alt="Singing unicorn with microphone" style="max-width: 180px; max-height: 200px; display: block; margin: 0 auto;">`;
}

// Create scholarly unicorn image
function createScholarlyUnicornSvg() {
    return `<img src="/images/unicorn-analysis.png" alt="Scholarly unicorn with glasses and books" style="max-width: 180px; max-height: 200px; display: block; margin: 0 auto;">`;
}

// Get meeting from array by ID
function getMeeting(id) {
    return savedMeetings.find(m => m.id === id);
}

// Get analysis column DOM element
function getAnalysisColumn() {
    return document.querySelector('.kanban-column:nth-child(2)');
}

// Get analysis body element
function getAnalysisBody() {
    const column = getAnalysisColumn();
    let body = column.querySelector('.analysis-body');

    if (body) {
        return body;
    }

    // Hide empty placeholder when analysis is displayed
    const emptyPlaceholder = column.querySelector('#analysisEmptyState');
    if (emptyPlaceholder) {
        emptyPlaceholder.style.display = 'none';
    }

    const div = document.createElement('div');
    div.className = 'analysis-body';
    column.appendChild(div);
    return div;
}

// Set up event listeners for the currently viewing title
function setupMeetingInfoListeners() {
    const titleElement = document.querySelector('.currently-viewing-title');
    if (titleElement) {
        titleElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const meetingId = parseInt(titleElement.getAttribute('data-meeting-id'));
            startInlineEdit(meetingId, titleElement);
        });

        // Add hover effect
        titleElement.addEventListener('mouseenter', () => {
            titleElement.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        });

        titleElement.addEventListener('mouseleave', () => {
            titleElement.style.backgroundColor = 'transparent';
        });
    }
}

// Create empty state HTML for Key Insights
function createKeyInsightsEmptyState() {
    return `
        <div class="empty-state-content">
            ${createScholarlyUnicornSvg()}
            <p>No analysis yet.</p>
            <p>Select a recording to extract patterns.</p>
        </div>
    `;
}

// Create empty state HTML for Live Recording
function createLiveRecordingEmptyState() {
    return `
        <div class="empty-state-content">
            ${createRecordingUnicornSvg()}
            <p>Ready to listen.</p>
            <p>Press Record when you begin.</p>
        </div>
    `;
}

// Filter meetings based on search query
function getFilteredMeetings() {
    if (!searchQuery.trim()) return savedMeetings;

    const query = searchQuery.toLowerCase();
    return savedMeetings.filter(meeting => {
        const titleMatch = meeting.title.toLowerCase().includes(query);
        const tagsMatch = meeting.tags && meeting.tags.some(tag => tag.toLowerCase().includes(query));
        return titleMatch || tagsMatch;
    });
}

// Create meeting info HTML header (with title and tags)
function createMeetingInfoHtml(meeting) {
    if (!meeting) return '';

    const tags = meeting.tags || [];
    const tagsHtml = tags.length > 0 ? `
        <div class="meeting-tags" style="margin-top: 0.5rem;">
            ${tags.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')}
        </div>
    ` : '';

    return `
        <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--color-border-light); margin-bottom: 1rem;">
            <p style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.875rem;">Currently viewing:</p>
            <h1 class="currently-viewing-title" style="margin: 0 0 0.5rem 0; font-size: 1.3rem; font-weight: 600; color: var(--color-text); cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.25rem; transition: background-color 0.2s;" data-meeting-id="${meeting.id}">${escapeHtml(meeting.title)}</h1>
            ${tagsHtml}
        </div>
    `;
}

// ===== THEME MANAGEMENT =====

// Set theme to specified value
function setTheme(themeName) {
    const body = document.body;

    // Remove all theme classes
    body.classList.remove('theme-signal', 'theme-dark', 'theme-prism');

    // Add selected theme class
    if (themeName === 'signal') {
        body.classList.add('theme-signal');
    } else if (themeName === 'dark') {
        body.classList.add('theme-dark');
    } else if (themeName === 'prism') {
        body.classList.add('theme-prism');
    }

    // Save preference
    localStorage.setItem('theme', themeName);

    // Update active state on buttons
    updateThemeButtons();
}

// Update active state on theme buttons
function updateThemeButtons() {
    const buttons = document.querySelectorAll('.theme-btn');
    const currentTheme = localStorage.getItem('theme') || 'signal';

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === currentTheme) {
            btn.classList.add('active');
        }
    });
}

// Load theme preference from localStorage
function loadTheme() {
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'signal';

    // Remove all theme classes first
    body.classList.remove('theme-signal', 'theme-dark', 'theme-prism');

    // Add the saved theme class (default has no class - uses :root)
    if (savedTheme === 'signal') {
        body.classList.add('theme-signal');
    } else if (savedTheme === 'dark') {
        body.classList.add('theme-dark');
    } else if (savedTheme === 'prism') {
        body.classList.add('theme-prism');
    }
    // 'default' theme applies :root styles (no class added)

    updateThemeButtons();
}

// Initialize Web Speech API
// Load meetings from Supabase
async function loadMeetings() {
    // In guest mode - load from session storage
    if (isClientSideOnly) {
        const guestMeetings = loadGuestMeetings();
        savedMeetings = guestMeetings;
        renderMeetingHistory();
        return;
    }

    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading meetings:', error);
        return;
    }

    savedMeetings = data || [];
    renderMeetingHistory();
}

// Load meetings from session storage (guest mode)
function loadGuestMeetings() {
    try {
        const stored = sessionStorage.getItem('guestMeetings');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error loading guest meetings:', e);
        return [];
    }
}

// Save meetings to session storage (guest mode)
function saveGuestMeetings(meetings) {
    try {
        sessionStorage.setItem('guestMeetings', JSON.stringify(meetings));
    } catch (e) {
        console.error('Error saving guest meetings:', e);
    }
}

// Save meeting to Supabase and auto-analyze
async function saveMeetingToSupabase(title, transcript, segments, duration, metadata = {}) {
    try {
        // In guest mode - save locally to session storage
        if (isClientSideOnly) {
            const guestMeeting = {
                id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title,
                transcript,
                segments,
                duration,
                audio_url: null,
                recording_mode: recordingMode,
                language: transcriptionLanguage,
                created_at: new Date().toISOString(),
                tags: [],
                summary: null,
                key_points: null,
                analysis: null,
            };

            // Load existing guest meetings and add new one
            const guestMeetings = loadGuestMeetings();
            guestMeetings.unshift(guestMeeting); // Add to beginning (newest first)
            saveGuestMeetings(guestMeetings);

            console.log('Guest meeting saved to session storage:', guestMeeting);
            return guestMeeting;
        }

        let audioUrl = null;

        // Upload first segment or combined audio (for backward compatibility)
        // If multiple segments, upload the first one as the primary audio file
        try {
            const audioToUpload = recordingSegments.length > 0 ? recordingSegments[0].audioBlob : new Blob(audioChunks, { type: 'audio/webm' });

            if (audioToUpload && audioToUpload.size > 0) {
                const fileName = `meeting-${Date.now()}.webm`;

                console.log(`Uploading audio file: ${fileName}, size: ${(audioToUpload.size / (1024 * 1024)).toFixed(2)}MB`);

                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('meeting-audio')
                    .upload(fileName, audioToUpload);

                if (uploadError) {
                    console.warn('Warning - audio upload failed (meeting will still be saved):', uploadError);
                    // Don't fail the entire save if audio upload fails - continue without audio URL
                } else {
                    const { data: urlData } = supabase
                        .storage
                        .from('meeting-audio')
                        .getPublicUrl(fileName);

                    audioUrl = urlData.publicUrl;
                    console.log('Audio uploaded successfully:', audioUrl);
                }
            }
        } catch (err) {
            console.warn('Warning - error uploading audio:', err);
            // Continue without audio URL
        }

        // Prepare meeting data with existing schema columns only
        const meetingData = {
            title,
            transcript,
            segments,
            duration,
            audio_url: audioUrl,
            recording_mode: recordingMode,
            language: transcriptionLanguage,
        };

        // Log multi-segment info for tracking
        if (recordingSegments.length > 1) {
            console.log(`Recording has ${recordingSegments.length} segments, total duration: ${duration}s`);
        }

        console.log('Inserting meeting data:', meetingData);

        // Insert meeting using existing schema
        const { data: insertResult, error: meetingError } = await supabase
            .from('meetings')
            .insert([meetingData])
            .select();

        if (meetingError) {
            console.error('Error inserting meeting:', meetingError);
            throw new Error(`Failed to save meeting: ${meetingError.message}`);
        }

        console.log('Meeting saved successfully:', insertResult);

        // Refresh archive immediately so the meeting appears regardless of analysis outcome
        await loadMeetings();

        // Auto-analyze if we have the meeting ID
        if (insertResult && insertResult.length > 0) {
            const meetingId = insertResult[0].id;
            await analyzeMeeting(meetingId, transcript);
        }

        return insertResult[0];
    } catch (error) {
        console.error('Error saving meeting:', error);
        await showAlert('Error saving meeting: ' + error.message);
    }
}

// Analyze meeting using GPT-5 via Netlight proxy
async function analyzeMeeting(meetingId, transcript) {
    try {
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Analyzing meeting...';

        const apiKey = openaiApiKey;
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch(
            'https://llm.netlight.ai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-5',
                    messages: [
                        {
                            role: 'user',
                            content: `Analyze this meeting transcript and provide:

1. EXECUTIVE SUMMARY: 2-3 key points from the meeting
2. ACTION ITEMS: List of specific tasks/decisions with owners if mentioned
3. SENTIMENT: Overall tone (Positive/Neutral/Negative) with brief explanation
4. SUGGESTED TAGS: 3-5 relevant tags that categorize this meeting (e.g., "Planning", "Product", "Decision", "Urgent", "Follow-up")

Format your response as valid JSON with these keys: "summary" (string), "action_items" (array of strings), "sentiment" (string), "suggested_tags" (array of strings).

Transcript:
${transcript}`,
                        },
                    ],
                    max_tokens: 4096,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }

        const apiResponse = await response.json();
        const responseText = apiResponse.choices[0].message.content;

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { error: 'Parse failed', rawResponse: responseText };

        // Save analysis to Supabase
        const { data, error } = await supabase
            .from('analyses')
            .insert([
                {
                    meeting_id: meetingId,
                    summary: analysis.summary || '',
                    action_items: normalizeActionItems(analysis.action_items || []),
                    sentiment: analysis.sentiment || '',
                    suggested_tags: analysis.suggested_tags || [],
                }
            ])
            .select()
            .single();

        if (error) throw error;

        currentAnalysis = data;
        status.textContent = 'Analysis complete';
        renderAnalysisColumn();

        // Reload meetings to show in history
        await loadMeetings();
    } catch (error) {
        console.error('Error analyzing meeting:', error);
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Analysis failed: ' + error.message;
    }
}

// Initialize recording mode and language selector controls
function initRecordingControls() {
    // Check browser support for screen capture
    if (!navigator.mediaDevices.getDisplayMedia) {
        console.warn('Screen capture not supported in this browser');
    }

    // Mode selector buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update recording mode
            recordingMode = btn.getAttribute('data-mode');
            console.log('Recording mode changed to:', recordingMode);

            // Update status message
            const status = document.getElementById('recordingStatus');
            if (!isRecording && !isPaused) {
                if (recordingMode === 'screen_audio') {
                    status.textContent = 'Ready (Screen + Microphone)';
                } else if (recordingMode === 'tab_audio') {
                    status.textContent = 'Ready (Tab Audio)';
                } else {
                    status.textContent = 'Ready (Microphone)';
                }
            }
        });
    });

    // Language selector buttons (button group with flag emojis)
    const languageBtns = document.querySelectorAll('.language-btn');
    languageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            languageBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update transcription language
            const language = btn.getAttribute('data-language');
            saveUserLanguagePreference(language);
            console.log('Language changed to:', transcriptionLanguage);
        });
    });

    // Legacy language selector (for backwards compatibility)
    const languageSelect = document.getElementById('transcriptionLanguage');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            saveUserLanguagePreference(e.target.value);
            console.log('Language changed to:', transcriptionLanguage);
            // Update button group to match
            updateLanguageButtonActive();
        });
    }
}

// Send audio to Whisper API for transcription
async function sendAudioToWhisper(audioBlob, language = 'en') {
    try {
        console.log('Starting Whisper transcription, blob size:', audioBlob.size, 'bytes');
        isProcessingWithWhisper = true;
        const status = document.getElementById('recordingStatus');
        const loader = document.getElementById('transcriptionLoader');
        status.textContent = 'Transcribing...';
        loader.classList.add('active');

        if (audioBlob.size < 10000) {
            throw new Error('Audio blob is too small — no audio was captured. Make sure "Share audio" is checked in the screen picker.');
        }

        const apiKey = openaiApiKey;
        console.log('API Key available:', !!apiKey, '| Blob size:', audioBlob.size);
        if (!apiKey) {
            throw new Error('OpenAI API key not configured. Check that OPENAI_API_KEY is set in your Vercel environment variables.');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', language);
        formData.append('temperature', '0');

        console.log('Sending to Whisper API...');
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

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);

            if (response.status === 413) {
                throw new Error('Recording too large. Please record a shorter clip (maximum ~2 hours at 64kbps).');
            } else if (response.status === 401) {
                throw new Error('API key invalid. Please check your configuration.');
            } else if (response.status === 429) {
                throw new Error('API rate limit reached. Please try again later.');
            } else {
                throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
            }
        }

        const result = await response.json();
        console.log('Transcription result:', result);

        isProcessingWithWhisper = false;

        // Update transcript
        currentTranscript = result.text || '';
        const display = document.getElementById('transcriptionDisplay');
        display.textContent = currentTranscript || '';
        display.classList.remove('empty');
        display.scrollTop = display.scrollHeight;

        if (!currentTranscript.trim()) {
            status.textContent = 'No speech detected — was "Share audio" checked in the screen picker?';
        } else {
            status.textContent = 'Transcription complete';
        }
        loader.classList.remove('active');

        return { text: result.text, segments: result.segments };
    } catch (error) {
        console.error('Error transcribing audio:', error);
        isProcessingWithWhisper = false;
        const status = document.getElementById('recordingStatus');
        const loader = document.getElementById('transcriptionLoader');
        status.textContent = 'Transcription failed: ' + error.message;
        loader.classList.remove('active');
        return null;
    }
}

// Enumerate available audio input devices
async function enumerateAudioDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioDevices = devices.filter(device => device.kind === 'audioinput');

        console.log('Available audio input devices:', audioDevices);

        const select = document.getElementById('audioDeviceSelect');
        if (!select) return;

        // Clear existing options except default
        select.innerHTML = '<option value="default">Default Device</option>';

        // Add available devices
        audioDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            // Show device label if available, otherwise show generic name
            const label = device.label || `Audio Input ${index + 1}`;
            option.textContent = label;
            select.appendChild(option);
        });

        console.log(`Found ${audioDevices.length} audio input device(s)`);

        // Log device details for debugging
        audioDevices.forEach((device, index) => {
            console.log(`  Device ${index}: ${device.label || 'Unknown'} (ID: ${device.deviceId})`);
        });
    } catch (err) {
        console.error('Error enumerating audio devices:', err);
    }
}

// Get audio constraints for the selected device
function getAudioConstraints() {
    // Basic audio constraints that work with most devices
    const basicConstraints = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    };

    if (selectedAudioDeviceId === 'default') {
        return basicConstraints;
    }

    // Try to use specific device, but don't make it strict
    return {
        audio: {
            ...basicConstraints.audio,
            deviceId: selectedAudioDeviceId // Not using { exact: } to allow fallback
        }
    };
}

// Request audio stream from the selected device
async function getAudioStream() {
    try {
        let constraints = getAudioConstraints();
        console.log('Requesting audio stream with constraints:', constraints);

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.warn('Failed with specified constraints, trying basic audio:', err);
            // Fallback to basic audio constraint
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const audioTracks = stream.getAudioTracks();
        console.log(`Audio tracks available: ${audioTracks.length}`);

        if (audioTracks.length === 0) {
            throw new Error('No audio tracks in stream');
        }

        const deviceLabel = audioTracks[0].label;
        console.log(`Recording from: ${deviceLabel}`);

        // Verify stream is active
        if (!stream.active) {
            throw new Error('Audio stream is not active');
        }

        return stream;
    } catch (err) {
        console.error('Error getting audio stream:', err);
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            throw new Error(`Audio device not found. Please check your audio input devices.`);
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw new Error(`Microphone permission denied. Please allow microphone access.`);
        } else if (err.name === 'OverconstrainedError') {
            throw new Error(`The selected audio device doesn't support the required settings. Try selecting a different device.`);
        }
        throw new Error(`Error accessing audio: ${err.message}`);
    }
}

// Save current recording segment and start a new one
async function saveRecordingSegment() {
    if (audioChunks.length === 0) {
        console.log('No audio chunks to save');
        return;
    }

    try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const segmentEndTime = Date.now();
        const segmentDuration = Math.floor((segmentEndTime - recordingStartTime) / 1000);
        const segmentNumber = currentSegmentNumber;

        console.log(`Auto-saving segment ${segmentNumber}:`, {
            duration: segmentDuration,
            size: (audioBlob.size / (1024 * 1024)).toFixed(2) + 'MB'
        });

        // Show status
        const status = document.getElementById('recordingStatus');
        status.textContent = `📹 Segment ${segmentNumber} reached 50min limit. Transcribing...`;

        // Transcribe this segment
        const segmentTranscript = await sendAudioToWhisper(audioBlob, transcriptionLanguage);

        // Store segment with metadata and transcription
        const segment = {
            number: segmentNumber,
            startTime: recordingStartTime,
            endTime: segmentEndTime,
            durationSeconds: segmentDuration,
            transcript: currentTranscript,
            audioBlob: audioBlob,
            transcriptionSegments: transcriptionSegments
        };

        recordingSegments.push(segment);
        console.log(`Segment ${segmentNumber} transcribed and saved`);

        // Prepare for next segment
        currentSegmentNumber++;
        audioChunks = [];
        const previousTranscript = currentTranscript;
        currentTranscript = '';
        transcriptionSegments = [];
        recordingStartTime = Date.now();
        recordingLengthWarning = false;

        // Continue recording with new segment
        const recordBtn = document.getElementById('micButton');
        recordBtn.textContent = 'Stop';

        // Reset recording for new segment
        try {
            let newStream;

            if (recordingMode === 'tab_audio') {
                // For tab audio mode, the existing stream continues — no refresh needed
                if (!audioStream || !audioStream.active) {
                    throw new Error('Tab audio stream ended. Please restart recording.');
                }
                newStream = audioStream;
                status.textContent = `✓ Segment ${segmentNumber} complete. Recording segment ${currentSegmentNumber}...`;
            } else if (recordingMode === 'screen_audio') {
                // Reuse the existing mixed stream (system audio + mic) across segments
                if (!mixedStream || !mixedStream.active) {
                    throw new Error('Audio capture ended. Please restart recording.');
                }
                newStream = mixedStream;
                status.textContent = `✓ Segment ${segmentNumber} complete. Recording segment ${currentSegmentNumber}...`;
            } else {
                // For microphone mode, just get fresh audio
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }

                audioStream = await getAudioStream();

                // Verify stream has audio tracks
                const audioTracks = audioStream.getAudioTracks();
                if (audioTracks.length === 0) {
                    throw new Error('No audio tracks in new segment stream');
                }

                if (!audioStream.active) {
                    throw new Error('Audio stream is not active for new segment');
                }

                newStream = audioStream;
                status.textContent = `✓ Segment ${segmentNumber} complete. Recording segment ${currentSegmentNumber}...`;
            }

            const options = {};

            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options.mimeType = 'audio/webm;codecs=opus';
                options.audioBitsPerSecond = 64000;
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options.mimeType = 'audio/webm';
                options.audioBitsPerSecond = 64000;
            }

            mediaRecorder = new MediaRecorder(newStream, options);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error in new segment:', event.error);
                status.textContent = 'Recording error: ' + event.error;
            };

            mediaRecorder.start();

            // Show combined transcript so far
            const display = document.getElementById('transcriptionDisplay');
            const combinedSoFar = recordingSegments.map(seg => seg.transcript).join('\n\n[New Segment]\n\n');
            display.textContent = combinedSoFar;
            display.classList.remove('empty');
            display.scrollTop = display.scrollHeight;

        } catch (err) {
            console.error('Error restarting recording for new segment:', err);
            status.textContent = 'Error starting new segment: ' + err.message;
            isRecording = false;
        }

    } catch (err) {
        console.error('Error saving segment:', err);
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Error saving segment: ' + err.message;
    }
}

// Recording controls
async function startRecording() {
    isRecording = true;
    isPaused = false;
    currentTranscript = '';
    transcriptionSegments = [];
    recordingStartTime = Date.now();
    audioChunks = [];
    recordingLengthWarning = false;
    recordingSegments = []; // Reset segments for new recording
    currentSegmentNumber = 1;

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
            // System audio + Microphone mode — captures both sides of a call (Teams, Zoom, etc.)
            try {
                // Chrome requires video to be requested; use 1fps to minimise overhead
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    },
                    video: { frameRate: { max: 1 } }
                });

                // Drop video — we only need the audio
                screenStream.getVideoTracks().forEach(t => t.stop());

                const systemAudioTracks = screenStream.getAudioTracks();
                if (systemAudioTracks.length === 0) {
                    throw new Error('No system audio captured. In the screen picker, check "Share audio" or "Share system audio".');
                }

                // Get microphone so the user\'s own voice is also captured
                audioStream = await getAudioStream();
                const micTracks = audioStream.getAudioTracks();
                if (micTracks.length === 0) {
                    throw new Error('No microphone audio available.');
                }

                // Mix system audio + microphone into one stream via Web Audio API
                audioContext = new AudioContext();
                const dest = audioContext.createMediaStreamDestination();
                audioContext.createMediaStreamSource(new MediaStream([systemAudioTracks[0]])).connect(dest);
                audioContext.createMediaStreamSource(new MediaStream([micTracks[0]])).connect(dest);
                mixedStream = dest.stream;
                stream = mixedStream;

                status.textContent = 'Capturing (System + Microphone)';
                console.log('System audio + microphone recording started');
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
        } else if (recordingMode === 'tab_audio') {
            // System audio only — no microphone. Good for one-sided capture.
            // Chrome and Edge only; Firefox does not support audio via getDisplayMedia.
            try {
                const tabStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    },
                    video: { frameRate: { max: 1 } } // Chrome requires video
                });

                // Drop video track
                tabStream.getVideoTracks().forEach(t => t.stop());

                const audioTracks = tabStream.getAudioTracks();
                if (audioTracks.length === 0) {
                    tabStream.getTracks().forEach(t => t.stop());
                    throw new Error('No audio captured. Make sure to check "Share audio" in the screen picker.');
                }

                audioStream = tabStream;
                stream = audioStream;
                status.textContent = 'Capturing (System Audio)';
                console.log('System audio recording started:', audioTracks[0].label);
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    status.textContent = 'System audio capture cancelled';
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
            audioStream = await getAudioStream();
            stream = audioStream;
            status.textContent = 'Listening (Microphone)';
            console.log('Microphone recording started');
        }

        // Verify stream has audio tracks
        const audioTracks = stream.getAudioTracks();
        console.log(`Stream has ${audioTracks.length} audio track(s)`);

        if (audioTracks.length === 0) {
            throw new Error('No audio tracks in stream. Please check your microphone connection.');
        }

        // Verify stream is active
        if (!stream.active) {
            throw new Error('Audio stream is not active. Please try again.');
        }

        // Set lower audio bitrate to keep file size under API limit (26MB)
        const options = {};

        // Try to use lower bitrates for better compression
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options.mimeType = 'audio/webm;codecs=opus';
            options.audioBitsPerSecond = 64000; // 64kbps instead of default ~128kbps
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options.mimeType = 'audio/webm';
            options.audioBitsPerSecond = 64000;
        }

        console.log('Creating MediaRecorder with options:', options);

        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (mrErr) {
            console.error('Failed to create MediaRecorder:', mrErr);
            throw new Error(`Cannot create MediaRecorder: ${mrErr.message}. Try a different audio device.`);
        }

        mediaRecorder.ondataavailable = (event) => {
            console.log('ondataavailable called, data size:', event.data.size);
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            status.textContent = 'Recording error: ' + event.error;
        };

        console.log('Starting MediaRecorder...');
        try {
            mediaRecorder.start();
            console.log('MediaRecorder started successfully');
        } catch (startErr) {
            console.error('Failed to start MediaRecorder:', startErr);
            throw new Error(`Cannot start recording: ${startErr.message}`);
        }
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

function resumeRecording() {
    isPaused = false;
    isRecording = true;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Stop';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = false;

    const status = document.getElementById('recordingStatus');
    if (recordingMode === 'screen_audio') {
        status.textContent = 'Capturing (Screen + Microphone)';
    } else if (recordingMode === 'tab_audio') {
        status.textContent = 'Capturing (Tab Audio)';
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

async function stopRecording() {
    isRecording = false;
    isPaused = false;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Record Meeting';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.classList.remove('recording');

    clearInterval(timerInterval);

    try {
        // Stop MediaRecorder and wait for data
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            console.log('MediaRecorder state before stop:', mediaRecorder.state);

            // Create a promise that resolves when onstop fires
            const stopPromise = new Promise((resolve) => {
                mediaRecorder.onstop = () => {
                    console.log('MediaRecorder onstop event fired, total chunks:', audioChunks.length);
                    resolve();
                };

                mediaRecorder.requestData(); // Flush any buffered data
                mediaRecorder.stop();
                console.log('MediaRecorder stop() called');
            });

            // Wait for the stop event to complete
            await stopPromise;
        }

        // Stop all streams
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        mixedStream = null;

        console.log('Recording stopped, audio chunks:', audioChunks.length);
    } catch (err) {
        console.error('Error stopping recording:', err);
    }

    // Handle final segment and transcription
    if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileSizeMB = audioBlob.size / (1024 * 1024);
        const maxSizeMB = 25; // Keep under 26MB API limit with some buffer

        console.log(`Audio blob size: ${fileSizeMB.toFixed(2)}MB (limit: ${maxSizeMB}MB)`);

        if (fileSizeMB > maxSizeMB) {
            status.textContent = `Recording too large (${fileSizeMB.toFixed(1)}MB). Maximum is ${maxSizeMB}MB. Please record a shorter clip.`;
            console.warn(`File size ${fileSizeMB.toFixed(2)}MB exceeds limit of ${maxSizeMB}MB`);
            return;
        }

        status.textContent = 'Transcribing final segment...';

        // Transcribe final segment
        const finalTranscript = await sendAudioToWhisper(audioBlob, transcriptionLanguage);

        // Save final segment
        const segmentEndTime = Date.now();
        const segmentDuration = Math.floor((segmentEndTime - recordingStartTime) / 1000);

        recordingSegments.push({
            number: currentSegmentNumber,
            startTime: recordingStartTime,
            endTime: segmentEndTime,
            durationSeconds: segmentDuration,
            transcript: currentTranscript,
            audioBlob: audioBlob,
            transcriptionSegments: transcriptionSegments
        });

        // Combine all segments
        if (recordingSegments.length > 1) {
            console.log(`Recording has ${recordingSegments.length} segments. Combining...`);

            // Create combined transcript with segment markers
            let combinedTranscript = '';
            recordingSegments.forEach((seg, index) => {
                combinedTranscript += seg.transcript;
                if (index < recordingSegments.length - 1) {
                    combinedTranscript += '\n\n[Segment ' + (index + 1) + ' ended - Segment ' + (index + 2) + ' started]\n\n';
                }
            });

            currentTranscript = combinedTranscript;

            const display = document.getElementById('transcriptionDisplay');
            display.textContent = currentTranscript || '';
            display.classList.remove('empty');
            display.scrollTop = display.scrollHeight;

            status.textContent = `✓ Recording complete: ${recordingSegments.length} segments transcribed and combined`;
        } else {
            status.textContent = currentTranscript.trim() ? 'Transcription complete' : 'No speech detected';
        }

        console.log('All segments processed:', {
            totalSegments: recordingSegments.length,
            totalDuration: recordingSegments.reduce((sum, seg) => sum + seg.durationSeconds, 0),
            combinedTranscriptLength: currentTranscript.length
        });
    } else {
        status.textContent = 'Ready to record';
    }
}

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

    // Auto-save recording segment at 50 minutes to prevent file size issues
    if (minutes >= MAX_SEGMENT_DURATION_MINUTES && !recordingLengthWarning && isRecording && !isPaused && audioChunks.length > 0) {
        console.log('Auto-saving recording segment at', minutes, 'minutes');
        recordingLengthWarning = true; // Prevent multiple triggers
        saveRecordingSegment();
    }
}

async function saveMeeting() {
    // Check if in guest mode
    if (isClientSideOnly) {
        await showAlert('Recordings are temporary in guest mode. Log in to save permanently.', 'Guest Mode');
        return;
    }

    if (currentTranscript.trim() === '') {
        await showAlert('No transcript to save');
        return;
    }

    if (isRecording || isPaused) {
        const stopFirst = await showConfirm('Stop recording before saving?');
        if (stopFirst) {
            await stopRecording();
        } else {
            return;
        }
    }

    const wordCount = currentTranscript.trim().split(' ').length;

    // Calculate total duration from all segments
    let totalElapsed = 0;
    if (recordingSegments.length > 0) {
        totalElapsed = recordingSegments.reduce((sum, seg) => sum + seg.durationSeconds, 0);
    } else {
        totalElapsed = recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0;
    }

    const durationMins = Math.floor(totalElapsed / 60);
    const durationSecs = totalElapsed % 60;

    const previewText = currentTranscript.trim().substring(0, 100);
    const preview = previewText.length < currentTranscript.trim().length ? previewText + '...' : previewText;

    const segmentInfo = recordingSegments.length > 1
        ? `\nRecording Parts: ${recordingSegments.length}\n`
        : '';

    const confirmSave = await showConfirm(
        `Save this recording?\n\n` +
        `Duration: ${durationMins}m ${durationSecs}s\n` +
        `Words: ${wordCount}\n` +
        `${segmentInfo}` +
        `Preview: ${preview}`,
        'Save Recording'
    );

    if (!confirmSave) {
        return;
    }

    // Prompt for title
    const customTitle = await showPrompt(
        'Enter a title for this meeting (or leave empty for auto-generated):',
        '',
        'Meeting Title'
    );

    let title;
    if (customTitle === null) {
        return;
    } else if (customTitle.trim() === '') {
        // Auto-generate title
        const now = new Date();
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        title = `Meeting - ${date}, ${time}`;
    } else {
        title = customTitle.trim();
    }

    // Prepare segment data for storage
    const segmentMetadata = recordingSegments.map(seg => ({
        number: seg.number,
        duration: seg.durationSeconds,
        startTime: seg.startTime,
        endTime: seg.endTime
    }));

    console.log('Saving meeting with segments:', {
        title,
        totalSegments: recordingSegments.length,
        totalDuration: totalElapsed,
        segments: segmentMetadata
    });

    // Save to Supabase (includes auto-analysis)
    // Pass segment metadata along with transcription segments
    await saveMeetingToSupabase(title, currentTranscript.trim(), transcriptionSegments, totalElapsed, {
        recordingSegments: segmentMetadata,
        multiSegmentRecording: recordingSegments.length > 1
    });

    // Clear recording and segments
    currentTranscript = '';
    transcriptionSegments = [];
    recordingSegments = [];
    currentSegmentNumber = 1;
    document.getElementById('transcriptionDisplay').textContent = '';
    document.getElementById('recordingTimer').textContent = '00:00:00';

    await showAlert(`Meeting "${title}" saved and analyzing...`, 'Success');
}

async function clearRecording() {
    if (isRecording || isPaused) {
        const hasRecording = currentTranscript.trim().length > 0;

        if (hasRecording) {
            const wordCount = currentTranscript.trim().split(' ').length;
            const confirmed = await showConfirm(
                `You have ${wordCount} words recorded.\n\nAre you sure you want to clear this recording?\nThis cannot be undone.`,
                'Clear Recording'
            );

            if (!confirmed) {
                return; // User cancelled
            }
        }

        // Stop any active recording first
        await stopRecording();
    }

    currentTranscript = '';
    transcriptionSegments = [];
    audioChunks = [];
    recordingSegments = [];
    currentSegmentNumber = 1;
    const display = document.getElementById('transcriptionDisplay');
    display.innerHTML = createLiveRecordingEmptyState();
    display.classList.add('empty');
    document.getElementById('recordingTimer').textContent = '00:00:00';
}

// Just select a meeting for display (don't open modal)
function selectMeeting(id) {
    const meeting = savedMeetings.find(m => m.id === id);
    if (!meeting) return;

    currentViewingMeetingId = id;
    renderMeetingHistory();

    // Fetch and display analysis
    fetchAndRenderAnalysis(id);
}

function deselectMeeting() {
    currentViewingMeetingId = null;
    currentAnalysis = null;
    renderMeetingHistory();
    renderAnalysisColumn();
}

// Fetch analysis and render it in the middle column
async function fetchAndRenderAnalysis(id) {
    const { data: analysis, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('meeting_id', id)
        .single();

    if (error) {
        console.log('No analysis yet for this meeting');
        currentAnalysis = {
            meeting_id: id,
            summary: null,
            action_items: null,
            sentiment: null,
        };
        renderAnalysisColumnWithButton(id);
    } else {
        // Normalize action items to ensure they have the correct structure
        analysis.action_items = normalizeActionItems(analysis.action_items);
        currentAnalysis = analysis;
        renderAnalysisColumn();
    }
}

// Save action items changes to database
async function saveActionItemsChanges() {
    if (!currentAnalysis || !currentAnalysis.id) return;

    try {
        const { error } = await supabase
            .from('analyses')
            .update({
                action_items: currentAnalysis.action_items
            })
            .eq('id', currentAnalysis.id);

        if (error) throw error;
    } catch (error) {
        console.error('Error saving action items:', error);
        // Optionally show user feedback
    }
}

// Open transcript modal for a meeting (meeting should already be selected)
async function viewMeetingTranscript(id) {
    const meeting = savedMeetings.find(m => m.id === id);
    if (!meeting) return;

    const modal = document.getElementById('transcriptModal');
    const titleInput = document.getElementById('modalTitleInput');
    titleInput.value = meeting.title;

    const dateStr = new Date(meeting.created_at).toLocaleString();
    const durationMins = Math.floor(meeting.duration / 60);
    const durationSecs = meeting.duration % 60;
    document.getElementById('modalTranscript').textContent =
        `Date: ${dateStr}\nDuration: ${durationMins}m ${durationSecs}s\n\n${meeting.transcript}`;

    // Hide edit area and show view mode
    document.getElementById('modalEditArea').classList.add('hidden');
    document.getElementById('transcriptEditor').value = meeting.transcript;
    updateEditButtonText();

    modal.classList.remove('hidden');
}

// Toggle between view and edit mode
function toggleEditMode() {
    const editArea = document.getElementById('modalEditArea');
    editArea.classList.add('hidden');
    updateEditButtonText();
}

// Update button text and behavior based on edit mode state
function updateEditButtonText() {
    const editArea = document.getElementById('modalEditArea');
    const editBtn = document.getElementById('editTranscriptBtn');
    const isHidden = editArea.classList.contains('hidden');

    editBtn.textContent = isHidden ? 'Edit Transcript' : 'Save Transcript';
}

// Handle edit button click - enter edit mode or save
function handleEditTranscriptClick() {
    const editArea = document.getElementById('modalEditArea');
    const isHidden = editArea.classList.contains('hidden');

    if (isHidden) {
        // Enter edit mode
        editArea.classList.remove('hidden');
    } else {
        // Save transcript
        saveTranscriptEdit();
    }

    updateEditButtonText();
}

// Save edited transcript
async function saveTranscriptEdit() {
    if (!currentViewingMeetingId) return;

    const newTranscript = document.getElementById('transcriptEditor').value.trim();
    if (!newTranscript) {
        await showAlert('Transcript cannot be empty', 'Edit Transcript');
        return;
    }

    try {
        // Update database
        const { error } = await supabase
            .from('meetings')
            .update({ transcript: newTranscript })
            .eq('id', currentViewingMeetingId);

        if (error) throw error;

        // Fetch updated meeting from database
        const { data: meeting, error: fetchError } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', currentViewingMeetingId)
            .single();

        if (fetchError) throw fetchError;

        // Update local meetings array
        const index = savedMeetings.findIndex(m => m.id === currentViewingMeetingId);
        if (index !== -1) {
            savedMeetings[index] = meeting;
        }

        // Update display
        const dateStr = new Date(meeting.created_at).toLocaleString();
        const durationMins = Math.floor(meeting.duration / 60);
        const durationSecs = meeting.duration % 60;
        document.getElementById('modalTranscript').textContent =
            `Date: ${dateStr}\nDuration: ${durationMins}m ${durationSecs}s\n\n${newTranscript}`;

        // Hide edit mode
        const editArea = document.getElementById('modalEditArea');
        editArea.classList.add('hidden');
        updateEditButtonText();

        // Ask if they want to re-analyze
        const reanalyze = await showConfirm('Transcript updated! Would you like to re-analyze this meeting with the updated transcript?', 'Re-analyze Meeting');
        if (reanalyze) {
            reanalyzeMeeting(currentViewingMeetingId);
        }
    } catch (error) {
        console.error('Error saving transcript:', error);
        await showAlert('Error saving transcript: ' + error.message, 'Error');
    }
}

// Render analysis column with "Analyze" button when no analysis exists
function renderAnalysisColumnWithButton(meetingId) {
    const analysisBody = getAnalysisBody();
    const meeting = getMeeting(meetingId);

    analysisBody.innerHTML = `
        <div class="analysis-content">
            ${createMeetingInfoHtml(meeting)}
            <div class="analysis-header">
                <h2>Key Insights & AI Analysis</h2>
            </div>
            <div class="empty-state-content" style="margin: 1.5rem 0;">
                ${createScholarlyUnicornSvg()}
                <p>No wisdom yet! 🤔</p>
                <p>Let's sprinkle some AI magic on this one</p>
            </div>
            <button class="analyze-btn" data-meeting-id="${meetingId}">✨ Generate Analysis</button>
        </div>
    `;

    // Add event listener for generate analysis button
    const analyzeButton = analysisBody.querySelector('.analyze-btn');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', () => {
            const mId = analyzeButton.getAttribute('data-meeting-id');
            reanalyzeMeeting(parseInt(mId));
        });
    }

    // Set up inline edit listener for title
    setupMeetingInfoListeners();
}

function closeMeetingTranscript() {
    // Save title if it changed
    saveMeetingTitle();

    currentViewingMeetingId = null;
    document.getElementById('transcriptModal').classList.add('hidden');
    renderMeetingHistory();

    // Show empty state in analysis column
    const analysisBody = getAnalysisBody();
    analysisBody.innerHTML = `
        <div class="empty-placeholder">
            <div class="empty-state-content">
                <div style="font-size: 2rem;">📊</div>
                <div style="font-weight: 500;">Select a recording</div>
                <div style="font-size: 0.85rem; opacity: 0.7;">to view AI analysis</div>
            </div>
        </div>
    `;
}

// Save meeting title if changed
async function saveMeetingTitle() {
    if (!currentViewingMeetingId) return;

    const titleInput = document.getElementById('modalTitleInput');
    const newTitle = titleInput.value.trim();

    const meeting = getMeeting(currentViewingMeetingId);
    if (!meeting || newTitle === meeting.title || !newTitle) return;

    try {
        const { error } = await supabase
            .from('meetings')
            .update({ title: newTitle })
            .eq('id', currentViewingMeetingId);

        if (error) throw error;

        meeting.title = newTitle;
        renderMeetingHistory();
    } catch (error) {
        console.error('Error saving title:', error);
        await showAlert('Error saving title: ' + error.message, 'Error');
    }
}

// Start inline editing for meeting title
function startInlineEdit(meetingId, titleDiv) {
    const meeting = getMeeting(meetingId);
    if (!meeting || titleDiv.querySelector('input')) return; // Already editing

    const originalTitle = meeting.title;

    // Create input and replace content
    titleDiv.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalTitle;
    input.className = 'inline-title-edit';
    titleDiv.appendChild(input);

    input.focus();
    input.select();

    const finishEdit = async (e) => {
        // Prevent multiple calls
        if (input.dataset.saving) return;

        input.dataset.saving = 'true';
        const newTitle = input.value.trim();

        if (!newTitle) {
            renderMeetingHistory();
            return;
        }

        if (newTitle !== originalTitle) {
            try {
                await updateMeetingTitle(meetingId, newTitle);
            } catch (error) {
                console.error('Failed to save title:', error);
                await showAlert('Failed to save title. Please try again.', 'Error');
            }
        }

        renderMeetingHistory();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await finishEdit(e);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            renderMeetingHistory();
        }
    });
}

// Update meeting title in database
async function updateMeetingTitle(meetingId, newTitle) {
    try {
        const meeting = getMeeting(meetingId);
        if (meeting) {
            meeting.title = newTitle;
        }

        // In guest mode - update session storage
        if (isClientSideOnly) {
            saveGuestMeetings(savedMeetings);
        } else {
            // Update in Supabase
            const { error } = await supabase
                .from('meetings')
                .update({ title: newTitle })
                .eq('id', meetingId);

            if (error) throw error;
        }

        // Update modal if it's open
        if (currentViewingMeetingId === meetingId) {
            document.getElementById('modalTitleInput').value = newTitle;

            // Update the "Currently viewing" section in the analysis column
            const analysisBody = getAnalysisBody();
            const allParagraphs = analysisBody.querySelectorAll('p');
            for (const p of allParagraphs) {
                if (p.textContent === 'Currently viewing:') {
                    // Found it - update the parent div that contains the meeting info
                    const meetingInfoDiv = p.closest('div');
                    if (meetingInfoDiv) {
                        meetingInfoDiv.innerHTML = createMeetingInfoHtml(meeting);
                        // Re-setup event listeners on the newly created title
                        setupMeetingInfoListeners();
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error saving title:', error);
        await showAlert('Error saving title: ' + error.message, 'Error');
    }
}

// Show context menu for meeting
function showMeetingMenu(meetingId, buttonElement) {
    // Remove any existing menu
    const existingMenu = document.getElementById('meetingContextMenu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create menu
    const menu = document.createElement('div');
    menu.id = 'meetingContextMenu';
    menu.className = 'meeting-context-menu';
    menu.innerHTML = `
        <button class="meeting-menu-item" data-action="edit" data-meeting-id="${meetingId}">
            ✏️ Edit Transcript
        </button>
    `;

    document.body.appendChild(menu);

    // Position menu near button
    const rect = buttonElement.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = (rect.right - 150) + 'px';

    // Handle menu item click
    menu.querySelector('[data-action="edit"]').addEventListener('click', async (e) => {
        const mId = parseInt(e.target.getAttribute('data-meeting-id'));
        // First select the meeting if not already selected
        if (currentViewingMeetingId !== mId) {
            selectMeeting(mId);
        }
        // Then open the modal to view/edit
        await viewMeetingTranscript(mId);
        menu.remove();
    });

    // Close menu when clicking elsewhere
    const closeMenu = (e) => {
        if (e.target !== buttonElement && !menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
}


function renderMeetingHistory() {
    const list = document.getElementById('meetingsList');
    const emptyState = document.getElementById('archiveEmptyState');
    list.innerHTML = '';

    const meetings = getFilteredMeetings();

    if (meetings.length === 0) {
        // Show empty state only when there are no meetings
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }

    // Hide empty state when meetings exist
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    meetings.forEach(meeting => {
        const li = document.createElement('li');
        li.className = 'meeting-item';
        li.setAttribute('data-id', meeting.id);

        // Add selected class if this is the current viewing meeting
        if (meeting.id === currentViewingMeetingId) {
            li.classList.add('selected');
        }

        const date = new Date(meeting.created_at);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const durationMins = Math.floor(meeting.duration / 60);
        const durationSecs = meeting.duration % 60;

        const tags = meeting.tags || [];
        const tagsHtml = tags.length > 0 ? `
            <div class="meeting-tags">
                ${tags.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : '';

        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div class="meeting-title" data-meeting-id="${meeting.id}" style="cursor: pointer; user-select: none;">${escapeHtml(meeting.title)}</div>
                    <div class="meeting-meta">
                        <span>${dateStr} ${timeStr}</span>
                        <span>${durationMins}m ${durationSecs}s</span>
                    </div>
                    ${tagsHtml}
                </div>
                <button class="meeting-menu-btn" data-meeting-id="${meeting.id}" title="Options">⋮</button>
            </div>
        `;

        // Click title to edit inline
        const titleDiv = li.querySelector('.meeting-title');
        titleDiv.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startInlineEdit(meeting.id, titleDiv);
        });

        // Click to select/deselect meeting (not open)
        li.addEventListener('click', (e) => {
            // Don't select if clicking the menu button or title
            if (e.target.classList.contains('meeting-menu-btn') || e.target.classList.contains('meeting-title')) return;

            // Toggle selection: if already selected, deselect; otherwise select
            if (currentViewingMeetingId === meeting.id) {
                deselectMeeting();
            } else {
                selectMeeting(meeting.id);
            }
        });

        // Menu button click
        const menuBtn = li.querySelector('.meeting-menu-btn');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showMeetingMenu(meeting.id, e.target);
        });

        list.appendChild(li);
    });
}

// Render analysis in the middle column
function renderAnalysisColumn() {
    const column = getAnalysisColumn();
    const emptyState = column.querySelector('#analysisEmptyState');

    if (!currentAnalysis) {
        // Show empty state when no analysis is available
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        // Remove analysis body if it exists
        const existingBody = column.querySelector('.analysis-body');
        if (existingBody) {
            existingBody.remove();
        }
        return;
    }

    // Hide empty state and get/create analysis body
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    const analysisBody = getAnalysisBody();

    // Ensure analysis body has correct class
    analysisBody.className = 'analysis-body';

    const iconCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const iconTrash = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>`;
    const iconCheck = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    let actionItemsHtml = '';
    if (Array.isArray(currentAnalysis.action_items)) {
        actionItemsHtml = '<ul class="action-items-list">' +
            currentAnalysis.action_items.map((item, index) => `
                <li class="action-item" data-item-index="${index}">
                    <input type="checkbox" class="action-item-checkbox" data-item-index="${index}" ${item.completed ? 'checked' : ''} title="Mark as complete">
                    <span class="action-item-text ${item.completed ? 'completed' : ''}">${escapeHtml(item.text)}</span>
                    <div class="action-item-controls">
                        <button class="copy-item-btn" data-item-index="${index}" aria-label="Copy action item">${iconCopy}</button>
                        <button class="delete-item-btn" data-item-index="${index}" aria-label="Delete action item">${iconTrash}</button>
                        <span class="undo-delete-wrapper hidden">
                            <button class="undo-delete-btn" data-item-index="${index}">Undo <span class="undo-countdown">5</span></button>
                        </span>
                    </div>
                </li>
            `).join('') +
            '</ul>';
    } else if (typeof currentAnalysis.action_items === 'string') {
        actionItemsHtml = `<p>${escapeHtml(currentAnalysis.action_items)}</p>`;
    }

    const reanalyzeBtn = currentAnalysis.id ?
        `<button class="reanalyze-btn" data-meeting-id="${currentAnalysis.meeting_id}">Re-analyze</button>` :
        '';

    const addTagsBtn = currentAnalysis.suggested_tags && currentAnalysis.suggested_tags.length > 0 ?
        `<button class="add-tags-btn" data-meeting-id="${currentAnalysis.meeting_id}">Add Tags</button>` :
        '';

    const meeting = getMeeting(currentViewingMeetingId);

    analysisBody.innerHTML = `
        <div class="analysis-content">
            ${createMeetingInfoHtml(meeting)}
            <div class="analysis-header">
                <h2>Key Insights & AI Analysis</h2>
                <div class="analysis-buttons">
                    ${addTagsBtn}
                    ${reanalyzeBtn}
                </div>
            </div>

            <h3>Sentiment</h3>
            <p>${escapeHtml(currentAnalysis.sentiment || '')}</p>

            <h3>Executive Summary</h3>
            <p>${escapeHtml(currentAnalysis.summary || '')}</p>

            <div class="action-items-section">
                <h3>Action Items</h3>
                ${actionItemsHtml}
            </div>
        </div>
    `;

    // Add event listener for re-analyze button
    const reanalyzeButton = analysisBody.querySelector('.reanalyze-btn');
    if (reanalyzeButton) {
        reanalyzeButton.addEventListener('click', () => {
            const meetingId = reanalyzeButton.getAttribute('data-meeting-id');
            reanalyzeMeeting(parseInt(meetingId));
        });
    }

    // Add event listener for add tags button
    const addTagsButton = analysisBody.querySelector('.add-tags-btn');
    if (addTagsButton) {
        addTagsButton.addEventListener('click', () => {
            const meetingId = addTagsButton.getAttribute('data-meeting-id');
            showTagSelection(meetingId, currentAnalysis.suggested_tags || []);
        });
    }

    // Set up action item checkboxes
    const actionItemCheckboxes = analysisBody.querySelectorAll('.action-item-checkbox');
    actionItemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const li = checkbox.closest('.action-item');
            const itemIndex = parseInt(checkbox.getAttribute('data-item-index'));
            const textSpan = li.querySelector('.action-item-text');

            if (checkbox.checked) {
                li.classList.add('completed');
                textSpan.classList.add('completed');
                if (currentAnalysis.action_items[itemIndex]) {
                    currentAnalysis.action_items[itemIndex].completed = true;
                }
            } else {
                li.classList.remove('completed');
                textSpan.classList.remove('completed');
                if (currentAnalysis.action_items[itemIndex]) {
                    currentAnalysis.action_items[itemIndex].completed = false;
                }
            }

            // Save to database
            saveActionItemsChanges();
        });
    });

    // Per-item copy buttons
    analysisBody.querySelectorAll('.copy-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-item-index'));
            const item = currentAnalysis.action_items[index];
            if (!item) return;
            const text = item.text || item;
            navigator.clipboard.writeText(text).then(() => {
                btn.innerHTML = iconCheck;
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = iconCopy;
                    btn.classList.remove('copied');
                }, 2000);
            });
        });
    });

    // Per-item delete with 5-second undo
    analysisBody.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-item-index'));
            const li = btn.closest('.action-item');
            const undoWrapper = li.querySelector('.undo-delete-wrapper');
            const countdownEl = li.querySelector('.undo-countdown');

            // Visual pending state
            li.classList.add('pending-delete');
            btn.classList.add('hidden');
            undoWrapper.classList.remove('hidden');

            let secondsLeft = 5;
            const intervalId = setInterval(() => {
                secondsLeft--;
                if (countdownEl) countdownEl.textContent = secondsLeft;
            }, 1000);

            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                pendingDeletions.delete(index);
                // Remove from data and DOM
                const dataIndex = currentAnalysis.action_items.findIndex((_, i) => i === index);
                if (dataIndex !== -1) currentAnalysis.action_items.splice(dataIndex, 1);
                li.remove();
                saveActionItemsChanges();
            }, 5000);

            pendingDeletions.set(index, { timeoutId, intervalId });
        });
    });

    analysisBody.querySelectorAll('.undo-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-item-index'));
            const li = btn.closest('.action-item');
            const deleteBtn = li.querySelector('.delete-item-btn');
            const undoWrapper = li.querySelector('.undo-delete-wrapper');
            const countdownEl = li.querySelector('.undo-countdown');

            const pending = pendingDeletions.get(index);
            if (pending) {
                clearTimeout(pending.timeoutId);
                clearInterval(pending.intervalId);
                pendingDeletions.delete(index);
            }

            li.classList.remove('pending-delete');
            deleteBtn.classList.remove('hidden');
            undoWrapper.classList.add('hidden');
            if (countdownEl) countdownEl.textContent = '5';
        });
    });

    // Set up inline edit listener for title
    setupMeetingInfoListeners();
}

// Analyze or re-analyze a meeting
async function reanalyzeMeeting(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;

    const analysisBody = document.querySelector('.analysis-body');
    analysisBody.innerHTML = `
        <div class="analysis-loading">
            <p>Analyzing meeting with AI...</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <p class="progress-text" id="progressText">0%</p>
        </div>
    `;

    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 30, 95);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.floor(progress) + '%';
    }, 400);

    try {
        // Delete old analysis if exists
        const { error: deleteError } = await supabase
            .from('analyses')
            .delete()
            .eq('meeting_id', meetingId);

        if (deleteError) console.error('Error deleting old analysis:', deleteError);

        // Run new analysis
        await analyzeMeeting(meetingId, meeting.transcript);

        // Complete the progress bar
        clearInterval(progressInterval);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
    } catch (error) {
        console.error('Error re-analyzing meeting:', error);
        clearInterval(progressInterval);
        analysisBody.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
    }
}

// Save tags to meeting
async function saveMeetingTags(meetingId, tags) {
    try {
        const { data, error } = await supabase
            .from('meetings')
            .update({ tags })
            .eq('id', meetingId)
            .select();

        if (error) throw error;

        // Update local meetings
        const meeting = getMeeting(meetingId);
        if (meeting) {
            meeting.tags = tags;
        }

        currentSelectedTags = [];

        // Refresh UI
        renderMeetingHistory();

        // Also refresh analysis column to show updated data
        if (currentViewingMeetingId === meetingId && currentAnalysis) {
            renderAnalysisColumn();
        }
    } catch (error) {
        console.error('Error saving tags:', error);
        await showAlert('Error saving tags: ' + error.message, 'Error');
    }
}

// Show tag selection UI
function showTagSelection(meetingId, suggestedTags) {
    const tagSelectionHtml = `
        <div class="tag-selection">
            <h4>Add Tags to Meeting</h4>
            <p>Suggested tags:</p>
            <div class="suggested-tags" id="suggestedTagsContainer">
                ${suggestedTags.map(tag => `
                    <button class="tag-btn" data-tag="${tag}">${escapeHtml(tag)}</button>
                `).join('')}
            </div>
            <p>Or add custom tag:</p>
            <div class="custom-tag-input">
                <input type="text" id="customTagInput" placeholder="Enter custom tag">
                <button id="addCustomTagBtn">Add</button>
            </div>
            <div class="selected-tags">
                <p>Selected tags:</p>
                <div id="selectedTagsList"></div>
            </div>
            <div class="tag-actions">
                <button class="save-tags-btn" id="saveTagsBtn">Save Tags</button>
                <button class="cancel-tags-btn" id="cancelTagsBtn">Cancel</button>
            </div>
        </div>
    `;

    const analysisBody = document.querySelector('.analysis-body');
    analysisBody.innerHTML = tagSelectionHtml;
    currentSuggestedTags = suggestedTags;
    currentSelectedTags = [];
    updateTagsList();

    // Wire up event listeners
    // Suggested tags
    document.querySelectorAll('#suggestedTagsContainer .tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            toggleTag(tag);
        });
    });

    // Custom tag input
    document.getElementById('addCustomTagBtn').addEventListener('click', addCustomTag);

    // Key press on input
    document.getElementById('customTagInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomTag();
        }
    });

    // Action buttons
    const saveBtn = document.getElementById('saveTagsBtn');
    const cancelBtn = document.getElementById('cancelTagsBtn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            finishTagSelection(meetingId);
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeTagSelection);
    }
}

function toggleTag(tag) {
    const index = currentSelectedTags.indexOf(tag);
    if (index > -1) {
        currentSelectedTags.splice(index, 1);
    } else {
        currentSelectedTags.push(tag);
    }
    updateTagsList();
    updateTagButtons();
}

function addCustomTag() {
    const input = document.getElementById('customTagInput');
    const tag = input.value.trim();
    if (tag && !currentSelectedTags.includes(tag)) {
        currentSelectedTags.push(tag);
        input.value = '';
        updateTagsList();
    }
}

function updateTagsList() {
    const tagsList = document.getElementById('selectedTagsList');
    if (tagsList) {
        tagsList.innerHTML = currentSelectedTags.map(tag => `
            <span class="selected-tag" data-tag="${tag}">${escapeHtml(tag)} <button class="remove-tag-btn">×</button></span>
        `).join('');

        // Wire up remove buttons
        tagsList.querySelectorAll('.remove-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = btn.closest('.selected-tag').getAttribute('data-tag');
                removeTag(tag);
            });
        });
    }
}

function updateTagButtons() {
    document.querySelectorAll('.tag-btn').forEach(btn => {
        const tag = btn.getAttribute('data-tag');
        if (currentSelectedTags.includes(tag)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function removeTag(tag) {
    currentSelectedTags = currentSelectedTags.filter(t => t !== tag);
    updateTagsList();
    updateTagButtons();
}

function finishTagSelection(meetingId) {
    saveMeetingTags(meetingId, currentSelectedTags);
}

function closeTagSelection() {
    currentSelectedTags = [];
    renderAnalysisColumn();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load OpenAI API key from server config
    try {
        const res = await fetch('/api/transcriber-config');
        if (res.ok) {
            const cfg = await res.json();
            openaiApiKey = cfg.key || '';
        }
    } catch { /* key stays empty — transcription will show "API key not configured" */ }

    // Check if user is logged in
    await checkAuth();

    init();

    // Handle window resize with debouncing to prevent breaking
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Re-sync theme on resize to ensure consistency
            updateThemeButtons();

            // Adjust control panel position if it was dragged
            const floatingPanel = document.querySelector('.floating-control-panel');
            if (floatingPanel && floatingPanel.style.left) {
                // Ensure panel stays within viewport on resize
                const rect = floatingPanel.getBoundingClientRect();
                const maxX = window.innerWidth - floatingPanel.offsetWidth;
                if (rect.left < 0 || rect.right > window.innerWidth) {
                    resetControlPanelPosition();
                }
            }
        }, 300);
    });
});

async function init() {
    // Load saved theme preference
    loadTheme();

    // Handle guest mode (client-side only)
    if (isClientSideOnly) {
        // Show guest mode notice
        const guestNotice = document.getElementById('guestModeNotice');
        if (guestNotice) {
            guestNotice.style.display = 'block';
        }

        // Keep save button enabled for guest mode - recordings are stored locally
        const saveBtn = document.getElementById('saveMeetingBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.title = 'Save meeting (stored locally for this session)';
        }

        // Archive is now visible in guest mode - shows empty state until recordings are saved
        // Removed: Hide archive column code - now visible with empty state

        // Update current user display
        const currentUserEl = document.getElementById('currentUser');
        if (currentUserEl) {
            currentUserEl.textContent = 'Guest mode - recordings stored locally';
        }
    } else {
        // Display current user
        if (currentUser) {
            document.getElementById('currentUser').textContent = `Logged in as: ${currentUser.username}`;
        }
    }

    // Load user's theme preference if available
    if (currentUser?.theme) {
        setTheme(currentUser.theme);
    } else {
        loadTheme();
    }

    // Ensure theme buttons are updated
    updateThemeButtons();

    // Wire up logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Wire up back button (for portfolio navigation)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Send message to parent to close app
            if (window.parent !== window) {
                window.parent.postMessage({ action: 'closeApp' }, '*');
            }
        });
    }

    // Initialize recording controls (Whisper API + Screen Capture)
    initRecordingControls();
    loadUserLanguagePreference();
    updateLanguageButtonActive();

    // Enumerate and set up audio devices
    await enumerateAudioDevices();
    const audioDeviceSelect = document.getElementById('audioDeviceSelect');
    if (audioDeviceSelect) {
        audioDeviceSelect.addEventListener('change', (e) => {
            selectedAudioDeviceId = e.target.value;
            console.log('Audio device changed to:', selectedAudioDeviceId);
        });
    }

    // Update devices when permissions change or devices are plugged/unplugged
    navigator.mediaDevices.addEventListener('devicechange', enumerateAudioDevices);

    // Load meetings from Supabase
    await loadMeetings();

    // Wire up mic button
    const micBtn = document.getElementById('micButton');
    micBtn.addEventListener('click', () => {
        if (isRecording && !isPaused) {
            // Currently recording - stop it
            stopRecording();
        } else if (isPaused) {
            // Paused - resume it
            resumeRecording();
        } else if (!isRecording && !isPaused) {
            // Not recording - start it
            startRecording();
        }
    });

    // Wire up pause button
    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.addEventListener('click', pauseRecording);

    // Wire up save and clear buttons
    document.getElementById('saveMeetingBtn').addEventListener('click', saveMeeting);
    document.getElementById('clearBtn').addEventListener('click', clearRecording);

    // Wire up modal close
    document.getElementById('modalCloseBtn').addEventListener('click', closeMeetingTranscript);
    document.getElementById('transcriptModal').addEventListener('click', (e) => {
        if (e.target.id === 'transcriptModal') {
            closeMeetingTranscript();
        }
    });

    // Wire up themed modal dialog buttons
    const alertCloseBtn = document.querySelector('#alertModal .modal-close-btn');
    const alertOkBtn = document.querySelector('#alertModal .modal-btn-primary');
    if (alertCloseBtn) alertCloseBtn.addEventListener('click', closeAlert);
    if (alertOkBtn) alertOkBtn.addEventListener('click', closeAlert);

    const confirmCloseBtn = document.querySelector('#confirmModal .modal-close-btn');
    const confirmCancelBtn = document.querySelector('#confirmModal .modal-btn-secondary');
    const confirmOkBtn = document.querySelector('#confirmModal .modal-btn-primary');
    if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', cancelConfirm);
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', cancelConfirm);
    if (confirmOkBtn) confirmOkBtn.addEventListener('click', acceptConfirm);

    const promptCloseBtn = document.querySelector('#promptModal .modal-close-btn');
    const promptCancelBtn = document.querySelector('#promptModal .modal-btn-secondary');
    const promptOkBtn = document.querySelector('#promptModal .modal-btn-primary');
    if (promptCloseBtn) promptCloseBtn.addEventListener('click', cancelPrompt);
    if (promptCancelBtn) promptCancelBtn.addEventListener('click', cancelPrompt);
    if (promptOkBtn) promptOkBtn.addEventListener('click', acceptPrompt);

    // Wire up edit transcript buttons
    document.getElementById('editTranscriptBtn').addEventListener('click', handleEditTranscriptClick);
    document.getElementById('saveEditBtn').addEventListener('click', saveTranscriptEdit);
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        toggleEditMode();
        updateEditButtonText();
    });

    // Wire up search input
    const searchInput = document.getElementById('meetingsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderMeetingHistory();
        });
    }

    // Wire up control panel toggle button
    const toggleBtn = document.getElementById('toggleControlPanel');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleControlPanel);
    }

    // Wire up ⋯ settings toggle button
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsToggleBtn && settingsPanel) {
        settingsToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = settingsPanel.classList.toggle('open');
            settingsToggleBtn.classList.toggle('active', isOpen);
        });
    }

    // Load control panel visibility preference
    loadControlPanelVisibility();

    // Initialize control panel dragging
    initControlPanelDragging();

    // Load saved position from sessionStorage
    loadControlPanelPosition();

    // Wire up theme buttons (only buttons with data-theme attribute)
    const themeButtons = document.querySelectorAll('.theme-btn[data-theme]');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const themeName = btn.getAttribute('data-theme');
            setTheme(themeName);
        });
    });

    // Initialize empty states with unicorns
    const transcriptionDisplay = document.getElementById('transcriptionDisplay');
    transcriptionDisplay.innerHTML = createLiveRecordingEmptyState();
    transcriptionDisplay.classList.add('empty');

    // Initialize Key Insights empty state
    const analysisColumn = getAnalysisColumn();
    const emptyPlaceholder = analysisColumn.querySelector('.empty-placeholder');
    if (emptyPlaceholder) {
        emptyPlaceholder.innerHTML = createKeyInsightsEmptyState();
    }

    // Render initial UI
    renderMeetingHistory();
}
