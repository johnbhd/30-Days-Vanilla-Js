# Turret Dash Collision Unstuck & Bot AI Recall/Tower Threat Intelligence

**Date:** 11-06-2026  
**Type:** Bug Fix & AI Enhancement  
**Status:** Complete  

---

## 1. Summary & Motivation
This update resolves three combat and AI issues in ML Heroes 2D MOBA:
1. **Hero Dash/Leap Stuck in Turret**: When heroes cast dash or leap skills (Alucard Q Groundsplitter, Balmond Q, Tigreal W, Saber E) towards a turret center, landing inside the non-walkable turret tile (`MAP_TILES.TURRET`) caused the hero's collision box to become permanently stuck.
2. **Interrupted Enemy Recall Loop**: When an enemy bot channeled recall and took damage, its recall was previously cancelled without an internal cooldown or recent damage delay. On the next frame, because the player was still distant or the attacker was a projectile/minion, the bot immediately re-channelled recall in place, repeatedly getting attacked while standing still.
3. **Enemy Hero Tower Intelligence**: The enemy bot would dive enemy turrets without minions tanking shots, or continue standing in turret range while taking tower blasts rather than disengaging.

---

## 2. Files Modified / Created
* `js/skills.js` — Added `resolveTurretCollision(destX, destY, map, origX, origY)` helper to `SkillManager`; wrapped leap (`Alucard Q`), dashes (`dash`, `dash_knock`, `dash_push`, `dash_reset`), and Tigreal's ultimate pull to clamp landing coordinates at least 38px outside turret perimeters.
* `js/hero.js` — Added turret perimeter proximity check (`< 36px`) in `checkWalkable`, and added continuous unstuck separation (`< 38px`) in `hero.update()` to eject any overlapping hero safely onto walkable lane tiles.
* `js/map.js` — Tagged turret projectiles with `isTurret: true` and base crystal blasts with `isTurret: true, isCrystal: true`; passed `{ team, isTurret, isCrystal }` to `target.takeDamage`.
* `js/bots.js` — Added `recallCooldown`, `recentDamageTimer`, `turretThreatTimer`, and `checkTurretSafety(map, minionManager, combatTexts)`. Made interrupted recalls trigger a 5.0s cooldown and force fleeing on foot towards Red Base. Added tower dive intelligence so bots disengage from turrets when untanked or hit by tower fire. Added turret separation in `stepMovement()`.
* `scratch/test_tower_recall_fixes.js` — Comprehensive automated test suite verifying turret collision resolution, unstuck separation, bot recall cooldown & retreat, and turret threat disengagement.

---

## 3. Technical Implementation Details

### 3.1 Turret Dash Collision Resolution & Unstuck Separation
* **Turret Geometry**: Turret tiles are 40x40px centered at `(worldX, worldY)`. Half-diagonal is ~28.3px; hero radius is 18px (`checkWalkable` sample box radius 12.6px).
* **Safe Landing Distance (38px)**:
  ```javascript
  const d = Math.hypot(destX - t.worldX, destY - t.worldY);
  if (d < 38) {
    const angle = d > 1 ? Math.atan2(destY - t.worldY, destX - t.worldX) : Math.atan2(origY - t.worldY, origX - t.worldX);
    destX = t.worldX + Math.cos(angle) * 38;
    destY = t.worldY + Math.sin(angle) * 38;
  }
  ```
* **Continuous Separation in Update Loop**: In both `Hero.update` and `BotHero.stepMovement`, if distance to any active turret center is `< 38px`, the hero is smoothly separated outward, ensuring a hero can never remain trapped inside a turret.

### 3.2 Interrupted Recall & Low-Health Escape
* When damaged, `takeDamage` sets `recallCooldown = 5.0s` and `recentDamageTimer = 4.0s`.
* If `this.hp < this.maxHp * 0.35`:
  * Recall is strictly guarded: requires `recallCooldown <= 0`, `recentDamageTimer <= 0`, `turretThreatTimer <= 0`, `distToPlayer > 420px`, no Blue minions within 240px, and no Blue turrets within 220px.
  * If any condition fails (e.g. damaged or in combat), bot immediately flees on foot towards `(this.spawnX, this.spawnY)` at Red Base.
  * If chased closely (`distToPlayer < 180px`), bot casts defensive peel abilities (Q/W) backward while continuing to run.

### 3.3 Tower Aggro & Dive Avoidance
* `checkTurretSafety(map, minionManager, combatTexts)`:
  * Detects if the bot is within 190px of an active Blue turret or base crystal.
  * Counts friendly Red minions within turret range.
  * If `turretThreatTimer > 0` (bot hit by tower), `redMinionsTanking === 0`, or `bot.hp < 45%`, bot disengages, aborts chases/attacks, cancels any recall, sets `state = "RETREAT"`, vectors away from the turret toward Red base, and displays `"[BOT] FLEEING TURRET!"`.

---

## 4. Verification & Testing
* `test_tower_recall_fixes.js`:
  1. Hero leap directly into turret center: landing coordinate verified outside turret at 38.0px, walkable.
  2. Forced hero placement onto turret center: unstuck separation pushes hero to 38.0px.
  3. Recalling bot hit by player attack: recall cancelled, 5s cooldown verified, bot does not restart recall on subsequent frame and flees to Red Base on foot.
  4. Bot under enemy turret with no minions: bot retreats away from turret with `[BOT] FLEEING TURRET!` alert.
  5. Bot hit by turret projectile: sets `turretThreatTimer` and retreats.
  6. Bot turret separation verified.
* Existing regressions verified:
  * `test_phase10.js` (8/8 tests passed).
  * `test_phase9.js` (5/5 tests passed).
  * All 15 JavaScript files in `js/` pass `node --check`.
