# BEM Button System - Quick Reference Card

## Class Structure

```
.btn                    Base class (all buttons)
├── .btn--primary       Main action (Blue)
├── .btn--secondary     Cancel/Alternative (Gray)
├── .btn--icon          Icon-only toggle button
├── .btn--success       Confirmatory action (Green)
├── .btn--danger        Destructive action (Red)
├── .btn--warning       Caution/Alert (Amber)
├── .btn--text          Minimal text-only
├── .btn--ghost         Link-style button
│
├── .btn--sm            36px height
├── .btn--md            44px height (default)
├── .btn--lg            52px height
├── .btn--xl            60px height
│
├── .btn--block         Full width
├── .btn--square        Square shape
│
└── .active             Selected state (for toggles)
```

---

## Quick Examples

### Basic Buttons

```html
<!-- Primary Action -->
<button class="btn btn--primary">Save</button>

<!-- Secondary Action -->
<button class="btn btn--secondary">Cancel</button>

<!-- Icon Toggle -->
<button class="btn btn--icon active">🌙</button>

<!-- Success Action -->
<button class="btn btn--success">Confirm</button>

<!-- Danger Action -->
<button class="btn btn--danger">Delete</button>

<!-- Disabled -->
<button class="btn btn--primary" disabled>Disabled</button>
```

### With Sizes

```html
<button class="btn btn--primary btn--sm">Small</button>
<button class="btn btn--primary btn--md">Medium (default)</button>
<button class="btn btn--primary btn--lg">Large</button>
<button class="btn btn--primary btn--xl">Extra Large</button>
```

### Common Patterns

```html
<!-- Theme Selector -->
<button class="btn btn--icon active">☀️</button>
<button class="btn btn--icon">🌙</button>

<!-- Record Controls -->
<button class="btn btn--primary btn--lg">Record</button>
<button class="btn btn--secondary btn--lg" disabled>Pause</button>

<!-- Modal Actions -->
<button class="btn btn--secondary">Cancel</button>
<button class="btn btn--primary">OK</button>

<!-- Recording Actions -->
<button class="btn btn--primary">Save</button>
<button class="btn btn--secondary">Clear</button>

<!-- Edit Mode -->
<button class="btn btn--primary">Edit</button>
<button class="btn btn--secondary">Cancel</button>
<button class="btn btn--success">Save</button>
```

### Icon Buttons

```html
<!-- Microphone Icon -->
<button class="btn btn--icon btn--md" data-mode="microphone">🎤</button>

<!-- Screen Share Icon -->
<button class="btn btn--icon btn--md" data-mode="screen">🖥️</button>

<!-- Language Flag -->
<button class="btn btn--icon btn--md active" data-language="en">🇬🇧</button>

<!-- Menu Button -->
<button class="btn btn--icon btn--sm">⋮</button>
```

---

## Variant Colors

| Variant | Color | Usage |
|---------|-------|-------|
| `.btn--primary` | Blue (#2563eb) | Save, Submit, Record, OK |
| `.btn--secondary` | Gray (surface) | Cancel, Clear, Close |
| `.btn--icon` | Transparent | Theme, Mode, Language toggles |
| `.btn--success` | Green (#10b981) | Confirm, Apply, Accept |
| `.btn--danger` | Red (#ef4444) | Delete, Sign Out |
| `.btn--warning` | Amber (#f59e0b) | Caution, Alert |
| `.btn--text` | Text color | Minimal styling |
| `.btn--ghost` | Primary color | Link-style |

---

## Size Reference

```
Extra Small (implied)
┌──┐
│✓ │  32px
└──┘

Small (.btn--sm)
┌────┐
│OK  │  36px
└────┘

Medium (.btn--md, default)
┌────────┐
│Cancel  │  44px
└────────┘

Large (.btn--lg)
┌──────────────┐
│   Record    │  52px
└──────────────┘

Extra Large (.btn--xl)
┌────────────────────┐
│   Start Session    │  60px
└────────────────────┘
```

---

## State Indicators

### Interactive States

```
Default (no interaction)
┌─────────┐
│ Button  │
└─────────┘

Hover (:hover)
┌─────────┐
│ Button  │  ← Background/border changes
└─────────┘

Active (:active)
┌─────────┐
│ Button  │  ← Pressed appearance
└─────────┘

Focus-Visible (:focus-visible, keyboard only)
┌─────────┐
│ Button  │  ← Blue outline (keyboard only)
└─────────┘

Disabled (:disabled)
┌─────────┐
│ Button  │  ← Grayed out, 40% opacity
└─────────┘
```

### Toggle States

```
Inactive
┌─────────┐
│   🌙    │  ← Border visible
└─────────┘

Active (.active)
┌─────────┐
│   🌙    │  ← Blue background, white icon
└─────────┘
```

---

## Accessibility Checklist

When using buttons, ensure:

- ✅ Use semantic `<button>` element
- ✅ Add `title` attribute for icon-only buttons
- ✅ Use `aria-label` for screen readers if needed
- ✅ Buttons are keyboard accessible (Tab navigation)
- ✅ Focus state visible on keyboard (`:focus-visible`)
- ✅ No focus ring on mouse click (by design)
- ✅ Use `disabled` attribute for disabled buttons
- ✅ Button text clearly describes action
- ✅ Minimum 44x44px touch target size (built-in)
- ✅ Sufficient color contrast (WCAG AA)

---

## Theme Support

### Default Theme
```css
.btn--primary { background: #2563eb; color: white; }
.btn--icon { border: 1px solid #e5e7eb; }
```

### Dark Theme
```css
body.theme-dark .btn--primary { background: #3b82f6; }
body.theme-dark .btn--icon { border: 1px solid #4b5563; }
```

### Prism Theme
```css
body.theme-prism .btn--primary { background: linear-gradient(135deg, #FF4FD8, #9A6BFF); }
body.theme-prism .btn--icon { border: 1px solid rgba(155, 140, 255, 0.2); }
```

### Signal Theme
```css
body.theme-signal .btn--primary { background: #E10600; border: 2px solid #E10600; }
body.theme-signal .btn--icon { border: 2px solid #E10600; }
```

---

## Migration Checklist

When updating old button classes to BEM:

- [ ] Remove old class names (e.g., `.theme-btn`, `.record-button`)
- [ ] Add `.btn` base class
- [ ] Add appropriate variant (`.btn--primary`, `.btn--icon`, etc.)
- [ ] Add size modifier if needed (`.btn--lg`, `.btn--sm`)
- [ ] Add `.active` for toggle buttons when selected
- [ ] Test in all 4 themes (default, dark, prism, signal)
- [ ] Verify keyboard focus visible
- [ ] Test disabled state if applicable
- [ ] Verify click/action still works

---

## Old → New Class Mapping (Quick Reference)

```
.theme-btn → .btn.btn--icon
.mode-btn → .btn.btn--icon.btn--md
.language-btn → .btn.btn--icon.btn--md
.record-button → .btn.btn--primary.btn--lg
.pause-button → .btn.btn--secondary.btn--lg
.save-button → .btn.btn--primary
.clear-button → .btn.btn--secondary
.logout-button → .btn.btn--secondary
.modal-btn.modal-btn-primary → .btn.btn--primary
.modal-btn.modal-btn-secondary → .btn.btn--secondary
.edit-transcript-btn → .btn.btn--primary
.save-edit-btn → .btn.btn--success
.cancel-edit-btn → .btn.btn--secondary
.tag-btn → .btn.btn--text.btn--sm
```

---

## Common Issues

### Q: Button text wraps to multiple lines?
**A:** Reduce padding or use `white-space: nowrap;` on button text

### Q: Focus outline appears on mouse click?
**A:** This is by design with `:focus-visible` - shows only on keyboard

### Q: Button size inconsistent?
**A:** Add size modifier (`.btn--sm`, `.btn--md`, `.btn--lg`, `.btn--xl`)

### Q: Theme colors not applying?
**A:** Verify theme class is on `<body>` and CSS is loaded

### Q: Disabled button still clickable?
**A:** Use `disabled` attribute, not just `.disabled` class

### Q: Icon button misaligned?
**A:** Use `.btn--icon` variant which has proper centering

---

## Composition Examples

### Icon + Text Button
```html
<button class="btn btn--primary">
    💾 Save File
</button>
```

### Icon Only
```html
<button class="btn btn--icon" title="Settings">⚙️</button>
```

### Full Width
```html
<button class="btn btn--primary btn--block">Sign Up</button>
```

### Button Group
```html
<div class="btn-group">
    <button class="btn btn--icon active">Option 1</button>
    <button class="btn btn--icon">Option 2</button>
    <button class="btn btn--icon">Option 3</button>
</div>
```

### Vertical Button Group
```html
<div class="btn-group btn-group--vertical">
    <button class="btn btn--primary">Save</button>
    <button class="btn btn--secondary">Discard</button>
</div>
```

---

## CSS Classes Available

### Base
- `.btn`

### Variants
- `.btn--primary`
- `.btn--secondary`
- `.btn--icon`
- `.btn--success`
- `.btn--danger`
- `.btn--warning`
- `.btn--text`
- `.btn--ghost`

### Sizes
- `.btn--sm` (36px)
- `.btn--md` (44px, default)
- `.btn--lg` (52px)
- `.btn--xl` (60px)

### Widths
- `.btn--block` (full width)
- `.btn--square` (equal width/height)

### States
- `.active` (for toggles)
- `:disabled` (native browser state)
- `:focus-visible` (keyboard focus)

### Utilities (Future)
- `.btn.loading` (loading spinner)
- `.btn--outline` (outline style)
- `.btn--link` (link style)

---

## Performance Tips

- ✅ Combine modifiers in HTML (smaller final output)
- ✅ CSS is fully compiled (no runtime processing)
- ✅ No JavaScript required for styling
- ✅ Transitions are GPU-accelerated
- ✅ Font icons (emoji) load instantly

---

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** `:focus-visible` supported in all modern browsers

---

## Getting Help

**Design Document:** Read `BEM_BUTTON_SYSTEM_DESIGN.md` for comprehensive info
**Migration Guide:** See `BUTTON_MIGRATION_GUIDE.md` for step-by-step instructions
**Examples:** Check `BUTTON_BEFORE_AFTER_EXAMPLES.md` for visual comparisons
**CSS File:** View `bem-button-system.css` for complete implementation

---

## Summary

The BEM button system provides:
- 🎯 **Consistent** styling across all buttons
- 🚀 **Scalable** for future button types
- ♿ **Accessible** with keyboard and screen reader support
- 🎨 **Themeable** with complete theme support
- 📦 **Maintainable** with centralized definitions
- ⚡ **Performant** with minimal CSS

**Remember:** `.btn` + one or more variants = complete button styling!
