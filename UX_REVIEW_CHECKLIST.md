# Senior UX Review Framework
## After the Noise - Production-Level UX Standards

**Document Status**: Living standard for all UX decisions
**Review Level**: Production-ready (WCAG AA, scalable, sustainable)
**Audience**: Engineers, designers, product managers

---

## Core UX Philosophy

This checklist reflects senior-level UX thinking:
- **User-first, business-aware**: Every decision serves user goals within business constraints
- **Problem-driven**: Define what to solve before proposing solutions
- **Scalable systems**: Design components, not one-offs
- **Pragmatic excellence**: Ship high-quality, maintainable solutions
- **Accessibility as baseline**: Not a feature, but quality standard

---

## Pre-Review: Context & Clarity

**Before reviewing any UI change, establish context:**

### 1. What Problem Are We Solving?
- [ ] **Identify user goal**: What is the user trying to accomplish?
- [ ] **Current pain point**: What's broken or inefficient?
- [ ] **Business objective**: How does this align with product strategy?
- [ ] **Constraints**: Technical, time, resource limitations?
- [ ] **Success metric**: How do we know this worked?

**Example - Good**:
> "Users can't find their past recordings because the list has no filtering or search. This increases support load and reduces feature adoption. We're adding search to reduce cognitive load and increase rediscovery of past recordings."

**Example - Poor**:
> "Let's make the search box bigger."

### 2. Is This the Right Solution?
- [ ] Have we considered alternatives?
- [ ] Is this the simplest solution?
- [ ] Does it add unnecessary complexity?
- [ ] Can we solve this with existing patterns?
- [ ] What are we potentially breaking?

### 3. Edge Cases & Scalability
- [ ] What happens with 1 item? 1,000 items?
- [ ] What if user has no results?
- [ ] What if fields are very long?
- [ ] What if device is very small/large?
- [ ] What if user can't see colors / can't use mouse?

---

## Section 1: Information Architecture & Layout

### 1.1 Visual Hierarchy Review

**Principle**: Users should instantly understand what's important and what to do.

**Critical Questions**:
- [ ] **What is the primary action on this screen?** (Should be obvious)
- [ ] **Visual weight alignment**: Largest elements are most important? (Check: size, color, position, contrast)
- [ ] **Predictable scanning pattern**: Does layout guide eyes left-to-right, top-to-bottom?
- [ ] **No competing focal points**: Is there visual noise fighting for attention?

**Kanban Columns - Example**:
- ✅ Columns have equal visual weight (appropriate - equal importance)
- ✅ Headers are clear and scannable
- ✅ Primary action (recording) is prominent in first column
- ⚠️ Empty states should be visually lighter (not distracting)

**Audit Checklist**:
- [ ] Primary action is largest/most prominent
- [ ] Secondary actions are visually subordinate
- [ ] Background hierarchy: Content > Surface > Background
- [ ] No visual elements at same weight competing for attention
- [ ] Color used to emphasize importance, not distract

### 1.2 Grid & Spacing System Review

**Principle**: 8px grid system creates rhythm, predictability, and maintainability.

**Current Standard**: 8px base unit
- `--spacing-xs: 0.5rem` (8px) - tight spacing
- `--spacing-sm: 1rem` (16px) - standard spacing
- `--spacing-md: 1.5rem` (24px) - section spacing
- `--spacing-lg: 2rem` (32px) - large gaps
- `--spacing-xl: 2.5rem` (40px) - extra large
- `--spacing-xxl: 3rem` (48px) - max spacing

**Audit**:
- [ ] All spacing uses multiples of 8px (0.5rem units)
- [ ] No arbitrary pixel values (e.g., `11px`, `23px`)
- [ ] Spacing tells a story: proximity = relationship
- [ ] Related items close together, unrelated items further apart
- [ ] Mobile spacing ≥ 0.75rem between tap targets

**Layout Stability Review**:
- [ ] No jank when content loads
- [ ] Dynamic content doesn't cause layout shifts (CLS)
- [ ] Consistent spacing across states (loading, empty, populated)

### 1.3 Whitespace Intentionality Review

**Principle**: Whitespace reduces cognitive load and clarifies relationships.

- [ ] **Is whitespace intentional or accidental?** (Every gap should have purpose)
- [ ] **Breathing room around primary actions** (Buttons not cramped)
- [ ] **Section separation**: Is grouping clear? (Whitespace vs. borders)
- [ ] **Mobile whitespace**: Not too cramped, not too loose
- [ ] **No information overload**: Can user process this in < 3 seconds?

### 1.4 Scanability & Predictable Structure

**Principle**: Consistency reduces friction. Users learn patterns once, apply everywhere.

- [ ] **Consistent layout structure**: Header → Content → Actions (same in all sections)
- [ ] **Headings provide clear structure**: Can user skim headings and understand page?
- [ ] **Predictable element placement**: Buttons always bottom-right? Saves cognitive cycles
- [ ] **Repetition builds pattern**: Same component type always behaves the same way
- [ ] **Progressive disclosure**: Advanced options hidden until needed

---

## Section 2: Interaction Design & Patterns

### 2.1 Pattern Consistency Review

**Principle**: Established patterns work. Break them only for strong reasons.

**Current Patterns**:
- Theme switching: Click button → immediate theme change ✅
- Recording control: Click record → immediate feedback ✅
- Modal interactions: Esc closes, overlay click closes ✅
- Form submission: Enter key submits ✅

**Audit**:
- [ ] **Are we using established patterns?** (Don't invent when standards exist)
- [ ] **If breaking a pattern, is there clear justification?** (Document it)
- [ ] **Consistency within product**: Does same action behave same way everywhere?
- [ ] **Consistency with user expectations**: Does this match what users expect?

**Example - Good**:
> "We're using a standard icon + label button pattern. Users recognize it instantly."

**Example - Poor**:
> "We invented a new way to toggle settings that only exists in this one place."

### 2.2 Affordance & Feedback Review

**Principle**: Users should instantly know what's interactive and what happens when they interact.

- [ ] **Visual affordance**: Can user tell button is clickable? (Color, border, shape)
- [ ] **Immediate feedback**: < 100ms response (or indication that action is processing)
- [ ] **State clarity**: Button appearance clearly shows state (normal, hover, active, disabled)
- [ ] **Disabled state is obvious**: Not just opacity - use meaningful visual change
- [ ] **Focus indicator visible**: Keyboard users can see what will happen if they press Enter

**Button States - Comprehensive Review**:
```
NORMAL STATE:
- [ ] Color, border, type face all indicating "clickable"
- [ ] Cursor changes to pointer

HOVER STATE:
- [ ] Visual change (border color, background, subtle lift)
- [ ] Transition smooth (200ms)
- [ ] User understands this is interactive

ACTIVE/PRESSED STATE:
- [ ] Clear visual difference from normal
- [ ] Indicates: "This is selected/in use"
- [ ] Consistent across all button types

DISABLED STATE:
- [ ] Clearly not interactive (opacity 0.5, not just gray)
- [ ] Cursor: not-allowed
- [ ] Explanation on hover why disabled? (Nice-to-have)

FOCUS STATE (Keyboard):
- [ ] Visible focus ring (2px solid)
- [ ] Focus clearly visible even in light mode
- [ ] Contrast meets WCAG AA (3:1 minimum)
```

### 2.3 Progressive Disclosure & Complexity Review

**Principle**: Show only what's needed now. Hide complexity until required.

- [ ] **Simple path visible**: Basic flow doesn't require clicking into settings
- [ ] **Advanced options available but not intrusive**: For power users who need them
- [ ] **Layering**: Surface information → Details → Debug info
- [ ] **Cognitive load**: User never sees more than they can process

**Example - After the Noise**:
- ✅ Recording controls prominent (Record, Pause)
- ✅ Advanced: Mode (mic/screen), Language, Device selector (available but not overwhelming)
- ✅ Hidden: Theme, Control panel toggle (important but not every interaction)

### 2.4 User Effort Minimization Review

**Principle**: Every click, every keystroke costs. Minimize both.

- [ ] **Minimum steps to primary action**: Can user accomplish goal in ≤ 3 taps?
- [ ] **Smart defaults**: Pre-filled when sensible
- [ ] **Shortcuts available**: For power users (e.g., Enter to save)
- [ ] **Avoid unnecessary modals**: Direct inline edit preferable?
- [ ] **One-tap to undo**: If data loss possible

### 2.5 Error Prevention Before Error Handling

**Principle**: Prevent errors first. Handle gracefully when they occur.

**Prevention**:
- [ ] **Constraints**: Only accept valid input (e.g., file type validation before upload)
- [ ] **Confirmation**: Before destructive action (Delete recording)
- [ ] **Disable invalid actions**: Can't save without required fields
- [ ] **Smart defaults**: Usually-right choice pre-selected

**Handling (If Error Occurs)**:
- [ ] **Specific error message**: Not "Error" but "Recording must be ≥ 5 seconds"
- [ ] **Actionable**: User knows what to do to fix
- [ ] **Recovery path**: Easy way back to success
- [ ] **No blame**: "We couldn't save" not "You entered bad data"

### 2.6 Motion & Animation Review

**Principle**: Motion communicates meaning. Decoration wastes CPU and battery.

- [ ] **Every animation has purpose**: Communicates state change or draws attention
- [ ] **Duration ≤ 300ms**: Feels instant, not slow
- [ ] **Easing natural**: Ease-in-out for state changes
- [ ] **No flashing**: Doesn't cause accessibility issues
- [ ] **Respects prefers-reduced-motion**: Users with vestibular issues get static version

**Current Animations**:
- ✅ Theme transition: 200ms fade (communicates change)
- ✅ Loader animation: Loops, indicates processing
- ✅ Hover state: 200ms color shift (clear feedback)

**Audit**:
- [ ] Remove animations that don't communicate meaning
- [ ] Every animation ≤ 300ms (test: does it feel responsive?)
- [ ] Consistent easing across all animations

---

## Section 3: Visual System & Semantic Design

### 3.1 Color Palette Review

**Principle**: Limited palette (5-7 colors) + shades = coherent system. Too many colors = chaos.

**Current System**:
- **Primary**: #4A5568 (action, CTA)
- **Accent Red**: #E10600 (Signal theme, alerts)
- **Accent Blue**: #0047FF (Signal theme, secondary)
- **Semantic Green**: #6EEB83 (Success, positive)
- **Semantic Red**: #FF7A59 (Error, danger)
- **Semantic Yellow**: #FFC83D (Warning)
- **Neutral scale**: Background → Surface → Text (8-step scale)

**Audit**:
- [ ] **Limited palette**: ≤ 7 semantic colors (+ shades)
- [ ] **Intentional use**: Each color serves a purpose
- [ ] **No orphan colors**: Color doesn't appear once and disappear
- [ ] **Semantic clarity**: Green = success, Red = error, Yellow = warning
- [ ] **Never rely on color alone**: Add icon/text for meaning

### 3.2 Contrast & Accessibility Review

**Principle**: WCAG AA (4.5:1) is minimum. AAA (7:1) preferred for important info.

**Test Process**:
```
1. Use WebAIM Contrast Checker
2. Test: Foreground vs Background
3. For text: 14.5:1 = AAA, 4.5:1 = AA, < 4.5:1 = FAIL
4. For UI components: 3:1 minimum
```

**Areas to Test**:
- [ ] Body text on background (4.5:1 minimum, 7:1 preferred)
- [ ] Secondary text on background (4.5:1 minimum)
- [ ] Button text on button background (4.5:1 minimum)
- [ ] Links in text (4.5:1 minimum + underline or other indicator)
- [ ] Form labels on background (4.5:1 minimum)
- [ ] Error text on background (4.5:1 minimum)
- [ ] Disabled text (3:1 OK since not critical info)

**Themes to Test**:
- [ ] Default theme (light background, dark text)
- [ ] Dark theme (dark background, light text)
- [ ] Signal theme (red/blue accents)
- [ ] PrismPulse theme (purple/pink accents)

### 3.3 State Consistency Review

**Principle**: Same state should look the same everywhere. State behavior should be predictable.

**States to Define**:
- **Normal**: Default, interactive
- **Hover**: User can interact
- **Active/Selected**: Currently in use
- **Disabled**: Can't interact (why? Consider tooltip)
- **Focus**: Keyboard accessible
- **Error**: Invalid state
- **Loading**: Processing
- **Empty**: No data

**For Each State**:
- [ ] Is appearance consistent across all uses?
- [ ] Is behavior predictable?
- [ ] Is it accessible (contrast, indication)?

**Example - Button States**:
```
NORMAL: Border 1px, text color, cursor pointer
HOVER:  Border darker, background surface color
ACTIVE: Border primary color, slight background shift
DISABLED: Opacity 0.5, cursor not-allowed
FOCUS: Focus ring 2px solid
```

If button behaves differently in modals vs. header, that's a bug.

---

## Section 4: Typography

### 4.1 Type Scale Review

**Principle**: 2-3 font sizes maximum. Limited scale = coherence.

**Current Standard**:
- **Body**: 0.9rem - 0.95rem (14-16px) minimum
- **Small**: 0.85rem (13-14px) for secondary info
- **Large**: 1.2rem - 1.5rem for headings
- **XL**: 1.5rem+ for page titles

**Audit**:
- [ ] **Min body size 14px**: Readability (especially for 40+ audience)
- [ ] **Line height 1.4-1.6**: Not cramped, not loose
- [ ] **Letter spacing**: Normal (don't artificially increase unless special reason)
- [ ] **Max line width 80 chars**: Readability (72-80 chars optimal)

### 4.2 Hierarchy & Emphasis Review

**Principle**: Hierarchy communicates importance. Visual emphasis should match content importance.

- [ ] **Headings establish structure**: Page title > Section > Subsection
- [ ] **Weight variation**: Bold for emphasis, regular for body (don't use italics for readability)
- [ ] **Size variation**: Larger = more important (not arbitrary)
- [ ] **All caps rare**: Only for labels (like buttons)
- [ ] **Consistency**: Same heading level always same size/weight

### 4.3 Readability vs. Brand Review

**Principle**: Clarity first. Brand expression second.

- [ ] **Is every text readable?** (Squint test: can you read from 3 feet away?)
- [ ] **Contrast sufficient for accessibility?** (WCAG AA minimum)
- [ ] **Font choices support function**: Serif for long reads, sans-serif for UI
- [ ] **No decorative type**: UI should prioritize clarity over aesthetics
- [ ] **Monospace for code/data**: Makes information density clear

---

## Section 5: Accessibility (WCAG 2.1 AA - Baseline Quality)

### 5.1 Keyboard Navigation Review

**Principle**: Every interaction possible without mouse. Tab order logical and predictable.

**Test Process**:
1. Close trackpad, use keyboard only
2. Tab through entire interface
3. Verify logical flow (top-left → top-right → down)

**Audit**:
- [ ] **All interactive elements focusable**: Buttons, links, form fields
- [ ] **Focus visible**: Can see what will happen if you press Enter
- [ ] **Tab order logical**: Left-to-right, top-to-bottom
- [ ] **No keyboard traps**: Can always tab out (e.g., modal has close button with Escape)
- [ ] **Shortcuts documented**: If available (e.g., Ctrl+S to save)
- [ ] **Focus indicator prominent**: 2px solid, high contrast

**Current Implementation**:
- ✅ All buttons focusable
- ✅ Escape closes modals
- ✅ Enter submits forms
- ⚠️ Tab order needs verification in complex flows

### 5.2 Screen Reader Testing

**Principle**: Semantic HTML makes content understandable without visuals.

**Test Tools**:
- Mac: VoiceOver (Cmd+F5)
- Windows: NVDA (free), JAWS (paid)
- Browser: Chrome Vox

**Audit**:
- [ ] **Buttons announced as buttons**: Not just text
- [ ] **Form fields have labels**: Screen reader announces "Email input" not just "input"
- [ ] **Page structure**: Headings, sections, landmarks announced
- [ ] **Images have alt text**: If meaningful (ignore decorative)
- [ ] **Status changes announced**: "Saved", "Error", etc.
- [ ] **Modal role correct**: Screen reader knows it's a dialog
- [ ] **Skip links present**: Jump to main content

**Specific Checks for This App**:
- [ ] "Recording" header announced as heading
- [ ] Recording button announced: "Record, button"
- [ ] Theme button announced: "Default theme, button"
- [ ] Status updates announced: "Transcribing..."
- [ ] Empty states read as empty

### 5.3 Touch Target Size Review

**Principle**: 44x44px minimum. 48x48px preferred (fits finger). Icons/text centered.

**Every Interactive Element**:
- [ ] Min-height: 44px (minimum), 48px (preferred)
- [ ] Min-width: 44px (minimum), 48px (preferred)
- [ ] Adequate spacing: ≥ 8px between touch targets

**Current Status**:
- ✅ Record button: 48x48px
- ✅ Theme buttons: 44x44px
- ✅ Mode buttons: 48x48px
- ✅ Language buttons: 48x48px
- ⚠️ Verify gaps: 8px minimum between targets

**Mobile Testing**:
- [ ] Tap with thumb: Not stretched reaching across screen
- [ ] Not too small to accidentally hit wrong button
- [ ] Adequate spacing: Can't accidentally tap adjacent buttons

### 5.4 Color Independence Review

**Principle**: Information must be conveyed with more than color alone.

- [ ] **Status not color-only**: Error = red text + icon, not just red
- [ ] **Links not color-only**: Underlined or icon indicator (not just blue)
- [ ] **Charts**: Use color + pattern + label
- [ ] **Form validation**: Red border + text message (not just red)

### 5.5 Reduced Motion Respect

**Principle**: Vestibular disorders = motion sickness from animations. Support `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
}
```

- [ ] **Animations disable if user prefers**: System setting respected
- [ ] **Immediate feedback still works**: Buttons still respond, just no animation
- [ ] **No auto-playing video/animation**: Especially parallax

---

## Section 6: Forms & Inputs

### 6.1 Field Minimization Review

**Principle**: Every field costs. Only ask for essential information.

- [ ] **Count fields**: What's truly required vs. nice-to-have?
- [ ] **Can we pre-fill?**: Use existing data, don't re-ask
- [ ] **Progressive steps?**: Long form better as wizard?
- [ ] **Bulk operations?**: Can user input multiple records at once?

### 6.2 Label & Input Review

**Principle**: Clear labels above inputs. Floating labels hard to read on mobile.

- [ ] **Label above input** (not inside, not floating)
- [ ] **Label associated to input**: `<label for="inputId">`
- [ ] **Visible always**: Not hidden on focus
- [ ] **Required indicator clear**: * or "required" label
- [ ] **Placeholder NOT label**: Placeholder disappears, confuses user

### 6.3 Input Validation & Error Review

**Principle**: Real-time validation is helpful. Format requirements should be clear upfront.

- [ ] **Format requirements visible**: "MM/DD/YYYY" shown before typing
- [ ] **Real-time feedback for long fields**: Typing a password shows strength
- [ ] **Submit-time validation obvious**: Red border + error message
- [ ] **Error messages specific**: Not "Invalid input" but "Password must be ≥ 8 characters"
- [ ] **Error message associated**: Next to field or in error summary

### 6.4 Smart Defaults & Autofill

**Principle**: Pre-select the most likely option. Respect browser autofill.

- [ ] **Default selected**: Most common choice pre-selected
- [ ] **Autofill supported**: `autocomplete="email"`, etc. respected
- [ ] **No pseudo-defaults**: Don't select something as if it's intelligent
- [ ] **User can override**: Default is starting point, not requirement

### 6.5 Multi-Column Layout Avoidance

**Principle**: Single column on mobile saves cognitive load. Columns require complex responsive logic.

- [ ] **Mobile-first layout**: Single column by default
- [ ] **Desktop enhancement**: Multi-column only if really beneficial
- [ ] **Consistent across sizes**: Simpler responsive CSS
- [ ] **Readability maintained**: No text wrapping to 30px width

---

## Section 7: Design Systems & Component Thinking

### 7.1 Component-Based Architecture Review

**Principle**: Components are building blocks. Define once, use everywhere.

**Current Components**:
- `.theme-btn` - Theme switcher
- `.mode-btn` - Recording mode
- `.language-btn` - Language selector
- `.device-select` - Audio device (select element)
- `.control-toggle-btn` - Show/hide panel
- `.record-button` / `.pause-button` - Recording control
- `.save-button` / `.clear-button` - Action buttons
- `.modal-btn` - Modal actions

**Audit**:
- [ ] **Is each component reusable?** (Appears in multiple places)
- [ ] **All states defined**: Normal, hover, active, disabled, focus, error, loading
- [ ] **Theming consistent**: Same component same appearance across themes
- [ ] **No variants**: One component doesn't have 5 different looks
- [ ] **Edge cases handled**: What if label is very long? Very short?

### 7.2 Design Token System Review

**Principle**: Tokens (variables) ensure consistency and enable theming.

**Current Tokens**:
- Colors: `--color-primary`, `--color-surface`, `--color-divider`, etc.
- Spacing: `--spacing-xs` through `--spacing-xxl`
- Border radius: `--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`
- Typography: Font sizes, weights (via font-family)

**Audit**:
- [ ] **No hardcoded values**: All colors, spacing, radii use tokens
- [ ] **Token naming semantic**: Name describes purpose, not value (`--spacing-sm` not `--margin-16px`)
- [ ] **Consistent usage**: Same semantic spacing everywhere
- [ ] **Theming complete**: All tokens redefined per theme

### 7.3 Edge Cases & Empty States Review

**Principle**: Edge cases reveal design gaps. Plan for them.

**Edge Cases to Plan**:
- [ ] **Empty state**: What if no recordings? Show helpful message, not blank
- [ ] **One item**: Does layout break with single element?
- [ ] **Many items**: Does list feel overwhelming? Consider pagination/virtualization
- [ ] **Very long text**: What if user enters 500-character title? Truncate? Wrap?
- [ ] **No data**: Form with zero results shown gracefully?
- [ ] **Slow connection**: Loading state visible? Skeleton screens?
- [ ] **Device without camera**: Can't record video? Graceful degradation?
- [ ] **Low vision**: 20% zoom - can user still interact?
- [ ] **Low battery**: Animations disabled, critical info clear?

**Current Empty States**:
- ✅ Recording section: Unicorn illustration + text
- ✅ Analysis section: Placeholder text
- ⚠️ Meetings list: Verify empty state styling

---

## Section 8: Responsive Design

### 8.1 Mobile-First Principle

**Principle**: Start with mobile (smallest screen, most constraint). Enhance for larger screens.

**Process**:
1. Design mobile layout (< 480px)
2. Define breakpoints based on content (480, 768, 1024, 1200, 1400)
3. Enhance at each breakpoint

**Audit**:
- [ ] **Base styles work on smallest screen**: No media queries required for core functionality
- [ ] **Media queries additive**: Larger screens get enhancements, not redesigns
- [ ] **Touch-first interactions**: Hover effects layer on top (not required)
- [ ] **Readable at smallest**: No illegible text, buttons too small

### 8.2 Breakpoint Testing

**Test at Each**:
- Mobile: 375px (iPhone SE), 390px (iPhone 14)
- Tablet: 600px, 768px (iPad)
- Desktop: 1024px, 1280px, 1920px+

**For Each Size, Test**:
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px
- [ ] Readability maintained
- [ ] Hierarchy still clear
- [ ] No broken layouts

### 8.3 Hover Dependency Review

**Principle**: Hover doesn't work on touch. Don't hide critical info behind hover.

- [ ] **Hover is enhancement**: Nice-to-have, not required
- [ ] **Touch targets large enough**: Don't need hover for context
- [ ] **Critical info visible without hover**: Descriptions, hints visible upfront
- [ ] **Tap reveals same info as hover**: Consistency

**After the Noise Example**:
- ✅ Recording buttons don't hide critical info behind hover
- ✅ Hover effects are visual feedback, not required

### 8.4 Stable Layouts Across Breakpoints

**Principle**: Content shouldn't jump around. Cumulative Layout Shift (CLS) metric.

- [ ] **No layout shift on load**: Images have dimensions, avoid reflow
- [ ] **Consistent spacing**: Gap doesn't change unexpectedly at breakpoint
- [ ] **Elements don't reorder**: Same order across sizes (unless intentional progressive disclosure)
- [ ] **Stable modals**: Don't suddenly shift when content loads

---

## Section 9: Production-Level Quality Gates

### 9.1 Risk Identification & Mitigation

**Before shipping, identify risks:**

- [ ] **Performance risk**: Does heavy animation harm battery? Does large image load slowly?
- [ ] **Accessibility risk**: Could any user group be locked out?
- [ ] **Cross-browser risk**: Does this work in Safari, Firefox, Edge?
- [ ] **Scalability risk**: Works for 10 items, breaks at 1000?
- [ ] **Maintenance risk**: Is code so complex future engineers can't change it?
- [ ] **Data risk**: Could user lose data? Undo path available?

**Mitigation Strategy**:
- Document risks discovered
- Plan fixes or accept tradeoff (with approval)
- Add regression tests to prevent re-emergence

### 9.2 Challenge Unclear Requirements

**Senior UX duty**: Push back on vague specs.

**Red Flags**:
- "Make it pop"
- "Make it more modern"
- "Users want it"
- "Competitor has X"

**Response**:
- What problem are we solving?
- Who is the user? What's their goal?
- How do we measure success?
- What constraints do we have?

### 9.3 Scope Clarification

**Scope creep kills projects. Be explicit:**

- [ ] **What's in scope?** (This feature, this browser)
- [ ] **What's out of scope?** (Progressive web app, internationalization)
- [ ] **Dependencies?** (Requires API change, needs data migration?)
- [ ] **Success criteria?** (Specific metrics, not "looks good")

### 9.4 Decision Rationale Documentation

**For each UX decision, document:**

**Template**:
```
DECISION: [What we decided]

PROBLEM: [What user pain were we solving?]

OPTIONS CONSIDERED:
1. [Option A] - Pros: X, Cons: Y
2. [Option B] - Pros: X, Cons: Y
3. [Option C] - Pros: X, Cons: Y

CHOSEN: [Option C]

RATIONALE: [Why this over others? Data? Constraints?]

RISK: [What could go wrong?]

VALIDATION: [How will we know it worked?]
```

This creates institutional knowledge.

### 9.5 Avoid Over-Engineering

**Principle**: Simplest solution that solves the problem wins.

**Questions**:
- [ ] **Is this needed now?** (Don't build for hypothetical future)
- [ ] **Will we actually use this?** (Track it, don't assume)
- [ ] **Is maintenance cost worth benefit?** (Complex code = future bugs)
- [ ] **Can we ship simpler version first?** (MVP then iterate)

**Example**:
- ❌ Building infinite scroll + virtualization before knowing if users scroll past page 2
- ✅ Ship pagination, measure usage, optimize if needed

### 9.6 User Value vs. Business Impact Balance

**Senior thinking: serve both, but be explicit about tradeoffs.**

**Example - Theme Selector Location**:
- **User value**: Themes improve accessibility (high contrast for low vision users)
- **Business value**: Themes improve engagement, time on app
- **Decision**: Place prominently in header (both benefit)

**Example - Complex Filtering**:
- **User value**: Power users want sophisticated filters
- **Business value**: Encourages deeper product engagement
- **Decision**: Hide advanced filters, surface smart defaults (serve both)

---

## Section 10: Pre-Merge Checklist

**All of the above distilled into quick checks:**

### Must Pass:
- [ ] **User goal clear**: Can describe what user is trying to accomplish
- [ ] **Problem statement**: What pain are we solving?
- [ ] **No cognitive overload**: Doesn't throw too much at user
- [ ] **Pattern consistency**: Uses established patterns unless justified
- [ ] **Accessibility baseline met**: WCAG AA, keyboard nav, touch targets, screen reader
- [ ] **Mobile-first tested**: Works at 375px
- [ ] **All states defined**: Normal, hover, active, disabled, focus, error
- [ ] **Contrast verified**: WCAG AA minimum
- [ ] **No layout instability**: CLS acceptable
- [ ] **Responsive breakpoints tested**: 375, 768, 1024, 1400
- [ ] **Empty states handled**: What if no data?
- [ ] **All 4 themes tested**: Default, Signal, Dark, Prism
- [ ] **128 tests passing**: All regression tests pass

### Nice to Have:
- [ ] **Decision rationale documented**
- [ ] **Edge cases identified**
- [ ] **Accessibility enhanced** (AAA beyond AA)
- [ ] **Performance profiled** (no janky animations)
- [ ] **Cross-browser tested** (Safari, Firefox, Edge)

---

## Sign-Off Template

```
REVIEW DATE: _______________
REVIEWER: _______________

MUST PASS ITEMS: ___ / 12 ✅

ISSUES FOUND:
- [ ] Critical (blocks merge)
- [ ] Major (should fix before merge)
- [ ] Minor (nice to have)
- [ ] None

DECISION:
☐ APPROVED - Ready for production
☐ NEEDS REVISION - Fix issues then re-review
☐ BLOCKED - Wait for dependency

RATIONALE:
[Why did we approve/block? What was the key decision?]

RISKS ACCEPTED:
[Any known limitations or risks we're shipping with?]
```

---

## Resources & References

### WCAG 2.1 Guidelines:
- https://www.w3.org/WAI/WCAG21/quickref/
- https://www.w3.org/WAI/WCAG21/Understanding/

### Design Systems:
- https://www.designsystems.com/
- https://design.google/library/design-systems/
- https://www.designsystemsforfigma.com/

### Accessibility:
- https://www.a11y-101.com/
- https://www.nngroup.com/articles/accessibility/
- https://inclusive-components.design/

### Performance:
- https://web.dev/performance/
- https://www.nngroup.com/articles/slow-web-pages/

### Usability:
- https://www.nngroup.com/ (Nielsen Norman Group)
- https://www.smashingmagazine.com/
- Don Norman - "The Design of Everyday Things"

---

## How to Use This Framework

### **Workflow**:
1. **Before starting**: Read "Pre-Review: Context & Clarity"
2. **Design phase**: Reference relevant sections (Typography? Forms?)
3. **Before merge**: Go through "Section 10: Pre-Merge Checklist"
4. **Post-merge**: Document decision rationale for future reference

### **For Teams**:
- Share this with designers and engineers
- Use sections as starting point for design reviews
- Adapt to your specific product
- Update as you learn what works

### **For Questions**:
- "How accessible does this need to be?" → Section 5
- "Should we use this new font?" → Section 4
- "Is this button big enough?" → Section 2.2 & 5.3
- "Should we ship this?" → Section 9

---

**Last Updated**: February 26, 2026
**Maintainer**: UX Team
**Version**: 1.0 - Production Standard

