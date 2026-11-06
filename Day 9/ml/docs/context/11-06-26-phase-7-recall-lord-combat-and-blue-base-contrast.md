# Phase 7: Recall Teleport, Summoned Lord Combat Overhaul & Blue Base Visual Contrast

**Date**: 11-06-2026
**Author**: Antigravity Assistant & JB

---

## 1. Overview
Phase 7 introduces three essential gameplay improvements into the Land of Dawn:

1. **2-Second Recall Ability (Both Heroes)**:
   - Dedicated **Recall** button (`#btnRecall`) in the ability dock and keyboard shortcut (`KeyB`).
   - Channels for exactly **2.0 seconds** while stationary, displaying swirling cyan portal rings, floating particle sparks, spatial warp sound synthesis, and an on-canvas channeling progress bar (`RECALLING (2.0s)`).
   - Any movement, taking damage, or casting an ability immediately interrupts channeling (`RECALL CANCELLED`).
   - Teleports the player to friendly Blue Base (`100, 480`), instantly triggering base fountain healing.
   - **Both Heroes**: Enemy Bot Hero channels 2.0s recall when retreating at low HP and safe distance, teleporting to Red Base (`1160, 480`).

2. **Summoned Lord Navigation, Target Acquisition & Slashing VFX**:
   - Resolved the pathing lockup where the Summoned Lord would halt after waypoints.
   - Lord now continuously advances along the Mid Lane toward the Red Base (`x = 1220, y = 480`) and never freezes.
   - Expanded target acquisition to a **250px aggro radius**:
     - Sits priority-weighted scans across Red Turrets, Red Base Crystal, Enemy Bot Hero, and Red Minions.
   - Short-range melee slashing attack visuals:
     - Equipped with a sweeping purple cleave arc (`particles.spawnSlash`, `#9b59b6`, 52px radius).
     - Heavy white impact sparks (`particles.spawnBurst`).
     - Blade whoosh sound synthesis (`sound.playSlash()`).
     - Deals 140 physical damage per strike, damaging minions, turrets, crystals, and the enemy bot via `enemyBot.takeDamage(...)`.

3. **Blue Base Tile Ground Color Contrast**:
   - Replaced old dark red base floor tiles (`#8b0000`) under the Blue Crystal with high-contrast tactical sapphire blue (`#162a45`).
   - Grid rendering draws subtle tactical cyan borders (`rgba(0, 210, 211, 0.22)`), perfectly complementing the cyan fountain perimeter ring and glowing crystal while providing clean contrast.

---

## 2. Key Code Changes

### 2.1 `index.html` & `css/style.css`
- Added `#btnRecall` button to `.ability-dock` with icon `<i class="fa-solid fa-house"></i> Recall` and key indicator `B`.
- Updated controls hint: `Click move/attack | Q, W, E, R skills | B recall | P shop | TAB scoreboard`.
- Added CSS styles for `.recall-btn`, `.recall-btn:hover`, and `.recall-btn.channeling` with cyan pulse animation (`recallPulse`).

### 2.2 `js/sound.js`
- Added `playRecall()`: multi-oscillator rising harmonic chime for channeling.
- Added `playTeleport()`: spatial warp swoosh + high-frequency arrival bell.

### 2.3 `js/hero.js`
- Added `this.isRecalling = false`, `this.recallTimer = 0`, `this.recallMax = 2.0`.
- Added `startRecall(combatTexts, sound)`: checks if already in base at full HP, initiates 2.0s channeling, halts movement, plays sound, emits floater.
- Added `cancelRecall(combatTexts)`: resets channeling state and pops `"RECALL CANCELLED"` floater.
- Updated `setTarget(tx, ty)` and `takeDamage(...)`: interrupts recall if active.
- In `Hero.update`: channels timer, generates swirling portal rings (`particles.spawnRing`), teleports to `(100, 480)` on completion, plays arrival sound and particles.
- In `Hero.render`: renders on-canvas channeling progress bar (`RECALLING (Xs)`) and dashed spinning teleport ring at feet.

### 2.4 `js/bots.js`
- Added `this.isRecalling = false`, `this.recallTimer = 0`, `this.recallMax = 2.0`.
- In `BotHero.takeDamage(...)`: interrupts recall if active.
- In `BotHero.update`:
  - Handles 2.0s channeling with crimson portal rings and teleports to `(spawnX, spawnY)` upon completion.
  - In `RETREAT` decision tree: when low HP (`< 28% max HP`), safely distanced from player (`> 360px`), and far from base (`> 260px`), starts recall.
- In `BotHero.render`: renders crimson recall channeling bar and dashed ground teleport ring.

### 2.5 `js/objectives.js`
- Overhauled `updateSummonedLord`:
  - 250px aggro scan: scans Red turrets, Red Crystal, enemy bot, and Red minions; sorts by priority and distance.
  - Attacks with sweeping purple cleave slash (`particles.spawnSlash`), white impact sparks (`particles.spawnBurst`), and blade whoosh SFX (`sound.playSlash()`).
  - Calls `enemyBot.takeDamage` when targeting the enemy bot hero.
  - Autonomous continuous marching: follows waypoints, and continues marching toward Red Base (`1220, 480`) even after waypoints are finished.
  - Sieges and damages the Red Base Crystal.

### 2.6 `js/map.js`
- Split `MAP_TILES` into `BASE_BLUE: { id: 4, color: "#162a45" }` and `BASE_RED: { id: 7, color: "#3d1418" }`.
- `addBase(cx, cy, w, h, team)`: applies `BASE_BLUE` for Blue team and `BASE_RED` for Red team.
- `Map.render`: renders `BASE_BLUE` tiles with `#162a45` sapphire blue and `rgba(0, 210, 211, 0.22)` cyan grid lines; renders `BASE_RED` with `#3d1418` dark crimson.

### 2.7 `js/main.js`
- Bound `#btnRecall` click and `KeyB` keydown to `selectedHero.startRecall(combatTexts, sound)`.
- Bound `KeyP` to toggle the Equipment Shop.
- Cleared `Input.targetX` / `Input.targetY` after consumption when not dragging, ensuring movement clicks do not unintentionally cancel immediate recall.
- Passed `sound, particles` to `objectiveManager.update`.
- Updated `#btnRecall` and `#cdOverlayRecall` UI state during recall channeling.

---

## 3. Verification & Results
- Verified with comprehensive headless Node simulation test suite:
  - Base tile colors: Blue base is `#162a45`, Red base is `#3d1418`.
  - Player recall: 2.0s channeling, damage interruption, and teleport to `(100, 480)`.
  - Bot recall: safe retreat initiation, 2.0s channeling, and teleport to Red base.
  - Summoned Lord: attacks minions (-140 HP), damages bot hero, triggers purple slash VFX + burst + sound, continuously marches without getting stuck, and sieges Red Crystal.
- All 15 JS modules compile with 0 errors.
