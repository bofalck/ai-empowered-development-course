# Phase 1 Accessibility Testing Procedures

## Overview

This document provides comprehensive, step-by-step testing procedures for Phase 1 accessibility compliance. These procedures can be followed by anyone - no QA expertise required.

## Testing Checklist Summary

- [ ] **Contrast Ratio Testing** - Verify color contrast meets WCAG AA standards
- [ ] **Screen Reader Testing (NVDA)** - Windows accessibility validation
- [ ] **Screen Reader Testing (VoiceOver)** - Mac accessibility validation
- [ ] **Screen Reader Testing (TalkBack)** - Android accessibility validation
- [ ] **Screen Reader Testing (VoiceOver iOS)** - iOS accessibility validation

---

# PART 1: CONTRAST RATIO VERIFICATION (WCAG AA Compliance)

## Overview

Contrast ratio testing ensures text is readable for people with low vision. WCAG AA requires:
- **4.5:1** minimum contrast for normal text (14px or smaller)
- **3:1** minimum contrast for large text (18px+ or 14px+ bold)

## Color Palette Reference

### Default Theme
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | MUJI Natural | #F7F6F3 | Page background |
| Text Primary | Dark | #2B2A28 | Main text |
| Text Secondary | Medium Dark | #3A3936 | Subtext |
| Primary Button | Slate | #4A5568 | Primary actions |
| Divider | Light | #E2E0DB | Borders |

### Signal in Silence Theme
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Off-white | #F5F4F0 | Page background |
| Text Primary | Black | #111111 | Main text |
| Text Secondary | Dark Gray | #3A3936 | Subtext |
| Primary Accent | Red | #E10600 | Emphasis |
| Secondary Accent | Blue | #0047FF | Alternative emphasis |

### Dark Theme
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Deep charcoal | #161513 | Page background |
| Text Primary | Light | #F2F0EB | Main text |
| Text Secondary | Light Gray | #C4C0BA | Subtext |
| Primary Button | Taupe | #8B8680 | Primary actions |
| Divider | Medium dark | #2A2825 | Borders |

### PrismPulse Theme
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Off-white | #FDFBFF | Page background |
| Text Primary | Dark Purple | #2B1B47 | Main text |
| Text Secondary | Purple | #5A5370 | Subtext |
| Primary | Hot Pink | #FF4FD8 | Emphasis |
| Secondary | Lavender | #9A6BFF | Alternative |
| Accent Blue | Aqua | #39D9FF | Links |
| Accent Green | Lime | #6EEB83 | Success |

## Testing Procedure

### Step 1: Prepare Your Testing Environment

1. Open the "After the Noise" application in your browser
2. Open WebAIM Contrast Checker in a new tab: https://webaim.org/resources/contrastchecker/
3. Have a color picker tool ready (browser DevTools will work)

### Step 2: Extract Colors Using Browser DevTools

**For Windows (Chrome/Edge):**
1. Right-click on an element you want to test
2. Select "Inspect" or "Inspect Element"
3. Look for the `color:` or `background-color:` properties in the Styles panel
4. Click on the color swatch to open the color picker

**For Mac (Safari/Chrome):**
1. Right-click on an element you want to test
2. Select "Inspect Element"
3. Look for the `color:` or `background-color:` properties
4. Click on the color value or swatch

### Step 3: Test Each Theme's Text Contrast

#### Testing Template for Each Theme:

**Theme Name:** [Default/Signal/Dark/PrismPulse]

| Text Element | Foreground Color | Background Color | Ratio | Status | Notes |
|--------------|------------------|------------------|-------|--------|-------|
| Primary Text | #color | #color | X:1 | PASS/FAIL | |
| Secondary Text | #color | #color | X:1 | PASS/FAIL | |
| Button Text | #color | #color | X:1 | PASS/FAIL | |
| Link Text | #color | #color | X:1 | PASS/FAIL | |
| Header Text | #color | #color | X:1 | PASS/FAIL | |

### Step 4: Specific Contrast Ratios to Test

#### DEFAULT THEME

**Test 1: Main Body Text**
- **Element to test:** Any paragraph text in the interface
- **Foreground:** #2B2A28 (Dark)
- **Background:** #F7F6F3 (Light)
- **Expected ratio:** 12.8:1 ✓ PASS
- **How to test:**
  1. Open WebAIM Contrast Checker
  2. Enter foreground: #2B2A28
  3. Enter background: #F7F6F3
  4. Verify ratio is 4.5:1 or higher

**Test 2: Primary Button (14pt)**
- **Element to test:** "Save", "Clear", "Record" buttons
- **Foreground:** #F7F6F3 (Light text on button)
- **Background:** #4A5568 (Slate)
- **Expected ratio:** 8.5:1 ✓ PASS

**Test 3: Column Headers**
- **Element to test:** "Recording", "Analysis", "Archive" headers
- **Foreground:** #2B2A28
- **Background:** #F7F6F3
- **Expected ratio:** 12.8:1 ✓ PASS

**Test 4: Secondary Text**
- **Element to test:** Meeting dates, metadata, timestamps
- **Foreground:** #3A3936 (Medium Dark)
- **Background:** #F7F6F3
- **Expected ratio:** 9.2:1 ✓ PASS

#### SIGNAL IN SILENCE THEME

**Test 1: Main Body Text**
- **Foreground:** #111111 (Black)
- **Background:** #F5F4F0 (Off-white)
- **Expected ratio:** 18.5:1 ✓ PASS

**Test 2: Accent Red Buttons**
- **Foreground:** #FFFFFF (White text)
- **Background:** #E10600 (Red)
- **Expected ratio:** 8.5:1 ✓ PASS

**Test 3: Accent Blue Buttons**
- **Foreground:** #FFFFFF (White text)
- **Background:** #0047FF (Blue)
- **Expected ratio:** 10:1 ✓ PASS

**Test 4: Text on Red Background**
- **Foreground:** #111111 (Black)
- **Background:** #E10600 (Red)
- **Expected ratio:** 10.3:1 ✓ PASS

#### DARK THEME

**Test 1: Main Body Text**
- **Foreground:** #F2F0EB (Light)
- **Background:** #161513 (Very Dark)
- **Expected ratio:** 13.1:1 ✓ PASS

**Test 2: Primary Button**
- **Foreground:** #F7F6F3 (Light text)
- **Background:** #8B8680 (Taupe)
- **Expected ratio:** 9.2:1 ✓ PASS

**Test 3: Secondary Text**
- **Foreground:** #C4C0BA (Light Gray)
- **Background:** #161513 (Very Dark)
- **Expected ratio:** 6.1:1 ✓ PASS

**Test 4: Column Headers**
- **Foreground:** #F2F0EB
- **Background:** #161513
- **Expected ratio:** 13.1:1 ✓ PASS

#### PRISMULSE THEME

**Test 1: Main Body Text**
- **Foreground:** #2B1B47 (Dark Purple)
- **Background:** #FDFBFF (Off-white)
- **Expected ratio:** 10.2:1 ✓ PASS

**Test 2: Primary Button (Hot Pink)**
- **Foreground:** #FFFFFF (White)
- **Background:** #FF4FD8 (Hot Pink)
- **Expected ratio:** 6.3:1 ✓ PASS

**Test 3: Secondary Button (Lavender)**
- **Foreground:** #2B1B47 (Dark text)
- **Background:** #9A6BFF (Lavender)
- **Expected ratio:** 4.8:1 ✓ PASS

**Test 4: Links (Aqua)**
- **Foreground:** #39D9FF (Aqua)
- **Background:** #FDFBFF
- **Expected ratio:** 5.1:1 ✓ PASS

### Step 5: Recording Your Results

**For each test, create an entry:**

```
Date: [YYYY-MM-DD]
Tester: [Your Name]
Theme: [Theme Name]
Element: [Button/Text/Header/etc]
Foreground Color: [#HEX]
Background Color: [#HEX]
Measured Ratio: [X:1]
Required Ratio: [4.5:1 or 3:1]
Status: [PASS/FAIL]
Notes: [Any observations]
```

### Step 6: What to Do If You Find Issues

**If a contrast ratio is below 4.5:1:**

1. Note the specific element and theme
2. Check if it's body text (needs 4.5:1) or large text (needs 3:1)
3. Create a GitHub issue with:
   - Theme affected
   - Element/component name
   - Current and required ratios
   - Screenshot of DevTools showing colors

4. Possible fixes:
   - Darken foreground color
   - Lighten background color
   - Adjust theme CSS variables
   - Use different color combination

---

# PART 2: SCREEN READER TESTING

## Overview

Screen reader testing validates that all interactive elements and content are properly announced to users with visual impairments. The application needs to work with:

- **NVDA** (Windows) - free, open-source
- **JAWS** (Windows) - commercial (optional)
- **VoiceOver** (Mac) - built-in
- **TalkBack** (Android) - built-in
- **VoiceOver** (iOS) - built-in

## What Screen Readers Announce

Screen readers speak:
- Page structure (headings, lists, sections)
- Link text and button purposes
- Form labels and input types
- Error messages
- Dynamic content changes (loading states, alerts)
- Alternative text for images

## Expected Behavior Reference

### Semantic HTML Requirements

- All text content should have proper heading hierarchy (h1, h2, h3)
- Form inputs should have associated `<label>` elements with `for` attribute matching input `id`
- Buttons should have clear, descriptive text
- Links should have meaningful link text (not "click here")
- Navigation should use semantic `<nav>` element
- Main content should use `<main>` element
- Landmarks should be used: `<header>`, `<footer>`, `<section>`, `<article>`

---

## TESTING: NVDA (Windows)

### Prerequisites

- Windows 10 or Windows 11
- Administrator access to install software
- USB drive (optional, NVDA portable version available)
- Browser: Chrome, Firefox, or Edge

### Download and Installation

1. Go to https://www.nvaccess.org/download/
2. Click "Download Version X.XX.X" (most recent stable version)
3. Run the installer (.exe file)
4. Follow installation wizard
5. Accept default settings unless you need advanced configuration
6. Restart your computer (recommended)

### Starting NVDA

1. Click the Windows start button
2. Type "NVDA"
3. Press Enter to start
4. You'll hear a startup sound and tone

### Basic NVDA Controls

| Action | Keyboard Shortcut |
|--------|-------------------|
| Start/Stop Reading | Ctrl + Alt + Down Arrow |
| Read Current Line | Ctrl + Alt + Up Arrow |
| Read Current Character | Ctrl + Alt + Right Arrow |
| Navigate Forward | Down Arrow |
| Navigate Backward | Up Arrow |
| Pause/Resume | Ctrl |
| Cycle through heading levels | H (for h1), 2 (for h2), 3 (for h3) |
| Jump to next button | B |
| Jump to next form field | F |
| List all headings | H + Alt |
| List all links | K |

### Testing Procedure: Login/Authentication

**Step 1: Load the Application**

1. Open browser and navigate to the application
2. Start NVDA (if not already running)
3. Press Ctrl + Alt + Down Arrow to start reading

**Expected to hear:**
```
"After the Noise, web page
Navigation section
Button: Default Theme
Button: Signal Theme
... (other theme buttons)
Main section
Article
Heading level 1: After the Noise
```

**Test Points:**
- [ ] Application name is announced
- [ ] Logo/title is presented as heading
- [ ] Theme buttons are announced as buttons (not just clickable elements)
- [ ] Main content area is identified as such

**Step 2: Check Form Labels**

1. Press F to jump to the first form field
2. Listen for: "Email address, edit text" or similar
3. Move to password field with Down Arrow
4. Listen for: "Password, edit text, protected"

**Expected to hear:**
```
"Email address, edit text"
[Tab]
"Password, edit text, protected"
```

**Issue to check for:**
- [ ] Label is clearly announced BEFORE the input type
- [ ] Password field is announced as "protected"
- [ ] Placeholder text is NOT used in place of labels

**Step 3: Check Buttons**

1. Press B to jump to buttons
2. For each button, verify the purpose is clear

**Expected to hear:**
```
"Login, button"
"Sign up, button"
"Cancel, button"
```

**NOT acceptable:**
```
"Button" (with no text)
"Click me, button" (unclear purpose)
```

**Step 4: Test Theme Switching**

1. In NVDA, press B to go to first button
2. You should hear theme buttons announced
3. Listen to what each button is called

**Expected to hear:**
```
"Default theme, button"
"Signal in Silence theme, button"
"Dark theme, button"
"PrismPulse theme, button"
```

**Step 5: Record Your Findings**

Create a log entry:

```
NVDA Testing Log - Login Flow
Date: [YYYY-MM-DD]
Tester: [Name]

Test Results:
- [ ] PASS: Application title announced as H1
- [ ] PASS: Theme buttons announced with descriptive text
- [ ] PASS: Form labels associated with inputs
- [ ] PASS: Password field announced as protected
- [ ] PASS: All buttons have clear purposes

Issues Found:
[List any problems or missing announcements]
```

### Testing Procedure: Recording Setup (Mode and Language Selection)

**Step 1: Navigate to Recording Controls**

1. With NVDA running, press Tab to navigate through page
2. Listen for recording mode buttons
3. Stop when you hear "Microphone, button" or similar

**Expected to hear:**
```
"Recording mode selector, group
Microphone, button, selected, pressed"
"Screen and audio, button"
```

**Issues to check:**
- [ ] Mode selector is announced as a group/fieldset
- [ ] Currently selected option is announced as "selected" or "pressed"
- [ ] Button purpose is clear

**Step 2: Check Language Selection**

1. Continue tabbing to language buttons
2. Listen for language announcements
3. Note which language is active

**Expected to hear:**
```
"Language selector, group
English, button, selected"
"Swedish, button"
"German, button"
"Spanish, button"
```

**Step 3: Test Language Selection**

1. Press Tab or click to navigate to a language button
2. Press Enter to select a different language
3. Wait and listen for confirmation announcement

**Expected to hear:**
- Language changed confirmation (may be visual only - note if it's not announced)
- Settings saved message (if applicable)

**Step 4: Check Audio Device Selector**

1. Navigate to audio device dropdown
2. Listen for dropdown announcement

**Expected to hear:**
```
"Audio device, combobox, Default Device"
```

**Step 5: Recording Issues to Note**

Create an issue entry if:
- [ ] Mode buttons not announced as buttons
- [ ] Selected state not announced
- [ ] Language not announced with full name
- [ ] Device dropdown not announced as dropdown/select
- [ ] No confirmation when changing settings

### Testing Procedure: Start/Pause/Stop Recording

**Step 1: Locate Recording Buttons**

1. Navigate with Tab to find recording buttons
2. Listen for button names

**Expected to hear:**
```
"Record, button"
"Pause, button, disabled"
```

**Step 2: Start Recording**

1. Press Enter on the Record button
2. Wait 2-3 seconds
3. Listen for any announcement

**Expected to hear:**
```
"Recording, button"  [button text changes]
"Recording started"  [announcement, if implemented]
```

**Issues to check:**
- [ ] Button state changes are announced
- [ ] Recording status is announced (visual OR announced)
- [ ] Timer is displayed (content is available)

**Step 3: Pause Recording**

1. Press Tab to find Pause button
2. It should now be enabled (not grayed out)
3. Press Enter to pause

**Expected to hear:**
```
"Pause, button"  [now enabled instead of disabled]
[After pause]
"Recording paused, button"
"Resume, button"  [new button appears]
```

**Step 4: Resume Recording**

1. If Resume button appears, press Tab to find it
2. Press Enter to resume

**Expected to hear:**
```
"Recording resumed"
"Pause, button"  [state changes back]
```

**Step 5: Stop Recording**

1. Look for Stop button (may be same as Record button)
2. Press Enter to stop

**Expected to hear:**
```
"Recording stopped"
"Transcription processing..."  [if applicable]
```

**Step 6: Recording Control Issues**

Log any of these issues found:
- [ ] Button state changes not announced
- [ ] Pause button doesn't become enabled
- [ ] No announcement when recording starts/stops
- [ ] Timer not readable by screen reader
- [ ] Recording status unclear

### Testing Procedure: Save Meeting

**Step 1: Complete a Recording**

1. Follow the Start/Pause/Stop procedure
2. After stopping, look for a Save button

**Step 2: Locate Save Button**

1. Use B to jump to buttons
2. Listen for "Save" button

**Expected to hear:**
```
"Save, button"
```

**Step 3: Save Meeting**

1. Press Enter on Save button
2. Wait for any confirmation

**Expected to hear (Option A - If modal appears):**
```
"Save meeting dialog, dialog
Title, edit text"  [or similar]
```

**Expected to hear (Option B - If form fields):**
```
"Meeting title, edit text"
"Save, button"
"Cancel, button"
```

**Step 4: Enter Title and Save**

1. If a title field exists, it should be auto-focused
2. Type a meeting title
3. Press Tab to navigate to Save button
4. Press Enter to save

**Expected to hear:**
```
"Meeting saved"
"Meeting added to archive"  [or similar confirmation]
```

**Step 5: Verify Meeting Appears**

1. Navigate to the meeting list/archive column
2. Use arrow keys to find the newly saved meeting
3. It should be announced with title and metadata

**Step 6: Save Meeting Issues**

- [ ] Save button not found or unclear
- [ ] No confirmation message after saving
- [ ] Modal dialog not announced as dialog
- [ ] Title input not properly labeled
- [ ] Saved meeting not appearing in list
- [ ] No way to know if save was successful

### Testing Procedure: View Meeting List

**Step 1: Navigate to Archive Column**

1. Use Tab to navigate to the Archive/Meeting List section
2. Listen for column header

**Expected to hear:**
```
"Archive, heading"
"Meeting list"
```

**Step 2: Find Search Input**

1. Press F to jump to form fields
2. Should find search input

**Expected to hear:**
```
"Search meetings, edit text"
```

**Step 3: Review Meeting Items**

1. Press Down Arrow to navigate through meeting list
2. Each meeting should be announced with:
   - Title
   - Date created
   - Duration
   - Tags (if any)

**Expected to hear:**
```
"Team Standup Meeting, list item, 2026-02-24, 15 minutes"
"Tags: planning, urgent"
```

**Step 4: Select a Meeting**

1. Press Enter on a meeting to view details
2. Listen for announcement of selected state

**Expected to hear:**
```
"Team Standup Meeting, selected"
[Content appears in Analysis column]
"Meeting analysis loaded"  [if applicable]
```

**Step 5: Meeting List Issues**

- [ ] Meeting items not announced as list items
- [ ] No title announced for meetings
- [ ] Dates/metadata not readable
- [ ] Selected state not announced
- [ ] Search field not properly labeled
- [ ] Empty state message not announced

### Testing Procedure: View Analysis (Kanban Layout)

**Step 1: Select a Meeting**

1. Navigate to meeting list
2. Select a meeting by pressing Enter
3. Content should load in the Analysis column

**Step 2: Check Analysis Section Heading**

1. Press H to jump to headings
2. Listen for analysis headings

**Expected to hear:**
```
"Analysis, heading"
"Summary, heading"  [or section headings]
"Action Items, heading"
"Key Insights, heading"
```

**Step 3: Review Analysis Hierarchy**

1. Press 2 to navigate by H2 headings
2. You should hear main analysis section headings

**Step 4: Check Content Sections**

Use arrow keys to read through each section:

**Summary Section:**
```
"Summary, heading
[Content is read out]"
```

**Action Items Section:**
```
"Action Items, heading"
"Checkbox, checked, Plan Q1 roadmap"
"Checkbox, unchecked, Review budget proposal"
```

**Key Insights Section:**
```
"Key Insights, heading
[Content is read]"
```

**Step 5: Kanban Layout Issues**

- [ ] Column headers not announced as headings
- [ ] No heading hierarchy (all same level)
- [ ] Sections not clearly separated
- [ ] Links within analysis not announced
- [ ] List structure not used for list content
- [ ] Kanban layout not understandable sequentially

### Testing Procedure: Edit Transcript

**Step 1: Open a Meeting**

1. Select a meeting from the list
2. Wait for content to load in Analysis column

**Step 2: Find Edit Button**

1. Press B to jump to buttons
2. Look for Edit button

**Expected to hear:**
```
"Edit, button"
```

**Step 3: Open Transcript Modal**

1. Press Enter on Edit button
2. Listen for modal announcement

**Expected to hear:**
```
"Transcript edit, dialog
Title, edit text"  [or modal heading]
[Content inside modal is announced]
```

**Step 4: Check Modal Structure**

1. Modal should be announced as dialog
2. Modal should have a close button

**Expected to hear:**
```
"Edit transcript, dialog
[Modal content]
Close, button"
```

**Step 5: Edit Transcript**

1. Navigate to transcript text area
2. Should be announced as textarea

**Expected to hear:**
```
"Transcript, text area, edit text"
[Current transcript text]
```

**Step 6: Save Changes**

1. After editing, find Save button
2. Press Enter

**Expected to hear:**
```
"Transcript saved"
"Closing dialog"
```

**Step 7: Edit Transcript Issues**

- [ ] Edit button not found or unclear
- [ ] Modal not announced as modal/dialog
- [ ] Transcript textarea not properly labeled
- [ ] Close button not available
- [ ] No confirmation message after save
- [ ] Modal doesn't close after save

### Testing Procedure: Archive Meeting

**Step 1: Find Meeting to Archive**

1. Navigate to meeting list
2. Select a meeting

**Step 2: Look for Archive/Delete Button**

1. Press B to find buttons in meeting context
2. Look for Archive, Delete, or Remove button

**Expected to hear:**
```
"Archive, button"
or
"Delete, button"
```

**Step 3: Trigger Archive Action**

1. Press Enter on the button
2. If confirmation needed, listen for it

**Expected to hear:**
```
"Confirm delete?"
"Are you sure you want to archive this meeting?"
```

**Step 4: Confirm Action**

1. Find and press Confirm or Yes button
2. Listen for confirmation

**Expected to hear:**
```
"Meeting archived"
"Meeting removed from list"
```

**Step 5: Verify Meeting is Archived**

1. Navigate back to meeting list
2. Previous meeting should not appear
3. Or meeting should be marked as archived

**Step 6: Archive Issues**

- [ ] No archive/delete button found
- [ ] No confirmation before deletion
- [ ] No confirmation message after deletion
- [ ] Meeting still visible after archiving
- [ ] No way to find archived meetings

### Recording Your NVDA Testing Results

Create a file: `NVDA_Testing_Results_[DATE].md`

```markdown
# NVDA Testing Results

Date: [YYYY-MM-DD]
Tester: [Your Name]
Application Version: [Version number]
NVDA Version: [Version number]
Windows Version: [Windows 10/11]
Browser: [Chrome/Firefox/Edge]

## Test Summary

### Login/Authentication Flow
- [ ] PASS: Application name announced
- [ ] PASS: Title as H1
- [ ] PASS: Theme buttons have descriptive text
- [ ] PASS: Form labels associated with inputs
- [ ] PASS: Password field announced as protected
- [ ] PASS: Login button announced clearly
- [ ] PASS: Error messages announced
- [ ] FAIL: [List any failures]

### Recording Setup
- [ ] PASS: Microphone/Screen mode announced
- [ ] PASS: Selected mode is announced
- [ ] PASS: Language options announced
- [ ] PASS: Selected language is announced
- [ ] PASS: Device selector announced as dropdown
- [ ] FAIL: [List any failures]

### Start/Pause/Stop Recording
- [ ] PASS: Record button announced clearly
- [ ] PASS: Button state changes announced
- [ ] PASS: Pause button becomes enabled
- [ ] PASS: Recording status is conveyed
- [ ] PASS: Stop/Complete action is clear
- [ ] FAIL: [List any failures]

### Save Meeting
- [ ] PASS: Save button found and announced
- [ ] PASS: Save dialog/form announced correctly
- [ ] PASS: Title field has label
- [ ] PASS: Confirmation message provided
- [ ] PASS: Meeting appears in archive after save
- [ ] FAIL: [List any failures]

### View Meeting List
- [ ] PASS: Archive section announced as section
- [ ] PASS: Search field has label
- [ ] PASS: Meetings announced as list items
- [ ] PASS: Each meeting title announced
- [ ] PASS: Meeting metadata (date, duration) announced
- [ ] PASS: Tags announced if present
- [ ] FAIL: [List any failures]

### View Analysis (Kanban Layout)
- [ ] PASS: Each kanban column has heading
- [ ] PASS: Section headings use proper hierarchy
- [ ] PASS: Summary section readable
- [ ] PASS: Action items announced with checked state
- [ ] PASS: Key insights section readable
- [ ] PASS: Links within analysis announced with text
- [ ] FAIL: [List any failures]

### Edit Transcript
- [ ] PASS: Edit button announced clearly
- [ ] PASS: Modal dialog announced correctly
- [ ] PASS: Transcript textarea labeled
- [ ] PASS: Close button available and announced
- [ ] PASS: Save button available and announced
- [ ] PASS: Confirmation on save provided
- [ ] FAIL: [List any failures]

### Archive Meeting
- [ ] PASS: Archive/Delete button found
- [ ] PASS: Confirmation dialog presented
- [ ] PASS: Confirmation message provided
- [ ] PASS: Meeting removed from list
- [ ] FAIL: [List any failures]

## Issues Found

### Critical Issues (Block accessibility)
1. [Issue description]
2. [Issue description]

### Major Issues (Significantly impact experience)
1. [Issue description]
2. [Issue description]

### Minor Issues (Small impact, nice to fix)
1. [Issue description]
2. [Issue description]

## Recommendations

1. [Recommendation]
2. [Recommendation]

## Tester Sign-off

Tester: ____________________
Date: ______________________
```

---

## TESTING: VoiceOver (Mac)

### Prerequisites

- Mac with macOS 10.14 or later
- Built-in screen reader (VoiceOver) - no installation needed
- Browser: Safari (recommended), Chrome, or Firefox

### Starting VoiceOver

**Method 1: Keyboard Shortcut**
1. Press Cmd + F5
2. VoiceOver will start immediately

**Method 2: System Preferences**
1. Go to System Preferences > Accessibility
2. Click "VoiceOver" in the sidebar
3. Check "Enable VoiceOver"

### Basic VoiceOver Controls

| Action | Mac Keyboard |
|--------|--------------|
| VoiceOver key | Ctrl + Option (or Caps Lock if enabled) |
| Start reading | VO + A (where VO = Ctrl + Option) |
| Read current item | VO + A |
| Navigate next item | VO + Right Arrow |
| Navigate previous item | VO + Left Arrow |
| Go to first item on page | VO + Home |
| Jump to next button | VO + B |
| Jump to next heading | VO + H |
| Jump to next link | VO + L |
| Jump to next form field | VO + F |
| List all headings | VO + U (opens rotor) |
| Open VoiceOver menu | VO + U |
| Select/Click item | VO + Space |
| Stop speaking | Control |

### Testing Procedure: Login/Authentication (VoiceOver)

**Step 1: Launch Application**

1. Open browser and navigate to application
2. Enable VoiceOver (Cmd + F5)
3. Press VO + Home to go to top of page
4. Press VO + A to start reading

**Expected to hear:**
```
"After the Noise, web page
heading level 1
[Page is read aloud]"
```

**Test Points:**
- [ ] Application title announced as H1
- [ ] Theme buttons announced
- [ ] Main content section identified
- [ ] Login form announced

**Step 2: Navigate to Form**

1. Press VO + F to jump to form fields
2. Listen for email input announcement

**Expected to hear:**
```
"Email address, edit text"
```

**Step 3: Test Form Accessibility**

1. Press VO + F again for password field
2. Should be announced as protected

**Expected to hear:**
```
"Password, secure edit text"
or
"Password, password field"
```

**Step 4: Check Buttons**

1. Press VO + B to jump to buttons
2. Each button should have clear purpose

**Expected to hear:**
```
"Login, button"
"Sign up, button"
"Theme buttons in group"
```

**Step 5: Record Results**

- [ ] PASS: Application announced as webpage
- [ ] PASS: Title is H1
- [ ] PASS: Form fields have labels
- [ ] PASS: Password field announced as secure
- [ ] PASS: Buttons have clear purposes
- [ ] FAIL: [List issues]

### Testing Procedure: Recording Setup (VoiceOver)

**Step 1: Navigate to Controls**

1. Press VO + Right Arrow to navigate forward
2. Listen for mode selector group

**Expected to hear:**
```
"Group, Recording mode selector
Microphone, button, selected"
```

**Step 2: Check Mode Options**

1. Press VO + Right Arrow to hear each option
2. Listen for currently selected option

**Expected to hear:**
```
"Microphone, button, selected"
"Screen and audio, button"
```

**Step 3: Check Language Options**

1. Continue navigating with VO + Right Arrow
2. Listen for language selector

**Expected to hear:**
```
"Language selector
English, button, selected"
"Swedish, button"
"German, button"
"Spanish, button"
```

**Step 4: Test Device Selection**

1. Navigate to audio device dropdown
2. Should be announced as select element

**Expected to hear:**
```
"Audio device, popup button, Default Device"
```

**Step 5: Record Results**

- [ ] PASS: Mode buttons announced as group
- [ ] PASS: Selected option announced
- [ ] PASS: Language options announced
- [ ] PASS: Device selector announced as dropdown
- [ ] FAIL: [List issues]

### Testing Procedure: Recording Controls (VoiceOver)

**Step 1: Find Record Button**

1. Press VO + B to jump to buttons
2. Listen for "Record" button

**Expected to hear:**
```
"Record, button"
```

**Step 2: Check Pause Button**

1. Press VO + B again or navigate right
2. Should find "Pause" button (initially disabled)

**Expected to hear:**
```
"Pause, button, disabled"
```

**Step 3: Start Recording**

1. With Record button selected, press VO + Space to click
2. Listen for confirmation

**Expected to hear:**
```
"Recording started"
or
"Record, button, pressed"  [button state changes]
```

**Step 4: Pause Recording**

1. Press VO + B to jump to Pause button
2. Now should be enabled
3. Press VO + Space to pause

**Expected to hear:**
```
"Pause, button"  [now enabled]
[After pause]
"Recording paused"
"Resume, button"  [new button]
```

**Step 5: Complete Recording**

1. Press VO + B to find Stop button
2. Press VO + Space to stop

**Expected to hear:**
```
"Recording stopped"
"Transcription in progress"  [if applicable]
```

**Step 6: Record Results**

- [ ] PASS: Record button state changes announced
- [ ] PASS: Pause button enables/disables
- [ ] PASS: Recording status conveyed
- [ ] PASS: Pause/Resume flow clear
- [ ] FAIL: [List issues]

### Testing Procedure: Save Meeting (VoiceOver)

**Step 1: Complete Recording**

1. Complete a test recording using previous steps
2. Stop recording when ready

**Step 2: Find Save Button**

1. Press VO + B to jump to Save button
2. Should be clearly labeled

**Expected to hear:**
```
"Save, button"
```

**Step 3: Open Save Dialog**

1. Press VO + Space to activate
2. Listen for dialog announcement

**Expected to hear:**
```
"Save meeting, dialog"
or
"Title, edit text"  [if dialog opens]
```

**Step 4: Enter Meeting Title**

1. Should auto-focus on title field
2. Type a meeting title
3. Press Tab to navigate

**Expected to hear:**
```
"Meeting title, edit text"
[After typing]
"Save, button"
```

**Step 5: Save Meeting**

1. Press VO + Space on Save button
2. Listen for confirmation

**Expected to hear:**
```
"Meeting saved"
or
"Meeting added to archive"
```

**Step 6: Record Results**

- [ ] PASS: Save button found
- [ ] PASS: Save dialog announced
- [ ] PASS: Title field has label
- [ ] PASS: Confirmation provided
- [ ] PASS: Meeting appears in list
- [ ] FAIL: [List issues]

### Testing Procedure: View Meeting List (VoiceOver)

**Step 1: Navigate to Archive**

1. Use VO + Right Arrow to navigate
2. Look for Archive column

**Expected to hear:**
```
"Archive, heading"
"Meeting list"
```

**Step 2: Check Search Field**

1. Press VO + F to jump to form fields
2. Should find search input

**Expected to hear:**
```
"Search meetings, edit text"
```

**Step 3: Review Meeting Items**

1. Use VO + Down Arrow to navigate through list
2. Each meeting should be announced

**Expected to hear:**
```
"Team Standup, list item"
"2026-02-24, 15 minutes"
"Tags: planning, urgent"  [if applicable]
```

**Step 4: Select a Meeting**

1. With meeting selected, press VO + Space
2. Meeting should load in Analysis column

**Expected to hear:**
```
"Meeting selected"
[Analysis content announced]
```

**Step 5: Record Results**

- [ ] PASS: Archive section announced
- [ ] PASS: Search field labeled
- [ ] PASS: Meetings announced as list
- [ ] PASS: Meeting details readable
- [ ] PASS: Selection state announced
- [ ] FAIL: [List issues]

### Testing Procedure: View Analysis (VoiceOver)

**Step 1: Select Meeting**

1. Navigate to meeting list
2. Select meeting to load analysis

**Step 2: Check Heading Hierarchy**

1. Press VO + U to open rotor
2. Select "Headings" to see structure
3. Should see main sections listed

**Expected structure:**
```
Analysis (H2)
- Summary (H3)
- Action Items (H3)
- Key Insights (H3)
```

**Step 3: Navigate by Heading**

1. Press VO + H to jump between headings
2. Verify heading levels make sense

**Step 4: Check Content Sections**

1. Navigate to each section with arrows
2. Verify content is readable and structured

**Expected:**
```
Summary section has paragraph text
Action Items section has list with checkboxes
Key Insights section has paragraph text
```

**Step 5: Record Results**

- [ ] PASS: Column headers announced
- [ ] PASS: Proper heading hierarchy (H1/H2/H3)
- [ ] PASS: Sections clearly separated
- [ ] PASS: Links announced with text
- [ ] PASS: Lists structured properly
- [ ] FAIL: [List issues]

### Testing Procedure: Edit Transcript (VoiceOver)

**Step 1: Find Edit Button**

1. Press VO + B to jump to buttons
2. Look for Edit button

**Expected to hear:**
```
"Edit transcript, button"
or
"Edit, button"
```

**Step 2: Open Modal**

1. Press VO + Space to activate
2. Listen for modal announcement

**Expected to hear:**
```
"Dialog, Save changes?
title, edit text"
```

**Step 3: Check Modal Components**

1. Press VO + Home to go to dialog start
2. Should hear dialog announcement and heading

**Step 4: Navigate to Text Area**

1. Press VO + F to jump to form field
2. Should find transcript textarea

**Expected to hear:**
```
"Transcript, edit text, multiple line"
[Current text read]
```

**Step 5: Edit and Save**

1. Type changes to transcript
2. Find Save button
3. Press VO + Space

**Expected to hear:**
```
"Transcript saved"
"Dialog closed"
```

**Step 6: Record Results**

- [ ] PASS: Edit button found and announced
- [ ] PASS: Modal announced as dialog
- [ ] PASS: Textarea labeled
- [ ] PASS: Close button available
- [ ] PASS: Confirmation message provided
- [ ] FAIL: [List issues]

### Recording VoiceOver Testing Results

Create a file: `VoiceOver_Testing_Results_[DATE].md`

```markdown
# VoiceOver Testing Results

Date: [YYYY-MM-DD]
Tester: [Your Name]
Application Version: [Version]
macOS Version: [10.14 / 11 / 12 / etc]
Browser: [Safari/Chrome/Firefox]

## Test Results by Feature

### Login/Authentication
- [ ] PASS: Application announced as webpage
- [ ] PASS: Title is H1
- [ ] PASS: Form fields labeled
- [ ] PASS: Password field secure
- [ ] PASS: All buttons announced
- [ ] FAIL: [List issues]

### Recording Setup
- [ ] PASS: Mode selector announced as group
- [ ] PASS: Selected option announced
- [ ] PASS: Language options announced
- [ ] PASS: Device selector is dropdown
- [ ] FAIL: [List issues]

### Recording Controls
- [ ] PASS: Record button announced
- [ ] PASS: Button states change and announced
- [ ] PASS: Pause/Resume flow clear
- [ ] PASS: Stop action clear
- [ ] FAIL: [List issues]

### Save Meeting
- [ ] PASS: Save button found
- [ ] PASS: Dialog announced
- [ ] PASS: Title field labeled
- [ ] PASS: Confirmation provided
- [ ] FAIL: [List issues]

### Meeting List
- [ ] PASS: Archive section announced
- [ ] PASS: Search labeled
- [ ] PASS: Meetings in list
- [ ] PASS: Details readable
- [ ] FAIL: [List issues]

### Analysis View
- [ ] PASS: Proper heading hierarchy
- [ ] PASS: Sections separated
- [ ] PASS: Links announced
- [ ] PASS: Lists structured
- [ ] FAIL: [List issues]

### Edit Transcript
- [ ] PASS: Edit button found
- [ ] PASS: Dialog announced
- [ ] PASS: Textarea labeled
- [ ] PASS: Save confirmed
- [ ] FAIL: [List issues]

## Summary of Issues

Critical: [Number]
Major: [Number]
Minor: [Number]

## Tester Certification

I have completed comprehensive VoiceOver testing and verified the above results.

Tester: ____________________
Date: ______________________
```

---

## TESTING: TalkBack (Android)

### Prerequisites

- Android device (phone or tablet) running Android 6.0+
- TalkBack enabled (Settings > Accessibility > TalkBack)
- Chrome browser or Firefox
- Application accessible on mobile

### Enabling TalkBack

1. Go to Settings app
2. Scroll to Accessibility
3. Tap "Vision"
4. Tap "TalkBack"
5. Toggle ON
6. Accept permissions
7. System will restart/reconfigure

### Basic TalkBack Controls

| Action | Touch Gesture |
|--------|---------------|
| Start reading | Swipe up then down (two-finger) |
| Navigate next item | Swipe right (single finger) |
| Navigate previous item | Swipe left (single finger) |
| Activate item | Double tap anywhere on screen |
| Read from top | Swipe up (two-finger) |
| Read from current position | Swipe down (two-finger) |
| Open local context menu | Swipe down then right |
| Open global context menu | Swipe right then down |

### Testing Procedure: Login Flow (TalkBack)

**Step 1: Load Application**

1. Open browser and navigate to application
2. TalkBack will automatically start reading
3. Listen to page announcement

**Expected to hear:**
```
"After the Noise, web page"
[Page structure announced]
```

**Step 2: Explore Theme Buttons**

1. Swipe right to navigate to first interactive element
2. Should find theme button

**Expected to hear:**
```
"Default theme, button"
[Double tap to select]
```

**Step 3: Navigate to Form Fields**

1. Continue swiping right
2. Find email input

**Expected to hear:**
```
"Email, edit text"
or
"Email address, edit text"
```

**Step 4: Enter Email**

1. Double tap on email field
2. On-screen keyboard appears
3. Type email address

**Expected to hear:**
```
"Email entered"
[Character feedback as you type]
```

**Step 5: Move to Password Field**

1. Swipe right to navigate to password field
2. Should be announced as password field

**Expected to hear:**
```
"Password, password field"
or
"Password, secure field"
```

**Step 6: Enter Password**

1. Double tap password field
2. Type password

**Expected to hear:**
```
[Each character announced as you type]
[For password fields, dots may be announced instead]
```

**Step 7: Find and Activate Login**

1. Swipe right to navigate to Login button
2. Double tap to activate

**Expected to hear:**
```
"Login, button"
[After double tap]
"Logging in..."
"Login successful"
```

**Step 8: Record Results**

- [ ] PASS: Page announced correctly
- [ ] PASS: Theme buttons reachable
- [ ] PASS: Form fields labeled
- [ ] PASS: Password field marked as secure
- [ ] PASS: Login button found
- [ ] FAIL: [List issues]

### Testing Procedure: Recording Setup (TalkBack)

**Step 1: Navigate to Recording Mode**

1. Swipe right through controls
2. Listen for mode selector

**Expected to hear:**
```
"Microphone, button, selected"
[Swipe right]
"Screen and audio, button"
```

**Step 2: Check Language Selection**

1. Continue swiping right
2. Find language selector

**Expected to hear:**
```
"English, button, selected"
"Swedish, button"
"German, button"
"Spanish, button"
```

**Step 3: Try Changing Language**

1. Swipe to non-English language button
2. Double tap to change
3. Listen for confirmation

**Expected to hear:**
```
"Language changed to Swedish"
or
"Swedish selected"
```

**Step 4: Find Device Selector**

1. Continue swiping right
2. Look for audio device selector

**Expected to hear:**
```
"Audio device, button"
or
"Microphone selector, button"
```

**Step 5: Record Results**

- [ ] PASS: Mode buttons findable
- [ ] PASS: Selected option announced
- [ ] PASS: Language options announced
- [ ] PASS: Device selector accessible
- [ ] FAIL: [List issues]

### Testing Procedure: Recording (TalkBack)

**Step 1: Start Recording**

1. Navigate to Record button
2. Double tap to start

**Expected to hear:**
```
"Record, button"
[After double tap]
"Recording started"
or
"Recording button, pressed"
```

**Step 2: Monitor Recording**

1. Let recording continue for 5 seconds
2. Listen for timer/status

**Step 3: Pause Recording**

1. Swipe right to find Pause button
2. Double tap

**Expected to hear:**
```
"Pause, button"
[After double tap]
"Recording paused"
"Resume, button"  [new button announced]
```

**Step 4: Resume Recording**

1. If Resume button exists, double tap
2. Or navigate back to Record button

**Expected to hear:**
```
"Recording resumed"
```

**Step 5: Stop Recording**

1. Navigate to Stop/Record button again
2. Double tap

**Expected to hear:**
```
"Recording stopped"
"Transcription processing..."  [if applicable]
```

**Step 6: Record Results**

- [ ] PASS: Record button found
- [ ] PASS: Recording announced
- [ ] PASS: Pause button works
- [ ] PASS: Resume button works
- [ ] PASS: Stop button works
- [ ] FAIL: [List issues]

### Testing Procedure: Save Meeting (TalkBack)

**Step 1: Complete Recording**

1. Follow recording procedure
2. Stop recording

**Step 2: Find Save Button**

1. Swipe right to locate Save button
2. Listen for announcement

**Expected to hear:**
```
"Save, button"
```

**Step 3: Activate Save**

1. Double tap Save button
2. Wait for response

**Expected to hear (Option A):**
```
"Save meeting dialog"
"Title, edit text"
[Form appears]
```

**Expected to hear (Option B):**
```
"Meeting saved"
[Inline confirmation]
```

**Step 4: Enter Title (if dialog):**

1. Double tap title field
2. Type meeting title
3. Look for Save button in dialog

**Expected to hear:**
```
"Meeting title, edit text"
[After typing]
"Save, button"
```

**Step 5: Complete Save**

1. Double tap Save in dialog
2. Listen for confirmation

**Expected to hear:**
```
"Meeting saved to archive"
"Meeting added successfully"
```

**Step 6: Record Results**

- [ ] PASS: Save button found
- [ ] PASS: Save dialog accessible (if present)
- [ ] PASS: Title field findable
- [ ] PASS: Confirmation provided
- [ ] FAIL: [List issues]

### Testing Procedure: Meeting List (TalkBack)

**Step 1: Navigate to Archive Column**

1. Use left/right navigation to find Archive section
2. Listen for section announcement

**Expected to hear:**
```
"Archive, section"
or
"Meeting list"
```

**Step 2: Find Search Field**

1. Swipe right to form fields
2. Look for search input

**Expected to hear:**
```
"Search meetings, edit text"
```

**Step 3: Review Meetings**

1. Navigate to meeting items
2. Each should be announced individually

**Expected to hear:**
```
"Team Standup Meeting, button"
or
"Team Standup Meeting, list item"
[Swipe right]
"Created 2026-02-24, 15 minutes"
[Swipe right]
"Tags: planning, urgent"  [if applicable]
```

**Step 4: Select Meeting**

1. Double tap on meeting to select
2. Should load in Analysis column

**Expected to hear:**
```
"Meeting selected"
or
"Loading analysis..."
[After loaded]
"Analysis ready"
```

**Step 5: Record Results**

- [ ] PASS: Archive section found
- [ ] PASS: Search field accessible
- [ ] PASS: Meetings announced clearly
- [ ] PASS: Meeting details readable
- [ ] PASS: Selection works
- [ ] FAIL: [List issues]

### Testing Procedure: Analysis View (TalkBack)

**Step 1: Select a Meeting**

1. Navigate to meeting list
2. Double tap to select
3. Analysis loads

**Step 2: Explore Analysis Sections**

1. Swipe right to navigate through content
2. Listen for section headings

**Expected to hear:**
```
"Summary, heading"
[Content read]
"Action Items, heading"
"Checkbox, unchecked, Item text"
"Key Insights, heading"
```

**Step 3: Interact with Checkboxes**

1. Navigate to checkbox in Action Items
2. Double tap to toggle

**Expected to hear:**
```
"Checkbox, unchecked, Plan Q1 roadmap, button"
[After double tap]
"Checked"
```

**Step 4: Check Links**

1. Navigate through content
2. Listen for link announcements

**Expected to hear:**
```
"Link to document, link"
or
"External link, link"
```

**Step 5: Record Results**

- [ ] PASS: Sections announced with headings
- [ ] PASS: Checkboxes accessible
- [ ] PASS: Checkboxes toggle works
- [ ] PASS: Links announced properly
- [ ] FAIL: [List issues]

### Testing Procedure: Edit Transcript (TalkBack)

**Step 1: Find Edit Button**

1. Navigate through action items
2. Look for Edit button

**Expected to hear:**
```
"Edit transcript, button"
or
"Edit, button"
```

**Step 2: Open Edit Dialog**

1. Double tap Edit button
2. Dialog should appear

**Expected to hear:**
```
"Edit transcript, dialog"
or
"Title, edit text"  [if dialog form]
```

**Step 3: Navigate Dialog Components**

1. Swipe right through dialog
2. Find textarea with transcript

**Expected to hear:**
```
"Transcript, edit text, multiple line"
[Text content read]
```

**Step 4: Edit Transcript**

1. Double tap textarea
2. Edit text as needed
3. Find Save button

**Expected to hear:**
```
"Transcript text, edit text"
[After edits]
"Save, button"
```

**Step 5: Save Changes**

1. Double tap Save
2. Listen for confirmation

**Expected to hear:**
```
"Transcript saved"
"Closing dialog"
```

**Step 6: Record Results**

- [ ] PASS: Edit button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Textarea labeled
- [ ] PASS: Save button found
- [ ] PASS: Confirmation provided
- [ ] FAIL: [List issues]

### Recording TalkBack Testing Results

Create a file: `TalkBack_Testing_Results_[DATE].md`

```markdown
# TalkBack Testing Results

Date: [YYYY-MM-DD]
Tester: [Your Name]
Application Version: [Version]
Android Version: [6.0/7.0/8.0/etc]
Device: [Device model]
Browser: [Chrome/Firefox]

## Test Results

### Login/Authentication
- [ ] PASS: Page announced
- [ ] PASS: Form fields labeled
- [ ] PASS: Password field secure
- [ ] PASS: Login button found
- [ ] FAIL: [List issues]

### Recording Setup
- [ ] PASS: Mode buttons accessible
- [ ] PASS: Selected option announced
- [ ] PASS: Language options accessible
- [ ] PASS: Device selector accessible
- [ ] FAIL: [List issues]

### Recording Controls
- [ ] PASS: Record button found
- [ ] PASS: Recording announced
- [ ] PASS: Pause/Resume works
- [ ] PASS: Stop works
- [ ] FAIL: [List issues]

### Save Meeting
- [ ] PASS: Save button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Title field found
- [ ] PASS: Confirmation provided
- [ ] FAIL: [List issues]

### Meeting List
- [ ] PASS: Archive section found
- [ ] PASS: Search accessible
- [ ] PASS: Meetings announced
- [ ] PASS: Selection works
- [ ] FAIL: [List issues]

### Analysis View
- [ ] PASS: Sections announced
- [ ] PASS: Checkboxes work
- [ ] PASS: Links announced
- [ ] FAIL: [List issues]

### Edit Transcript
- [ ] PASS: Edit button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Textarea found
- [ ] PASS: Save works
- [ ] FAIL: [List issues]

## Summary

Total Tests: [Number]
Passed: [Number]
Failed: [Number]

## Tester Certification

I have completed comprehensive TalkBack testing.

Tester: ____________________
Date: ______________________
```

---

## TESTING: VoiceOver (iOS)

### Prerequisites

- iPhone or iPad running iOS 14+
- VoiceOver enabled (Settings > Accessibility > VoiceOver)
- Safari or Chrome browser
- Application accessible on mobile

### Enabling VoiceOver

1. Go to Settings app
2. Tap "Accessibility"
3. Tap "VoiceOver"
4. Toggle ON
5. Tap "Start VoiceOver" if prompted

### Basic VoiceOver Controls (iOS)

| Action | Gesture |
|--------|---------|
| Navigate next item | Swipe right |
| Navigate previous item | Swipe left |
| Activate item | Double tap |
| Scroll up | Swipe up with 3 fingers |
| Scroll down | Swipe down with 3 fingers |
| Open rotor | Swipe up with two fingers |
| Mute/Unmute | Shake device gently |

### Testing Procedure: Login (iOS VoiceOver)

**Step 1: Load Application**

1. Open Safari/Chrome
2. Navigate to application
3. VoiceOver begins reading

**Expected to hear:**
```
"After the Noise, web page"
[Page structure announced]
```

**Step 2: Explore Page**

1. Swipe right to navigate
2. Find theme buttons

**Expected to hear:**
```
"Default theme, button"
"Signal theme, button"
"Dark theme, button"
"PrismPulse theme, button"
```

**Step 3: Navigate to Form**

1. Continue swiping right
2. Find email field

**Expected to hear:**
```
"Email address, text field"
```

**Step 4: Enter Email**

1. Double tap email field
2. On-screen keyboard appears
3. Type email address

**Expected to hear:**
```
[Character announcements as you type]
```

**Step 5: Navigate to Password**

1. Swipe right to password field
2. Should be announced as secure

**Expected to hear:**
```
"Password, secure text field"
```

**Step 6: Enter Password**

1. Double tap password field
2. Type password

**Step 7: Find Login Button**

1. Swipe right to find Login button
2. Double tap to activate

**Expected to hear:**
```
"Login, button"
[After double tap]
"Logging in..."
```

**Step 8: Record Results**

- [ ] PASS: Application name announced
- [ ] PASS: Page structure clear
- [ ] PASS: Theme buttons accessible
- [ ] PASS: Email field labeled
- [ ] PASS: Password field labeled as secure
- [ ] PASS: Login button found and works
- [ ] FAIL: [List issues]

### Testing Procedure: Recording (iOS VoiceOver)

**Step 1: Find Recording Controls**

1. Swipe right to navigate controls
2. Listen for Record button

**Expected to hear:**
```
"Record, button"
```

**Step 2: Start Recording**

1. Double tap Record button
2. Listen for confirmation

**Expected to hear:**
```
"Recording started"
or
"Record button, pressed"
```

**Step 3: Pause Recording**

1. Swipe right to find Pause button
2. Now should be enabled

**Expected to hear:**
```
"Pause, button"
[After double tap]
"Recording paused"
```

**Step 4: Resume Recording**

1. Swipe right to find Resume button
2. Double tap

**Expected to hear:**
```
"Recording resumed"
```

**Step 5: Stop Recording**

1. Navigate back to Record button
2. Double tap to stop

**Expected to hear:**
```
"Recording stopped"
```

**Step 6: Record Results**

- [ ] PASS: Record button found
- [ ] PASS: Recording announced
- [ ] PASS: Pause works
- [ ] PASS: Resume works
- [ ] PASS: Stop works
- [ ] FAIL: [List issues]

### Testing Procedure: Save Meeting (iOS VoiceOver)

**Step 1: Complete Recording**

1. Follow recording steps
2. Stop recording

**Step 2: Find Save Button**

1. Swipe right to find Save
2. Should be announced

**Expected to hear:**
```
"Save, button"
```

**Step 3: Activate Save**

1. Double tap Save
2. Listen for response

**Expected to hear:**
```
"Save meeting dialog"
or
"Title, text field"
```

**Step 4: Enter Title (if form)**

1. Double tap title field
2. Type meeting title

**Step 5: Complete Save**

1. Find Save button in dialog
2. Double tap to save

**Expected to hear:**
```
"Meeting saved"
"Saved to archive"
```

**Step 6: Record Results**

- [ ] PASS: Save button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Title field works
- [ ] PASS: Confirmation provided
- [ ] FAIL: [List issues]

### Testing Procedure: Meeting List (iOS VoiceOver)

**Step 1: Navigate to Archive**

1. Swipe right to find Archive section
2. Listen for section heading

**Expected to hear:**
```
"Archive, section"
"Meeting list"
```

**Step 2: Find Search**

1. Swipe right to find search field
2. Should be announced

**Expected to hear:**
```
"Search meetings, text field"
```

**Step 3: Review Meetings**

1. Swipe right through meeting items
2. Each should be announced

**Expected to hear:**
```
"Team Standup Meeting, button"
or
"Team Standup Meeting, list item"
```

**Step 4: Select Meeting**

1. Double tap to select
2. Analysis should load

**Expected to hear:**
```
"Meeting selected"
[Analysis announced]
```

**Step 5: Record Results**

- [ ] PASS: Archive section found
- [ ] PASS: Search field accessible
- [ ] PASS: Meetings announced
- [ ] PASS: Selection works
- [ ] FAIL: [List issues]

### Testing Procedure: Analysis View (iOS VoiceOver)

**Step 1: Select Meeting**

1. Navigate to meeting
2. Double tap to select
3. Analysis loads

**Step 2: Explore Analysis**

1. Swipe right through sections
2. Listen for heading announcements

**Expected to hear:**
```
"Summary, heading"
[Content]
"Action Items, heading"
"Checkbox, unchecked, Item"
"Key Insights, heading"
```

**Step 3: Interact with Checkboxes**

1. Navigate to checkbox
2. Double tap to toggle

**Expected to hear:**
```
"Checkbox, unchecked"
[After double tap]
"Checkbox, checked"
```

**Step 4: Record Results**

- [ ] PASS: Sections announced
- [ ] PASS: Checkboxes work
- [ ] PASS: Links announced
- [ ] FAIL: [List issues]

### Testing Procedure: Edit Transcript (iOS VoiceOver)

**Step 1: Find Edit Button**

1. Swipe right to find Edit
2. Should be announced as button

**Expected to hear:**
```
"Edit transcript, button"
```

**Step 2: Open Edit Dialog**

1. Double tap Edit
2. Dialog appears

**Expected to hear:**
```
"Edit transcript, dialog"
```

**Step 3: Navigate Dialog**

1. Swipe right through components
2. Find textarea

**Expected to hear:**
```
"Transcript, text area"
[Text read]
```

**Step 4: Edit Text**

1. Double tap textarea
2. Make edits

**Step 5: Save Changes**

1. Find Save button
2. Double tap

**Expected to hear:**
```
"Transcript saved"
```

**Step 6: Record Results**

- [ ] PASS: Edit button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Textarea accessible
- [ ] PASS: Save works
- [ ] FAIL: [List issues]

### Recording iOS VoiceOver Testing Results

Create a file: `VoiceOver_iOS_Testing_Results_[DATE].md`

```markdown
# VoiceOver (iOS) Testing Results

Date: [YYYY-MM-DD]
Tester: [Your Name]
Application Version: [Version]
iOS Version: [14/15/16/etc]
Device: [iPhone/iPad model]
Browser: [Safari/Chrome]

## Test Results

### Login/Authentication
- [ ] PASS: Application announced
- [ ] PASS: Form fields labeled
- [ ] PASS: Password field secure
- [ ] PASS: Login button works
- [ ] FAIL: [List issues]

### Recording Controls
- [ ] PASS: Record button found
- [ ] PASS: Recording announced
- [ ] PASS: Pause/Resume works
- [ ] PASS: Stop works
- [ ] FAIL: [List issues]

### Save Meeting
- [ ] PASS: Save button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Title field works
- [ ] PASS: Confirmation provided
- [ ] FAIL: [List issues]

### Meeting List
- [ ] PASS: Archive section found
- [ ] PASS: Meetings announced
- [ ] PASS: Selection works
- [ ] FAIL: [List issues]

### Analysis View
- [ ] PASS: Sections announced
- [ ] PASS: Checkboxes work
- [ ] FAIL: [List issues]

### Edit Transcript
- [ ] PASS: Edit button found
- [ ] PASS: Dialog accessible
- [ ] PASS: Save works
- [ ] FAIL: [List issues]

## Summary

Tests Passed: [Number]
Tests Failed: [Number]

## Tester Certification

I have completed comprehensive iOS VoiceOver testing.

Tester: ____________________
Date: ______________________
```

---

# SUMMARY AND ISSUE TRACKING

## How to Document Issues Found

When you find an accessibility issue during testing, create a GitHub Issue with:

**Title:** [WCAG Level] [Issue Type] - [Component]

Examples:
- "WCAG AA Contrast - Dark theme button insufficient contrast"
- "WCAG A Semantic - Modal dialog not announced correctly"
- "WCAG A Semantic - Form labels not associated with inputs"

**Description Template:**

```markdown
## Issue
[Brief description]

## Severity
- [ ] Critical (blocks use)
- [ ] Major (significantly impacts experience)
- [ ] Minor (minor inconvenience)

## WCAG Level Affected
- [ ] A
- [ ] AA
- [ ] AAA

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Current Behavior
[What happens now]

## Expected Behavior
[What should happen]

## Testing Device/Software
- Screen reader: [NVDA/VoiceOver/TalkBack/etc]
- Version: [Version number]
- Device: [Device type]
- Browser: [Browser name]

## Screenshots/Evidence
[Attach screenshots if possible]

## Testing Tool Used
- WebAIM Contrast Checker
- [Other tool]
```

## Completion Checklist

- [ ] Contrast ratio testing completed for all 4 themes
- [ ] NVDA testing completed (Windows)
- [ ] VoiceOver testing completed (Mac)
- [ ] TalkBack testing completed (Android)
- [ ] VoiceOver iOS testing completed
- [ ] All test results documented
- [ ] All issues logged in GitHub
- [ ] Issues prioritized by severity
- [ ] Fixes assigned to team members
- [ ] Re-testing scheduled for fixed issues

## Resources

**WCAG Standards:**
- https://www.w3.org/WAI/WCAG21/quickref/

**Contrast Checker:**
- https://webaim.org/resources/contrastchecker/
- https://www.tpgi.com/color-contrast-checker/

**Screen Reader Tools:**
- NVDA: https://www.nvaccess.org/
- JAWS: https://www.freedomscientific.com/products/software/jaws/
- Built-in: VoiceOver (Mac/iOS), TalkBack (Android)

**Testing Guides:**
- WCAG Testing: https://www.w3.org/WAI/test-evaluate/
- Screen Reader Testing: https://www.a11ybytes.de/

---

**Document Version:** 1.0
**Last Updated:** 2026-02-26
**Status:** Ready for Testing
