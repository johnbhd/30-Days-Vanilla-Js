# Bugfix: Prevent Turtle/Lord Displacement from Tigreal's Ultimate & Add River Pit Leashing

**Date**: 11-06-2026
**Author**: Antigravity Assistant & JB

---

## 1. Root Cause Analysis
- **The Issue**: When playing as Tigreal, using his Ultimate ability (`Implosion`, skill type `ultimate_pull`) near the river or Mid Lane caused the Turtle to be pulled directly into Tigreal's position (in the middle of Mid Lane). The Turtle would then stay in Mid Lane indefinitely or appear to spawn there.
- **Cause**:
  1. In `js/skills.js`, `ultimate_pull` called `getAllEnemies()`, which includes `objectives.turtle` and `objectives.lord`.
  2. The pulling logic indiscriminately moved every target within 160px:
     `e.x = hero.x + (Math.random() - 0.5) * 20;`
     `e.y = hero.y + (Math.random() - 0.5) * 20;`
  3. Because River Bosses in MOBAs must be **crowd-control immune to displacement/pulls**, this caused the Turtle's coordinates to be permanently overwritten.
  4. Furthermore, `objectives.js` lacked pit leashing return logic and did not reset the coordinates to pit coordinates upon respawn.

---

## 2. Solutions Implemented

### 2.1 Displacement CC-Immunity for River Bosses ([`js/skills.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/skills.js))
- In `ultimate_pull`:
  - Added strict check: `const isBossOrTurret = e.isTurret || e.isBoss || (objectives && (e === objectives.turtle || e === objectives.lord));`
  - If `isBossOrTurret` is true, position `(e.x, e.y)` is **NEVER modified**.
  - Bosses still take damage (`applySkillDamage(e, 320, hero, ...)`), but remain rooted in their pit sanctuary.
  - Only minions and enemy heroes (`enemyBot`) are pulled into Tigreal.

### 2.2 River Pit Home Coordinates & Leashing ([`js/objectives.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/objectives.js))
- Added `homeX` and `homeY` properties to both `this.turtle` and `this.lord`.
- Marked `this.turtle.isBoss = true` and `this.lord.isBoss = true`.
- In `updateBossCombat`:
  - If idle or no target, boss leashes and smoothly walks back to `(homeX, homeY)`. Snaps cleanly to pit center when within 3px.
  - If an active target moves farther than 190px from the pit center, boss drops aggro (`boss.target = null`) and leashes back.
  - Aggro proximity check evaluates distance from the pit center (`homeX, homeY`) instead of roaming units.
- On spawn/respawn:
  - Both Turtle and Lord strictly reset coordinates to their designated pit:
    `this.turtle.x = this.pits[this.turtlePit].x;`
    `this.turtle.y = this.pits[this.turtlePit].y;`

---

## 3. Verification
- Simulated Tigreal at `(660, 440)` near the Upper Pit `(660, 380)` casting `Implosion`:
  - Verified minion at `(670, 490)` was pulled into Tigreal.
  - Verified Turtle at `(660, 380)` took 320 damage but **did not move** (`x = 660, y = 380`).
  - Verified offset Turtle leashes back to `(660, 380)`.
- All 15 JS modules compile with 0 errors.
