# Responsive Design Testing Checklist
## Quick Reference for Validation Testing

---

## Quick Test Grid

### Breakpoint: 375px (iPhone SE / Mobile Portrait)

**Configuration:**
```
Width: 375px
Height: 667px (typical)
DPR: 2x
User Agent: Mobile
```

#### Elements to Check

| Element | Expected | Status | Notes |
|---------|----------|--------|-------|
| Header | Full width, stacked | ○ | Padding: 0.75rem |
| "AFTER THE NOISE" | 3 lines, centered | ○ | No overflow |
| Theme buttons (☀️📡🌙🦄) | 4 buttons, 44px min | ○ | Should have clear spacing |
| Record/Pause buttons | 2 buttons, side-by-side, 48px | ○ | Full width in panel |
| Mode buttons (🎤🖥️) | 2 buttons, side-by-side, 44px | ○ | Equal width |
| Language buttons (🇬🇧🇸🇪🇩🇪🇪🇸) | 4 buttons, grid, 44px | ○ | 0.5rem gap between |
| Recording timer | Visible, readable | ○ | 1rem (16px) font |
| Device select | Full width | ○ | Minimum 44px height |
| Search input | Full width | ○ | Minimum 44px height |
| Kanban columns | Single column | ○ | 375px width - padding |
| Modal close button (×) | 44x44px | ○ | Not 32x32px |
| Horizontal scroll | None | ○ | Content fits width |
| Touch targets | All ≥44px | ○ | No overlap |

---

### Breakpoint: 480px (Mobile Landscape / Android)

**Configuration:**
```
Width: 480px
Height: 320px (landscape)
DPR: 1x-2x
User Agent: Mobile Android
```

#### Elements to Check

| Element | Expected | Status | Notes |
|---------|----------|--------|-------|
| Header | Full width, stacked | ○ | Padding: 0.75rem |
| Theme buttons | 4 buttons, 44px min | ○ | Properly spaced |
| Control panel | Visible, accessible | ○ | Not cut off |
| Record/Pause buttons | 48px height | ○ | Clear distinction |
| Language selector | 4 buttons, grid | ○ | 0.5rem gap |
| Kanban board | Single column | ○ | Scrollable |
| Modal | Width: 95% | ○ | Fits screen |
| No horizontal scroll | ✓ | ○ | Content fits |

---

### Breakpoint: 768px (Tablet Portrait)

**Configuration:**
```
Width: 768px
Height: 1024px
DPR: 2x (iPad)
User Agent: Tablet
```

#### Elements to Check

| Element | Expected | Status | Notes |
|---------|----------|--------|-------|
| Header | Vertical flex | ○ | Width 100% |
| Kanban board | Single column | ○ | Min-height: 350px |
| Recording panel | Visible | ○ | Accessible |
| Theme selector | Full width | ○ | Gap: 0.25rem OK |
| Modal | Max-width: 500px | ○ | Width: 95% |
| All buttons | Minimum 44px | ○ | Touch friendly |
| Horizontal scroll | None | ○ | No overflow |

---

### Breakpoint: 1024px (Tablet Landscape / iPad Pro)

**Configuration:**
```
Width: 1024px
Height: 768px
DPR: 2x
User Agent: Tablet
```

#### Elements to Check

| Element | Expected | Status | Notes |
|---------|----------|--------|-------|
| Kanban board | 2 columns | ○ | Recording + Analysis on top |
| Column layout | Responsive | ○ | Archive wraps below |
| Recording panel | Docked bottom | ○ | Accessible |
| Header | Flex row | ○ | Proper alignment |
| All touch targets | ≥44px | ○ | WCAG compliant |
| No horizontal scroll | ✓ | ○ | Responsive |

---

### Breakpoint: 1400px (Desktop)

**Configuration:**
```
Width: 1400px
Height: 900px
DPR: 1x
User Agent: Desktop Chrome
```

#### Elements to Check

| Element | Expected | Status | Notes |
|---------|----------|--------|-------|
| Container | Max-width: 1400px | ○ | Centered |
| Kanban board | 3 columns | ○ | Recording\|Analysis\|Archive |
| Gap | 1.5rem (24px) | ○ | Proper spacing |
| Recording panel | Centered bottom | ○ | Visible, accessible |
| Header | Horizontal flex | ○ | Title + Theme + User |
| Modal | Max-width: 500px | ○ | Centered |
| All elements | Properly spaced | ○ | No crowding |

---

### Breakpoint: 1920px (Large Desktop)

**Configuration:**
```
Width: 1920px
Height: 1080px
DPR: 1x
User Agent: Desktop Chrome
```

#### Elements to Check

| Element | Expected | Status | Notes |
|---------|----------|--------|-------|
| Container | Still max-width: 1400px | ○ | Left/right margins |
| Kanban board | 3 columns | ○ | Equal distribution |
| Recording panel | Centered bottom | ○ | Ample spacing |
| All content | Readable | ○ | Proper font sizes |
| Whitespace | Balanced | ○ | No crowding |

---

## Detailed Testing Procedures

### Test 1: Touch Target Sizing

**Objective:** Verify all interactive elements meet minimum 44x44px

**Procedure:**
1. Open DevTools (F12)
2. Set viewport to 375px width
3. Right-click each button element
4. Inspect computed size
5. Note: Minimum 44px (width and height)

**Elements to Test:**
- [ ] Theme buttons (☀️📡🌙🦄)
- [ ] Record button
- [ ] Pause button
- [ ] Mode buttons (🎤🖥️)
- [ ] Language buttons (🇬🇧🇸🇪🇩🇪🇪🇸)
- [ ] Device select dropdown
- [ ] Modal close button (×)
- [ ] Search input
- [ ] Save/Clear buttons

**Pass Criteria:**
- All buttons: ≥44px width AND ≥44px height
- All inputs: ≥44px height
- Clear visual separation between buttons

**Expected Results After CSS Fixes:**
```
✓ Theme button: 44x44px minimum
✓ Record button: 48x48px minimum
✓ Mode button: 44x44px minimum
✓ Language button: 44x44px minimum
✓ Modal close: 44x44px
```

---

### Test 2: Text Readability

**Objective:** Verify text is readable without zoom on all breakpoints

**Procedure:**
1. Set viewport to each breakpoint
2. Check font sizes
3. Verify no text overflow
4. Check line height

**Elements to Test:**
- [ ] Header title "AFTER THE NOISE"
- [ ] Column headers "Recording", "Analysis", "Archive"
- [ ] Button text
- [ ] Modal text
- [ ] Recording timer

**Pass Criteria:**
- No text requiring >150% zoom
- Minimum 16px body font
- Line height ≥1.5

**Expected Measurements:**
```
At 375px:
- Body: 16px (1rem) ✓
- Header: 20px (1.25rem) ✓
- Timer: 16px (1rem) ✓

At 768px+:
- Body: 16px (1rem) ✓
- Header: 20px (1.25rem) ✓
```

---

### Test 3: Horizontal Scrolling

**Objective:** Verify no unwanted horizontal scrolling

**Procedure:**
1. Set each breakpoint
2. Check for horizontal scrollbar
3. Attempt to scroll right (should be impossible)
4. Check container widths

**Elements to Test:**
- [ ] Header (full width)
- [ ] Main content (container max-width)
- [ ] Kanban board (responsive grid)
- [ ] Floating control panel
- [ ] Modal dialogs

**Pass Criteria:**
- No horizontal scrollbar appears
- No hidden content off-screen right
- Container never exceeds viewport width

**Expected Results:**
```
At 375px: No scroll, content fits exactly or with proper padding
At 480px: No scroll, content responsive
At 768px+: No scroll, layouts properly constrained
```

---

### Test 4: Layout Shifting

**Objective:** Verify no layout shift (CLS) when elements change

**Procedure:**
1. Set breakpoint to 375px
2. Slow network throttling
3. Observe page load and interactions
4. Check for jumping/shifting content

**Elements to Watch:**
- [ ] Floating control panel appearing/disappearing
- [ ] Header elements reflowing
- [ ] Kanban columns stacking/unstacking
- [ ] Modal appearance/disappearance

**Pass Criteria:**
- No visible jumps or shifts
- Smooth transitions only
- Content stable before interactions

---

### Test 5: Button Group Layout

**Objective:** Verify button groups stack/arrange properly

**Procedure:**
1. Check Record/Pause button arrangement at each breakpoint
2. Check Mode button arrangement
3. Check Language button arrangement
4. Check Theme button arrangement

**Expected Results:**

**At 375px (Floating Control Panel):**
```
Recording panel:
├─ Timer (full width, centered)
└─ Record | Pause (2 columns, 50% each, 0.5rem gap)

Capture settings panel:
├─ Mode 1 | Mode 2 (2 columns, 50% each)
├─ Language grid (4 columns, 25% each, 0.5rem gap)
└─ Device select (full width)
```

**At 768px:**
```
Control panel stacks vertically:
├─ Recording panel (full width)
├─ Capture settings (full width)
└─ All elements full width
```

**At 1024px+:**
```
Control panel horizontal:
├─ Recording panel
├─ Panel divider (vertical)
├─ Capture settings panel
└─ Settings dividers between sections
```

---

### Test 6: Modal Behavior

**Objective:** Verify modals fit screen and are usable

**Procedure:**
1. Trigger a modal (e.g., edit transcript)
2. Check modal dimensions at each breakpoint
3. Verify close button is accessible
4. Check form inputs are usable
5. Test scrolling within modal if content exceeds height

**Elements to Test:**
- [ ] Modal width (should be 95% at mobile)
- [ ] Modal height (max: 90vh)
- [ ] Close button (should be 44x44px)
- [ ] Form inputs (minimum 44px height)
- [ ] Button sizing (minimum 44px)

**Pass Criteria:**
- Modal fits within viewport
- All interactive elements accessible
- Close button easily tappable
- No horizontal scroll within modal

---

### Test 7: Header Layout Responsiveness

**Objective:** Verify header adapts properly

**Procedure:**

**At 375px:**
- [ ] Stacks vertically (flex-direction: column)
- [ ] Title section (full width)
- [ ] Theme selector (full width)
- [ ] User section (full width)
- [ ] Padding: 0.75rem

**At 768px:**
- [ ] Stacks vertically
- [ ] Theme selector and user section on same row with space-between
- [ ] All items stretch or align properly

**At 1024px+:**
- [ ] Horizontal layout (flex-direction: row)
- [ ] Title on left, theme + user on right
- [ ] Proper spacing maintained

---

### Test 8: Floating Control Panel Positioning

**Objective:** Verify control panel accessibility at all sizes

**Procedure:**

**At 1920px-1024px:**
- [ ] Panel centered bottom
- [ ] Spacing: 2rem from bottom
- [ ] Draggable as designed
- [ ] Visible without scrolling

**At 768px:**
- [ ] Panel full width with padding
- [ ] Bottom spacing: 0.75rem
- [ ] Width: calc(100% - 1.5rem)
- [ ] Visible without scrolling

**At 480px:**
- [ ] Panel full width, no padding
- [ ] Bottom: 0 (flush to bottom)
- [ ] Border radius: 20px 20px 0 0 (iOS style)
- [ ] Accessible via toggle button in header

**At 375px:**
- [ ] Same as 480px
- [ ] All buttons within reach
- [ ] Not cut off by notch/home indicator (if applicable)

---

### Test 9: Keyboard Navigation

**Objective:** Verify keyboard accessibility

**Procedure:**
1. Use Tab key to navigate elements
2. Check focus is visible
3. Verify tab order is logical
4. Test on all breakpoints

**Elements to Test:**
- [ ] Header buttons (theme, logout)
- [ ] Kanban board buttons
- [ ] Modal buttons
- [ ] Form inputs
- [ ] Control panel buttons

**Pass Criteria:**
- Visible focus indicator on every interactive element
- Tab order logical (left-to-right, top-to-bottom)
- No focus trapped
- Escape key closes modals

---

## Platform-Specific Testing

### iOS Testing (iPhone SE - 375px)

**Device:** iPhone SE, 375px width, iPhone 12 notch
**Safari Version:** Latest

**Tests:**
- [ ] Status bar doesn't overlap content
- [ ] Home indicator doesn't interfere with bottom panel
- [ ] Keyboard doesn't hide critical controls
- [ ] Pinch zoom works (if enabled)
- [ ] Safe area insets respected (viewport-fit: cover)

**Expected CSS:**
```css
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
padding-bottom: env(safe-area-inset-bottom);
```

---

### Android Testing (480px width)

**Device:** Pixel 4a / Galaxy A51, 480px width
**Chrome Version:** Latest

**Tests:**
- [ ] Navigation bar doesn't hide content
- [ ] Buttons tappable with fat fingers
- [ ] Long-press doesn't trigger wrong elements
- [ ] System font scaling doesn't break layout

---

### Tablet Testing (iPad - 768px+)

**Device:** iPad Air / Mini, 768px width
**Safari Version:** Latest

**Tests:**
- [ ] Landscape orientation works (1024px)
- [ ] Split view (50% width) works
- [ ] Apple Pencil hover effects (if any) work
- [ ] Keyboard docking doesn't interfere

---

## Browser Compatibility Testing

### Browsers to Test

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### Features to Verify

| Feature | Support | Test |
|---------|---------|------|
| CSS Grid | ✓ | Layout displays correctly |
| Flexbox | ✓ | Buttons align properly |
| CSS Variables | ✓ | Colors theme correctly |
| Media Queries | ✓ | Breakpoints respond |
| Viewport meta | ✓ | Mobile scaling works |
| Safe area insets | ✓ | Notched devices work |

---

## Performance Testing

### Metrics to Check

**At Each Breakpoint:**
- [ ] Page load time < 3s
- [ ] Layout shift (CLS) < 0.1
- [ ] First contentful paint < 1.5s
- [ ] CSS file size: ~27KB (acceptable)

**Tools:**
- Chrome DevTools (Lighthouse)
- PageSpeed Insights
- WebPageTest

---

## Accessibility Compliance

### WCAG 2.1 Level AAA Checklist

- [ ] Touch targets ≥44x44px
- [ ] Font size minimum 16px (except UI components)
- [ ] Color contrast ≥7:1 for text
- [ ] Focus visible on all interactive elements
- [ ] No red-only status indicators
- [ ] Keyboard navigation possible
- [ ] No touch-only interactions
- [ ] Modals have proper focus management

### Tools to Use
- [ ] WAVE (WebAIM)
- [ ] Axe DevTools
- [ ] Lighthouse (Chrome)
- [ ] Manual keyboard testing

---

## Testing Summary Form

**Date:** ________________
**Tester:** ________________
**Tested Breakpoints:** 375px ☐ 480px ☐ 768px ☐ 1024px ☐ 1400px ☐ 1920px ☐

### Results

| Test | 375px | 480px | 768px | 1024px | 1400px | 1920px | Notes |
|------|-------|-------|-------|--------|--------|--------|-------|
| Touch targets | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Text readable | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| No H-scroll | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| No layout shift | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Buttons align | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Modal fit | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Header layout | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Control panel | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Keyboard nav | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Overall | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

**Issues Found:**
1. ___________________________
2. ___________________________
3. ___________________________

**Pass/Fail:** ☐ PASS ☐ FAIL ☐ CONDITIONAL

**Signature:** ________________ **Date:** ________________

---

## Quick Debug Commands

**Chrome DevTools Console:**

```javascript
// Check button sizes at 375px
document.querySelectorAll('button').forEach(btn => {
    const rect = btn.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
        console.warn(`FAIL: ${btn.className}`, rect.width, rect.height);
    }
});

// Check for horizontal overflow
if (document.documentElement.scrollWidth > window.innerWidth) {
    console.error('Horizontal scroll detected!');
}

// Check all links are keyboard accessible
document.querySelectorAll('a, button').forEach(el => {
    if (!el.tabIndex && el.tabIndex !== 0) {
        console.warn('Not keyboard accessible:', el);
    }
});
```

---

## Common Issues & Solutions

### Issue: Buttons appear squashed at 375px
**Solution:** Check for missing `display: flex; align-items: center; justify-content: center;`

### Issue: Horizontal scroll appears on mobile
**Solution:** Check `width: 100%` elements have `box-sizing: border-box` and account for padding

### Issue: Modal doesn't fit on screen
**Solution:** Check `max-height: 90vh` is applied to `.modal-content`

### Issue: Buttons overlap at 375px
**Solution:** Check gap between buttons is minimum 0.5rem, not 0.3rem

### Issue: Header text wraps strangely
**Solution:** Check `flex-direction: column` on header at mobile, and widths are 100%

---

## Final Approval Checklist

Before marking responsive design complete:

- [ ] All breakpoints tested (375px, 480px, 768px, 1024px, 1400px, 1920px)
- [ ] No horizontal scrolling on any viewport
- [ ] All touch targets ≥44px (or fixed with CSS updates)
- [ ] Text readable without zoom
- [ ] No layout shifting
- [ ] Modals fit screen
- [ ] Floating panel accessible
- [ ] Keyboard navigation works
- [ ] Tested on actual mobile device
- [ ] No browser console errors
- [ ] CSS fixes applied and verified
- [ ] Testing documentation complete

**Approved For Deployment:** ☐ YES ☐ NO

**Approver:** ________________ **Date:** ________________

---

**Testing Guide Created:** February 26, 2026
**Last Updated:** February 26, 2026
**Next Review:** After CSS fixes applied and tested
