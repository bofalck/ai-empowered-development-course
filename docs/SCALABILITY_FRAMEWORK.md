# Scalability Framework: Building for Growth

## Problem Statement

Current architecture (main.js: 1925 lines):
- All code in one file
- Mixing concerns: rendering + events + business logic
- Hard to add new features (must search entire codebase)
- Hard to test individual features
- Hard for new developers to onboard

## Solution: Feature-Based Module Organization

Instead of organizing code by **type** (rendering, events, database), organize by **feature** so all related code lives together.

---

## Architecture: Feature Modules

### Directory Structure

```
src/
├── core/                              ← Shared utilities & infrastructure
│   ├── supabase.js                   ← Database client
│   ├── constants.js                  ← App constants
│   └── utils.js                      ← Helper functions
│
├── features/                          ← Feature-specific code
│   ├── recording/
│   │   ├── index.js                  ← Exports
│   │   ├── recording-state.js        ← State management (isRecording, isPaused, etc)
│   │   ├── recording-ui.js           ← Rendering (timer display, status)
│   │   ├── recording-events.js       ← Event listeners (record btn, pause btn)
│   │   └── recording-service.js      ← Business logic (start, stop, pause)
│   │
│   ├── analysis/
│   │   ├── index.js
│   │   ├── analysis-state.js         ← Current analysis, tags, etc
│   │   ├── analysis-ui.js            ← Render analysis panel, insights
│   │   ├── analysis-events.js        ← Event listeners for analysis UI
│   │   └── analysis-service.js       ← API calls to GPT, tag management
│   │
│   ├── meetings/
│   │   ├── index.js
│   │   ├── meetings-state.js         ← Loaded meetings, search state
│   │   ├── meetings-ui.js            ← Render meetings list, cards
│   │   ├── meetings-events.js        ← List item clicks, search input
│   │   └── meetings-service.js       ← Load, save, delete meetings
│   │
│   ├── theme/
│   │   ├── index.js
│   │   ├── theme-state.js
│   │   ├── theme-ui.js               ← Update theme buttons
│   │   ├── theme-events.js           ← Theme button clicks
│   │   └── theme-service.js          ← Apply theme CSS
│   │
│   ├── auth/
│   │   ├── index.js
│   │   ├── auth-state.js
│   │   ├── auth-ui.js                ← User display, logout btn
│   │   └── auth-events.js            ← Logout handler
│   │
│   └── shared/                        ← Shared components
│       ├── modals/
│       │   ├── modal-service.js      ← showAlert, showConfirm, showPrompt
│       │   └── modal-ui.js           ← Render modals
│       │
│       ├── components/
│       │   ├── buttons.js            ← Button rendering
│       │   └── inputs.js             ← Input rendering
│       │
│       └── control-panel/
│           ├── control-panel-ui.js
│           ├── control-panel-events.js
│           └── control-panel-service.js
│
├── app.js                            ← Initialize app, wire up features
└── main.js                           ← Entry point, load app
```

---

## How Each Feature Works

### Feature Module Pattern

Each feature module (e.g., `features/recording/`) contains:

#### 1. **index.js** - Public API
```javascript
export { default as recordingState } from './recording-state.js';
export { setupRecordingUI } from './recording-ui.js';
export { setupRecordingEvents } from './recording-events.js';
export { startRecording, stopRecording, pauseRecording } from './recording-service.js';
```

#### 2. **recording-state.js** - Local State
```javascript
// Centralized state for this feature
export const recordingState = {
  isRecording: false,
  isPaused: false,
  currentTranscript: '',
  recordingMode: 'microphone',
};

export function setRecordingState(updates) {
  Object.assign(recordingState, updates);
}

export function getRecordingState() {
  return recordingState;
}
```

#### 3. **recording-service.js** - Business Logic
```javascript
// Pure functions, no DOM manipulation
export async function startRecording() {
  setRecordingState({ isRecording: true, isPaused: false });
  // ... recording logic
}

export async function stopRecording() {
  setRecordingState({ isRecording: false });
  // ... save logic
}
```

#### 4. **recording-ui.js** - Rendering
```javascript
// Only DOM manipulation and rendering
import { recordingState } from './recording-state.js';

export function setupRecordingUI() {
  updateTimerDisplay();
  updateStatusDisplay();
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('recordingTimer');
  timerElement.textContent = formatTime(recordingState.elapsedTime);
}
```

#### 5. **recording-events.js** - Event Handlers
```javascript
// Only event listening, delegates to services
import { startRecording, stopRecording } from './recording-service.js';

export function setupRecordingEvents() {
  const recordBtn = document.getElementById('micButton');
  const pauseBtn = document.getElementById('pauseButton');

  recordBtn.addEventListener('click', startRecording);
  pauseBtn.addEventListener('click', stopRecording);
}
```

---

## Adding a New Feature: Step-by-Step

### Example: Add "Meeting Transcription Editor" Feature

**Step 1**: Create folder
```bash
mkdir src/features/transcription-editor
cd src/features/transcription-editor
```

**Step 2**: Create 5 files with standard pattern
```
transcription-editor/
├── index.js                    (exports)
├── transcription-editor-state.js
├── transcription-editor-ui.js
├── transcription-editor-events.js
└── transcription-editor-service.js
```

**Step 3**: Implement state
```javascript
// transcription-editor-state.js
export const editorState = {
  isEditing: false,
  editingMeetingId: null,
  editingText: '',
};
```

**Step 4**: Implement UI (rendering)
```javascript
// transcription-editor-ui.js
export function renderEditor(meetingId, transcript) {
  const editor = document.createElement('div');
  editor.className = 'transcript-editor';
  editor.innerHTML = `
    <textarea>${transcript}</textarea>
    <button class="save-btn">Save</button>
  `;
  return editor;
}
```

**Step 5**: Implement events
```javascript
// transcription-editor-events.js
export function setupEditorEvents() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('save-btn')) {
      saveMeetingTranscript();
    }
  });
}
```

**Step 6**: Implement service (business logic)
```javascript
// transcription-editor-service.js
export async function saveMeetingTranscript() {
  const text = editorState.editingText;
  await updateMeetingTranscript(editorState.editingMeetingId, text);
}
```

**Step 7**: Wire up in app.js
```javascript
// app.js
import * as transcriptionEditor from './features/transcription-editor/index.js';

export async function initializeApp() {
  // ... other features
  transcriptionEditor.setupEditorUI();
  transcriptionEditor.setupEditorEvents();
}
```

---

## Dependency Rules

### ✅ Allowed Dependencies

```
feature A service → core utils
feature A service → feature B service (via exports)
feature A ui → feature A state
feature A ui → shared/components
feature A events → feature A service
```

### ❌ Forbidden Dependencies

```
feature A state ← any other feature (state is private)
feature A events ← shared/modals (use via service)
ui → events (one-way: events call ui through service)
```

---

## Benefits of This Architecture

### For New Features
- Copy existing feature folder as template
- Consistent file structure
- All related code in one place
- Don't need to know where things go

### For Testing
- Test state independently (no DOM needed)
- Test UI rendering (mock state)
- Test events (mock elements)
- Test services (mock API)

### For Code Reuse
- Move entire feature folder to another project
- Import just the service functions
- Components are self-contained

### For Scaling Teams
- Different team members work on different features
- Clear boundaries prevent conflicts
- Easy code review: "Is this PR in one feature folder?"

### For Debugging
- Bug in recording? Look in `features/recording/`
- Feature is slow? Profile each file separately
- Memory leak? Isolate to feature and investigate

---

## Migration Path: Current → Feature-Based

### Phase 1: Create Feature Folders (Week 1)
```
features/
├── recording/
├── analysis/
├── meetings/
├── theme/
├── auth/
└── shared/
```

### Phase 2: Move State (Week 1-2)
Extract all state objects into `*-state.js` files

### Phase 3: Move Services (Week 2)
Extract all business logic into `*-service.js` files

### Phase 4: Move UI (Week 2-3)
Extract all rendering functions into `*-ui.js` files

### Phase 5: Move Events (Week 3)
Extract all event listeners into `*-events.js` files

### Phase 6: Wire Up (Week 3-4)
Update `app.js` to initialize all features

### Phase 7: Cleanup (Week 4)
Remove old main.js, optimize bundles

---

## File Size Estimates

**Before**:
```
main.js: 1925 lines
```

**After**:
```
src/
├── core/
│   ├── supabase.js: 50 lines
│   ├── constants.js: 30 lines
│   └── utils.js: 100 lines
├── features/
│   ├── recording/:
│   │   ├── index.js: 5 lines
│   │   ├── recording-state.js: 30 lines
│   │   ├── recording-service.js: 150 lines
│   │   ├── recording-ui.js: 100 lines
│   │   └── recording-events.js: 80 lines
│   ├── analysis/:
│   │   └── (5 files, ~400 lines total)
│   ├── meetings/:
│   │   └── (5 files, ~300 lines total)
│   └── shared/:
│       └── (modals, components, ~200 lines)
├── app.js: 50 lines (orchestration)
└── main.js: 20 lines (entry point)

Total: 1925 lines → same content, better organized
```

---

## Testing Strategy with Feature Modules

### Unit Tests (Feature-Level)
```
tests/features/
├── recording/
│   ├── recording-service.test.js
│   ├── recording-state.test.js
│   └── recording-ui.test.js
├── analysis/
└── meetings/
```

### Integration Tests (Feature Interactions)
```
tests/integration/
├── recording-to-analysis.test.js
├── meetings-search.test.js
└── theme-switching.test.js
```

### Regression Tests (Visual/Behavioral)
```
tests/regression/
├── ui-rendering.test.js
├── responsive-design.test.js
└── accessibility.test.js
```

---

## Example: Adding Real-Time Collaboration

With feature-based architecture:

```
features/collaboration/
├── index.js
├── collaboration-state.js     ← User cursors, selections
├── collaboration-ui.js        ← Render user cursors
├── collaboration-events.js    ← Cursor movement tracking
└── collaboration-service.js   ← WebSocket sync

// Wire up in app.js:
import * as collaboration from './features/collaboration/index.js';

// Done! No changes to other features needed.
```

---

## Best Practices

### 1. Keep Features Independent
- Each feature should work standalone
- Share only via exports, not direct imports of internal files

### 2. One Responsibility Per File
- `*-state.js`: Only state + getters/setters
- `*-service.js`: Only business logic
- `*-ui.js`: Only DOM manipulation
- `*-events.js`: Only event listening

### 3. No Circular Dependencies
```javascript
// ❌ Bad: circular dependency
// feature A service imports feature A events
// feature A events imports feature A service

// ✅ Good: one-way flow
// service → (called by) → events
// service → (renders) → ui
```

### 4. Document Feature APIs
```javascript
// features/recording/index.js
/**
 * Recording Feature
 *
 * State:
 * - recordingState.isRecording (boolean)
 * - recordingState.isPaused (boolean)
 *
 * Services:
 * - startRecording() → Promise
 * - stopRecording() → Promise
 * - pauseRecording() → Promise
 */
```

---

## Success Metrics

After implementing feature-based architecture:

| Metric | Before | After |
|--------|--------|-------|
| Lines in main file | 1925 | ~50 |
| Avg feature file size | N/A | ~100 lines |
| New feature setup time | 30 min | 5 min |
| Test coverage | 85 | 95+ |
| Code review time | Long | Shorter (focused) |
| Onboarding time | Days | Hours |

---

## Next Steps

1. Review this framework with team
2. Create feature folder structure
3. Start migration with one feature (Recording)
4. Establish naming conventions
5. Create feature template generator
6. Update documentation
7. Train team on pattern
