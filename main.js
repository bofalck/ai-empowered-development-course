import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.0/+esm';

// Supabase client
const supabaseUrl = 'https://xqpqcuvvjgnjtqmhrtku.supabase.co';
const supabaseKey = 'sb_publishable_XsrMMvQjHZcj6Cql1xA5Fw_nF9nfubb';
const supabase = createClient(supabaseUrl, supabaseKey);

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
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let currentViewingMeetingId = null;
let currentSuggestedTags = [];
let currentSelectedTags = [];
let searchQuery = '';
let currentUser = null;

// Phase 2: Whisper API + Screen Capture
let recordingMode = 'microphone'; // 'microphone' or 'screen_audio'
let transcriptionLanguage = 'en'; // Default to English
let isProcessingWithWhisper = false; // Flag while sending to Whisper API
let screenStream = null; // For screen capture mode

// ===== SESSION MANAGEMENT =====

function getSession() {
    const data = localStorage.getItem('transcriber_session');
    return data ? JSON.parse(data) : null;
}

function clearSession() {
    localStorage.removeItem('transcriber_session');
}

function logout() {
    clearSession();
    window.location.href = 'login.html';
}

// Check if user is logged in
function checkAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    currentUser = session;
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
            // Ensure theme is reapplied when showing panel
            reapplyThemeToControlPanel();
        } else {
            floatingPanel.classList.add('hidden');
        }
    }
    localStorage.setItem('control_panel_visible', isVisible.toString());
}

// Reapply theme styling to control panel
function reapplyThemeToControlPanel() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    // Force a reflow to ensure theme styles are applied
    const currentTheme = localStorage.getItem('theme') || 'default';

    // Remove and re-add hidden class to trigger CSS re-evaluation
    const wasHidden = floatingPanel.classList.contains('hidden');
    if (wasHidden) {
        floatingPanel.classList.remove('hidden');
        // Trigger reflow
        void floatingPanel.offsetWidth;
        floatingPanel.classList.add('hidden');
    }
}

// Toggle control panel visibility
function toggleControlPanel() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        const isCurrentlyHidden = floatingPanel.classList.contains('hidden');
        const willBeVisible = isCurrentlyHidden;

        setControlPanelVisibility(willBeVisible); // Show if hidden, hide if shown

        // Reapply theme when showing
        if (willBeVisible) {
            setTimeout(() => {
                reapplyThemeToControlPanel();
            }, 0);
        }

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

// ===== HELPER FUNCTIONS =====

// Create recording unicorn image
function createRecordingUnicornSvg() {
    return `<img src="/assets/unicorn-recording.png" alt="Singing unicorn with microphone" style="max-width: 180px; max-height: 200px; display: block; margin: 0 auto;">`;
}

// Create scholarly unicorn image
function createScholarlyUnicornSvg() {
    return `<img src="/assets/unicorn-analysis.png" alt="Scholarly unicorn with glasses and books" style="max-width: 180px; max-height: 200px; display: block; margin: 0 auto;">`;
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

    // Create analysis body and remove empty placeholder
    const emptyPlaceholder = column.querySelector('.empty-placeholder');
    if (emptyPlaceholder) {
        emptyPlaceholder.remove();
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
    const currentTheme = localStorage.getItem('theme') || 'default';

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === currentTheme) {
            btn.classList.add('active');
        }
    });
}

// Load theme preference from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'default';

    if (savedTheme === 'signal') {
        document.body.classList.add('theme-signal');
    } else if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (savedTheme === 'prism') {
        document.body.classList.add('theme-prism');
    }

    updateThemeButtons();
}

// Initialize Web Speech API
// Load meetings from Supabase
async function loadMeetings() {
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

// Save meeting to Supabase and auto-analyze
async function saveMeetingToSupabase(title, transcript, segments, duration) {
    try {
        let audioUrl = null;

        // Upload audio if available
        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const fileName = `meeting-${Date.now()}.webm`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('meeting-audio')
                .upload(fileName, audioBlob);

            if (uploadError) {
                console.error('Error uploading audio:', uploadError);
            } else {
                const { data: urlData } = supabase
                    .storage
                    .from('meeting-audio')
                    .getPublicUrl(fileName);

                audioUrl = urlData.publicUrl;
            }
        }

        // Insert meeting with audio URL and Whisper metadata
        const { data: meetingData, error: meetingError } = await supabase
            .from('meetings')
            .insert([
                {
                    title,
                    transcript,
                    segments,
                    duration,
                    audio_url: audioUrl,
                    recording_mode: recordingMode,
                    language: transcriptionLanguage,
                }
            ])
            .select()
            .single();

        if (meetingError) throw meetingError;

        // Auto-analyze
        await analyzeMeeting(meetingData.id, transcript);

        return meetingData;
    } catch (error) {
        console.error('Error saving meeting:', error);
        alert('Error saving meeting: ' + error.message);
    }
}

// Analyze meeting using GPT-5 via Netlight proxy
async function analyzeMeeting(meetingId, transcript) {
    try {
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Analyzing meeting...';

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
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
                    action_items: analysis.action_items || [],
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
                    status.textContent = 'Ready (Screen + Audio)';
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

// Recording controls
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
        let audioTrack;
        if (recordingMode === 'screen_audio' && stream.getAudioTracks().length > 0) {
            audioTrack = stream.getAudioTracks()[0];
        } else if (recordingMode === 'microphone') {
            audioTrack = stream.getAudioTracks()[0];
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

async function stopRecording() {
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

async function saveMeeting() {
    if (currentTranscript.trim() === '') {
        alert('No transcript to save');
        return;
    }

    if (isRecording || isPaused) {
        const stopFirst = confirm('Stop recording before saving?');
        if (stopFirst) {
            stopRecording();
        } else {
            return;
        }
    }

    const wordCount = currentTranscript.trim().split(' ').length;
    const elapsed = recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0;
    const durationMins = Math.floor(elapsed / 60);
    const durationSecs = elapsed % 60;

    const previewText = currentTranscript.trim().substring(0, 100);
    const preview = previewText.length < currentTranscript.trim().length ? previewText + '...' : previewText;

    const confirmSave = confirm(
        `Save this recording?\n\n` +
        `Duration: ${durationMins}m ${durationSecs}s\n` +
        `Words: ${wordCount}\n\n` +
        `Preview: ${preview}`
    );

    if (!confirmSave) {
        return;
    }

    // Prompt for title
    const customTitle = prompt('Enter a title for this meeting (or leave empty for auto-generated):');

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

    const finalElapsed = recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0;

    // Save to Supabase (includes auto-analysis)
    await saveMeetingToSupabase(title, currentTranscript.trim(), transcriptionSegments, finalElapsed);

    // Clear recording
    currentTranscript = '';
    transcriptionSegments = [];
    document.getElementById('transcriptionDisplay').textContent = '';
    document.getElementById('recordingTimer').textContent = '00:00:00';

    alert(`Meeting "${title}" saved and analyzing...`);
}

function clearRecording() {
    if (isRecording || isPaused) {
        const hasRecording = currentTranscript.trim().length > 0;

        if (hasRecording) {
            const wordCount = currentTranscript.trim().split(' ').length;
            const confirmed = confirm(
                `You have ${wordCount} words recorded.\n\n` +
                `Are you sure you want to clear this recording?\n` +
                `This cannot be undone.`
            );

            if (!confirmed) {
                return; // User cancelled
            }
        }

        // Stop any active recording first
        stopRecording();
    }

    currentTranscript = '';
    transcriptionSegments = [];
    audioChunks = [];
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
        currentAnalysis = analysis;
        renderAnalysisColumn();
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
        alert('Transcript cannot be empty');
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
        const reanalyze = confirm('Transcript updated! Would you like to re-analyze this meeting with the updated transcript?');
        if (reanalyze) {
            reanalyzeMeeting(currentViewingMeetingId);
        }
    } catch (error) {
        console.error('Error saving transcript:', error);
        alert('Error saving transcript: ' + error.message);
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
    analysisBody.innerHTML = `<div class="empty-placeholder">Select a meeting to view AI analysis</div>`;
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
        alert('Error saving title: ' + error.message);
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
                alert('Failed to save title. Please try again.');
            }
        }

        renderMeetingHistory();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            renderMeetingHistory();
        }
    });
}

// Update meeting title in database
async function updateMeetingTitle(meetingId, newTitle) {
    try {
        const { error } = await supabase
            .from('meetings')
            .update({ title: newTitle })
            .eq('id', meetingId);

        if (error) throw error;

        const meeting = getMeeting(meetingId);
        if (meeting) {
            meeting.title = newTitle;
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
        alert('Error saving title: ' + error.message);
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
    list.innerHTML = '';

    const meetings = getFilteredMeetings();

    if (meetings.length === 0) {
        list.innerHTML = '<li style="padding: 1rem; text-align: center; color: #9ca3af;">No meetings found</li>';
        return;
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
    const analysisBody = getAnalysisBody();

    if (!currentAnalysis) {
        analysisBody.className = 'analysis-body';
        analysisBody.innerHTML = createKeyInsightsEmptyState();
        return;
    }

    // Ensure analysis body has correct class
    analysisBody.className = 'analysis-body';

    let actionItemsHtml = '';
    let checkAllBtn = '';
    if (Array.isArray(currentAnalysis.action_items)) {
        checkAllBtn = `<button class="check-all-btn" title="Check all action items">✓ Check All</button>`;
        actionItemsHtml = '<ul class="action-items-list">' +
            currentAnalysis.action_items.map((item, index) => `
                <li class="action-item">
                    <input type="checkbox" class="action-item-checkbox" data-item-index="${index}" title="Click to mark as complete">
                    <span class="action-item-text">${escapeHtml(item)}</span>
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

            <h3>Executive Summary</h3>
            <p>${escapeHtml(currentAnalysis.summary || '')}</p>

            <div class="action-items-section">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Action Items</h3>
                    ${checkAllBtn}
                </div>
                ${actionItemsHtml}
            </div>

            <h3>Sentiment</h3>
            <p>${escapeHtml(currentAnalysis.sentiment || '')}</p>
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
        checkbox.addEventListener('change', (e) => {
            const li = checkbox.closest('.action-item');
            if (checkbox.checked) {
                li.classList.add('completed');
            } else {
                li.classList.remove('completed');
            }
        });
    });

    // Set up "Check All" button
    const checkAllButton = analysisBody.querySelector('.check-all-btn');
    if (checkAllButton) {
        checkAllButton.addEventListener('click', () => {
            const allChecked = Array.from(actionItemCheckboxes).every(cb => cb.checked);

            actionItemCheckboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
                const li = checkbox.closest('.action-item');
                if (checkbox.checked) {
                    li.classList.add('completed');
                } else {
                    li.classList.remove('completed');
                }
            });

            // Update button text based on state
            const hasAnyChecked = Array.from(actionItemCheckboxes).some(cb => cb.checked);
            checkAllButton.textContent = hasAnyChecked ? '✗ Uncheck All' : '✓ Check All';
        });
    }

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
        alert('Error saving tags: ' + error.message);
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

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!checkAuth()) return;

    init();
});

async function init() {
    // Display current user
    if (currentUser) {
        document.getElementById('currentUser').textContent = `Logged in as: ${currentUser.username}`;
    }

    // Load user's theme preference if available
    if (currentUser?.theme) {
        setTheme(currentUser.theme);
    } else {
        loadTheme();
    }

    // Wire up logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Initialize recording controls (Whisper API + Screen Capture)
    initRecordingControls();
    loadUserLanguagePreference();
    updateLanguageButtonActive();

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

    // Load saved theme preference
    loadTheme();

    // Wire up control panel toggle button
    const toggleBtn = document.getElementById('toggleControlPanel');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleControlPanel);
    }

    // Load control panel visibility preference
    loadControlPanelVisibility();

    // Initialize control panel dragging
    initControlPanelDragging();

    // Load saved position from sessionStorage
    loadControlPanelPosition();

    // Wire up theme buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
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
