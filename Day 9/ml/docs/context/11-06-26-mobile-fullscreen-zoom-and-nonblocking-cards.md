# Mobile Fullscreen Canvas Zoom & Non-Blocking HUD Cards

**Date:** 11-06-2026  
**Type:** Feature / UX Improvement  
**Status:** Complete  

---

## 1. Summary & Motivation

On mobile devices, gameplay was severely hampered by two responsiveness issues:
1. **Letterboxed Canvas / Tiny Hero:** On portrait smartphones, `.game-wrapper` was constrained to a 16:9 ratio, producing a 219px tall strip surrounded by large black voids above and below. The hero in the canvas appeared tiny (~12px) and far away. Similarly in landscape, pillarbox bars bordered the sides.
2. **Screen Blocking by HUD Cards:** The in-game info cards (`.hero-panel` for hero stats/builds and `.hero-skills-panel` for abilities) were stacked vertically in the top-right column, covering up to 60% of the battlefield and blocking the view of approaching enemy bots, minions, and towers.

This update makes the mobile gaming experience true full screen:
- In portrait: Canvas expands to full screen (`100vw x 100dvh`) with `object-fit: cover`, zooming the hero to the center of the display with 4x greater visual presence and zero black bars.
- In landscape: Canvas expands to full screen (`100vw x 100dvh`), eliminating side pillarboxes.
- The cards no longer block the screen:
  - `.hero-skills-panel` is repositioned to fixed bottom-right, placing ability circles right under the player's thumb.
  - `.hero-panel` is made translucent, compact, and equipped with a one-tap collapse toggle (`#toggleHeroPanelBtn`) that shrinks it down to a slim 26px bar.
- Input click/touch coordinate conversion and canvas match HUDs dynamically adjust for `object-fit: cover`.

---

## 2. Files Modified / Created

* [`Day 9/ml/index.html`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/index.html)
  - Added `#toggleHeroPanelBtn` collapse/expand button in `.hero-header-top`.
* [`Day 9/ml/css/style.css`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/css/style.css)
  - Added `.toggle-card-btn` and `.hero-panel.collapsed` styling.
  - Added `max-height: 90dvh; overflow-y: auto;` to `.shop-modal`, `.scoreboard-modal`, and `.settings-modal`.
  - Updated `@media (max-width: 768px)`, `@media (max-width: 480px)`, `@media (orientation: portrait)`, and `@media (orientation: landscape) and (max-height: 600px)`:
    - Full screen `.game-wrapper` (`100vw x 100dvh`, `aspect-ratio: unset`, `border: none`).
    - `canvas { object-fit: cover !important; }`.
    - `.hero-skills-panel` fixed at bottom-right corner with hidden keys hint/header.
    - Translucent glassmorphism styling for `.hero-panel`.
* [`Day 9/ml/js/input.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/input.js)
  - Added aspect-ratio-aware coordinate translation in `updateCoords()` when `style.objectFit === "cover"`.
* [`Day 9/ml/js/renderer.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/renderer.js)
  - Added `visibleLeft` horizontal crop detection in `renderUI()` so the match timer/crystal status and respawn banner remain perfectly positioned inside the visible window in portrait mode.
* [`Day 9/ml/js/main.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/main.js)
  - Added event listener for `#toggleHeroPanelBtn` to toggle `.collapsed` on `#heroPanel`.
* `Day 9/ml/docs/context/11-06-26-mobile-fullscreen-zoom-and-nonblocking-cards.md`
  - Created this context document.

---

## 3. Technical Implementation Details

### 3.1 Fullscreen Object-Fit Cover & Coordinate Mapping
When `canvas` renders at 1280x720 and is displayed inside a viewport with `object-fit: cover`:
```javascript
const canvasAspect = canvas.width / canvas.height;
const rectAspect = rect.width / rect.height;
let scale, offsetX = 0, offsetY = 0;
if (rectAspect < canvasAspect) {
  // Mobile portrait: cropped horizontally
  scale = rect.height / canvas.height;
  offsetX = (canvas.width * scale - rect.width) / 2;
} else {
  // Wide landscape: cropped vertically
  scale = rect.width / canvas.width;
  offsetY = (canvas.height * scale - rect.height) / 2;
}
this.mouseX = ((clientX - rect.left) + offsetX) / scale;
this.mouseY = ((clientY - rect.top) + offsetY) / scale;
```
This guarantees touch taps on mobile screens map with mathematical precision to game world coordinates.

### 3.2 Non-Blocking HUD Architecture
- **Controls at Bottom-Right:** Mobile MOBA thumb layout places Q/W/E/R circles, upgrade plus buttons, and cooldowns at `position: fixed; bottom: calc(10px + env(safe-area-inset-bottom)); right: calc(10px + env(safe-area-inset-right));`.
- **Top-Right Minimalist Stats:** `.hero-panel` is given translucent glassmorphism (`rgba(12, 18, 34, 0.65)` with `backdrop-filter: blur(6px)`) and a collapse button that hides builds, inventory, and badges, leaving an ultra-compact single-line status bar.

---

## 4. Verification & Testing

- Syntax check: `node --check Day 9/ml/js/*.js` passed.
- Unit tests: `test_fullscreen_mobile_cards.js` passed all 5 tests.
- Full regression suites passed:
  - `test_hero_select_mobile.js`
  - `test_phase11_leveling_and_dive_limit.js`
  - `test_tower_recall_fixes.js`
  - `test_phase10.js`

---

## 5. Next Steps / Dependencies

- Desktop layout remains completely unaffected.
- Git commit created locally per project rules.
