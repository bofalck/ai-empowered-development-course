# BEM Button Component System Design

## Overview

This document outlines a scalable, maintainable BEM (Block, Element, Modifier) based button component system that consolidates 20+ button types currently scattered throughout the application into a coherent, extensible structure.

---

## Design Principles

1. **Single Responsibility**: Each button variant has a clear, single purpose
2. **Composability**: Modifiers can be combined for flexible styling
3. **Accessibility**: Built-in keyboard focus states and semantic structure
4. **Consistency**: Unified spacing, sizing, and transition behavior
5. **Scalability**: Easy to add new variants without breaking existing code
6. **Theme Support**: Works seamlessly with existing theme system (default, dark, signal, prism)

---

## BEM Structure

### Block: `.btn`

Base button class with shared properties for all button types.

**Properties:**
- `min-height: 44px` (touch-friendly minimum)
- `padding: 0.5rem 0.75rem` (icon buttons) or `0.75rem 1.5rem` (text buttons)
- `border: 1px solid var(--color-divider)`
- `border-radius: var(--border-radius-sm)`
- `cursor: pointer`
- `transition: all 200ms ease`
- `font-family: inherit`
- `font-weight: 500`
- `font-size: 0.95rem` or theme-specific sizes
- `display: inline-flex` (for alignment of text and icons)
- `align-items: center`
- `justify-content: center`

**States:**
- `:hover` - Enhanced border and background
- `:active` - Pressed appearance
- `:disabled` - Grayed out, not-allowed cursor
- `:focus-visible` - Keyboard-only focus ring (outline: 2px solid var(--color-primary); outline-offset: 2px)

---

## Button Variants (Modifiers)

### `.btn--primary`
**Purpose:** Main actions (Save, Record, Confirm)

**Styling:**
- `background-color: var(--color-primary)`
- `color: white`
- `border-color: var(--color-primary)`

**States:**
- `:hover` - Darker background (#5A6478)
- `:active` - Even darker (#3F3D3A)
- `:disabled` - Opacity: 0.4, cursor: not-allowed

### `.btn--secondary`
**Purpose:** Cancel/Clear/Alternative actions

**Styling:**
- `background-color: var(--color-surface)`
- `color: var(--color-text)`
- `border-color: var(--color-divider)`

**States:**
- `:hover` - Background: var(--color-divider), border: var(--color-text)
- `:active` - Background: #D9D7D0
- `:disabled` - Opacity: 0.4, cursor: not-allowed

### `.btn--icon`
**Purpose:** Icon-only buttons (Theme, Mode, Language toggles)

**Sizing:**
- `min-height: 48px`
- `min-width: 48px`
- `padding: 0.5rem 0.75rem`
- `font-size: 1.2rem - 1.5rem` (emoji/icon size)

**Styling:**
- `background-color: transparent`
- `border: 1px solid var(--color-divider)`
- `display: flex`
- `align-items: center`
- `justify-content: center`

**States:**
- `:hover` - Background: var(--color-surface), border: var(--color-text)
- `.active` modifier applies: Background: var(--color-primary), color: white

### `.btn--ghost`
**Purpose:** Minimal buttons with no background (Future use)

**Styling:**
- `background-color: transparent`
- `border: none`
- `color: var(--color-primary)`

**States:**
- `:hover` - Underline or opacity change
- `:active` - Color shift

### `.btn--danger`
**Purpose:** Destructive actions (Delete, Sign Out)

**Styling:**
- `background-color: #ef4444` (red)
- `color: white`
- `border-color: #ef4444`

**States:**
- `:hover` - Background: #dc2626
- `:active` - Background: #b91c1c

### `.btn--success`
**Purpose:** Confirmatory actions (Save changes, Accept)

**Styling:**
- `background-color: #10b981` (green)
- `color: white`
- `border-color: #10b981`

**States:**
- `:hover` - Background: #059669
- `:active` - Background: #047857

### `.btn--warning`
**Purpose:** Caution/Alert actions

**Styling:**
- `background-color: #f59e0b` (amber)
- `color: white`
- `border-color: #f59e0b`

**States:**
- `:hover` - Background: #d97706
- `:active` - Background: #b45309

### `.btn--text`
**Purpose:** Text-only buttons (minimal styling)

**Sizing:**
- `padding: 0.75rem 1.5rem`
- `font-size: 0.95rem`

**Styling:**
- `background-color: transparent`
- `border: 1px solid var(--color-divider)`
- `color: var(--color-text)`

**States:**
- `:hover` - Border: var(--color-text), opacity: 0.8
- `:active` - Background: rgba(0,0,0, 0.05)

---

## Size Modifiers

### `.btn--sm` (Small)
- `min-height: 36px`
- `padding: 0.375rem 0.75rem`
- `font-size: 0.85rem`

### `.btn--md` (Medium - Default)
- `min-height: 44px`
- `padding: 0.5rem 1rem`
- `font-size: 0.95rem`

### `.btn--lg` (Large)
- `min-height: 52px`
- `padding: 0.75rem 1.5rem`
- `font-size: 1rem`

### `.btn--xl` (Extra Large)
- `min-height: 60px`
- `padding: 1rem 2rem`
- `font-size: 1.1rem`

---

## Width Modifiers

### `.btn--block`
- `width: 100%`
- `display: flex`

### `.btn--square`
- `width: equal to height`
- `padding: 0` (center content with flexbox)

---

## State Modifiers

### `.btn.active`
Applied to toggle buttons that are currently selected

### `.btn:disabled` or `.btn[disabled]`
Browser native disabled state

### `.btn.loading` (Future enhancement)
- Show spinner/loader state
- Disable interaction

---

## Mapping: Old Classes → New BEM Structure

| Old Class | New BEM Class | Variant(s) | Size | Notes |
|-----------|---------------|-----------|------|-------|
| `.theme-btn` | `.btn.btn--icon` | icon | md | No background, toggle active state |
| `.theme-btn-default` | `.btn.btn--icon` | icon | md | Data attribute for theme |
| `.theme-btn-signal` | `.btn.btn--icon` | icon | md | Data attribute for theme |
| `.theme-btn-dark` | `.btn.btn--icon` | icon | md | Data attribute for theme |
| `.theme-btn-prism` | `.btn.btn--icon` | icon | md | Data attribute for theme |
| `.mode-btn` | `.btn.btn--icon.btn--md` | icon | md | Toggle active for mode selection |
| `.language-btn` | `.btn.btn--icon.btn--md` | icon | md | Toggle active for language selection |
| `.record-button` | `.btn.btn--primary.btn--lg` | primary | lg | Min-height: 48px, flex: 1 |
| `.pause-button` | `.btn.btn--secondary.btn--lg` | secondary | lg | Disabled by default, becomes enabled on recording |
| `.save-button` | `.btn.btn--primary` | primary | md | For saving meetings |
| `.clear-button` | `.btn.btn--secondary` | secondary | md | For clearing transcript |
| `.modal-btn.modal-btn-primary` | `.btn.btn--primary` | primary | md | Modal context |
| `.modal-btn.modal-btn-secondary` | `.btn.btn--secondary` | secondary | md | Modal context |
| `.action-button` | `.btn` | (base) | md | Generic base, combined with specific classes |
| `.logout-button` | `.btn.btn--secondary` | secondary | md | Could also use `.btn--danger` for more prominence |
| `.control-toggle-btn` | `.btn.btn--icon` | icon | md | Toggle show/hide control panel |
| `.edit-transcript-btn` | `.btn.btn--primary` | primary | md | Edit button in modal |
| `.cancel-edit-btn` | `.btn.btn--secondary` | secondary | md | Cancel editing |
| `.save-edit-btn` | `.btn.btn--success` | success | md | Confirm save during edit |
| `.meeting-menu-btn` | `.btn.btn--icon.btn--sm` | icon | sm | Options menu trigger |
| `.analyze-btn` | `.btn.btn--primary` | primary | md | Generate analysis |
| `.reanalyze-btn` | `.btn.btn--primary` | primary | md | Re-run analysis |
| `.add-tags-btn` | `.btn.btn--primary` | primary | md | Add tags to meeting |
| `.tag-btn` | `.btn.btn--text` | text | sm | Tag selection button |
| `.meeting-menu-item` | Not a button, but list item | - | - | Styled as menu item, not a button |

---

## Complete CSS Implementation

### Step 1: Base `.btn` Class

```css
/* Base button component - works for all variants */
.btn {
    /* Display & Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;

    /* Sizing */
    min-height: 44px;
    padding: 0.75rem 1rem;

    /* Styling */
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);

    /* Typography */
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.5;

    /* Interaction */
    cursor: pointer;
    transition: all 200ms ease;

    /* Remove default button styling */
    appearance: none;
    -webkit-appearance: none;

    /* Text selection */
    user-select: none;
}

/* Base focus-visible state (keyboard-only) */
.btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* Disabled state */
.btn:disabled,
.btn[disabled] {
    cursor: not-allowed;
    opacity: 0.4;
}
```

### Step 2: Variant Classes

```css
/* ===== PRIMARY VARIANT ===== */
.btn--primary {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

.btn--primary:hover:not(:disabled) {
    background-color: #5A6478;
    border-color: var(--color-text);
}

.btn--primary:active:not(:disabled) {
    background-color: #3F3D3A;
}

/* ===== SECONDARY VARIANT ===== */
.btn--secondary {
    background-color: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-divider);
}

.btn--secondary:hover:not(:disabled) {
    background-color: var(--color-divider);
    border-color: var(--color-text);
}

.btn--secondary:active:not(:disabled) {
    background-color: #D9D7D0;
}

/* ===== ICON VARIANT ===== */
.btn--icon {
    min-height: 48px;
    min-width: 48px;
    padding: 0.5rem 0.75rem;
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-divider);
    font-size: 1.2rem;
}

.btn--icon:hover:not(:disabled) {
    background-color: var(--color-surface);
    border-color: var(--color-text);
}

.btn--icon.active,
.btn--icon:active:not(:disabled) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.btn--icon.active:hover {
    background-color: #5A6478;
}

/* ===== GHOST VARIANT ===== */
.btn--ghost {
    background-color: transparent;
    border: none;
    color: var(--color-primary);
}

.btn--ghost:hover:not(:disabled) {
    opacity: 0.8;
    text-decoration: underline;
}

.btn--ghost:active:not(:disabled) {
    opacity: 0.6;
}

/* ===== DANGER VARIANT ===== */
.btn--danger {
    background-color: #ef4444;
    color: white;
    border-color: #ef4444;
}

.btn--danger:hover:not(:disabled) {
    background-color: #dc2626;
    border-color: #991b1b;
}

.btn--danger:active:not(:disabled) {
    background-color: #b91c1c;
}

/* ===== SUCCESS VARIANT ===== */
.btn--success {
    background-color: #10b981;
    color: white;
    border-color: #10b981;
}

.btn--success:hover:not(:disabled) {
    background-color: #059669;
    border-color: #047857;
}

.btn--success:active:not(:disabled) {
    background-color: #047857;
}

/* ===== WARNING VARIANT ===== */
.btn--warning {
    background-color: #f59e0b;
    color: white;
    border-color: #f59e0b;
}

.btn--warning:hover:not(:disabled) {
    background-color: #d97706;
    border-color: #b45309;
}

.btn--warning:active:not(:disabled) {
    background-color: #b45309;
}

/* ===== TEXT VARIANT ===== */
.btn--text {
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-divider);
}

.btn--text:hover:not(:disabled) {
    border-color: var(--color-text);
    background-color: rgba(43, 42, 40, 0.04);
}

.btn--text:active:not(:disabled) {
    background-color: rgba(43, 42, 40, 0.08);
}
```

### Step 3: Size Modifiers

```css
/* ===== SIZE VARIANTS ===== */

/* Small */
.btn--sm {
    min-height: 36px;
    padding: 0.375rem 0.75rem;
    font-size: 0.85rem;
}

.btn--sm.btn--icon {
    min-width: 36px;
}

/* Medium (default) - explicitly defined for clarity */
.btn--md {
    min-height: 44px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
}

.btn--md.btn--icon {
    min-width: 48px;
}

/* Large */
.btn--lg {
    min-height: 52px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    flex: 1;  /* Often used in control panels */
}

.btn--lg.btn--icon {
    min-width: 52px;
    font-size: 1.5rem;
}

/* Extra Large */
.btn--xl {
    min-height: 60px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
}

.btn--xl.btn--icon {
    min-width: 60px;
}
```

### Step 4: Width Modifiers

```css
/* ===== WIDTH VARIANTS ===== */

/* Full width button */
.btn--block {
    width: 100%;
    display: flex;
}

/* Square button (width = height) */
.btn--square {
    width: var(--btn-size, 44px);  /* Use CSS custom property */
    padding: 0;
}
```

### Step 5: Group Utilities

```css
/* ===== BUTTON GROUPS ===== */

/* Container for button groups */
.btn-group {
    display: flex;
    gap: var(--spacing-xs, 0.5rem);
    align-items: center;
}

/* Remove gaps between adjacent buttons */
.btn-group--compact {
    gap: 0;
}

.btn-group--compact .btn {
    border-radius: 0;
    border-right-width: 0;
}

.btn-group--compact .btn:first-child {
    border-top-left-radius: var(--border-radius-sm);
    border-bottom-left-radius: var(--border-radius-sm);
}

.btn-group--compact .btn:last-child {
    border-right-width: 1px;
    border-top-right-radius: var(--border-radius-sm);
    border-bottom-right-radius: var(--border-radius-sm);
}

/* Vertical button group */
.btn-group--vertical {
    flex-direction: column;
}

.btn-group--vertical .btn {
    width: 100%;
}
```

### Step 6: Theme-Specific Overrides

```css
/* ===== DARK THEME OVERRIDES ===== */
body.theme-dark .btn--icon {
    background-color: transparent;
    border-color: #3A3935;
    color: #F2F0EB;
}

body.theme-dark .btn--icon:hover:not(:disabled) {
    background-color: #2A2825;
    border-color: #F2F0EB;
}

body.theme-dark .btn--text {
    color: #F2F0EB;
    border-color: #3A3935;
}

body.theme-dark .btn--text:hover:not(:disabled) {
    border-color: #F2F0EB;
    background-color: rgba(242, 240, 235, 0.1);
}

body.theme-dark .btn--secondary:hover:not(:disabled) {
    background-color: #3A3935;
    border-color: #F2F0EB;
}

/* ===== PRISM THEME OVERRIDES ===== */
body.theme-prism .btn--primary {
    background: linear-gradient(135deg, #FF4FD8 0%, #9A6BFF 100%);
    border-color: transparent;
    box-shadow: var(--shadow-2);
}

body.theme-prism .btn--primary:hover:not(:disabled) {
    box-shadow: var(--shadow-3), var(--glow);
}

body.theme-prism .btn--icon {
    background-color: transparent;
    border-color: rgba(155, 140, 255, 0.2);
}

body.theme-prism .btn--icon:hover:not(:disabled) {
    background-color: var(--soft-surface-1);
    border-color: rgba(155, 140, 255, 0.4);
}

body.theme-prism .btn--icon.active {
    background: linear-gradient(135deg, #FF4FD8 0%, #9A6BFF 100%);
    border-color: transparent;
}

/* ===== SIGNAL THEME OVERRIDES ===== */
body.theme-signal .btn--primary {
    background-color: #E10600;
    border: 2px solid #E10600;
    box-shadow: 2px 2px 0px #111111;
}

body.theme-signal .btn--primary:hover:not(:disabled) {
    box-shadow: 3px 3px 0px #111111;
}

body.theme-signal .btn--secondary {
    border: 2px solid #E10600;
    box-shadow: 2px 2px 0px #111111;
}
```

---

## Migration Strategy

### Phase 1: Implement Base CSS
1. Add `.btn` base class with all shared properties
2. Add all variant classes (--primary, --secondary, --icon, etc.)
3. Add size modifiers (--sm, --md, --lg, --xl)
4. Add theme-specific overrides
5. **Do NOT modify HTML yet**

### Phase 2: Create Migration Map
1. Document each old class and its new BEM equivalent
2. Create find/replace patterns for refactoring
3. Test old and new classes in parallel

### Phase 3: Update HTML Gradually
1. Start with a single feature (e.g., all theme buttons)
2. Replace old classes with new BEM classes
3. Verify styling matches exactly
4. Move to next feature group

### Phase 4: Clean Up Legacy Classes
1. Once all HTML is updated, remove old CSS rules
2. Keep old class selectors commented for reference
3. Update styles.css to be BEM-focused

---

## Usage Examples

### Basic Buttons

```html
<!-- Primary Button -->
<button class="btn btn--primary">Save</button>

<!-- Secondary Button -->
<button class="btn btn--secondary">Cancel</button>

<!-- Icon Button -->
<button class="btn btn--icon" title="Dark theme">🌙</button>

<!-- Icon Button (Active/Selected) -->
<button class="btn btn--icon active" title="English">🇬🇧</button>

<!-- Success Button -->
<button class="btn btn--success">Confirm</button>

<!-- Danger Button -->
<button class="btn btn--danger">Delete</button>

<!-- Text Button -->
<button class="btn btn--text">More Options</button>
```

### With Size Modifiers

```html
<!-- Small Button -->
<button class="btn btn--primary btn--sm">OK</button>

<!-- Large Button (for Record/Pause) -->
<button class="btn btn--primary btn--lg">Record</button>

<!-- Large Icon Button -->
<button class="btn btn--icon btn--lg">🎤</button>

<!-- Extra Large Button -->
<button class="btn btn--primary btn--xl">Start Session</button>
```

### With Width Modifiers

```html
<!-- Full Width Button -->
<button class="btn btn--primary btn--block">Submit Form</button>

<!-- Square Button -->
<button class="btn btn--icon btn--square">✓</button>
```

### Button Groups

```html
<!-- Horizontal Group (Theme Selector) -->
<div class="btn-group">
    <button class="btn btn--icon active" data-theme="default">☀️</button>
    <button class="btn btn--icon" data-theme="dark">🌙</button>
    <button class="btn btn--icon" data-theme="signal">📡</button>
    <button class="btn btn--icon" data-theme="prism">🦄</button>
</div>

<!-- Vertical Group (Modal Actions) -->
<div class="btn-group btn-group--vertical">
    <button class="btn btn--primary">Save Changes</button>
    <button class="btn btn--secondary">Discard</button>
</div>

<!-- Compact Group (Toggle Buttons) -->
<div class="btn-group btn-group--compact">
    <button class="btn btn--icon active">Mic</button>
    <button class="btn btn--icon">Screen</button>
</div>
```

### Real-World Examples

```html
<!-- Recording Control Panel -->
<div class="control-buttons">
    <button id="micButton" class="btn btn--primary btn--lg">Record</button>
    <button id="pauseButton" class="btn btn--secondary btn--lg" disabled>Pause</button>
</div>

<!-- Meeting Actions -->
<div class="recording-actions">
    <button class="btn btn--primary">Save</button>
    <button class="btn btn--secondary">Clear</button>
</div>

<!-- Modal Actions -->
<div class="modal-footer">
    <button class="btn btn--secondary">Cancel</button>
    <button class="btn btn--primary">Confirm</button>
</div>

<!-- Mode & Language Selectors -->
<div class="recording-mode-selector">
    <button class="btn btn--icon btn--md active" data-mode="microphone">🎤</button>
    <button class="btn btn--icon btn--md" data-mode="screen_audio">🖥️</button>
</div>

<div class="language-selector">
    <button class="btn btn--icon btn--md active" data-language="en">🇬🇧</button>
    <button class="btn btn--icon btn--md" data-language="sv">🇸🇪</button>
    <button class="btn btn--icon btn--md" data-language="de">🇩🇪</button>
</div>

<!-- Header Controls -->
<div class="user-section">
    <button class="btn btn--secondary">Sign Out</button>
</div>
```

---

## Before & After Comparison

### Example 1: Theme Button

**BEFORE:**
```css
.theme-btn {
    padding: 0.5rem 0.75rem;
    background: none;
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 200ms ease;
}

.theme-btn:hover {
    border-color: var(--color-text);
    background-color: rgba(43, 42, 40, 0.04);
}

.theme-btn:active {
    background-color: rgba(43, 42, 40, 0.08);
}

.theme-btn.active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: #F7F6F3;
}
```

**AFTER:**
```css
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
}

.btn--icon {
    min-height: 48px;
    min-width: 48px;
    padding: 0.5rem 0.75rem;
    background-color: transparent;
    font-size: 1.2rem;
}

.btn--icon:hover:not(:disabled) {
    background-color: var(--color-surface);
    border-color: var(--color-text);
}

.btn--icon.active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.btn--icon.active:hover {
    background-color: #5A6478;
}
```

**HTML BEFORE:**
```html
<button id="themeDefault" class="theme-btn theme-btn-default" title="Default theme" data-theme="default">☀️</button>
```

**HTML AFTER:**
```html
<button id="themeDefault" class="btn btn--icon active" title="Default theme" data-theme="default">☀️</button>
```

---

### Example 2: Record Button Group

**BEFORE:**
```css
.record-button {
    padding: 0.75rem 1rem;
    background-color: var(--color-primary);
    color: #F7F6F3;
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 200ms ease;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.pause-button {
    padding: 0.75rem 1rem;
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 200ms ease;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.pause-button:disabled {
    background-color: var(--color-divider);
    color: #9ca3af;
    cursor: not-allowed;
    opacity: 0.4;
}
```

**AFTER:**
```css
.btn--lg {
    min-height: 52px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    flex: 1;
}

.btn--primary {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

.btn--primary:hover:not(:disabled) {
    background-color: #5A6478;
}

.btn--secondary {
    background-color: var(--color-surface);
    color: var(--color-text);
}

.btn--secondary:hover:not(:disabled) {
    background-color: var(--color-divider);
}
```

**HTML BEFORE:**
```html
<button id="micButton" class="record-button">Record</button>
<button id="pauseButton" class="pause-button" disabled>Pause</button>
```

**HTML AFTER:**
```html
<button id="micButton" class="btn btn--primary btn--lg">Record</button>
<button id="pauseButton" class="btn btn--secondary btn--lg" disabled>Pause</button>
```

---

### Example 3: Modal Actions

**BEFORE:**
```css
.modal-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
    font-family: inherit;
}

.modal-btn-primary {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

.modal-btn-primary:hover {
    background-color: #5A6478;
}

.modal-btn-secondary {
    background-color: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-divider);
}

.modal-btn-secondary:hover {
    background-color: var(--color-divider);
    border-color: var(--color-text);
}

.edit-transcript-btn {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: background-color 0.2s;
}

.save-edit-btn {
    background-color: #10b981;
    color: white;
}

.cancel-edit-btn {
    background-color: #6b7280;
    color: white;
}
```

**AFTER:**
```css
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 200ms ease;
}

.btn--primary { /* Covers modal-btn-primary, edit-transcript-btn */ }

.btn--secondary { /* Covers modal-btn-secondary */ }

.btn--success { /* Covers save-edit-btn */ }
```

**HTML BEFORE:**
```html
<!-- Confirm Modal -->
<button class="modal-btn modal-btn-secondary">Cancel</button>
<button class="modal-btn modal-btn-primary">OK</button>

<!-- Transcript Edit Modal -->
<button id="editTranscriptBtn" class="edit-transcript-btn">Edit</button>
<button id="saveEditBtn" class="save-edit-btn">Save</button>
<button id="cancelEditBtn" class="cancel-edit-btn">Cancel</button>
```

**HTML AFTER:**
```html
<!-- Confirm Modal -->
<button class="btn btn--secondary">Cancel</button>
<button class="btn btn--primary">OK</button>

<!-- Transcript Edit Modal -->
<button id="editTranscriptBtn" class="btn btn--primary">Edit</button>
<button id="saveEditBtn" class="btn btn--success">Save</button>
<button id="cancelEditBtn" class="btn btn--secondary">Cancel</button>
```

---

## Accessibility Considerations

### Keyboard Navigation
- All buttons must be focusable with Tab key
- `.btn:focus-visible` provides visual feedback for keyboard users only
- `:focus` is avoided to prevent double focus indicators from mouse clicks

### Screen Readers
- Use semantic `<button>` elements, not `<div>` elements
- Provide clear `title` and `aria-label` attributes for icon-only buttons
- Use `aria-disabled="true"` in addition to `disabled` attribute if needed

### Color Contrast
- Ensure sufficient contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for graphics)
- Don't rely on color alone to convey meaning
- Use `.active` class or `aria-current` for active states

### Touch Targets
- Minimum touch target size: 44px (currently enforced with `min-height: 44px`)
- Adequate spacing between buttons (gap: 0.5rem)
- Buttons should be easily tappable on mobile devices

### Motor Control
- Disabled states should be clearly visible
- Hover states provide feedback for cursor-based interaction
- No rapid animations or movements that could trigger seizures

---

## Future Extensions

### Loading State
```css
.btn.loading {
    pointer-events: none;
    opacity: 0.7;
}

.btn.loading::before {
    content: '';
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-right: 0.5em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### Icon Position Modifier
```css
.btn--icon-right {
    flex-direction: row-reverse;
}
```

### Outline Variant
```css
.btn--outline {
    background-color: transparent;
    border: 2px solid currentColor;
}

.btn--outline.btn--primary {
    color: var(--color-primary);
    border-color: var(--color-primary);
}

.btn--outline.btn--primary:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
}
```

### Link Button
```css
.btn--link {
    background-color: transparent;
    border: none;
    color: var(--color-primary);
    text-decoration: underline;
}

.btn--link:hover {
    text-decoration: none;
}
```

---

## Performance Notes

1. **CSS Bundle Size**: The BEM structure reduces duplication and creates a more compact CSS file
2. **Maintainability**: Single source of truth for button styles across themes
3. **Rendering Performance**: No performance degradation with additional classes
4. **Browser Support**: Uses standard CSS features compatible with all modern browsers

---

## Testing Checklist

- [ ] All button variants render correctly
- [ ] All size modifiers work as expected
- [ ] All state modifiers work as expected
- [ ] Theme overrides apply correctly
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus states are visible for keyboard users
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44x44px
- [ ] Hover/active states provide feedback
- [ ] Disabled state is clearly visible
- [ ] All existing functionality preserved
- [ ] No console errors or warnings

---

## Summary

This BEM-based button system provides:

✅ **Consistency**: Unified styling across 20+ button types
✅ **Scalability**: Easy to add new variants without breaking existing code
✅ **Maintainability**: Single source of truth for each button type
✅ **Accessibility**: Built-in keyboard and screen reader support
✅ **Flexibility**: Composable modifiers for endless combinations
✅ **Performance**: Reduced CSS duplication and bundle size
✅ **Future-Ready**: Framework for extensions (loading, outline, link variants, etc.)

The system is designed to be implemented gradually, allowing for testing and verification at each stage without disrupting existing functionality.
