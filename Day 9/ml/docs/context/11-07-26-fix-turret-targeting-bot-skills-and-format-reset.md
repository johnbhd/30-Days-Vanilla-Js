# Context Document: Fix Turret Targeting, Bot Skill Intelligence, and Match Format Reset

## Date
November 7, 2026

## Objective
1. **Fix Long-Range Hero Bullet on Turret**: Ensure ranged heroes (Miya, Layla, Angela, Pharsa, Nana) properly fire and display projectiles when attacking turrets and base crystals. Fix coordinate resolution so `target.worldX` takes precedence over tile `target.x`.
2. **Fix Melee Splash Attack Direction**: Ensure melee attacks against turrets face toward the turret rather than in the opposite direction by fixing the target coordinate resolution bug.
3. **Enhance Bot Skill IQ & Usage (Both Teams)**: Fix bots not using skills or having too restrictive combat ranges. Implement intelligent combo execution tailored to each hero's role and kit, including poke in laning, team clash combos, objective burning, and self-buffs/shields with proper visual effects and audio cues.
4. **Clean Game Reset on Format Change**: When switching match format (e.g., 2v2 to 1v1 or 3v3), completely reset the match state (fresh map, full HP turrets, cleared minions, reset scoreboard, 0:00 timer, Level 1 stats).

## Target Files
- `Day 9/ml/js/utils.js`: Add `getEntityPos(entity)` helper.
- `Day 9/ml/js/hero.js`: Prioritize `worldX` / `worldY` over tile `x` / `y` when targeting, calculating distance, sorting targets, spawning projectiles, and rendering melee slash visuals.
- `Day 9/ml/js/map.js`: Prioritize `worldX` / `worldY` over tile `x` / `y` for turret target checks, base target checks, and projectile tracking.
- `Day 9/ml/js/minions.js`: Prioritize `worldX` / `worldY` over tile `x` / `y` for minion targeting.
- `Day 9/ml/js/objectives.js`: Prioritize `worldX` / `worldY` over tile `x` / `y` for river boss and summoned lord targeting.
- `Day 9/ml/js/bots.js`: Overhaul combat engagement range, implement intelligent skill combo rotations, enable poke/wave-clear in laning, and allow skill usage against turrets and bosses.
- `Day 9/ml/js/main.js`: Implement `resetGameForNewFormat()` and integrate into `selectMatchMode()` to ensure changing format completely resets the game.

## Status
Complete

## Changes Made
1. **Turret World Coordinate Resolution & Visible Bullet**:
   - In `Day 9/ml/js/utils.js`: Added and exported `getEntityPos(entity)` helper prioritizing `worldX` / `worldY` over `x` / `y`.
   - In `Day 9/ml/js/hero.js`: Updated target selection, distance calculations, projectile creation, and melee slash effects to prioritize `target.worldX !== undefined ? target.worldX : target.x`. Ranged hero basic attack bullets now visibly fly straight to the turret and register damage.
   - In `Day 9/ml/js/map.js`: Updated turret/base target acquisition and projectile movement loop (`p.target.worldX !== undefined ? p.target.worldX : p.target.x`).
   - In `Day 9/ml/js/minions.js`: Standardized target coordinate extraction for minions attacking heroes, bots, and turrets.
   - In `Day 9/ml/js/objectives.js`: Standardized coordinate extraction for river bosses and summoned Lord.

2. **Melee Slash Direction on Turrets**:
   - Fixed melee slash effect (`particles.spawnSlash(this.x, this.y, tx, ty, ...)`) so `(tx, ty)` points directly at the turret world position `(turret.worldX, turret.worldY)` instead of tile position (e.g. 19, 14), eliminating opposite-direction slashes and sparks.

3. **Bot Skill IQ & Usage (Both Teams)**:
   - In `Day 9/ml/js/bots.js`:
     - Expanded combat engagement range to dynamic `combatThreatRange = Math.max(380, maxSkillReach + 50)` so bots don't sit passively out of range.
     - Added `this.heroData = heroData` and `this.skillActionTimer = 0` to enable fluid chaining of signature combos.
     - Implemented `castBotSkills(targetHero, dist, ...)` with customized signature combos for all 10 heroes (Tigreal pull & stun initiate, Gusion daggers & dash, Layla long-range sniping, Miya rain & split arrows, Angela heal & puppet bind, Pharsa artillery meteors, Nana Molina morph CC, Alucard leap & lifesteal, Balmond execute finisher, Saber knockup finisher).
     - Enabled lane poking in `engageLaning`, AOE wave-clearing on minion waves, Q casting to siege turrets faster, and Q/W casting to burn river bosses and summoned Lords.

4. **Clean Game Reset on Match Format Change**:
   - In `Day 9/ml/js/main.js`:
     - Implemented `resetGameForNewFormat()` and added `isFormatReset` flag.
     - When switching formats (e.g. 2v2 to 1v1 or 3v3) via `selectMatchMode(mode)`, the game state is completely reset (map recreated with all turrets at full HP, minions cleared, objectives reset, scoreboard reset, match timer reset to 0:00, gameStats reset).
     - In `startMatch()`, if `isFormatReset` is active, level/item preservation is bypassed so all champions start fresh at Level 1 with 0 items.

## Verification
- Syntax checked all JS files with `node -c "Day 9/ml/js"/*.js` (zero syntax errors).
- Executed comprehensive unit test script `test_fixes_turret_bot_skills_and_reset.js` verifying:
  - Ranged hero projectile targeting and flight toward turret world coordinates.
  - Melee hero slash angle toward turret world coordinates.
  - Bot skill combo execution (Tigreal initiation, stun, Layla poke, Angela heal).
  - Bot skill casting on turrets during siege.
  - Match format switch resetting all turrets, minions, scoreboard, and starting heroes at Level 1.
- Executed existing test suites (`test_hero_tabs_and_announcements.js`, `test_respawn_level_bot_items.js`, `test_custom_slot_selection.js`) with 100% passing results.
