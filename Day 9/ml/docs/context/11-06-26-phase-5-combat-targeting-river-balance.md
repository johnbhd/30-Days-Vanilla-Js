# Phase 5: Combat Enhancements, Targeting Fixes & River Balance

**Date**: 11-06-2026
**Author**: Antigravity Assistant & JB

---

## 1. Overview
In response to gameplay balance and combat feel observations, Phase 5 delivers five core enhancements:
1. **Dynamic Melee Slash FX**: Real-time sweeping crescent blade slash arcs and bright impact sparks for short-range melee heroes (Balmond, Tigreal, Alucard, Saber, Gusion) with procedural whoosh audio synthesizer.
2. **Defensive Targeting for Enemy Bot Hero**: Blue Turrets, Blue Minions, and the Blue Base Crystal actively acquire the Red Bot hero as a priority target when in range, firing defensive cannonballs, energy bolts, and melee strikes.
3. **Decreased Attack Ranges & Tactical Circle Zones**: Range values for Ranged heroes were tightened from 240px to 170–185px, and Melee heroes from 110–140px to 68–75px, rendered on-canvas as a clean, stylish dashed cyan targeting zone circle.
4. **Passive Gold Income**: Both Player and Bot hero receive ambient +10 gold every 3.0 seconds, updating the HUD and scoreboard seamlessly.
5. **Exact Horizontal & Vertical River Centering**: Repositioned Turtle and Lord pits to the exact horizontal center (`x = 660px`) and vertical centers (`y = 380px` upper pit, `y = 620px` lower pit) of the blue river channel, aligned with stone sanctuary floor decals.

---

## 2. Key Code Modifications

### 2.1 `js/particles.js` & `js/sound.js`
- Added `slash` particle type to `ParticleEngine` object pool.
- Added `spawnSlash(x, y, targetX, targetY, color, radius)` computing orientation angle and drawing dual-layer crescent arc (outer glowing color ring + bright white core blade streak).
- Added `SoundEngine.playSlash()` synthesizing a fast sawtooth frequency ramp whoosh.
- Added `SoundEngine.playCrystalBlast()` synthesizing resonant energy discharge chime for base crystal defense.

### 2.2 `js/config.js`, `js/hero.js` & `js/bots.js`
- Adjusted `stats.range` across all 10 heroes to tactical MOBA thresholds:
  - Ranged (Layla, Miya, Pharsa, Nana): 170–185px (~4.3 tiles).
  - Mid-range (Angela): 125px.
  - Melee (Balmond, Tigreal, Alucard, Saber, Gusion): 68–75px (~1.75 tiles).
- In `Hero.render`: draws dashed neon targeting circle zone (`rgba(78, 204, 163, 0.45)`) with subtle interior fill.
- In `Hero.update` & `BotHero.engagePlayer`: executing melee basic attack triggers `particles.spawnSlash`, `particles.spawnBurst`, and `sound.playSlash()`.
- Added uniform `Hero.takeDamage(...)` method.

### 2.3 `js/map.js` & `js/minions.js`
- Expanded `Map.updateCombat` and `MinionManager.update` signatures to accept `enemyBot, sound, particles, scoreboard`.
- Blue Turrets now scan for candidate enemy heroes (`enemyBot`), firing defensive shots when minions are absent or when attacked.
- Added **Base Crystal Defense System**: Blue Base Crystal and Red Base Crystal detect invading enemy champions and minions within a 210px defense radius, firing 95-damage energy bolts.
- Blue Minions now acquire `enemyBot` within `attackRange + 45px` and deal melee/ranged damage.

### 2.4 `js/objectives.js` & `js/map.js`
- Centered pits at `x = 660px` (true center of columns 15–17, `x = 600..720px`).
- Centered upper pit at `y = 380px` (true vertical midpoint between Top Lane row 7 and Mid Lane row 11).
- Centered lower pit at `y = 620px` (true vertical midpoint between Mid Lane row 13 and EXP Lane row 17).
- Updated boss sanctuary stone decals and river water wave lines to align with `x = 660px`.

### 2.5 `js/main.js`
- Added `passiveGoldTimer`: distributes +10 gold every 3.0 seconds to both Player (`gameStats.gold`) and Bot (`enemyBot.gold`), recording gains in `scoreboard`.
- Passed `enemyBot` to `minionManager.update` and `map.updateCombat`.

---

## 3. Verification & Testing
- Node.js compilation check passed across all 15 modules with 0 errors.
- Unit and combat simulation tests verified:
  - Balmond attack range (75px) vs Layla attack range (185px).
  - Upper pit `(660, 380)` and Lower pit `(660, 620)`.
  - Slash particle generation upon melee basic attack.
  - Blue Turret and Blue Base Crystal targeting `enemyBot` and firing projectiles.
  - Blue Minions targeting `enemyBot` and dealing damage.
  - Passive gold accumulator +10g every 3.0s.
