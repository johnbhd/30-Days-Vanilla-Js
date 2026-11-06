# Mobile Portrait Camera Hero Follow & 60 FPS Performance Optimization

**Date:** 11-06-2026  
**Type:** Feature / Bug Fix / Performance Optimization  
**Status:** Complete  

---

## 1. Summary & Motivation

Testing on mobile devices revealed two critical issues:
1. **Camera Not Following Hero in Portrait Mode:** In portrait mode, the screen is tall and narrow (~390px x 844px). The camera horizontal position was previously clamped to `[0, mapWidth - GAME.CANVAS_WIDTH] = [0, 1280 - 1280] = [0, 0]`, permanently locking `camera.x` to `0`. Consequently, the player's hero was cropped off-screen near spawn (`x = 100`), and as the hero moved, the camera failed to follow the hero across the map.
2. **Mobile Lag / Stuttering:** The game experienced frame drops on mobile due to:
   - 1,536 canvas tile draw calls per frame in `map.render()` for static ground tiles.
   - Multiple CSS `backdrop-filter: blur(...)` shaders running over the canvas every frame on mobile GPUs.
   - Multiple DOM `document.getElementById` queries and innerHTML rewrites executing 60 times a second.

This update resolves both issues:
- Dynamic aspect-ratio camera tracking in `updateCamera()` keeps the hero centered on screen in full-screen portrait and landscape modes, smoothly rendering the map around the hero as they walk.
- Offscreen pre-rendered map canvas reduces 1,500+ tile draw calls per frame to 1 hardware-accelerated `drawImage` blit.
- CSS `backdrop-filter: blur` is disabled on mobile in favor of high-performance semi-transparent dark backgrounds.
- UI DOM lookups in `loop()` are cached, eliminating layout thrashing and delivering a solid 60 FPS experience.

---

## 2. Files Modified / Created

* [`Day 9/ml/js/main.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/main.js)
  - Implemented `updateCamera(snap)` with dynamic visible viewport width calculation, centering `selectedHero` and clamping `minCamX`/`maxCamX` to map bounds.
  - Snapped camera to hero on match start in `startMatch()`.
  - Cached DOM element references for ability cooldown overlays and recall button.
  - Eliminated redundant `textContent` and `innerHTML` assignments in `loop()`.
* [`Day 9/ml/js/map.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/map.js)
  - Added `initOffscreen()` to pre-render the 1280x960 static tile grid onto an offscreen canvas.
  - Updated `render(ctx, camera)` to draw the offscreen canvas with a single `ctx.drawImage()`, with defensive clamped tile bounds in fallback mode.
  - Added dark void background fill (`#0a0f1e`) so camera pans beyond map boundaries display clean empty space.
  - Re-rendered offscreen buffer when turrets are destroyed.
* [`Day 9/ml/css/style.css`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/css/style.css)
  - Disabled `backdrop-filter: blur(...)` in mobile media queries.
  - Added `transform: translateZ(0); will-change: transform;` to `canvas` for dedicated GPU hardware compositing.
* `Day 9/ml/docs/context/11-06-26-portrait-camera-hero-follow-and-mobile-performance.md`
  - Created this context document.

---

## 3. Technical Implementation Details

### 3.1 Dynamic Camera Viewport Math in Portrait Mode
On a portrait phone (e.g., 390px x 844px) displaying a 1280x720 canvas with `object-fit: cover`:
```javascript
const scale = rect.height / GAME.CANVAS_HEIGHT;
const viewW = rect.width / scale; // ~333px visible width on canvas
const minCamX = -(GAME.CANVAS_WIDTH - viewW) / 2; // ~ -473px
const maxCamX = mapWidth - (GAME.CANVAS_WIDTH + viewW) / 2; // ~ +473px

const targetX = selectedHero.x - GAME.CANVAS_WIDTH / 2;
const clampedX = clamp(targetX, minCamX, maxCamX);

camera.x += (clampedX - camera.x) * cameraLerp;
```
When `selectedHero` is at spawn (`x = 100`), `targetX = -540`, clamped to `-473px`. The hero renders at `canvasX = 100 - (-473) = 573px` (117px from phone left bezel), fully visible. As the hero moves right, `camera.x` tracks smoothly up to `+473px`, keeping the hero centered on screen while scrolling the map.

### 3.2 Offscreen Canvas Pre-Rendering
The 32x24 tile grid is rendered once to `this.offscreenCanvas` during initialization. Every animation frame:
```javascript
ctx.drawImage(this.offscreenCanvas, -camera.x, -camera.y);
```
Dynamic elements (river wave highlights, turrets, crystal bases, HP bars) are rendered on top with camera offsets.

---

## 4. Verification & Testing

- Syntax check: `node --check Day 9/ml/js/*.js` passed.
- Unit tests: `test_portrait_camera_and_smoothness.js` passed all 4 tests.
- Regression suites:
  - `test_fullscreen_mobile_cards.js` passed.
  - `test_hero_select_mobile.js` passed.
  - `test_phase11_leveling_and_dive_limit.js` passed.
  - `test_tower_recall_fixes.js` passed.
  - `test_phase10.js` passed.

---

## 5. Next Steps / Dependencies

- Commit changes locally per project rules.
- Push to GitHub when requested.
