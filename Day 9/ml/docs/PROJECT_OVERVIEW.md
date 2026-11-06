# ML Heroes - 2D MOBA Prototype

## Project Overview

A browser-based 2D Multiplayer Online Battle Arena (MOBA) prototype featuring Mobile Legends: Bang Bang heroes on a 3-lane map (Land of Dawn inspired).

**Status:** Phase 1, 2 & 3 Complete — Hero Selection, Minion Waves, Q/W/E/R Skills, River Bosses & Item Shop
**Engine:** HTML5 Canvas + Vanilla JavaScript
**Target:** Mobile Legends fans & game prototyping enthusiasts

---

## The 10 Heroes

| # | Hero | Role | Lane | Color | Stats (HP/Atk/Spd/Range) |
|---|------|------|------|-------|--------------------------|
| 1 | **Miya** | Marksman | Gold Lane | #f1c40f | 750 / 110 / 3.2 / 550 |
| 2 | **Layla** | Marksman | Gold Lane | #e67e22 | 720 / 115 / 3.0 / 650 |
| 3 | **Tigreal** | Tank | Roam | #3498db | 2900 / 95 / 2.4 / 120 |
| 4 | **Angela** | Support | Roam | #f39c12 | 2000 / 80 / 2.6 / 200 |
| 5 | **Alucard** | Fighter/Assassin | Jungle | #9b59b6 | 2100 / 130 / 2.8 / 140 |
| 6 | **Balmond** | Fighter | Jungle/EXP | #e67e22 | 2300 / 120 / 2.7 / 130 |
| 7 | **Gusion** | Assassin | Jungle | #e74c3c | 1750 / 150 / 3.4 / 110 |
| 8 | **Saber** | Assassin | Jungle/Roam | #34495e | 1800 / 140 / 3.1 / 100 |
| 9 | **Pharsa** | Mage | Mid Lane | #9b59b6 | 1700 / 125 / 2.6 / 700 |
| 10 | **Nana** | Mage | Mid Lane | #2ecc71 | 1680 / 120 / 2.8 / 600 |

**Role-Lane Mapping:**
- **Marksman** → Gold Lane (solo, bonus gold from minions)
- **Tank** → Roam (moves with team, provides vision/CC)
- **Support** → Roam (heals/buffs, vision control)
- **Fighter** → Jungle / EXP Lane (durable melee, 1v1 strength)
- **Assassin** → Jungle (high mobility, burst damage)
- **Mage** → Mid Lane (magic damage, wave clear, rotate)

---

## How to Run

```bash
cd /data/data/com.termux/files/home/projects/codev/fafa/ml
python -m http.server 8000
```

Then open: `http://localhost:8000`

### Controls

| Action | Input |
|--------|-------|
| Select hero | Click hero button on start screen |
| Move hero | Click anywhere on the map |
| Camera follow | Automatic (smooth lerp) |
| Restart | Refresh page |

---

## Project Structure

```
ml/
├── index.html             # Entry point (hero selection + canvas)
├── css/style.css          # ML dark-theme UI + button styles
├── js/
│   ├── config.js          # 10 hero definitions + game constants
│   ├── utils.js           # Math helpers, image loader
│   ├── input.js           # Click/touch-to-move input
│   ├── map.js             # Tile map: 3 lanes, jungle, river, bases, turrets
│   ├── hero.js            # Hero class (movement, rendering, stats)
│   ├── renderer.js        # Canvas rendering
│   └── main.js            # Game loop, camera, selection logic
├── assets/
│   ├── sprites/heroes/    # 10 folders with idle.png each
│   ├── sprites/tiles/     # Ready for actual tile sprites
│   ├── sprites/effects/   # For future skill effects
│   ├── sprites/ui/        # For future HUD elements
│   └── maps/
│       └── land_of_dawn.json # Map layout data
├── docs/
│   ├── PROJECT_OVERVIEW.md     # This file
│   ├── HERO_DESIGN.md         # Detailed hero specs
│   ├── MAP_LAYOUT.md          # Map design notes
│   ├── GAMEPLAY_PHASES.md     # Roadmap (Phase 2, 3, 4)
│   └── TECHNICAL_SPEC.md      # Code architecture
├── README.md                  # Quick start summary
└── .gitignore
```

---

## Phase 1 — Hero Selection (Complete)

**What's done:**
- ✅ 10 hero buttons with colored icons
- ✅ Click handler selects hero, hides overlay
- ✅ Hero spawns near Blue Base (left side)
- ✅ Side panel updates with name/role/lane
- ✅ Camera follows hero
- ✅ Click map to move

**Files changed:**
- `index.html` — added selection overlay markup
- `css/style.css` — overlay, grid, card styles
- `js/main.js` — builds grid from config, handles selection + spawn

---

## Roadmap — Future Phases

| Phase | Feature | Estimated Time | Status |
|-------|---------|----------------|--------|
| **Phase 2** | Minion waves (spawn every 30s, walk lanes, attack) | ~1 hour | Not started |
| **Phase 3** | Turrets + base crystals + win condition | ~2 hours | Not started |
| **Phase 4** | Hero skills (Q/W/E/R) per ML hero kit | ~2+ hours | Not started |

---

## Hero Images — Source & Licensing

All 10 hero icons were downloaded from the [MLBB-Build-Analyser GitHub repo](https://github.com/Linconius/MLBB-Build-Analyser) — `web/public/assets/heroes/<hero>.png`.

- **Format:** Transparent PNG
- **Size:** ~12–17KB each
- **Usage:** Intended for prototype/learning purposes
- **Note:** These are simplified icon assets; full MLBB hero sprites would require ripping from the game's 3D models or commissioning original art

---

## Technical Notes

### Map System (`map.js`)

- **Grid:** 32×24 tiles (TILE_SIZE = 40px)
- **3 lanes** vertically: Gold (x=8), Mid (x=16), EXP (x=24)
- **Horizontal river** through middle y=12
- **Jungle patches** at four corners between lanes
- **Bases** at left (Blue) and right (Red) with crystals (5000 HP)
- **Turrets:** 3 per side per lane (9 total per team)
- **Walkability:** Defined per tile type (grass=walkable, turret=not walkable)

### Hero System (`hero.js`)

- **State:** hp, maxHp, x, y, targetX, targetY, speed, radius
- **Movement:** Click-to-move, simple collision (try x then y)
- **Rendering:** Colored circle fallback → `idle.png` if loaded
- **Health bar:** Above hero, color-critical (green >50%, red <50%)

### Game Loop (`main.js`)

- **FPS:** 60 (requestAnimationFrame)
- **Delta time:** `(currentTime - lastTime) / 1000`
- **Camera:** Lerp follow hero (0.1 smoothness)
- **Bounds:** Clamped to map size

---

## Adding More Heroes

1. Download hero PNG from MLBB sources (recommend Liquipedia/DeviantArt)
2. Place in `assets/sprites/heroes/<hero-name>/idle.png`
3. Add hero entry to `js/config.js` HEROES array:
   ```js
   {
     id: "newhero",
     name: "New Hero",
     role: "Mage",
     lane: "Mid Lane",
     color: "#9b59b6",
     sprite: "assets/sprites/heroes/newhero/",
     stats: { hp: 1700, atk: 125, spd: 2.6, range: 700 }
   }
   ```
4. Re-run server — button appears automatically

---

## License

This project is for **educational and prototyping purposes only**.  
Hero artwork sourced from MLBB-Build-Analyser (public GitHub repo).  
Game concept & hero roles belong to Moonton (Mobile Legends: Bang Bang).

No copyright infringement intended. This is a fan-made prototype for learning game development.

---

## Need Help?

- Add minion waves? → "do phase 2"
- Add hero skills? → "do phase 4"
- Change map layout? → edit `assets/maps/land_of_dawn.json`
- Different hero roles? → edit `js/config.js`