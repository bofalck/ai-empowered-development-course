# Application Architecture: Modular Refactoring

## Overview

The application has been refactored from a single 1925-line `main.js` file into a modular architecture with focused, single-responsibility modules. This improves maintainability, testability, and code reusability.

## Module Structure

### Core Modules Created

#### 1. **utils.js** (`src/utils.js`)
**Purpose**: Shared utility functions with no external dependencies

**Exports**:
- `escapeHtml(text)` - Prevent XSS attacks
- `formatDuration(seconds)` - Format seconds to HH:MM:SS
- `formatDate(date)` - Format dates to readable strings
- `createRecordingUnicornSvg()` - Asset helper
- `createScholarlyUnicornSvg()` - Asset helper
- `normalizeActionItems(items)` - Convert old string format to new object format

**Dependencies**: None

---

#### 2. **database.js** (`src/database.js`)
**Purpose**: All Supabase database operations and the supabase client

**Exports**:
- `supabase` - The Supabase client instance
- `loadMeetings()` - Fetch all meetings
- `saveMeetingToSupabase(title, transcript, segments, duration)` - Save new meeting
- `saveMeetingTags(meetingId, tags)` - Update meeting tags
- `saveAnalysisToSupabase(meetingId, analysis)` - Save AI analysis
- `fetchAnalysis(meetingId)` - Get analysis for a meeting
- `deleteAnalysis(meetingId)` - Delete old analysis
- `saveActionItemsChanges(analysisId, actionItems)` - Save action item updates
- `getMeetingById(id)` - Get single meeting
- `updateMeetingTranscript(meetingId, transcript)` - Update meeting transcript

**Dependencies**: None

---

#### 3. **auth.js** (`src/auth.js`)
**Purpose**: User authentication and session management

**Exports**:
- `getSession()` - Get session from localStorage
- `clearSession()` - Clear session
- `logout()` - Logout user
- `checkAuth()` - Verify user is logged in
- `getCurrentUser()` - Get current user object
- `setCurrentUser(user)` - Set current user

**State**:
- `currentUser` - Current logged-in user

**Dependencies**: None

---

#### 4. **theme.js** (`src/theme.js`)
**Purpose**: Theme management and styling

**Exports**:
- `setTheme(themeName)` - Change theme ('default', 'signal', 'dark', 'prism')
- `updateThemeButtons()` - Update active state on theme buttons
- `loadTheme()` - Load saved theme from localStorage

**Dependencies**: None

---

#### 5. **ui-state.js** (`src/ui-state.js`)
**Purpose**: Control panel visibility, dragging, and UI state

**Exports**:
- `loadControlPanelVisibility()` - Load saved visibility preference
- `setControlPanelVisibility(isVisible)` - Show/hide control panel
- `toggleControlPanel()` - Toggle visibility
- `initControlPanelDragging()` - Enable drag-to-move
- `loadControlPanelPosition()` - Load saved panel position
- `resetControlPanelPosition()` - Reset to default position

**State**:
- `isDragging` - Track drag state
- `dragOffsetX`, `dragOffsetY` - Track drag offset

**Dependencies**: None

---

#### 6. **transcription.js** (`src/transcription.js`)
**Purpose**: Whisper API transcription and language management

**Exports**:
- `loadUserLanguagePreference()` - Load saved language
- `saveUserLanguagePreference(language)` - Save language preference
- `updateLanguageButtonActive()` - Update UI button states
- `getTranscriptionLanguage()` - Get current language
- `setTranscriptionLanguage(language)` - Change language
- `sendAudioToWhisper(audioBlob, language)` - Send audio to Whisper API
- `getCurrentTranscript()` - Get current transcript text
- `setCurrentTranscript(transcript)` - Update transcript
- `getTranscriptionSegments()` - Get segment data
- `setTranscriptionSegments(segments)` - Update segments

**State**:
- `transcriptionLanguage` - Current language ('en', 'sv', 'de', 'es')
- `currentTranscript` - Current transcript text
- `transcriptionSegments` - Segment metadata
- `isProcessingWithWhisper` - Processing flag

**Dependencies**: None

---

#### 7. **recording.js** (`src/recording.js`)
**Purpose**: Recording controls and audio capture

**Exports**:
- `startRecording()` - Start recording (mic or screen)
- `pauseRecording()` - Pause recording
- `resumeRecording()` - Resume from pause
- `stopRecording(transcriptionLanguage)` - Stop recording
- `updateTimer()` - Update timer display
- `clearRecording()` - Clear recording state
- `setRecordingMode(mode)` - Set mode ('microphone' or 'screen_audio')
- `getRecordingMode()` - Get current mode
- `getRecordingState()` - Get all recording state
- `updateRecordingState(state)` - Update recording state

**State**:
- `isRecording`, `isPaused` - Recording status
- `currentTranscript`, `transcriptionSegments` - Transcript data
- `recordingMode` - Current mode
- `mediaRecorder`, `audioChunks` - MediaRecorder state
- `audioStream`, `screenStream` - Media streams

**Dependencies**:
- Imports `sendAudioToWhisper` from transcription.js
- Imports `saveMeetingToSupabase` from database.js

---

#### 8. **analysis.js** (`src/analysis.js`)
**Purpose**: AI analysis and meeting analysis logic

**Exports**:
- `analyzeMeeting(meetingId, transcript)` - Analyze meeting with GPT
- `reanalyzeMeeting(meetingId, transcript)` - Delete old and create new analysis
- `saveActionItemsChanges(analysisId, actionItems)` - Save action item updates
- `getCurrentAnalysis()` - Get current analysis
- `setCurrentAnalysis(analysis)` - Set current analysis
- `getSuggestedTags()`, `setSuggestedTags()` - Manage suggested tags
- `getSelectedTags()`, `setSelectedTags()` - Manage selected tags
- `clearSelectedTags()` - Clear selected tags

**State**:
- `currentAnalysis` - Current analysis data
- `currentSuggestedTags` - AI-suggested tags
- `currentSelectedTags` - User-selected tags

**Dependencies**:
- Imports from database.js, utils.js

---

### Remaining to Modularize

#### UI Rendering Functions (Still in main.js)
- `renderAnalysisColumn()` - Render analysis panel
- `renderMeetingHistory()` - Render meetings list
- `renderAnalysisColumnWithButton()` - Render with analyze button
- `createMeetingInfoHtml()` - Generate HTML for meeting info
- `createKeyInsightsEmptyState()` - Empty state HTML
- `createLiveRecordingEmptyState()` - Empty state HTML
- `showTagSelection()` - Tag selection UI
- And other rendering functions...

**Recommended module**: `ui-rendering.js`

#### Event Handler Setup (Still in main.js)
- Recording button event listeners
- Modal controls
- Meeting selection
- Editing listeners
- And other event handlers...

**Recommended module**: `event-handlers.js`

---

## Dependency Graph

```
utils.js
├─→ database.js ─→ database
├─→ auth.js
├─→ theme.js
├─→ ui-state.js
├─→ transcription.js ─→ sendAudioToWhisper
├─→ recording.js ─→ transcription, database
├─→ analysis.js ─→ database, utils
└─→ main.js (imports all + orchestrates)
```

---

## Current State

✅ **Completed Modules**:
1. utils.js - Complete
2. database.js - Complete
3. auth.js - Complete
4. theme.js - Complete
5. ui-state.js - Complete
6. transcription.js - Complete
7. recording.js - Complete (minor unused variable warning)
8. analysis.js - Complete

🔄 **In Progress/Partial**:
- Recording module has unused audioTrack variable (safe to ignore)
- Main.js still contains rendering and event handler logic

---

## Next Steps to Complete Refactoring

### Phase 1: Create UI Rendering Module
Create `src/ui-rendering.js` and extract all rendering functions:
- Migrate all functions that generate HTML
- Migrate DOM manipulation functions
- Export functions for rendering different sections

### Phase 2: Create Event Handlers Module
Create `src/event-handlers.js` and extract all event setup:
- Move all `addEventListener` calls
- Create initialization function
- Export setup function called from main.js

### Phase 3: Update main.js
Refactor main.js to be primarily an orchestrator:
- Import all modules
- Initialize modules on DOMContentLoaded
- Wire up event handlers
- Keep minimal logic

### Phase 4: Clean up
- Remove diagnostic warnings (unused variables)
- Add JSDoc comments to all modules
- Update index.html to import from src/ if using ES modules in browser

---

## Benefits of This Architecture

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Modules can be tested independently
3. **Reusability**: Modules can be imported in other projects
4. **Scalability**: Easy to add new features without cluttering main.js
5. **Documentation**: Clear module boundaries and exports
6. **Debugging**: Easier to isolate issues to specific modules

---

## Module Usage Examples

### Using the theme module:
```javascript
import { setTheme, loadTheme } from './src/theme.js';

// Load saved theme on startup
loadTheme();

// Change theme
setTheme('dark');
```

### Using the recording module:
```javascript
import { startRecording, stopRecording, getRecordingMode } from './src/recording.js';

// Start recording
await startRecording();

// Check current mode
const mode = getRecordingMode(); // 'microphone' or 'screen_audio'

// Stop and trigger transcription
await stopRecording();
```

### Using the analysis module:
```javascript
import { analyzeMeeting, getCurrentAnalysis } from './src/analysis.js';

// Analyze a meeting
await analyzeMeeting(meetingId, transcript);

// Get results
const analysis = getCurrentAnalysis();
console.log(analysis.summary, analysis.action_items);
```

---

## File Organization

```
project/
├── src/
│   ├── utils.js                 ✅ Complete
│   ├── database.js              ✅ Complete
│   ├── auth.js                  ✅ Complete
│   ├── theme.js                 ✅ Complete
│   ├── ui-state.js              ✅ Complete
│   ├── transcription.js         ✅ Complete
│   ├── recording.js             ✅ Complete
│   ├── analysis.js              ✅ Complete
│   ├── ui-rendering.js          ⏳ TODO
│   └── event-handlers.js        ⏳ TODO
├── main.js                      📝 Original (needs updating)
├── main-new.js                  📝 Partial refactor example
└── ARCHITECTURE.md              📄 This file
```

---

## Notes

- All modules use ES6 import/export syntax
- Modules export named exports (easier to tree-shake)
- State is centralized per module (easier to manage)
- No circular dependencies
- All async operations use try/catch for error handling
