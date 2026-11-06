# Phase 10: Controls Cleanup, Skill Button Labels, Allied Lord Combat, Angela Long-Range, Alucard Dash & Objective Hunting

**Date:** 11-06-2026  
**Type:** Feature / Bug Fix / Balance / AI Enhancements / UI Polish  
**Status:** Complete  

---

## 1. Summary & Motivation
This phase resolves multiple core gameplay, balance, UI, and AI requests:
1. **Controls Hint Card Removal**: Erased the bottom hint card (`#controlsHint`) from the DOM and CSS.
2. **Skill Button Labels Positioned Below**: Restructured `#skillsTray` so each ability slot uses `.skill-slot-wrapper` with circular button on top and `.skill-label` below the button.
3. **Equal Hero Respawn Timer**: Standardized death respawn duration to `10.0s` for both Player and Enemy Bot (`GAME.HERO_RESPAWN_TIME = 10`), eliminating the previous 5s vs 18s disparity.
4. **Allied Lord Combat & Life Decay Fix**: Added a proper `takeDamage(...)` method to the summoned Lord. Connected enemy Turrets, Base Crystal, Minions, and Bot Hero to actively target and damage the opposing Lord, ensuring its life decreases strictly from enemy damage without phantom self-decay.
5. **Angela Long-Range Ranged Firing**: Increased Angela's base range from `125` to `180`, converting her to a long-range support/mage firing themed magic projectiles (`#ff7675`).
6. **Alucard Q (Groundsplitter) Mid-Dash Attack**: Replaced the unbounded teleport with a 160px directional dash leap towards cursor with dash slash trails and Groundsplitter AOE slam.
7. **Long-Range Aiming & Click-to-Target**:
   - Added click-to-target enemy locking (38px click radius).
   - Biased auto-targeting in attack range towards the player's cursor pointer.
   - Miya Q (`multishot`) now fans arrows out in the direction of the cursor.
8. **Marksman HP Buff**: Increased base HP for Miya (from 750 to 1,650) and Layla (from 720 to 1,620) to restore standard carry survivability.
9. **Enemy Bot Lane Push & Objective Hunting**:
   - Bot detects minion clusters (>= 2 minions) and casts offensive skills (Q/W) to push waves quickly.
   - When Bot is healthy (HP > 65% and player absent/dead/far), Bot rotates to the river pit to fight Turtle or Lord.
   - Added dynamic boss slaying attribution: if Bot slays Lord, Red team secures gold and summons a Red Lord pushing down Mid towards Blue Base!

---

## 2. Files Modified
* [`Day 9/ml/index.html`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/index.html):
  - Removed `.bottom-dock` and `#controlsHint`.
  - Refactored `#skillsTray` with `.skill-slot-wrapper`.
* [`Day 9/ml/css/style.css`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/css/style.css):
  - Added `.skill-slot-wrapper` styles.
  - Positioned `.skill-label` below the button.
  - Removed `.controls-hint` CSS.
* [`Day 9/ml/js/config.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/config.js):
  - Added `GAME.HERO_RESPAWN_TIME = 10`.
  - Buffed Miya HP (`1650`), Layla HP (`1620`), and Angela range (`180`).
* [`Day 9/ml/js/hero.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/hero.js):
  - Set `respawnMax` to `GAME.HERO_RESPAWN_TIME`.
  - Added click-to-target enemy selection in `setTarget`.
  - Added cursor-proximity sorting in `updateCombat`.
  - Added Angela projectile styling.
* [`Day 9/ml/js/bots.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/bots.js):
  - Set `respawnMax` to `GAME.HERO_RESPAWN_TIME`.
  - Added wave-clearing ability logic in `engageLaning`.
  - Added `shouldContestObjective`, `engageObjective`, and `engageLord`.
* [`Day 9/ml/js/objectives.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/objectives.js):
  - Added `makeBossTakeDamage` and `createSummonedLord` with `takeDamage`.
  - Connected `enemyBot` to `updateBossCombat`.
  - Added team-aware slaying rewards (giving Red team gold/shield/Red Lord when Bot slays).
  - Updated `updateSummonedLord` and `render` for both BLUE and RED teams.
* [`Day 9/ml/js/map.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/map.js):
  - Added `objectiveManager` parameter to `updateCombat`.
  - Turrets & Crystal target opposing summoned Lord.
* [`Day 9/ml/js/minions.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/minions.js):
  - Minions target opposing summoned Lord.
* [`Day 9/ml/js/skills.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/skills.js):
  - Reworked Alucard Q (`leap`) into a 160px directional mid-dash attack.
  - Made Miya Q (`multishot`) fan towards cursor aim point.
* [`Day 9/ml/js/renderer.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/renderer.js):
  - Updated fallback respawn duration to 10s.
* [`Day 9/ml/js/main.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day%209/ml/js/main.js):
  - Passed `objectiveManager` to `enemyBot.update`, `minionManager.update`, `map.updateCombat`, and `selectedHero.setTarget`.

---

## 3. Verification
* Ran automated test suite `scratch/test_phase10.js` (8/8 tests passed).
* Ran regression test suite `scratch/test_phase9.js` (5/5 tests passed).
* Verified all 15 JS modules with `node --check` (0 errors).
