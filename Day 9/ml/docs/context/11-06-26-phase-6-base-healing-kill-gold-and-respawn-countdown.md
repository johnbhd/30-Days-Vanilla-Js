# Phase 6: Continuous Base Fountain Healing, Universal Kill Gold & Hero Respawn Countdown

**Date**: 11-06-2026
**Author**: Antigravity Assistant & JB

---

## 1. Overview
Phase 6 brings three foundational gameplay systems into the Land of Dawn:
1. **Continuous Base Fountain Healing**:
   - Both the **Player Hero (Blue team)** and the **Enemy Bot Hero (Red team)** continuously receive health regeneration whenever situated inside their friendly base territory (`distance <= 120px` to friendly crystal).
   - Functions at any non-max health state (low HP, half HP, or 90% HP) at **+20% Max HP per second**, restoring to 100% full health with green sparkle trails, periodic floating `+HP` text, and a distinct cyan/crimson sanctuary perimeter ring on the ground.
   - When the Enemy Bot heals to >= 95% HP, it automatically terminates retreat and resumes its lane push.
2. **Universal Kill Gold Bounty Attribution**:
   - Slaying a Minion, the Turtle, or the Lord reliably awards gold (`gameStats.gold` and `scoreboard.stats.player.gold`), increments CS, and displays an animated golden `+XXg` floater.
   - Fixed missing bounty pipelines across:
     - Melee basic strikes
     - Ranged basic attack projectiles
     - Ability skills (Q, W, E, R)
     - River bosses (Turtle +300g, Lord +500g)
3. **Live Hero Respawn Countdown Timer**:
   - When the Player Hero is defeated, a top-center MOBA countdown card renders on canvas: `💀 DEFEATED • Respawning in Xs` with a dynamic progress fill bar.
   - Live status indicators in the match status HUD and on the TAB Scoreboard (`💀 (Xs)` badge) display dead heroes' revive countdowns.
   - Restores 100% full health and control at Blue Base when the timer reaches 0.

---

## 2. Key Code Changes

### 2.1 `js/hero.js`
- Added `this.respawnMax = 5` and `this.baseHealTimer = 0`.
- In `Hero.update`:
  - When dying: initializes `this.respawnTimer = this.respawnMax`.
  - While inside Blue base (`dist <= 120` to friendly crystal): heals `this.maxHp * 0.20 * dt`, spawns green particle trails, and emits floating `+HP` text every 0.5s.
  - When melee basic attack slays a target with bounty: awards gold, increments CS, and displays `+${bounty}g` text floater.

### 2.2 `js/bots.js`
- In `BotHero.update`:
  - Added continuous fountain healing whenever within 120px of Red Base crystal at any health level (`hp < maxHp`).
  - Automatically transitions state back to `"LANING"` and pushes forward once reaching `>= 95% HP`.

### 2.3 `js/map.js`
- Added visual fountain sanctuary perimeter ring (`radius: 120px`, dashed cyan/crimson with subtle ambient fill) around both base crystals in `Map.render`.
- In `Map.updateCombat`: added fatal kill bounty check for ranged projectiles (`p.team === "BLUE"`), awarding gold, CS, and popping `+${bounty}g` text floaters.

### 2.4 `js/objectives.js`
- Added explicit bounty properties: `this.turtle.bounty = 300` and `this.lord.bounty = 500`.
- Updated `ObjectiveManager.update` signature to accept `scoreboard` and `enemyBot`.
- Slain callbacks update scoreboard gold (`scoreboard.addGold("player", bounty)`), increment objective counts (`turtlesTaken` / `lordsTaken`), and spawn floater text.

### 2.5 `js/skills.js`
- Implemented `applySkillDamage(target, damage, hero, combatTexts, gameStats, scoreboard, sound, particles)`.
- Routed Cyclone Sweep ticks, skill projectiles, AOE circle/beam bursts, and direct ultimate pulls through `applySkillDamage`.
- Automatically checks for fatal kill damage (`prevHp > 0 && newHp <= 0`) and awards bounty gold, increments CS, and pops `+${bounty}g` floater.

### 2.6 `js/renderer.js` & `js/scoreboard.js`
- In `Renderer.renderUI`:
  - Renders top-center respawn countdown banner (`280x50px`) with animated progress bar when player is defeated.
  - Renders `💀 [BOT] Reviving in Xs` inside match status HUD when bot is dead.
- In `Scoreboard.updateUI`:
  - Appends live `💀 (Xs)` badge next to dead champions.

---

## 3. Verification & Testing
- Automated Node.js simulation tests verified:
  - Blue hero healing in Blue Base (+20%/s from 200 to 750 HP).
  - Red bot healing in Red Base (+20%/s from 500 to 2300 HP).
  - Melee, ranged projectile, and skill minion kills awarding gold and spawning `+XXg` floaters.
  - Turtle (+300g) and Lord (+500g) awards and scoreboard objective tracking.
  - Hero respawn countdown from 5s to 0 and 100% HP revive at Blue Base.
