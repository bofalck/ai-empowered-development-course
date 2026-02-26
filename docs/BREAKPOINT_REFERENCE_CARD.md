# Responsive Breakpoint Reference Card
## Quick lookup for responsive design implementation

---

## Breakpoint Quick Reference

### Mobile First Strategy

```
Mobile (375px-480px)
    ↓ (min-width: 481px)
Tablet (481px-1023px)
    ↓ (min-width: 1024px)
Desktop (1024px+)
```

---

## Current Breakpoints in Code

### 1. Extra Small: `<480px`
**Query:** `@media (max-width: 479px)`
**Devices:** iPhone SE, small Android phones
**Lines in CSS:** ~3382-3429

**Key Styles:**
```css
header { padding: 0.75rem; }
.theme-btn { height: 44px; }
.record-button { height: 48px; }
.language-selector { gap: 0.5rem; }
```

**Components:**
- Floating control panel: Full width, stacks vertically
- Buttons: 44-48px height enforcement
- Kanban: Single column
- Header: Vertical flex

---

### 2. Mobile: `480px - 767px`
**Query:** `@media (max-width: 767px)`
**Devices:** Android phones, mobile landscape
**Lines in CSS:** ~3163-3379

**Key Styles:**
```css
header { flex-direction: column; padding: 0.75rem; }
.kanban-board { grid-template-columns: 1fr; }
.floating-control-panel { bottom: 0; width: 100%; }
.language-selector { grid-template-columns: repeat(4, 1fr); }
```

**Components:**
- Kanban: Single column
- Control panel: Full width at bottom (iOS-style curved top)
- Header: Vertical stacking
- Gap: 0.75rem between kanban columns

---

### 3. Tablet: `768px - 1023px`
**Query:** `@media (max-width: 1023px)`
**Devices:** iPad Mini, tablet portrait
**Lines in CSS:** ~3040-3160

**Key Styles:**
```css
header { flex-direction: column; }
.kanban-board { grid-template-columns: 1fr; gap: 1rem; }
.kanban-column { min-height: 350px; }
.floating-control-panel { width: calc(100% - 1.5rem); }
```

**Components:**
- Kanban: Single column (stacked)
- Control panel: Anchored to bottom with side padding
- Column height: 350px minimum
- Recording timer: 1.5rem (24px)

---

### 4. Tablet Large: `1024px - 1199px`
**Query:** `@media (max-width: 1199px)`
**Devices:** iPad, tablet landscape
**Lines in CSS:** ~3019-3037

**Key Styles:**
```css
.kanban-board {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
.kanban-column { min-height: 400px; }
header { gap: 1rem; }
```

**Components:**
- Kanban: Two columns (Recording + Analysis visible, Archive below)
- Control panel: Proper positioning
- Column height: 400px minimum
- Increased spacing

---

### 5. Desktop: `1200px - 1399px`
**Query:** `@media (max-width: 1399px) and (min-width: 1200px)`
**Devices:** Small desktop, laptop
**Lines in CSS:** ~3012-3016

**Key Styles:**
```css
.kanban-board { grid-template-columns: 1fr 1fr 1fr; }
```

**Components:**
- Kanban: Three columns (all visible)
- Same as large desktop

---

### 6. Large Desktop: `≥1400px`
**Query:** `@media (min-width: 1400px)`
**Devices:** Large monitor, desktop
**Lines in CSS:** ~3005-3009

**Key Styles:**
```css
.kanban-board { grid-template-columns: 1fr 1fr 1fr; }
```

**Components:**
- Kanban: Three columns
- Optimal layout for large screens

---

## Feature Behavior by Breakpoint

### Kanban Board Layout
```
375px   │ Single Column           │ ░░░░░░░░░
480px   │ Single Column           │ ░░░░░░░░░
768px   │ Single Column           │ ░░░░░░░░░
1024px  │ 2 Columns (+ Archive)   │ ░░░░░ ░░░░░
1400px  │ 3 Columns               │ ░░░ ░░░ ░░░
1920px  │ 3 Columns (max-width)   │ ░░░ ░░░ ░░░
```

### Header Layout
```
375px   │ Vertical Flex           │ Title
        │                         │ Themes
        │                         │ User
480px   │ Vertical Flex           │ Title
        │                         │ Themes
        │                         │ User
768px   │ Vertical Flex           │ Title (full)
        │                         │ Themes + User
1024px+ │ Horizontal Flex         │ Title | Themes | User
```

### Floating Control Panel
```
375px   │ Full width, bottom      │ ██████████ (curved top)
480px   │ Full width, bottom      │ ██████████ (curved top)
768px   │ Full width, sides       │ ░██████████░ (side padding)
1024px+ │ Centered, bottom        │ ████ (centered)
```

### Button Sizing
```
Element            │ 375px  │ 480px  │ 768px  │ 1024px │ Desktop
─────────────────────────────────────────────────────────────
Theme Button       │ 44px   │ 44px   │ 44px   │ 44px   │ 44px+
Record Button      │ 48px   │ 48px   │ 48px   │ 48px   │ 48px+
Mode Button        │ 44px   │ 44px   │ 44px   │ 48px   │ 48px+
Language Button    │ 44px   │ 44px   │ 44px   │ 48px   │ 48px+
Modal Close        │ 44x44  │ 44x44  │ 44x44  │ 44x44  │ 44x44
```

---

## Touch Target Sizing Standards

**Minimum:** 44x44px (WCAG AAA compliance)
**Recommended:** 48x48px (iOS standard)
**Preferred:** 56x56px (Android standard)

**Status by Breakpoint (After CSS Fixes):**
```
375px   │ ✓ All 44px minimum
480px   │ ✓ All 44px minimum
768px   │ ✓ All 44px minimum
1024px+ │ ✓ All 44px minimum
```

---

## Font Sizes by Breakpoint

```
Element              │ 375px  │ 768px  │ 1024px │ Desktop
──────────────────────────────────────────────────
Body Text            │ 1rem   │ 1rem   │ 1rem   │ 1rem
Header Title         │ 1.25rem│ 1rem   │ 1rem   │ 1.25rem
Column Header        │ 0.85rem│ 0.95rem│ 0.95rem│ 0.95rem
Recording Timer      │ 1rem   │ 1.5rem │ 2rem   │ 2rem
Button Text          │ 0.75rem│ 0.95rem│ 1rem   │ 1rem
```

---

## Media Query Patterns

### Desktop First (Currently NOT used, but good to know)
```css
/* Large - Default */
.kanban-board { grid-template-columns: 1fr 1fr 1fr; }

/* Medium - Reduce */
@media (max-width: 1199px) { /* Desktop down to tablet */
    .kanban-board { grid-template-columns: 1fr 1fr; }
}

/* Small - Minimize */
@media (max-width: 1023px) { /* Tablet down to mobile */
    .kanban-board { grid-template-columns: 1fr; }
}
```

### Mobile First (Better approach)
```css
/* Small - Start minimal */
@media (max-width: 767px) {
    .kanban-board { grid-template-columns: 1fr; }
}

/* Medium - Add complexity */
@media (min-width: 768px) {
    .kanban-board { grid-template-columns: 1fr 1fr; }
}

/* Large - Full layout */
@media (min-width: 1024px) {
    .kanban-board { grid-template-columns: 1fr 1fr 1fr; }
}
```

---

## Padding & Spacing by Breakpoint

```
Element         │ 375px  │ 480px  │ 768px  │ 1024px │ 1400px
────────────────────────────────────────────────────────────
Header Padding  │ 0.75rem│ 0.75rem│ 1rem   │ 1.5rem │ 1.5rem
Main Padding    │ 0.25rem│ 0.5rem │ 0.75rem│ 1rem   │ 1rem
Column Gap      │ 0.75rem│ 0.75rem│ 1rem   │ 1.5rem │ 1.5rem
Button Gap      │ 0.5rem │ 0.5rem │ 0.5rem │ 1rem   │ 1rem
```

---

## Common CSS Values Reference

### Spacing Variables (8px Grid System)
```css
--spacing-xs:  0.5rem   /* 8px */
--spacing-sm:  1rem     /* 16px */
--spacing-md:  1.5rem   /* 24px */
--spacing-lg:  2rem     /* 32px */
--spacing-xl:  2.5rem   /* 40px */
--spacing-xxl: 3rem     /* 48px */
```

### Border Radius
```css
--border-radius-sm: 8px
--border-radius-md: 12px
--border-radius-lg: 16px
```

### Colors (CSS Variables)
```css
--color-background:     #F7F6F3
--color-surface:        #ECEAE5
--color-divider:        #E2E0DB
--color-text:           #2B2A28
--color-text-secondary: #3A3936
--color-primary:        #4A5568
```

---

## Theme-Specific Breakpoint Adjustments

All breakpoints apply to all themes:
- Default (MUJI-inspired)
- Signal in Silence
- Dark
- PrismPulse

**No theme-specific breakpoint overrides** - breakpoints are theme-agnostic

---

## Container Queries (Future Enhancement)

**Current:** Using width-based media queries only
**Future Consideration:** Container queries could enhance component responsiveness

```css
/* Would look like: */
@container (min-width: 400px) {
    .floating-control-panel { width: 100%; }
}
```

---

## Testing Viewport Sizes

### Exact Sizes to Use in DevTools

```
Device              │ Width × Height    │ DPR   │ Query
────────────────────────────────────────────────────────
iPhone SE           │ 375 × 667         │ 2x    │ 375px
iPhone 12 Mini      │ 375 × 812         │ 3x    │ 375px
Pixel 4a / A51      │ 480 × 853         │ 2x    │ 480px
iPad Mini           │ 768 × 1024        │ 2x    │ 768px
iPad Air / Pro 10   │ 1024 × 1366       │ 2x    │ 1024px
Desktop (Laptop)    │ 1400 × 900        │ 1x    │ 1400px
Desktop (Monitor)   │ 1920 × 1080       │ 1x    │ 1920px
```

---

## Quick Debugging Commands

### Check Current Breakpoint (Browser Console)
```javascript
const width = window.innerWidth;
let breakpoint = 'Unknown';

if (width < 480) breakpoint = '375px (Extra Small)';
else if (width < 768) breakpoint = '480px (Mobile)';
else if (width < 1024) breakpoint = '768px (Tablet)';
else if (width < 1200) breakpoint = '1024px (Tablet Large)';
else if (width < 1400) breakpoint = '1200px (Desktop)';
else breakpoint = '1400px+ (Large Desktop)';

console.log(`Current breakpoint: ${width}px - ${breakpoint}`);
```

### Validate Button Sizes
```javascript
document.querySelectorAll('button').forEach(btn => {
    const rect = btn.getBoundingClientRect();
    const isSmall = rect.width < 44 || rect.height < 44;
    const status = isSmall ? '✗ FAIL' : '✓ PASS';
    console.log(`${status}: ${btn.className} (${rect.width}×${rect.height})`);
});
```

### Check for Horizontal Overflow
```javascript
const hasHScroll = document.documentElement.scrollWidth > window.innerWidth;
console.log(hasHScroll ? '✗ Horizontal scroll detected!' : '✓ No horizontal scroll');
```

---

## Common Issues & Quick Fixes

### Issue: Buttons too small on mobile
**Check:** `.theme-btn { min-height: 44px; height: 44px; }`
**Fix:** Ensure explicit height is set (not just min-height)

### Issue: Text wraps strangely
**Check:** Container width, padding, flex properties
**Fix:** Verify `box-sizing: border-box` and padding is accounted for

### Issue: Horizontal scroll appears
**Check:** Element width, padding, margins
**Fix:** Ensure `max-width: 100%` and padding doesn't exceed bounds

### Issue: Buttons overlap
**Check:** Gap between elements, flex-basis
**Fix:** Ensure sufficient gap (minimum 0.5rem) between buttons

### Issue: Modal too wide for screen
**Check:** Modal width property, max-width
**Fix:** Verify `width: 95%` and `max-width: 500px` applied

---

## File Locations

**CSS File:** `/Users/bofa/ai-empowered-development-course/styles.css`
**HTML File:** `/Users/bofa/ai-empowered-development-course/index.html`
**JavaScript:** `/Users/bofa/ai-empowered-development-course/main.js`

---

## Related Documentation

1. **RESPONSIVE_DESIGN_TEST_REPORT.md** - Comprehensive testing results
2. **RESPONSIVE_DESIGN_CSS_FIXES.md** - Implementation guide with code samples
3. **RESPONSIVE_TESTING_CHECKLIST.md** - Testing procedures and verification
4. **RESPONSIVE_DESIGN_SUMMARY.txt** - Executive summary of findings

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-26 | Initial comprehensive testing |
| 1.1 | TBD | After CSS fixes implemented |

---

## Maintenance Checklist

- [ ] Test all breakpoints after CSS changes
- [ ] Verify no breakpoint regressions
- [ ] Test on actual mobile devices
- [ ] Update this reference if breakpoints change
- [ ] Document any new breakpoint additions
- [ ] Review annually for modern device support

---

**Quick Reference Card Created:** February 26, 2026
**Current Breakpoint Status:** 5/6 passing (375px needs fixes)
**Next Update:** After CSS fixes implementation
