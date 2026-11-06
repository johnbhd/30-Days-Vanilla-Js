# Respawn Timer Fix, Turtle Buff Cleanse, Hero Level Preservation & Intelligent Bot Item Builds

**Date:** 11-06-2026  
**Type:** Bug Fix & Enhancement  
**Status:** Complete  

---

## 1. Summary & Motivation
The user identified four critical gameplay issues:
1. **Respawn Countdown Sticking:** Across all heroes and modes, heroes and bots occasionally had their respawn timer freeze at specific numbers (e.g. 5, 3) because external heals (base fountain, level-up stat gains, item purchases, healing waves) set `hp > 0` while `isDead` was true, preventing the respawn timer loop from running.
2. **Turtle Blue Circle Buff Persistence:** When slain, the Turtle granted a 350 HP shield with a prominent blue circle aura (`#00d2d3`). If that hero was killed by the Turtle or enemies, the blue circle lingered on the hero and persisted after respawning because `skillManager.activeBuffs.shield` was not cleansed upon death or respawn.
3. **Hero Level Preservation on Change:** When changing heroes mid-game via the "Change Hero" button (for the player hero, teammate bots, or enemy bots), the newly assigned champions reset to Level 1. Levels, EXP, and skill allocations should now persist seamlessly across hero switches.
4. **Intelligent Bot Item Builds:** Bot champions previously used a simplistic 4-item hardcoded chain regardless of their class. Bots now feature intelligent role-tailored item build paths (Mage, Marksman, Assassin, Tank, Fighter) with AP scaling for magic burst, lifesteal healing, and Immortality resurrect.

## 2. Files Modified / Created
* `Day 9/ml/js/hero.js` — Fixed respawn loop condition (`isDead || hp <= 0`), locked HP to 0 during death, added `setLevel(targetLevel, exp)` method.
* `Day 9/ml/js/bots.js` — Fixed bot respawn loop condition, added `setLevel(targetLevel, exp)`, added intelligent role-based item purchasing with AP scaling, lifesteal, and Immortality resurrect.
* `Day 9/ml/js/objectives.js` — Added target clearing upon death in boss combat leash, ensured slain targets lose aggro immediately.
* `Day 9/ml/js/renderer.js` — Suppressed shield aura rendering while hero is dead.
* `Day 9/ml/js/scoreboard.js` — Rendered visual item icons for bot champions on the scoreboard.
* `Day 9/ml/js/main.js` — Preserved champion levels, EXP, and progression when switching heroes in `startMatch()`.
* `Day 9/ml/js/skills.js` — Prevented heal spells from healing dead units.
* `Day 9/ml/js/config.js` — Exported `GAME`, `HEROES`, `getHeroById`.
* `Day 9/ml/js/items.js` — Exported `ITEM_CATALOG`, `ItemShop`.
* `Day 9/ml/docs/context/11-06-26-respawn-turtle-level-bot-builds.md` — Context documentation.

## 3. Technical Implementation Details
* **Respawn Timer Fix:**
  - In `Hero.prototype.update` and `BotHero.prototype.update`, respawn countdown triggers whenever `this.isDead || this.hp <= 0`.
  - While `this.isDead === true`, `this.hp` is strictly locked to 0 so no external healing (base fountain proximity, item purchases, level-up bonuses, healing waves) can corrupt the death state and cause the timer to freeze at intermediate countdowns (like 5 or 3).
  - Cleaned up recall states and targets upon death.
* **Turtle Blue Circle Buff Cleanse:**
  - In `hero.js`, `skillManager.activeBuffs.shield = 0` is executed immediately upon death and re-verified on respawn.
  - In `renderer.js`, `renderHero()` verifies `!hero.isDead` before drawing the `#00d2d3` shield aura.
  - In `bots.js`, `this.shield = 0` is cleared upon death and respawn.
* **Hero Level Preservation:**
  - Added `setLevel(targetLevel, exp)` on both `Hero` and `BotHero`.
  - In `main.js` (`startMatch`), captured previous level, EXP, and skill progression for `selectedHero` and all teammate/enemy bots in `teamRoster`.
  - When re-instantiating champions, re-applied `setLevel(prevLevel, prevExp)` and preserved skill allocations.
* **Intelligent Bot Item Builds:**
  - Implemented `getRecommendedBuild()` with distinct build paths:
    - **Mages (Pharsa, Nana, Angela):** Swift Boots -> Holy Crystal -> Athena's Shield -> Holy Crystal -> Immortality -> Bloodlust Axe.
    - **Magic Assassin (Gusion):** Swift Boots -> Holy Crystal -> Bloodlust Axe -> Holy Crystal -> Athena's Shield -> Immortality.
    - **Marksmen (Layla, Miya):** Swift Boots -> Blade of Despair -> Bloodlust Axe -> Blade of Despair -> Athena's Shield -> Immortality.
    - **Tank (Tigreal):** Swift Boots -> Athena's Shield -> Immortality -> Athena's Shield -> Blade of Despair -> Bloodlust Axe.
    - **Fighters (Balmond, Alucard, Saber):** Swift Boots -> Blade of Despair -> Bloodlust Axe -> Athena's Shield -> Immortality -> Blade of Despair.
  - Added dynamic item effect handling: AP boosts skill damages (Q +42, W +48, R +90), Lifesteal heals on basic attacks, and Immortality resurrects bots once at 35% HP.
  - Enhanced `scoreboard.js` to render visual item icons for bots.

## 4. Verification & Testing
* Automated unit & integration suite `test_respawn_level_bot_items.js` passed 100%.
* Regression suites `test_hero_skills_burst.js` and `test_custom_slot_selection.js` passed 100%.
* All JS syntax checked with `node -c "Day 9/ml/js"/*.js`.

## 5. Next Steps / Dependencies
* Ready to commit and push.
