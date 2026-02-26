# Button Standard & Design System

## Overview

This document defines the standard button specifications for the "After the Noise" application to ensure consistency across all UI elements.

---

## Button Classification

### 1. **Theme Buttons** (`.theme-btn`)
**Purpose**: Switch between application themes (default, signal, dark, prism)
**Location**: Header - top right area
**Emoji**: ☀️ 📡 🌙 🦄

**Specifications**:
```css
.theme-btn {
    padding: 0.5rem 0.75rem;      /* Standard button padding */
    font-size: 1.2rem;             /* Medium emoji size */
    min-height: 44px;              /* Accessible touch target */
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 200ms ease;
}
```

---

### 2. **Mode Buttons** (`.mode-btn`)
**Purpose**: Select recording mode (microphone, screen+audio)
**Location**: Control panel
**Emoji**: 🎤 🖥️

**Specifications**:
```css
.mode-btn {
    padding: 0.5rem 0.75rem;       /* Standard button padding */
    font-size: 1.5rem;             /* Larger emoji for prominence */
    min-height: 48px;              /* Touch target (48px standard) */
    min-width: 48px;               /* Square shape */
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    flex: 1;                        /* Flexible width */
    transition: all 200ms ease;
}
```

---

### 3. **Language Buttons** (`.language-btn`)
**Purpose**: Select transcription language
**Location**: Control panel
**Emoji**: 🇬🇧 🇸🇪 🇩🇪 🇪🇸

**Specifications**:
```css
.language-btn {
    padding: 0.5rem 0.75rem;       /* Standard button padding */
    font-size: 1.5rem;             /* Emoji size */
    min-height: 48px;              /* Touch target (48px standard) */
    min-width: 48px;               /* Square shape */
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    flex: 1;
    transition: all 200ms ease;
}
```

---

### 4. **Control Toggle Button** (`.control-toggle-btn`)
**Purpose**: Show/hide floating control panel
**Location**: Header
**Emoji**: 🎛️

**Specifications**:
```css
.control-toggle-btn {
    padding: 0.5rem 0.75rem;       /* Standard button padding */
    font-size: 1.2rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 200ms ease;
}
```

---

### 5. **Recording Buttons** (`.record-button`, `.pause-button`)
**Purpose**: Control recording (start, pause)
**Location**: Control panel
**Text**: "Record", "Pause"

**Specifications**:
```css
.record-button,
.pause-button {
    padding: 0.75rem 1.5rem;       /* More horizontal padding for text */
    font-size: 0.95rem;
    min-height: 48px;              /* Touch target (48px standard) */
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms ease;
}
```

---

### 6. **Action Buttons** (`.save-button`, `.clear-button`)
**Purpose**: Save/clear recording
**Location**: Recording section
**Text**: "Save", "Clear"

**Specifications**:
```css
.action-button {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: background-color 0.2s;
    min-height: 44px;              /* Accessible height */
}
```

---

### 7. **Modal Buttons** (`.modal-btn`)
**Purpose**: Primary/secondary actions in modals
**Location**: Modal dialogs
**Text**: "OK", "Cancel", etc.

**Specifications**:
```css
.modal-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    min-height: 44px;
    transition: all 200ms ease;
}

.modal-btn-primary {
    background-color: var(--color-primary);
    color: white;
}

.modal-btn-secondary {
    background-color: transparent;
    color: var(--color-text);
}
```

---

## Standard Button Properties

### All Buttons Must Have:

| Property | Value | Reason |
|----------|-------|--------|
| `min-height` | 44px or 48px | WCAG touch target accessibility |
| `padding` | 0.5rem 0.75rem (icon buttons) or 0.75rem 1.5rem (text buttons) | Consistent spacing |
| `border` | 1px solid | Visual definition |
| `border-radius` | var(--border-radius-sm) | Design system consistency |
| `cursor` | pointer | UX affordance |
| `transition` | all 200ms ease | Smooth interaction |
| `display: flex` | (when needed) | Center content |

---

## Hover & Active States

### Standard Interactions:
```css
.btn:hover {
    border-color: var(--color-text);
    background-color: var(--color-surface);
}

.btn:active {
    opacity: 0.9;
    transform: scale(0.98);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn.active {
    border-color: var(--color-primary);
    background-color: var(--color-surface);
}
```

---

## Theme-Specific Button Styling

### Each theme should define:
1. `.theme-btn` styling
2. `.mode-btn` styling
3. `.language-btn` styling
4. `.record-button` and `.pause-button` styling
5. `.action-button` styling
6. `.modal-btn` styling

### Example (PrismPulse Theme):
```css
body.theme-prism .theme-btn {
    background-color: var(--soft-surface-1);
    border-color: rgba(155, 140, 255, 0.2);
}

body.theme-prism .theme-btn:hover {
    background-color: var(--soft-surface-2);
    border-color: rgba(155, 140, 255, 0.4);
}
```

---

## Responsive Adjustments

### Mobile (< 480px):
```css
@media (max-width: 479px) {
    .mode-btn,
    .language-btn {
        min-height: 44px;           /* Slightly smaller on mobile */
        padding: 0.5rem;
    }
}
```

### Tablet (480px - 767px):
```css
@media (min-width: 480px) and (max-width: 767px) {
    .mode-btn,
    .language-btn {
        min-height: 48px;
    }
}
```

---

## Button Grouping

### Mode Selector:
```html
<div class="recording-mode-selector">
    <button class="mode-btn active">🎤</button>
    <button class="mode-btn">🖥️</button>
</div>
```
- **Gap**: 0.5rem between buttons
- **Container**: `display: flex; gap: 0.5rem`

### Language Selector:
```html
<div class="language-selector">
    <button class="language-btn active">🇬🇧</button>
    <button class="language-btn">🇸🇪</button>
    <button class="language-btn">🇩🇪</button>
    <button class="language-btn">🇪🇸</button>
</div>
```
- **Gap**: 0.5rem between buttons
- **Container**: `display: flex; gap: 0.5rem`

### Theme Selector:
```html
<div class="theme-selector">
    <button class="theme-btn active">☀️</button>
    <button class="theme-btn">📡</button>
    <button class="theme-btn">🌙</button>
    <button class="theme-btn">🦄</button>
</div>
```
- **Gap**: 0.5rem between buttons
- **Container**: `display: flex; gap: 0.5rem`

---

## Checklist for New Buttons

When adding a new button to the application:

- [ ] Minimum height: 44px (44px) or 48px (touch targets)
- [ ] Padding: 0.5rem 0.75rem (icon) or 0.75rem 1.5rem (text)
- [ ] Border: 1px solid with divider color
- [ ] Border-radius: Uses CSS variable
- [ ] Cursor: Set to pointer
- [ ] Transition: All 200ms ease
- [ ] Hover state: Defined
- [ ] Active state: Defined
- [ ] Disabled state: Handled (opacity 0.5)
- [ ] All themes: Styled consistently
- [ ] Responsive: Adjusted for mobile/tablet
- [ ] Accessibility: WCAG touch target (44-48px minimum)
- [ ] Semantic HTML: Using proper button element
- [ ] Color contrast: WCAG AA or higher

---

## Current Button Inventory

### Header Section:
- ✅ `.theme-btn` - Theme switcher (4 buttons)
- ✅ `.control-toggle-btn` - Show/hide panel (1 button)
- ✅ `.logout-button` - Sign out (1 button)

### Control Panel:
- ✅ `.mode-btn` - Recording mode (2 buttons)
- ✅ `.language-btn` - Transcription language (4 buttons)
- ✅ `.record-button` - Start/stop recording (1 button)
- ✅ `.pause-button` - Pause recording (1 button)
- ⚠️ `.device-select` - Audio device (dropdown, not button)

### Recording Section:
- ✅ `.save-button` - Save meeting (1 button)
- ✅ `.clear-button` - Clear transcript (1 button)

### Modals:
- ✅ `.modal-btn` - Modal actions (multiple)
- ✅ `.edit-transcript-btn` - Edit transcript (1 button)
- ✅ `.save-edit-btn` - Save edit (1 button)
- ✅ `.cancel-edit-btn` - Cancel edit (1 button)

**Total**: 19+ buttons following standard

---

## Future Improvements

1. Consider CSS class hierarchy:
   - `.btn` (base)
   - `.btn--primary` (primary action)
   - `.btn--secondary` (secondary action)
   - `.btn--icon` (icon buttons)
   - `.btn--text` (text buttons)

2. Create button component library:
   - Button with loading state
   - Button with tooltip
   - Button with icon + text

3. Add focus states for keyboard navigation:
   - Focus ring: `outline: 2px solid var(--color-primary)`
   - Focus offset: `outline-offset: 2px`

---

## References

- WCAG 2.1 Touch Target Size: [https://www.w3.org/WAI/WCAG21/Understanding/target-size.html](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- Material Design Button Specs: [https://material.io/components/buttons](https://material.io/components/buttons)
- Apple HIG Button Guidelines: [https://developer.apple.com/design/human-interface-guidelines/buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
