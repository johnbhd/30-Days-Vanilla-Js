# Phase 1: Hero Selection & Map Prototype

**Date:** 11-04-2026  
**Type:** Feature  
**Status:** Complete  

---

## 1. Summary & Motivation
Initial prototype establishment for the 2D Mobile Legends MOBA browser game. The objective was to create a 3-lane Land of Dawn map, define 10 core MLBB heroes with roles and base stats, render the hero on HTML5 canvas with camera tracking, and allow click-to-move navigation.

---

## 2. Files Modified / Created
* `index.html` — Canvas viewport (1280x720) and hero selection overlay markup
* `css/style.css` — Dark navy/teal MLBB theme styling, hero buttons, HUD panels
* `js/config.js` — Core game constants, map dimensions (32x24 tiles), and 10 hero definitions
* `js/utils.js` — Math helpers (clamp, getDistance, normalize, tile conversions, image loader)
* `js/input.js` — Click and touch event listeners for move target coordinates
* `js/map.js` — Procedural grid generation with tiles (grass, lane, jungle, river, base, turret)
* `js/hero.js` — Hero class with movement, stats, and fallback circle rendering
* `js/renderer.js` — 2D canvas clearing, map drawing, and hero rendering
* `js/main.js` — 60 FPS `requestAnimationFrame` game loop, lerp camera following, and hero selection grid
* `assets/sprites/heroes/*/idle.png` — 10 hero icons downloaded from MLBB-Build-Analyser
* `assets/maps/land_of_dawn.json` — Map metadata file

---

## 3. Technical Implementation Details
* **Canvas Dimensions:** 1280 × 720 px, 40 px tile size.
* **Camera Lerp:** Smooth camera follow with 0.1 interpolation factor:
  `camera.x += (hero.x - CANVAS_WIDTH / 2 - camera.x) * cameraLerp`
* **Hero Selection:** Generates buttons for all 10 heroes from `HEROES` config array; clicking spawns hero at Blue Base.

---

## 4. Verification & Testing
* Tested running via `python -m http.server 8000`.
* Verified hero spawns at (100, 360) and follows mouse clicks on the canvas.
