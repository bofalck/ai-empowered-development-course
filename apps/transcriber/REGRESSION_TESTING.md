# Transcriber Modal Regression Testing

## Overview

This document explains the regression tests for the transcriber modal dialogs and save workflow. These tests prevent data loss from broken modal buttons.

**Problem Being Prevented:** Modal button `onclick` attributes don't work in ES modules, causing save/confirm/prompt dialogs to become unresponsive. Users could lose recording data.

## Test Coverage

### 1. **Alert Modal (6 tests)**
- ✅ Show alert with title and message
- ✅ Close on OK button click
- ✅ Close on X button click
- ✅ Modal state management

### 2. **Confirm Modal (5 tests)**
- ✅ Show confirmation dialog
- ✅ Return `true` on OK
- ✅ Return `false` on Cancel
- ✅ Close on X button click
- ✅ Modal state management

### 3. **Prompt Modal (6 tests)**
- ✅ Show prompt with input field
- ✅ Populate default value
- ✅ Capture user input on OK
- ✅ Return null on Cancel
- ✅ Handle empty input
- ✅ Close on X button click

### 4. **Event Listeners (4 tests)**
- ✅ Alert buttons have listeners attached
- ✅ Confirm buttons have listeners attached
- ✅ Prompt buttons have listeners attached
- ✅ NO `onclick` attributes (must use `addEventListener`)

### 5. **Save Workflow (5 tests)** ⚠️ **CRITICAL**
- ✅ Display confirmation when saving
- ✅ Prompt for title after confirm
- ✅ Cancel save on user rejection
- ✅ Cancel save if title rejected
- ✅ Complete workflow: confirm → title → success
- ✅ Data preservation through all modal interactions

### 6. **Error Handling (3 tests)**
- ✅ Handle missing elements gracefully
- ✅ Handle rapid clicks
- ✅ No throws on duplicate show/hide

## Running the Tests

### Run all modal regression tests:
```bash
npm run test -- apps/transcriber/transcriber-modals.test.js
```

### Run with UI:
```bash
npm run test:ui -- apps/transcriber/transcriber-modals.test.js
```

### Run in watch mode:
```bash
npx vitest apps/transcriber/transcriber-modals.test.js --watch
```

### Run all tests:
```bash
npm run test
```

## Manual Regression Test Checklist

Before deploying, manually test this workflow:

**Scenario: Save a 2-minute meeting**

- [ ] 1. Launch transcriber app
- [ ] 2. Click "Record" button
- [ ] 3. Speak for ~30 seconds
- [ ] 4. Click "Save" button
- [ ] 5. **Confirmation dialog appears** - Click OK
  - ⚠️ If buttons don't respond: BUG - event listeners not attached
- [ ] 6. **Title prompt appears** - Enter "Test Meeting" - Click OK
  - ⚠️ If buttons don't respond: BUG - prompt modal not working
- [ ] 7. **Success alert appears** - Click OK
- [ ] 8. Verify meeting appears in "Archive" column
- [ ] 9. Click on meeting in archive
- [ ] 10. Verify transcript and metadata are intact

**Scenario: Cancel a save operation**

- [ ] 1. Record meeting (same as above)
- [ ] 2. Click "Save"
- [ ] 3. Click "Cancel" on confirmation dialog
  - ⚠️ If Cancel doesn't work: BUG - confirm modal buttons broken
- [ ] 4. Verify recording is still there (not lost)
- [ ] 5. Click "Save" again
- [ ] 6. Click OK on confirmation
- [ ] 7. Click "Cancel" on title prompt
  - ⚠️ If Cancel doesn't work: BUG - prompt modal buttons broken
- [ ] 8. Verify recording is still there (not lost)

**Scenario: Use X buttons to close modals**

- [ ] 1. Record meeting
- [ ] 2. Click "Save"
- [ ] 3. Click X button on confirmation modal
  - ⚠️ If X doesn't work: BUG - close button event listener failed
- [ ] 4. Verify recording still exists
- [ ] 5. Click "Save" again
- [ ] 6. Click OK on confirmation
- [ ] 7. Click X button on title prompt
  - ⚠️ If X doesn't work: BUG - close button not working
- [ ] 8. Verify recording still exists

## Key Implementation Details

### What Was Fixed

**Before (Broken):**
```html
<button class="modal-btn modal-btn-primary" onclick="saveRecording()">OK</button>
```
❌ `onclick` doesn't work in ES modules - button unresponsive

**After (Working):**
```html
<button class="modal-btn modal-btn-primary">OK</button>
```
✅ Event listener attached in `main.js`:
```javascript
const promptOkBtn = document.querySelector('#promptModal .modal-btn-primary');
if (promptOkBtn) promptOkBtn.addEventListener('click', acceptPrompt);
```

### Why This Matters

1. **Data Safety:** If users can't confirm saves, they lose recordings
2. **UX:** Frozen modals confuse users
3. **Silent Failure:** No error - button just doesn't work
4. **Easy to Regress:** Future changes could break this again

## When to Run Tests

- ✅ After any changes to modal HTML
- ✅ After updates to modal event handlers
- ✅ Before major releases
- ✅ If users report save issues
- ✅ After ES module refactoring

## Continuous Integration

These tests are run automatically as part of `npm run test`. They should pass 100% of the time.

```bash
npm run test:run  # Run all tests once
```

## Debugging Failed Tests

If a test fails:

1. **Check HTML structure** - Modal elements must exist and have correct IDs/classes
2. **Check event listeners** - Verify addEventListener calls in `main.js`
3. **Check for onclick attributes** - Should be removed
4. **Check modal CSS classes** - `.hidden` must be properly defined
5. **Run in UI mode** - `npm run test:ui` for visual debugging

```bash
npm run test:ui -- apps/transcriber/transcriber-modals.test.js
```

## Test Failure Impact

| Test Group | Impact if Fails |
|-----------|-----------------|
| Alert Modal | Users can't dismiss information messages |
| Confirm Modal | Users can't save meetings or confirm actions |
| Prompt Modal | Users can't enter meeting titles - LOSE DATA |
| Event Listeners | Modal buttons completely non-functional |
| Save Workflow | **CRITICAL - Data loss risk** |
| Error Handling | Unexpected crashes when clicking buttons |

## Related Code

- **Main implementation:** `apps/transcriber/main.js`
  - `showModal()`, `closeAlert()`, `acceptConfirm()`, `acceptPrompt()`
  - Event listener setup (~30 lines after line 2600)

- **HTML structure:** `apps/transcriber/index.html`
  - Lines 160-212: Modal HTML
  - CRITICAL: Must have no `onclick` attributes

- **Styles:** `styles.css`
  - `.modal-overlay`, `.themed-modal`, `.hidden` classes

## Future Improvements

- [ ] Add E2E tests with actual browser interaction
- [ ] Add integration tests with Supabase mock
- [ ] Monitor for modal-related errors in production
- [ ] Add timeout tests for slow responses
- [ ] Test keyboard support (Escape, Enter keys)
