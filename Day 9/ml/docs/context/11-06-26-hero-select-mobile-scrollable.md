# Hero Select Overlay Mobile Responsiveness & Scrollable Button

**Date:** 11-06-2026  
**Type:** Feature / Bug Fix / UX Improvement  
**Status:** Complete  

---

## 1. Summary & Motivation

On mobile devices and narrow/short viewports, the "Choose Your Hero" selection screen (`#heroSelectOverlay`) could not be scrolled down to reach the bottom "Start Match as [Hero]" button (`#startBtn`). This was caused by three critical CSS factors:
1. `.hero-select-overlay` was constrained inside `.game-wrapper` with `aspect-ratio: 16/9`, causing it to collapse to a ~219px tall slit on portrait mobile phones.
2. Flexbox alignment was set to `justify-content: center` with no `overflow-y: auto`, triggering the infamous CSS flexbox overflow clipping bug where content outside the bounds cannot be scrolled.
3. On touchscreens, the bottom button was pushed below the bezel/fold without scroll clearance or touch momentum scrolling.

This update makes the Hero Selection screen fully responsive, scrollable on mobile touch devices, expands it to full screen on mobile/portrait devices, and ensures the bottom Start Match button is always accessible, scrollable, and tap-friendly.

---

## 2. Files Modified / Created

* [`Day 9/ml/css/style.css`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/css/style.css)
  - Updated base `.hero-select-overlay` to `justify-content: flex-start; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; touch-action: pan-y;`.
  - Added thin custom scrollbar styles for `.hero-select-overlay`.
  - Added `margin: auto 0;` to `.select-container` for natural vertical centering on desktop while allowing top-to-bottom scrolling when content exceeds viewport height.
  - Added active feedback and touch-action optimization for `.hero-card` and `.start-button`.
  - Under `@media (max-width: 768px)` and `@media (max-width: 480px)`, switched `.hero-select-overlay` to `position: fixed; inset: 0; width: 100vw; height: 100dvh;` with safe-area bottom padding (`env(safe-area-inset-bottom)`).
  - Added `@media (orientation: portrait)` rule for full-screen hero selection on all portrait devices.
  - Added `@media (orientation: landscape) and (max-height: 600px)` rule with a 5-column compact layout that fits cleanly within landscape phone heights and scrolls smoothly if needed.
* [`Day 9/ml/js/main.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/main.js)
  - Added smooth scroll assistance `startBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` when a hero is selected on mobile/small screens.
  - Reset `selectOverlay.scrollTop = 0` when opening the hero selector via the in-game "Change Hero" button.
* `Day 9/ml/docs/context/11-06-26-hero-select-mobile-scrollable.md`
  - Created this context document per `docs/RULES.md`.

---

## 3. Technical Implementation Details

### 3.1 Resolving Flexbox Scroll Clipping
When a flex container uses `justify-content: center` and its children overflow, browsers align the center of the content to the center of the box, pushing the top content into negative scroll coordinates which cannot be scrolled back into view.
The solution applied:
```css
.hero-select-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}

.select-container {
  margin: auto 0; /* Centers vertically if space permits; scrolls from y=0 when overflowing */
}
```

### 3.2 Full-Screen Escape on Mobile Portrait Viewports
Because `.game-wrapper` has `aspect-ratio: 16/9`, a portrait smartphone (e.g. 390px x 844px) letterboxes the game wrapper down to a 219px height. Confining the hero overlay to `.game-wrapper` with `position: absolute` created an unplayable, cramped experience.
Using `position: fixed; inset: 0; width: 100vw; height: 100dvh; z-index: 200;` on mobile and portrait queries gives the hero selector access to the full mobile display.

### 3.3 Safe-Area Inset & Tap Targets
- Added `padding-bottom: calc(32px + env(safe-area-inset-bottom, 16px))` on mobile so the Start button is never obscured by the iPhone/Android home indicator bar.
- Configured minimum tap targets of 44px–48px for `#startBtn` with `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent`.

---

## 4. Verification & Testing

1. **Syntax Check:** Passed `node --check Day\ 9/ml/js/*.js`.
2. **Phase 11 Progression & AI Dive Tests:** Passed `test_phase11_leveling_and_dive_limit.js` (6/6 tests passing).
3. **Turret Collision & AI Threat Tests:** Passed `test_tower_recall_fixes.js` (4/4 tests passing).
4. **Phase 10 Combat & Skills Suite:** Passed `test_phase10.js` (8/8 tests passing).
5. **Hero Select Mobile Suite:** Passed `test_hero_select_mobile.js` verifying:
   - Base `.hero-select-overlay` scrollability, momentum scrolling, and flex alignment.
   - Container auto-margin centering.
   - `@media (max-width: 768px)` full-screen fixed positioning and 2-column grid.
   - `@media (max-width: 480px)` compact card sizing and button dimensions.
   - Orientation queries for mobile portrait and landscape.
   - JavaScript scroll assistance and reset logic.

---

## 5. Next Steps / Dependencies

- Maintain local commit; avoid running `git push` per user instruction.
- Continue testing gameplay across various mobile devices and screen aspect ratios.
