# Map Layout Documentation

## 3-Lane MOBA Map (Land of Dawn Inspired)

### Overview

The map is a **mirrored 3-lane MOBA battlefield** inspired by Mobile Legends: Bang Bang's "Land of Dawn." Designed for 5v5 gameplay, but currently configured for 1-hero prototype demonstration.

**Map Dimensions:** 32 tiles × 24 tiles  
**Tile Size:** 40 pixels  
**Total Pixel Dimensions:** 1280 × 960 (canvas is 1280 × 720, camera clips excess)

---

### Tile Types

| Tile ID | Name | Color | Walkable | Description |
|---------|------|-------|----------|-------------|
| 0 | Grass | #2d5a27 | ✅ | Default ground, walkable everywhere not overridden |
| 1 | Lane | #4a4a4a | ✅ | 3 horizontal lanes (Gold, Mid, EXP) |
| 2 | Jungle | #1b4332 | ✅ | Between lanes, contains neutral camps |
| 3 | River | #2a6f97 | ✅ | Horizontal channel through middle, contains Turtle/Lord |
| 4 | Base | #8b0000 | ✅ | Home base with crystal (5000 HP) |
| 5 | Turret | #ffd700 | ❌ | Defensive tower, 18 total (3 per lane × 3 lanes × 2 teams) |
| 6 | Bush | #3d5a3d | ✅ | Vision-denoting shrubbery near lanes |

---

### Lane Layout (Top to Bottom)

| Lane | X Position (tiles) | Role | Primary Hero Type | Description |
|------|-------------------|------|-------------------|-------------|
| **Gold Lane** | x=8 | Marksman | Ranged carry (Miya, Layla) | Solo lane with bonus gold from minions. 3 turrets per side. |
| **Mid Lane** | x=16 | Mage | Magic damage dealer (Pharsa, Nana) | Shortest lane, fastest rotations to other lanes. 3 turrets per side. |
| **EXP Lane** | x=24 | Fighter | Durable melee (Balmond, Alucard) | Solo lane with bonus XP. 3 turrets per side. |

**Lane visual:** Each lane is 4 tiles wide (spanning x±2 from the center line). Color-coded tile overlay helps players identify their lane.

---

### Jungle Layout

Four jungle quadrants between lanes:

| Quadrant | Position (corner) | Contents |
|------------|-------------------|----------|
| Top-Left | Near Gold/Mid intersection | Wolf/Buff camp |
| Top-Right | Near Mid/EXP intersection | Wolf/Buff camp |
| Bottom-Left | Near EXP/Gold intersection | Wolf/Buff camp |
| Bottom-Right | Near EXP/Mid intersection | Wolf/Buff camp |

**Each quadrant:** 6×6 tiles

**Neutral camps** provide:
- Gold and experience
- Buffs (Blue: cooldown reduction/mana; Red: attack damage and slow)
- Monster that respawns after death

---

### River

- **Position:** y = 12 (middle tile row)
- **Width:** 3 tiles tall
- **Length:** 32 tiles wide (full map width)
- **Contents:** 
  - **Turtle:** spawns at (16, 8), early game (2:00 mark), gives global gold + shield buff to last-hitter
  - **Lord:** spawns at (16, 16), late game (8:00 mark), becomes a pushing minion ally when killed

**River traversal:** Allows heroes to cross from one side of the map to the other, flank, or escape. Vision mechanics apply (bushes deny vision).

---

### Bases

| Team | Position (tiles) | Crystal HP | Description |
|------|------------------|------------|-------------|
| **Blue (Left)** | x=2, y=12 | 5000 | Left side of map. Crystal protected by base area and turrets. |
| **Red (Right)** | x=30, y=12 | 5000 | Right side of map. Mirror image of Blue base. |

**Base area:** 4×6 tiles surrounding the crystal. Crystal is an arc entity at the center. Destroying the crystal wins the game.

---

### Turrets

**Total:** 36 turrets (18 per team)

**Per lane:** 3 turrets × 2 teams = 6 turrets

**Position per lane:**
- **Turret 1 (outer):** Closest to base, fires first when minions/enemies enter range
- **Turret 2 (inner):** Mid-lane, slightly farther out
- **Turret 3 (base):** Closest to crystal, strongest damage, protects the crystal

**Turret behavior:**
- Auto-attack enemies and minions within range
- Prioritize minions over heroes when minions are present
- Deal significant damage; destroy before attempting crystal damage

**Turret coordinates (per team, per lane):**
- Outer: (6 or 26, lane row)
- Inner: (10 or 22, lane row)
- Base: (14 or 18, lane row)

*(Where lane row = 6 for Gold, 12 for Mid, 18 for EXP)*

---

### Objective Spawn Points

| Objective | Position (tiles) | Spawn Time | Effect |
|-----------|------------------|------------|--------|
| **Turtle** | (16, 8) | 2:00 game time | Global gold to whole team + defensive buff to last-hitter |
| **Lord** | (16, 16) | 8:00 game time | When killed, creates a pushing minion buff in the nearest lane |

---

### Map Coordinate System

**Tile coordinates:** (x, y) where:
- x = 0 (leftmost) to 31 (rightmost)
- y = 0 (topmost) to 23 (bottommost)
- (0, 0) = top-left corner
- (31, 23) = bottom-right corner

**Screen-relative coordinates** (used by game engine):
- Camera follows hero: `camera.x = hero.x - CANVAS_WIDTH/2`
- Heroes render at: `sx = hero.x - camera.x`, `sy = hero.y - camera.y`
- Heroes within `radius = 16` pixels of center are visible

**Example:** Hero at tile (100, 100) with camera at (90, 90) renders at screen position (10, 10).

---

### Walkability Rules

```
isWalkable(tx, ty):
  1. Check bounds: tx >= 0 && tx < 32 && ty >= 0 && ty < 24
  2. Look up grid[ty][tx] = tileId
  3. Find tile definition in MAP_TILES
  4. Return tile.walkable
```

**Walkable tiles:** Grass (0), Lane (1), Jungle (2), River (3), Base (4)
**Non-walkable:** Turret (5)

**Collision logic in `hero.js`:**
```
try move in X axis first
if walkable after X move → update x
then try move in Y axis
if walkable after Y move → update y
```

This prevents diagonal clipping through corners.

---

### Visual Tileset (Currently Color-Based)

The map currently uses **solid colors** per tile type (defined in `map.js` `MAP_TILES` object). Future enhancement:

1. Place actual PNG sprites in `assets/sprites/tiles/`
2. Load tilemap from `land_of_dawn.json`
3. Draw each tile's sprite instead of coloring
4. Add animated water shader for river
5. Add particle effects for Turtle/Lord buffs

**Current color palette:**
- Grass: #2d5a27 (dark green)
- Lane: #4a4a4a (medium gray)
- Jungle: #1b4332 (forest green)
- River: #2a6f97 (blue)
- Base: #8b0000 (dark red/brown)
- Turret: #ffd700 (gold)
- Bush: #3d5a3d (green-tinted)

---

### Map Data File (`land_of_dawn.json`)

The JSON contains higher-level layout info but the actual runtime map is built procedurally in `map.js init()` from the tile type constants. The JSON includes:

- Lane positions and roles
- Jungle patch coordinates
- Base positions and team assignments
- Objective spawn points (Turtle/Lord)
- Used for editor tools, AI pathfinding, or map customization

**Key JSON fields:**
- `lanes[]`: 3 entries with name, x position, role, hero list
- `jungle[]`: 4 entries with x, y, w, h
- `bases[]`: 2 entries with name, x, y, w, h, team
- `objectives`: turtle, lord spawn times and positions

---

### Minimap (Not Yet Implemented)

Planned feature: small overhead map in corner showing:
- Hero position
- Lane boundaries
- Jungle boundaries
- River
- Base locations
- Objective timers

Would use canvas `drawImage` of a minimap surface rendered each frame.

---

### Map Editing

To customize the map:

1. Edit `assets/maps/land_of_dawn.json` for high-level layout
2. Modify `map.js` `init()` function to change tile types, positions, or add new features
3. Add tile sprites to `assets/sprites/tiles/`
4. Re-run server to test changes

**Common modifications:**
- Add/remove jungle camps
- Change lane width
- Add alternate objective spawn points
- Modify base crystal HP

---

### Map Balance Notes

| Aspect | Current Setup | Balance Consideration |
|--------|--------------|----------------------|
| **Lane symmetry** | Mirrored (Blue/Red sides identical) | Ensures fair pick/ban and lane assignments |
| **Turrets per lane** | 3 per side | Standard MOBA count; enough to slow pushes but not stall |
| **Jungle quadrant size** | 6×6 tiles | Equal for both teams; neutral buffs spawn symmetrically |
| **River width** | 3 tiles | Allows single-file crossing; wide enough for duels |
| **Base crystal HP** | 5000 | High enough for prolonged fights, low enough for decisive endings |
| **Turtle position** | (16, 8) | Central, accessible from both sides; early-game objective |
| **Lord position** | (16, 16) | Deep in enemy territory; late-game game-ender |

---

## Running With Full Map

```bash
cd /data/data/com.termux/files/home/projects/codev/fafa/ml
python -m http.server 8000
```

Open `http://localhost:8000`

- Hero selection → click to spawn → click map to move
- Camera follows hero, panning within map bounds
- Turrets render as golden squares; walkable areas are colored
- Base crystals render as red/blue circles with labels

**Currently visible:** Color-coded lanes, jungle patches, river, bases, turrets, hero sprite (or colored circle).

**Not yet visible:** Minions, turrets shooting, crystal HP bars, Turtle/Lord spawn timers — these are Phase 2+ features.