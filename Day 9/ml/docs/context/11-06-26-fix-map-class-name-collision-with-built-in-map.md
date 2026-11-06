# Fix Context: Global `Map` Class Name Collision with JavaScript Built-in `window.Map`

**Date:** 2026-11-06  
**Status:** Resolved  
**Branch:** main  

## 1. Problem Description
During Vercel automated deployment builds, Playwright runs headless browser evaluations (`page.evaluate(...)`) via `scripts/pipeline.mjs` to capture gallery preview screenshots of every project:
```text
[preview] Day 9/ml/index.html: page.evaluate: TypeError: Cannot set properties of undefined (setting '2')
    at Map.init (http://127.0.0.1:38165/Day%209/ml/js/map.js:67:25)
    at new Map (http://127.0.0.1:38165/Day%209/ml/js/map.js:27:10)
    at parseEvaluationResultValue (<anonymous>:106:81)
    at UtilityScript.evaluate (<anonymous>:310:23)
```

## 2. Root Cause Analysis
In `Day 9/ml/js/map.js`, declaring `class Map { ... }` in the global scope overwrote JavaScript's standard built-in `window.Map` (ES6 Map data structure).
When Playwright injected its internal serialization utilities (`parseEvaluationResultValue`) into the page to evaluate expressions, it executed `new Map()`. Instead of instantiating an empty standard ES6 key-value map, it called the custom game map constructor without arguments (`width = undefined`, `height = undefined`), leading to uninitialized grid arrays and `TypeError: Cannot set properties of undefined (setting '2')` at line 67.

## 3. Solution
1. **Renamed Class:** Renamed `class Map` to `class GameMap` in `Day 9/ml/js/map.js` and updated instantiation in `Day 9/ml/js/main.js`. Native `window.Map` remains completely untouched.
2. **Defensive Defaults & Bounds Checks:**
   - Provided parameter fallbacks: `constructor(width = 32, height = 24, tileSize = 40)`.
   - Added bounds checks (`y >= 0 && y < this.height && x >= 0 && x < this.width && this.grid[y]`) in base connector loops.
   - Exported `window.GameMap = GameMap` and `global.GameMap = GameMap`.
3. **Automated Verification:** Verified all 18 regression and phase tests. All tests pass with 100% green status.
