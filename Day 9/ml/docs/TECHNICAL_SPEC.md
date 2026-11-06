# Technical Specification

## Architecture Overview

**Framework:** HTML5 Canvas + Vanilla JavaScript (no libraries, no build step)  
**Resolution:** 1280 × 720 pixels (canvas aspect ratio 16:9)  
**Color Theme:** Mobile Legends-inspired dark navy/teal (#1a1a2e primary, #0f3460 accents, #4ecca3 accent)  
**Input:** Mouse click / touch tap for move direction  
**Rendering:** 2D Canvas context, immediate mode drawing  
**Loop:** `requestAnimationFrame` @ 60 FPS target  
**Data Format:** JSON for map layout, hero configs, game state  
**No Dependencies:** Zero external JS libraries (no jQuery, no Phaser, no Three.js)  
**Deployable:** Any static web server (Python `http.server`, Node, etc.)

---

## File Structure & Responsibilities

| File | Responsibility | Lines | Complexity |
|------|---------------|-------|------------|
| `index.html` | Page skeleton, canvas container, UI overlay | ~40 | Low |
| `css/style.css` | Visual styling (dark theme, buttons, overlay) | ~80 | Low |
| `js/config.js` | Game constants, 10 hero definitions | ~80 | Low |
| `js/utils.js` | Math helpers, image loader | ~30 | Low |
| `js/input.js` | Click/touch event handling | ~25 | Low |
| `js/map.js` | Tile map, lanes, jungle, river, bases, turrets | ~120 | Medium |
| `js/hero.js` | Hero class, movement, rendering, stats | ~100 | Medium |
| `js/renderer.js` | Canvas clear + map/hero render calls | ~30 | Low |
| `js/main.js` | Game loop, camera, hero selection, init | ~130 | Medium |
| **Total** | **~648 lines** | | **Mixed** |

---

## Module Details

### `js/config.js` — Game Constants & Hero Design

**Exports:**
- `GAME` object with:
  - `TITLE`: string
  - `CANVAS_WIDTH`: 1280
  - `CANVAS_HEIGHT`: 720
  - `TILE_SIZE`: 40
  - `FPS`: 60
  - `MAP`: { WIDTH, HEIGHT, LANES: object, BASES: object }
- `HEROES` array of 10 objects, each with:
  - `id`: string (e.g., "miya")
  - `name`: string
  - `role`: string (Marksman, Tank, etc.)
  - `lane`: string (Gold Lane, Mid Lane, Jungle, Roam)
  - `color`: string (hex for UI)
  - `spritePath`: string (relative path to asset folder)
  - `stats`: { hp, atk, spd, range } all numbers

**Hero Entry Shape:**
```javascript
{
  id: "miya",
  name: "Miya",
  role: "Marksman",
  lane: "Gold Lane",
  color: "#f1c40f",
  sprite: "assets/sprites/heroes/miya/",
  stats: { hp: 750, atk: 110, spd: 3.2, range: 550 }
}
```

**Initialization:** Called implicitly by `main.js` on load.

---

### `js/map.js` — Tile-Based Map System

**Responsibilities:**
- 2D grid of tile IDs (32×24 = 768 tiles)
- Define walkability per tile type
- Render map tiles with colors
- Render bases (crystals) with arc + label
- Render turrets (gold squares)
- Clip camera bounds

**Key Constants (`MAP_TILES` object):**
```javascript
const MAP_TILES = {
  GRASS:   { id: 0, color: "#2d5a27", walkable: true },
  LANE:    { id: 1, color: "#4a4a4a", walkable: true },
  JUNGLE:  { id: 2, color: "#1b4332", walkable: true },
  RIVER:   { id: 3, color: "#2a6f97", walkable: true },
  BASE:    { id: 4, color: "#8b0000", walkable: true },
  TURRET:  { id: 5, color: "#ffd700", walkable: false },
  BUSH:    { id: 6, color: "#3d5a3d", walkable: true }
}
```

**Key Functions:**
- `Map(width, height, tileSize)` — constructor, builds grid
- `isWalkable(tx, ty)` — returns boolean, checks bounds + tile walkable flag
- `getTileColor(tx, ty)` — returns hex color for tile
- `render(ctx, camera)` — draws visible tiles + bases + turrets

**Map Layout (hardcoded in `init()`):**
- 3 lanes vertically: Gold (x=8), Mid (x=16), EXP (x=24), each 4 tiles wide
- River: y=12, 3 tiles tall, full width
- 4 jungle quadrants: 6×6 at corners between lanes
- Bases: Blue at (2, 12), Red at (30, 12), each 4×6 with crystal
- Turrets: 3 per lane per team (outer/inner/base positions)
- Objectives: Turtle at (16, 8), Lord at (16, 16)

**Camera Bounds:**
```javascript
camera.x = clamp(camera.x, 0, map.width * map.tileSize - GAME.CANVAS_WIDTH);
camera.y = clamp(camera.y, 0, map.height * map.tileSize - GAME.CANVAS_HEIGHT);
```

---

### `js/hero.js` — Hero Class

**Responsibilities:**
- Individual hero instance (state + behavior)
- Click-to-movement logic
- Rendering (colored circle fallback → PNG sprite)
- Health bar above head
- Name label

**Hero Class Fields:**
```javascript
class Hero {
  constructor(data) {        // from config
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.lane = data.lane;
    this.color = data.color;
    this.spritePath = data.sprite;  // e.g. "assets/sprites/heroes/miya/"
    this.stats = { ...data.stats }; // hp, atk, spd, range
    
    // Runtime state
    this.hp = this.stats.hp;       // current HP
    this.maxHp = this.stats.hp;    // max HP
    this.x = 100;                  // world x in tiles/pixels? pixels
    this.y = 360;                  // world y
    this.targetX = 100;            // destination
    this.targetY = 360;
    this.speed = data.stats.spd;   // tiles/sec or pixels/tick?
    this.radius = 16;              // render hitbox
    this.image = null;             // loaded PNG or null
    this.loaded = false;           // flag
  }
}
```

**Key Methods:**
- `loadSprite()` — async, tries `${spritePath}idle.png`, sets `this.loaded = true` on success
- `setTarget(tx, ty)` — sets target destination
- `update(map, dt)` — movement logic:
  - Compute dx = targetX - x, dy = targetY - y
  - If dist > 5: moveStep = speed * dt * 60 (normalize to 60fps)
  - stepX = (dx / dist) * moveStep, stepY = (dy / dist) * moveStep
  - Try X first: if map.isWalkable(floor((x+stepX)/tileSize), floor(y/tileSize)) → x += stepX
  - Try Y second: if map.isWalkable(floor(x/tileSize), floor((y+stepY)/tileSize)) → y += stepY
- `render(ctx, camera)` — draws hero:
  - sx = x - camera.x, sy = y - camera.y
  - If off-screen (sx < -50 etc) → return early
  - Save ctx, draw selection circle under hero
  - If this.loaded && this.image → drawImage at (sx-radius, sy-radius, radius*2, radius*2)
  - Else (fallback): colored circle + initial letter
  - Draw health bar: rect above head, filled proportion hp/maxHp
  - Draw name label centered below bar
  - Restore ctx

**Fallback Behavior:**
If `loadImage()` fails (no PNG), hero renders as:
- Colored circle (this.color)
- White initial letter (this.name[0].toUpperCase())
- Health bar in gray
- This is intentional for prototype; add art later

---

### `js/input.js` — Click/Touch-to-Move

**Responsibilities:**
- Mousemove / mousedown / mouseup on canvas
- Touchstart / touchmove for mobile
- Set global `Input.targetX`, `Input.targetY`

**Global Input State:**
```javascript
const Input = {
  mouseX: 0,
  mouseY: 0,
  targetX: null,     // world x, updated on click
  targetY: null,     // world y
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0
}
```

**Key Functions:**
- `init(canvas, camera)` — attaches all event listeners
  - `mousedown` → set isDragging, record world coords
  - `mouseup` → isDragging = false
  - `mousemove` → update mouseX/mouseY (throttled?)
  - `touchstart` (preventDefault!) → set world coords from touch
  - `touchmove` (preventDefault!) → update from touch
- `resetTarget()` — set targetX = null, targetY = null

**Click-to-Move Logic (in `main.js` loop, not input.js):**
```javascript
if (Input.targetX !== null && Input.targetY !== null) {
  selectedHero.setTarget(Input.targetX, Input.targetY);
}
```
*Note: The `targetX/Y` are in world pixel coordinates, same as hero.x/hero.y.*

---

### `js/renderer.js` — Rendering Layer

**Responsibilities:**
- Decouple rendering from game logic
- `clear()` — canvas clearRect(0,0,width,height)
- `renderMap(map, camera)` — delegate to map.render()
- `renderHero(hero, camera)` — delegate to hero.render()
- `renderUI(hero)` — draw HP/names in canvas (alternative to HTML overlay)

**Simple API:**
```javascript
class Renderer {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
  }
  clear() { this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); }
  renderMap(map, camera) { /* map.render(ctx, camera) */ }
  renderHero(hero, camera) { /* hero.render(ctx, camera) */ }
  renderUI(hero) { /* custom canvas UI */ }
}
```

**Current Usage in `main.js`:**
```javascript
const renderer = new Renderer(canvas);
// In loop:
renderer.clear();
renderer.renderMap(map, camera);
if (selectedHero) {
  renderer.renderHero(selectedHero, camera);
  renderer.renderUI(selectedHero);
}
```

---

### `js/main.js` — Game Loop & Orchestration

**Responsibilities:**
- Initialize everything
- Build hero selection grid
- Main game loop (60 FPS)
- Camera follow (lerp)
- State management (selectedHero null → spawned → moving)

**Key Variables:**
```javascript
let selectedHero = null;    // null until player clicks hero
const camera = { x: 0, y: 0 }; // camera offset
const cameraLerp = 0.1;      // smoothness [0..1]
```

**Game Loop Steps (per frame):**
1. `dt = (currentTime - lastTime) / 1000` — delta time in seconds
2. `lastTime = currentTime`
3. If `selectedHero`:
   - If `Input.targetX ≠ null`: `selectedHero.setTarget(Input.targetX, Input.targetY)`
   - `selectedHero.update(map, dt)` — move hero
   - Camera lerp: `camera.x += (selectedHero.x - WIDTH/2 - camera.x) * cameraLerp`
   - Clamp camera to map bounds
4. Render:
   - `renderer.clear()`
   - `renderer.renderMap(map, camera)`
   - If `selectedHero`: `renderer.renderHero(selectedHero, camera)` + `renderer.renderUI(selectedHero)`
   - Else: draw "Select a hero to begin" center text
5. `requestAnimationFrame(loop)`

**Initialization:**
```javascript
buildHeroGrid();     // generates 10 hero buttons
requestAnimationFrame(loop); // start loop
```

---

### Game Flow States

| State | Description | Transitions |
|-------|-------------|-------------|
| **SELECT** | Hero selection overlay visible | → SPAWN (click hero) |
| **SPAWN** | Hero spawned on map, overlay hidden | → MOVE (always) |
| **MOVE** | Player clicks map to move hero | → SELECT (refresh/relay) |
| **GAME_OVER** | (Future) crystal destroyed | → SELECT (refresh) |

### Current Flow (Phase 1)

```
Page Load
  → buildHeroGrid() → 10 buttons appear
  → requestAnimationFrame(loop) starts
  → selectedHero = null → shows "Select a hero to begin" text
  → User clicks hero button
    → selectHero(hero, cardEl) runs
      → overlay.addClass("hidden")
      → selectedHero = new Hero(data)
      → hero spawns at (100, 360)
      → updateHeroUI() → panel shows name/role/lane
      → controlsHint shows "Click anywhere to move"
    → loop detects selectedHero !== null
    → camera follows hero
    → User clicks map → hero moves
```

---

## Asset Pipeline

### Hero Icons

**Source:** Downloaded from GitHub repo `Linconius/MLBB-Build-Analyser`  
**Path:** `web/public/assets/heroes/<hero>.png`  
**Download Command (already executed):**
```bash
for hero in miya tigreal alucard layla angela gusion pharsa balmond nana saber; do
  url="https://raw.githubusercontent.com/Linconius/MLBB-Build-Analyser/main/web/public/assets/heroes/${hero}.png"
  curl -sL -o "${hero}/idle.png" "$url" --max-time 15
done
```

**Result:** 10 PNG files in `ml/assets/sprites/heroes/<hero>/idle.png`  
**Size:** 12–17KB each, transparent background  
**Expected by code:** `loadImage(`${spritePath}idle.png`)` — must exist for PNG rendering; if missing, colored circle fallback

### Map Data

**Source:** Built procedurally in `map.js init()` from tile type constants  
**JSON Supplement:** `assets/maps/land_of_dawn.json` (lane positions, roles, jungle coords, base positions, objectives)  
**Future:** Could load from JSON instead of hardcoded, but current approach keeps it simple (no build step, no external deps).

### No Other Assets Required

- No sound files (Phase 4 planned)
- No particle sprite sheets (Phase 4 planned)
- No music (Phase 4 planned)
- No font files beyond system fonts (CSS `font-family: "Segoe UI", Tahoma, etc.`)
- No third-party JS (vanilla only)

---

## Extensibility Points

### Adding a New Hero

1. Place PNG: `assets/sprites/heroes/newhero/idle.png`
2. Add entry to `HEROES` array in `js/config.js`
3. Button appears automatically on page load
4. Spawn position defaults to (100, 360) — customize if needed

### Changing Map Layout

1. Edit `assets/maps/land_of_dawn.json` for high-level design
2. Or edit `map.js init()` to change tile positions/sizes
3. Add/remove jungle patches, change lane widths
4. Re-run server to test

### Adding Skills (Phase 3)

1. Add `skills` entry per hero in `js/config.js`
2. Create `js/skills.js` for cooldown tracking + damage
3. Add skill buttons to `index.html`
4. Implement in `hero.js` `update()` or separate skill loop
5. Add particle effects in `js/particles.js` (Phase 4)

### Changing Controls

1. Modify `js/input.js` event listeners
2. Change move logic in `main.js` loop
3. Add alternative (WASD, arrow keys) in future

### Multiplayer (Phase 4)

1. Add `js/socket.js` for WebSocket connection
2. Sync `selectedHero` state between clients
3. Server authoritates moves/skills
4. Add chat, scoreboard, replay
5. Minimal changes to rendering code (just sync state)

---

## Performance Profile

| Metric | Expected | Notes |
|--------|----------|-------|
| FPS | 60 (target) | `requestAnimationFrame` on modern browsers |
| Memory | < 10 MB | 10 small PNGs + 768 tile IDs + simple objects |
| CPU | < 10% | Vanilla JS, simple math, no library overhead |
| Canvas ops/frame | ~20-30 draws | 1 map render + 1 hero render + UI text |
| Mobile compatibility | Good | Canvas is native; touch events supported; may need viewport meta |
| Browser support | Chrome, Firefox, Safari, Edge | No ES6+ transpilation needed; modern features used but fallbacks exist |

### Browser Compatibility

- **Canvas API:** Supported in all modern browsers (2017+)
- **`requestAnimationFrame`:** Supported in all modern browsers
- **`clamp`:** `Math.min Math.max` fallback available (used in code)
- **`fetch` / `curl`:** Only needed for asset download, not runtime
- **Touch events:** `touchstart`, `touchmove` with `preventDefault()` for mobile

### Development Workflow

1. `cd ml && python -m http.server 8000` — start local dev server
2. Open `http://localhost:8000` in browser
3. Make changes to JS/CSS/HTML
4. Refresh browser to see changes (no build step)
5. Debug with F12 devtools (console, network, elements)
6. No npm install, no bundler, no transpilation needed

### Deployment

- Any static web server serves the `ml/` folder
- GitHub Pages: push to `gh-pages` branch or set `/(ml)` as docs folder
- Netlify: drag `ml/` folder or connect repo
- Vercel: similar to Netlify
- Local network: `python -m http.server 8000` on host machine, other devices on same Wi-Fi visit `http host IP:8000`

---

## Known Limitations

| Limitation | Workaround |
|------------|------------|
| No sound | Add in Phase 4 (`js/sound.js`) |
| No particle effects | Add in Phase 4 (`js/particles.js`) |
| No multiple map sizes | Hardcoded 32×24; edit `map.js` to change |
| Only 10 heroes | Extend `HEROES` array in `config.js`; add PNG art |
| Single-player only | Phase 4 adds WebSocket multiplayer |
| No save/progress | Not designed; refresh to restart |
| Mobile touch accuracy | Click-to-map works; joystick not implemented |
| IE11 / very old browsers | Not supported (uses ES6 features like arrow functions, template literals) |

---

## Security Considerations

- **No server component:** This is a 100% client-side project
- **No data persistence:** Refresh loses state
- **No external requests at runtime:** Asset URLs hardcoded in `config.js`
- **CSP friendly:** No inline scripts that would trigger CSP violations (well, the JS is inline in HTML, but small and safe)
- **If adding multiplayer (Phase 4):** Validate all inputs on server; avoid WebSocket abuse

---

## Future-Proofing Notes

- **Modular design:** Each `js/*.js` module has single responsibility; can be split further
- **No build step:** Can edit files and refresh — ideal for learning/tinkering
- **JSON-driven:** Hero data, map layout, and game constants in JSON make tweaking easy
- **Sprite-ready:** Asset loading architecture (`loadImage` + `idle.png` pattern) makes adding art straightforward
- **Scalable map:** Tile-based design means map size changes just need grid dimension tweaks

---

## Change Log

| Date | Change | File(s) |
|------|--------|---------|
| 2026-11-04 | Initial prototype — Phase 1 (hero selection + movement) | All files |
| 2026-11-04 | Downloaded 10 hero PNGs from MLBB-Build-Analyser GitHub | `assets/sprites/heroes/*/` |
| 2026-11-04 | Created docs: PROJECT_OVERVIEW, HERO_DESIGN, MAP_LAYOUT, GAMEPLAY_PHASES, TECHNICAL_SPEC | `ml/docs/` |
| 2026-11-04 | Fixed JS bugs: click handler event passing, selectHero signature | `js/main.js` |
| 2026-11-04 | Simplified hero selection from grid to button-based (reliable rendering) | `index.html`, `css/style.css`, `js/main.js` |
| 2026-11-05 | (Current) Documentation completed; roadmap defined | `ml/docs/*.md` |

---

## Questions & Contact

For questions about this project's architecture, extend it, or integrate it into other work:

- **Extend Phase 2:** Say "do phase 2" → I'll implement minion waves
- **Extend Phase 3:** Say "do phase 3" → I'll add skills + objectives
- **Extend Phase 4:** Say "do phase 4" → I'll add polish + multiplayer
- **Modify hero roster:** Edit `js/config.js` HEROES array
- **Change map:** Edit `map.js init()` or `land_of_dawn.json`
- **General questions:** Review this spec doc or the individual MD files in `ml/docs/`

---

**End of Specification**