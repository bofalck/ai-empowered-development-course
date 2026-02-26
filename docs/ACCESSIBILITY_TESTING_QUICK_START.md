# Phase 1 Accessibility Testing - Quick Start Guide

**Welcome!** This guide will help you get started with Phase 1 accessibility testing in minutes.

---

## What is Phase 1 Accessibility Testing?

Phase 1 focuses on two critical areas:
1. **Contrast Ratios** - Ensuring text is readable for people with low vision
2. **Screen Readers** - Ensuring the app works with assistive technology

No prior QA experience needed. We'll guide you through every step.

---

## 5-Minute Setup

### What You'll Need

**For Contrast Ratio Testing:**
- [ ] Web browser (Chrome, Firefox, Safari)
- [ ] 10 minutes
- [ ] Computer with internet access

**For Screen Reader Testing (Windows):**
- [ ] Windows 10 or 11 computer
- [ ] Administrator access
- [ ] 30 minutes to 1 hour
- [ ] Headphones (optional but recommended)

**For Screen Reader Testing (Mac):**
- [ ] Mac computer
- [ ] Built-in VoiceOver (Cmd + F5 to enable)
- [ ] 30 minutes to 1 hour

**For Mobile Testing:**
- [ ] iPhone/iPad (for VoiceOver) OR
- [ ] Android phone/tablet (for TalkBack)
- [ ] 30 minutes to 1 hour

### Downloads Needed

Only if you want to test on Windows:

1. **NVDA Screen Reader** (free)
   - Go to: https://www.nvaccess.org/download/
   - Click: "Download Version X.XX.X"
   - Install: Follow prompts, restart computer
   - Time: 10 minutes

That's it! No other downloads needed.

---

## Where to Start

### Option 1: I have 15 minutes
**Test contrast ratios on one theme**

1. Read: **Section 1 of TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md**
2. Use: **ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md** - Contrast section
3. Time: 15 minutes

### Option 2: I have 1 hour
**Test contrast ratios on all themes**

1. Read: **Section 1 of TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md**
2. Use: **ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md** - All contrast sections
3. Time: 30-45 minutes

### Option 3: I have 2+ hours
**Full screen reader testing (Windows)**

1. Download NVDA from https://www.nvaccess.org/
2. Read: **PART 2 of TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md**
3. Follow: **TESTING: NVDA (Windows)** section step-by-step
4. Use: **ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md** - NVDA section
5. Document: Copy template from **ACCESSIBILITY_TESTING_TEMPLATES.md**
6. Time: 1.5-2 hours

### Option 4: I have 2+ hours
**Full screen reader testing (Mac)**

1. Enable VoiceOver (Cmd + F5)
2. Read: **PART 2 of TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md**
3. Follow: **TESTING: VoiceOver (Mac)** section step-by-step
4. Use: **ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md** - VoiceOver (Mac) section
5. Document: Copy template from **ACCESSIBILITY_TESTING_TEMPLATES.md**
6. Time: 1.5-2 hours

---

## Your First Test (Contrast Ratio - 15 minutes)

### Step 1: Open WebAIM (2 minutes)
1. Go to: https://webaim.org/resources/contrastchecker/
2. Keep this tab open

### Step 2: Open the App (1 minute)
1. Open new browser tab
2. Go to: Your application URL

### Step 3: Test Default Theme (7 minutes)

**Test 1: Main Text**
1. In app, look at any paragraph text
2. Right-click → "Inspect" or press F12
3. Find `color:` property (should be dark)
4. Click color swatch - note the hex code
5. Go to WebAIM tab
6. Paste hex in "Foreground color" field
7. Look at background color in app
8. In WebAIM, paste background hex in "Background color"
9. Read the contrast ratio shown
10. Check if ratio is ≥ 4.5:1
11. **Result:** Write down PASS or FAIL

**Test 2: Button**
1. Find any button in the app (Save, Record, etc.)
2. Right-click → Inspect
3. Find `color:` (text color) and `background-color:`
4. Repeat WebAIM steps with button colors
5. Check if ratio ≥ 4.5:1
6. **Result:** Write down PASS or FAIL

### Step 4: Test Other Themes (5 minutes)
1. Click theme buttons at top (☀️ 📡 🌙 🦄)
2. Repeat Tests 1-2 for each theme
3. Document results

### Step 5: Summary
Write down:
- [ ] Default theme: Main text PASS/FAIL, Button PASS/FAIL
- [ ] Signal theme: Main text PASS/FAIL, Button PASS/FAIL
- [ ] Dark theme: Main text PASS/FAIL, Button PASS/FAIL
- [ ] PrismPulse theme: Main text PASS/FAIL, Button PASS/FAIL

**That's one complete contrast ratio test!**

---

## Your First Screen Reader Test (NVDA - Windows)

### Prerequisites
- [ ] NVDA installed and working
- [ ] Application open in browser
- [ ] 5 minutes to read this, 30-45 minutes to test

### Step 1: Start NVDA (1 minute)
1. Press: `Ctrl + Alt + Down Arrow`
2. You'll hear: A startup sound
3. NVDA begins reading the page

### Step 2: Listen for Application Name (2 minutes)
1. NVDA is reading the page aloud
2. Press: `Ctrl` (to stop reading temporarily)
3. You should have heard: "After the Noise, web page"
4. Press: `Ctrl + Alt + Down Arrow` again to continue reading
5. **Expected:** "After the Noise" announced as heading

**Result:** PASS / FAIL

### Step 3: Test Buttons (3 minutes)
1. Press: `B` (jump to next button)
2. Listen for: Button name and purpose
3. You should hear: "Theme buttons" or similar
4. **Expected:** Each button announced clearly with name

**Result:** PASS / FAIL

### Step 4: Test Form Fields (5 minutes)
1. Press: `F` (jump to form field)
2. Listen for: "Email address, edit text" or similar
3. **Expected:** Field name announced with type
4. Press: `Down arrow` to hear more context
5. Go to next field: Press `F` again
6. **Expected:** "Password, protected"

**Result:** PASS / FAIL

### Step 5: Test Recording (10 minutes)
1. Find Record button (press `B` to jump through buttons)
2. Listen for: "Record, button"
3. Click with mouse or press: `Enter`
4. Listen for: "Recording started" or button state change
5. Wait 3 seconds
6. Find Pause button (should now be enabled)
7. Click it
8. Listen for: "Paused" or similar
9. Find Record again and click to stop
10. Listen for: "Recording stopped" or confirmation

**Expected:**
- Record button works
- Pause button appears
- Stop works
- Status is conveyed

**Result:** PASS / FAIL

### Step 6: Log Results

Use **ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md** - NVDA section:
1. Fill in date and tester name
2. Mark each test as PASS or FAIL
3. Note any issues

**You've completed one screen reader test!**

---

## Document Your Results

### After Each Test Session

1. **Take the Quick Checklist**
   - File: `ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md`
   - Fill in: Date, tester name, test results

2. **Optional: Detailed Report**
   - File: `ACCESSIBILITY_TESTING_TEMPLATES.md`
   - Choose template for your test type
   - Copy and fill in with details

3. **Create GitHub Issues for Failures**
   - File: `ACCESSIBILITY_TESTING_TEMPLATES.md`
   - Use template: "GitHub Issue for Accessibility Problem"
   - Fill in problem details
   - Post to project repository

### Example: Contrast Ratio Test Documentation

```
Date: 2026-02-26
Tester: John Smith

Default Theme:
- Main text: #2B2A28 on #F7F6F3 = 12.8:1 ✓ PASS
- Button: #F7F6F3 on #4A5568 = 8.5:1 ✓ PASS

Dark Theme:
- Main text: #F2F0EB on #161513 = 13.1:1 ✓ PASS
- Button: #F7F6F3 on #8B8680 = 3.2:1 ✗ FAIL

Issues Found: 1
- Dark theme button contrast too low
- Create GitHub issue with details
```

---

## Common Questions

### Q: What if I can't test all themes?
**A:** Test what you can! Every test helps. Even testing one theme is valuable.

### Q: What if I find an error?
**A:** Perfect! That's why we test. Document it:
1. What theme / feature?
2. What's wrong?
3. What did you expect?
4. Screenshot if possible

Then create a GitHub issue using the template in ACCESSIBILITY_TESTING_TEMPLATES.md

### Q: How long should testing take?
**A:**
- Contrast (4 themes): 30-45 minutes
- Screen reader (1 tool): 45-90 minutes
- Full Phase 1: 3-5 hours for one person

### Q: Do I need to test all screen readers?
**A:** No, but more is better:
- Minimum: 1 screen reader (NVDA or VoiceOver)
- Good: 2 screen readers
- Best: Test with NVDA, VoiceOver, and one mobile

### Q: What if something doesn't work as expected?
**A:** This is valuable information! Document it:
1. Exactly what did you do?
2. What happened?
3. What should have happened?
4. Screenshot (if possible)
5. Device/browser/OS used

### Q: Can I test on my phone?
**A:** Absolutely!
- iPhone/iPad: VoiceOver is built-in (Settings > Accessibility > VoiceOver > ON)
- Android: TalkBack is built-in (Settings > Accessibility > TalkBack > ON)
- Follow guide in TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md

---

## File Guide

| File | Purpose | When to Use |
|------|---------|------------|
| **TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md** | Complete guide with all details | Start here for full information |
| **ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md** | Printable checklist for testing | Use while testing (print it!) |
| **ACCESSIBILITY_TESTING_TEMPLATES.md** | Report and issue templates | After testing to document results |
| **This file** | Quick start guide | First thing you read |

---

## Testing Workflow

```
START
  ↓
Choose a test type (contrast or screen reader)
  ↓
Read relevant section in TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md
  ↓
Set up tools (WebAIM, NVDA, etc.)
  ↓
Follow step-by-step instructions
  ↓
Use ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md to track results
  ↓
Found a failure? → Create GitHub issue using template
  ↓
Document results in template
  ↓
Share with team
  ↓
END
```

---

## Help and Resources

### If You Get Stuck

1. **Check TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md** - Detailed step-by-step guide
2. **Check ACCESSIBILITY_TESTING_TEMPLATES.md** - Examples of how to document
3. **Check WebAIM resources:**
   - Contrast Checker: https://webaim.org/resources/contrastchecker/
   - WCAG Guide: https://webaim.org/articles/
4. **Check tool documentation:**
   - NVDA: https://www.nvaccess.org/
   - VoiceOver: https://www.apple.com/accessibility/voiceover/
   - TalkBack: https://support.google.com/accessibility/android/answer/6283677

### If You Have Questions

1. Ask team lead
2. Check WCAG standards: https://www.w3.org/WAI/WCAG21/quickref/
3. Refer to testing templates for examples

---

## Success Checklist

After you complete your first test, check:

- [ ] I opened the application
- [ ] I used one testing method (contrast or screen reader)
- [ ] I followed the step-by-step instructions
- [ ] I documented my results
- [ ] I identified any failures
- [ ] I created GitHub issues for failures
- [ ] I shared my results with the team

**Congratulations! You've completed Phase 1 accessibility testing!**

---

## What's Next?

After testing:
1. Team reviews all test results
2. Developers fix any issues found
3. Test again to verify fixes
4. Phase 1 complete → Move to Phase 2
5. Phase 2 covers: Advanced keyboard testing, focus management, advanced ARIA

---

## Quick Reference Card (Print This!)

```
╔════════════════════════════════════════════════════════════╗
║         PHASE 1 ACCESSIBILITY TESTING QUICK REFERENCE      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ CONTRAST RATIO TESTING                                     ║
║ • Go to: https://webaim.org/resources/contrastchecker/   ║
║ • Get text color: Right-click → Inspect                    ║
║ • Get background color: Right-click → Inspect              ║
║ • Compare result to 4.5:1 (or 3:1 for large text)         ║
║                                                            ║
║ SCREEN READER TESTING (WINDOWS)                            ║
║ • Install NVDA: https://www.nvaccess.org/download/         ║
║ • Start NVDA: Ctrl + Alt + Down Arrow                      ║
║ • Jump to buttons: B key                                   ║
║ • Jump to form fields: F key                               ║
║ • Jump to headings: H key                                  ║
║ • Stop reading: Ctrl key                                   ║
║                                                            ║
║ SCREEN READER TESTING (MAC)                                ║
║ • Enable VoiceOver: Cmd + F5                               ║
║ • Navigate: VO + Right/Left Arrow (VO = Ctrl + Option)    ║
║ • Activate: VO + Space                                     ║
║ • Jump to buttons: VO + B                                  ║
║ • Jump to headings: VO + H                                 ║
║                                                            ║
║ DOCUMENT RESULTS                                           ║
║ • Use: ACCESSIBILITY_TESTING_QUICK_CHECKLIST.md           ║
║ • Fill in: Date, tester, test results                      ║
║ • Issues: Create GitHub issues using template             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## You're Ready!

Pick a testing option above and start. Remember:
- Follow the step-by-step guides
- Document everything
- Ask if you're stuck
- Every test helps make the app better for everyone

**Happy testing!**

For detailed procedures, see: **TESTING_PROCEDURES_PHASE1_ACCESSIBILITY.md**

---

**Document Version:** 1.0
**Last Updated:** 2026-02-26
**Status:** Ready to Use
