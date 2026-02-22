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
let recognition = null;
let isRestarting = false;
let currentAnalysis = null;
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let currentViewingMeetingId = null;
let currentSuggestedTags = [];
let currentSelectedTags = [];

// Initialize Web Speech API
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('Speech Recognition API not supported');
        alert('Speech Recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.language = 'en-US'; // English for testing
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let interimTranscript = '';

    recognition.onstart = () => {
        // Recording started
    };

    recognition.onresult = (event) => {
        interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                // Final result - add to segments
                if (transcript.trim()) {
                    transcriptionSegments.push({
                        id: transcriptionSegments.length + 1,
                        speaker: 'Speaker',
                        text: transcript,
                        timestamp: new Date().toLocaleTimeString(),
                        duration: 0
                    });
                    currentTranscript += transcript + ' ';
                }
            } else {
                // Interim result
                interimTranscript += transcript;
            }
        }

        // Update display with interim + final
        const display = document.getElementById('transcriptionDisplay');
        const displayText = currentTranscript + (interimTranscript ? interimTranscript : '');
        display.textContent = displayText || '';
        display.scrollTop = display.scrollHeight;
    };

    recognition.onerror = (event) => {
        // Ignore 'aborted' error - that's normal when we pause/stop
        if (event.error === 'aborted') {
            return;
        }

        console.error('Speech recognition error:', event.error);
        const status = document.getElementById('recordingStatus');

        if (event.error === 'no-speech') {
            status.textContent = 'No speech detected. Please try again.';
            // Stop recording and show error
            stopRecordingDueToError('no-speech');
        } else if (event.error === 'network') {
            status.textContent = 'Network error. Check your connection.';
            stopRecordingDueToError('network');
        } else if (event.error === 'not-allowed') {
            status.textContent = 'Microphone permission denied';
            stopRecordingDueToError('not-allowed');
        } else {
            status.textContent = `Error: ${event.error}`;
            stopRecordingDueToError(event.error);
        }
    };

    recognition.onend = () => {
        // Recording ended
    };
}

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

        // Insert meeting with audio URL
        const { data: meetingData, error: meetingError } = await supabase
            .from('meetings')
            .insert([
                {
                    title,
                    transcript,
                    segments,
                    duration,
                    audio_url: audioUrl,
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

// Recording controls
async function startRecording() {
    if (!recognition) return;

    isRecording = true;
    isPaused = false;
    currentTranscript = '';
    transcriptionSegments = [];
    recordingStartTime = Date.now();
    audioChunks = [];

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Stop Recording';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = false;

    const status = document.getElementById('recordingStatus');
    status.textContent = 'Recording... (speak now)';
    status.classList.add('recording');

    // Start audio recording
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
        console.log('Audio recording started');
    } catch (err) {
        console.error('Error starting audio recording:', err);
    }

    // Start speech recognition
    try {
        recognition.start();
    } catch (err) {
        console.error('Error starting recognition:', err);
    }

    // Start timer
    timerInterval = setInterval(updateTimer, 100);
}

function pauseRecording() {
    if (!recognition) return;

    isPaused = true;
    isRecording = false;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Continue Recording';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.textContent = 'Paused';
    status.classList.remove('recording');

    try {
        recognition.abort();
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.pause();
        }
    } catch (err) {
        console.error('Error pausing:', err);
    }
    clearInterval(timerInterval);
}

function resumeRecording() {
    if (!recognition) return;

    isPaused = false;
    isRecording = true;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Stop Recording';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = false;

    const status = document.getElementById('recordingStatus');
    status.textContent = 'Recording... (speak now)';
    status.classList.add('recording');

    try {
        recognition.start();
        if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
    } catch (err) {
        console.error('Error resuming:', err);
    }

    // Restart timer from where it was
    timerInterval = setInterval(updateTimer, 100);
}

function stopRecording() {
    if (!recognition) return;

    isRecording = false;
    isPaused = false;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Record Meeting';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.textContent = 'Ready to record';
    status.classList.remove('recording');

    try {
        recognition.abort();
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
    } catch (err) {
        console.error('Error stopping:', err);
    }
    clearInterval(timerInterval);
}

function stopRecordingDueToError(errorType) {
    isRecording = false;
    isPaused = false;
    isRestarting = false;

    const recordBtn = document.getElementById('micButton');
    recordBtn.textContent = 'Record Meeting';

    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.disabled = true;

    const status = document.getElementById('recordingStatus');
    status.classList.remove('recording');

    clearInterval(timerInterval);

    try {
        if (recognition) {
            recognition.abort();
        }
    } catch (err) {
        console.log('Recognition already stopped');
    }

    // Show user-friendly error message
    const errorMessages = {
        'no-speech': {
            title: 'No Speech Detected',
            message: 'The microphone didn\'t pick up any speech. This could happen if:\n\n• Your microphone is not working\n• You were speaking too quietly\n• There was too much background noise\n• Your microphone permissions were revoked\n\nPlease check your microphone and try again.'
        },
        'network': {
            title: 'Network Error',
            message: 'There was a problem connecting to the speech recognition service. Please check your internet connection and try again.'
        },
        'not-allowed': {
            title: 'Microphone Permission Denied',
            message: 'The browser doesn\'t have permission to access your microphone. Please:\n\n1. Click the camera/microphone icon in your browser address bar\n2. Allow microphone access for this site\n3. Try recording again'
        },
        'default': {
            title: 'Recording Error',
            message: 'An error occurred while recording. Please try again.'
        }
    };

    const error = errorMessages[errorType] || errorMessages['default'];
    showErrorPopup(error.title, error.message);
}

function showErrorPopup(title, message) {
    alert(`${title}\n\n${message}`);
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
    document.getElementById('transcriptionDisplay').textContent = '';
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
    document.getElementById('modalTitle').textContent = meeting.title;

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
    const analysisColumn = document.querySelector('.kanban-column:nth-child(2)');
    const analysisBody = analysisColumn.querySelector('.analysis-body') ||
                        (() => {
                            const div = document.createElement('div');
                            div.className = 'analysis-body';
                            const existingBody = analysisColumn.querySelector('.empty-placeholder');
                            if (existingBody) existingBody.replaceWith(div);
                            else analysisColumn.appendChild(div);
                            return div;
                        })();

    const meeting = savedMeetings.find(m => m.id === meetingId);
    const meetingInfoHtml = meeting ? `
        <div style="padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem;">
            <p style="margin: 0 0 0.25rem 0; color: #6b7280; font-size: 0.875rem;">Currently viewing:</p>
            <p style="margin: 0; font-weight: 500; color: var(--color-text);">${escapeHtml(meeting.title)}</p>
        </div>
    ` : '';

    analysisBody.innerHTML = `
        <div class="analysis-content">
            ${meetingInfoHtml}
            <div class="analysis-header">
                <h2>Key Insights & AI Analysis</h2>
            </div>
            <p style="color: #6b7280; margin-bottom: 1rem;">No analysis available for this meeting yet.</p>
            <button class="analyze-btn" data-meeting-id="${meetingId}">Generate Analysis</button>
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
}

function closeMeetingTranscript() {
    currentViewingMeetingId = null;
    document.getElementById('transcriptModal').classList.add('hidden');
    renderMeetingHistory();

    // Show empty state in analysis column
    const analysisColumn = document.querySelector('.kanban-column:nth-child(2)');
    const analysisBody = analysisColumn.querySelector('.analysis-body');
    if (analysisBody) {
        analysisBody.innerHTML = `<div class="empty-placeholder">Select a meeting to view AI analysis</div>`;
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

    savedMeetings.forEach(meeting => {
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
                    <div class="meeting-title">${escapeHtml(meeting.title)}</div>
                    <div class="meeting-meta">
                        <span>${dateStr} ${timeStr}</span>
                        <span>${durationMins}m ${durationSecs}s</span>
                    </div>
                    ${tagsHtml}
                </div>
                <button class="meeting-menu-btn" data-meeting-id="${meeting.id}" title="Options">⋮</button>
            </div>
        `;

        // Click to select meeting (not open)
        li.addEventListener('click', (e) => {
            // Don't select if clicking the menu button
            if (e.target.classList.contains('meeting-menu-btn')) return;
            selectMeeting(meeting.id);
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
    const analysisColumn = document.querySelector('.kanban-column:nth-child(2)');
    const analysisBody = analysisColumn.querySelector('.analysis-body') ||
                        (() => {
                            const div = document.createElement('div');
                            div.className = 'analysis-body';
                            const existingBody = analysisColumn.querySelector('.empty-placeholder');
                            if (existingBody) existingBody.replaceWith(div);
                            else analysisColumn.appendChild(div);
                            return div;
                        })();

    if (!currentAnalysis) {
        analysisBody.innerHTML = `
            <div class="empty-placeholder">
                <p>Select a meeting to view or generate analysis</p>
            </div>
        `;
        return;
    }

    let actionItemsHtml = '';
    if (Array.isArray(currentAnalysis.action_items)) {
        actionItemsHtml = '<ul>' +
            currentAnalysis.action_items.map(item => `<li>${escapeHtml(item)}</li>`).join('') +
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

    const meeting = savedMeetings.find(m => m.id === currentViewingMeetingId);
    const meetingInfoHtml = meeting ? `
        <div style="padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem;">
            <p style="margin: 0 0 0.25rem 0; color: #6b7280; font-size: 0.875rem;">Currently viewing:</p>
            <p style="margin: 0; font-weight: 500; color: var(--color-text);">${escapeHtml(meeting.title)}</p>
        </div>
    ` : '';

    analysisBody.innerHTML = `
        <div class="analysis-content">
            ${meetingInfoHtml}
            <div class="analysis-header">
                <h2>Key Insights & AI Analysis</h2>
                <div class="analysis-buttons">
                    ${addTagsBtn}
                    ${reanalyzeBtn}
                </div>
            </div>

            <h3>Executive Summary</h3>
            <p>${escapeHtml(currentAnalysis.summary || '')}</p>

            <h3>Action Items</h3>
            ${actionItemsHtml}

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
}

// Analyze or re-analyze a meeting
async function reanalyzeMeeting(meetingId) {
    const meeting = savedMeetings.find(m => m.id === meetingId);
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
        const { error } = await supabase
            .from('meetings')
            .update({ tags })
            .eq('id', meetingId);

        if (error) throw error;

        // Update local meetings
        const meeting = savedMeetings.find(m => m.id === meetingId);
        if (meeting) {
            meeting.tags = tags;
        }

        currentSelectedTags = [];
        renderMeetingHistory();
        alert('Tags saved!');
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
            <div class="suggested-tags">
                ${suggestedTags.map(tag => `
                    <button class="tag-btn" data-tag="${escapeHtml(tag)}" onclick="toggleTag('${escapeHtml(tag)}')">${escapeHtml(tag)}</button>
                `).join('')}
            </div>
            <p>Or add custom tag:</p>
            <div class="custom-tag-input">
                <input type="text" id="customTagInput" placeholder="Enter custom tag">
                <button onclick="addCustomTag()">Add</button>
            </div>
            <div class="selected-tags">
                <p>Selected tags:</p>
                <div id="selectedTagsList"></div>
            </div>
            <div class="tag-actions">
                <button class="save-tags-btn" onclick="finishTagSelection(${meetingId})">Save Tags</button>
                <button class="cancel-tags-btn" onclick="closeTagSelection()">Cancel</button>
            </div>
        </div>
    `;

    const analysisBody = document.querySelector('.analysis-body');
    analysisBody.innerHTML = tagSelectionHtml;
    currentSuggestedTags = suggestedTags;
    currentSelectedTags = [];
    updateTagsList();
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
            <span class="selected-tag">${escapeHtml(tag)} <button onclick="removeTag('${escapeHtml(tag)}')">×</button></span>
        `).join('');
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
    init();
});

async function init() {
    // Initialize speech recognition
    initSpeechRecognition();

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

    // Render initial UI
    renderMeetingHistory();
}
