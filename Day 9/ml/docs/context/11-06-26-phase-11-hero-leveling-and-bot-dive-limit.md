# Phase 11 Context: Hero Leveling (1–15), Skill Point Upgrades & Bot Lane Dive Limit

**Date:** 2026-11-06  
**Status:** Completed  
**Branch:** main  

## 1. Objectives & Scope
Based on user feedback:
> "only hero leveling and skills points for now, plus fix the enemy hero when the tower was 3 in the lane it diving until 1st tower just to follow me it should only like dive in the 3rd tower and not trying to follow in the base to not die the rest the 2 and 3 disregard that 2 you propose"

Scope implemented:
1. **Hero Leveling & Progression System (Levels 1–15)**:
   - Level curve configured via `GAME.LEVEL_EXP` (table for Lv 1 to 15).
   - Stat scaling per level: +65 Max HP, +4.5 Attack Damage, +2 Armor.
   - EXP awards: minion kills (+45), hero slay (+220), turret destruction (+180), Turtle (+300), Lord (+450), and passive trickle (+2 EXP/s).
   - Level badges (`Lv. X`) rendered next to overhead health bars on canvas for both Player and Bot.
   - Player HUD: Level badge circle `#heroLevelBadge`, EXP progress bar container with fill `#heroExpBar` and text `#heroExpText`.

2. **Skill Point Allocation & Ability Upgrades**:
   - Start with 1 skill point at Level 1, gaining +1 point per level up.
   - Skill unlock / rank gates: Q/W/E max rank 5, Ultimate (R) max rank 3 gated at Level 4 (Rank 1), Level 8 (Rank 2), and Level 12 (Rank 3).
   - Upgraded skills deal scaled damage (+22% per rank) and have lower cooldowns (-0.4s per rank, -1.5s for R).
   - Skill upgrading UI: Pulsing gold `+` buttons (`#upBtnQ`, `#upBtnW`, `#upBtnE`, `#upBtnR`) when points are available and rank/level requirements are met; abilities header indicates unspent points (`#skillPointsBadge`).
   - Visual rank pips (`.skill-rank-pips` with active dots) under each ability in the top-right card.
   - Bot auto-allocates skill points prioritizing Ultimate at Lv 4/8/12, then balancing Q and W.

3. **Bot Lane Dive Limit & Anti-Suicide Boundary**:
   - Calculates the current frontline Blue turret dynamically in the bot's lane:
     - When all 3 towers are alive: Frontline is Outer Turret (`worldX = 540`), cutoff is `460px`.
     - When Outer turret falls: Frontline advances to Inner Turret (`worldX = 420`), cutoff is `340px`.
     - When Inner turret falls: Frontline advances to Base Turret (`worldX = 260`), cutoff is `180px`.
   - If player retreats deep past the frontline cutoff (`player.x < chaseCutoff`), the bot breaks pursuit (`state = "LANING"`), clamps its target coordinate, and pushes the lane or attacks the frontline tower instead of chasing the player into inner towers/base and suiciding.
   - Aggressive combat is maintained when player is fighting around the frontline turret (`player.x >= chaseCutoff`).

## 2. Modified Files
- `js/config.js`: Added `MAX_HERO_LEVEL`, `LEVEL_EXP`, `STAT_GROWTH`, and `EXP_REWARDS`.
- `js/hero.js`:
  - Added progression fields (`level`, `exp`, `maxExp`, `skillPoints`, `skillLevels`, `passiveExpTimer`).
  - Added `gainExp(amount, combatTexts, particles, sound)` with stat growth and leveling VFX/SFX.
  - Added passive EXP trickle (+2 EXP/s) in `update(dt)`.
  - Added canvas overhead level badge (`Lv. X`) beside health bar.
  - Awarded minion kill EXP on melee auto-attacks.
- `js/skills.js`:
  - Added `canCast(slot, hero)` and `upgradeSkill(slot, hero, combatTexts, sound)`.
  - Scaled projectile and AOE damage and cooldowns by `dmgMultiplier` and `cdReduction`.
  - Awarded EXP on skill kill bounties.
- `js/bots.js`:
  - Added progression fields and auto-allocation logic (`gainExp`, `autoAllocateSkill`).
  - Added `getLaneFrontlineBoundary(map)` calculating dynamic cutoff.
  - Enforced anti-suicide boundary in `update`, `engagePlayer`, and `engageLaning`.
  - Added canvas overhead level badge beside health bar.
- `js/map.js`:
  - Awarded turret destruction EXP to `hero` or `enemyBot` in `updateCombat`.
  - Awarded minion kill EXP on player ranged projectile kills.
- `js/objectives.js`:
  - Awarded Turtle (+300 EXP) and Lord (+450 EXP) to slayer in slay callbacks.
- `js/sound.js`:
  - Added procedural synthesizer sound effects `playLevelUp()` (ascending arpeggio) and `playUpgradeSkill()`.
- `index.html`:
  - Added `#heroLevelBadge`, `#heroExpBar`, `#heroExpText` to `#heroPanel`.
  - Added `#skillPointsBadge`, `#skillPointsCount`, `#upBtnQ/W/E/R`, and rank pips `#pipsSkillQ/W/E/R` to `#heroSkillsPanel`.
- `css/style.css`:
  - Styled level badge circle, exp progress bar, gold pulsing `+` upgrade buttons, rank pips, and skill locked state.
  - Added responsive scaling for mobile screens (`@media (max-width: 768px)` and `@media (max-width: 480px)`).
- `js/main.js`:
  - Added `updateHeroProgressionUI(hero, skillManager)` updating level, EXP bar, `+` button visibility, and rank pips.
  - Added click handlers for `#upBtnQ`, `#upBtnW`, `#upBtnE`, `#upBtnR`.
  - Initialized progression UI in `startMatch` and updated it continuously in `loop`.

## 3. Automated Verification
- Created `/root/.gemini/antigravity-cli/brain/ed37921f-ef3b-4565-8528-e740b8d6ee97/scratch/test_phase11_leveling_and_dive_limit.js`.
- Verified 6 specific test suites:
  1. Hero Leveling & Stat Growth (+65 HP, +4.5 ATK, skill points).
  2. Skill Unlocking, Upgrading, Rank Scaling, and Ultimate Level 4 lock gate.
  3. Bot Progression & Auto-Allocation (prioritizing R at Lv 4, balancing Q/W).
  4. Bot Lane Dive Limit with 3 towers active: engages player at frontline (x=500), but breaks chase and switches to laning when player flees to 2nd tower (x=400) or 1st tower (x=200).
  5. Progressive Frontline Advancement: when outer tower falls, bot advances to 2nd tower area (x=400), but stops before 1st tower (x=300).
  6. HTML & CSS UI Elements verification.
- Ran all regression suites: `test_phase10.js` (8/8 passed), `test_tower_recall_fixes.js` (4/4 passed), and `test_phase11_leveling_and_dive_limit.js` (6/6 passed). All 18 tests passed.
