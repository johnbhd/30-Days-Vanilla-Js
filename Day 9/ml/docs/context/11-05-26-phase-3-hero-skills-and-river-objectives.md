# Phase 3: Hero Abilities, River Objectives & Item Shop

**Date:** 11-05-2026  
**Type:** Feature  
**Status:** Complete  

---

## 1. Summary & Motivation
Implemented Phase 3 of the ML Heroes 2D MOBA prototype. This elevates the prototype from a basic lane pusher into a deep, engaging MOBA experience featuring:
1. **Hero Abilities Kit (Q/W/E/R):** 4 active skills for each of the 10 heroes (skillshots, AOE blasts, dashes, buffs, and crowd control).
2. **River Boss Objectives (Turtle & Lord):** Neutral bosses in the river with team-wide gold rewards, protective shields, and an allied pushing Lord unit.
3. **Item Shop & 6-Slot Inventory:** In-game shop interface to purchase iconic MLBB items with earned gold, dynamically boosting hero attributes.

---

## 2. Files Modified / Created
* `js/skills.js` — **[NEW]** Skill definitions for all 10 heroes, cooldown timers, active skill projectiles, AOEs, and skill casting logic
* `js/objectives.js` — **[NEW]** ObjectiveManager handling Turtle and Lord river bosses, retaliation AI, team gold rewards, protective shields, and the Summoned Lord Ally siege unit
* `js/items.js` — **[NEW]** Item catalog (Swift Boots, Blade of Despair, Athena's Shield, Bloodlust Axe, Holy Crystal, Immortality), 6-slot inventory, purchasing/selling, and hero stat recalculation
* `js/hero.js` — Updated to handle ability shields, speed boosts, lifesteal on hit, boss targeting, and Immortality revive
* `js/renderer.js` — Added rendering for skill projectiles, AOE circles, beam lasers, Turtle, Lord, Summoned Lord Ally, and shield auras
* `js/main.js` — Integrated hotkey listeners (`Q`, `W`, `E`, `R`, `B`), abilities dock, shop catalog building, and main game loop updates
* `index.html` — Added ability dock buttons (Q, W, E, R), inventory tray (6 slots), gold counter, shop modal overlay, and script imports
* `css/style.css` — Styled circular ability buttons with hotkey badges, cooldown countdown overlays, item shop modal, and inventory slots
* `docs/GAMEPLAY_PHASES.md` — Marked Phase 3 as complete
* `docs/PROJECT_OVERVIEW.md` — Updated status to Phase 1, 2 & 3 complete

---

## 3. Technical Implementation Details
* **Abilities Kit:** All 10 heroes have customized kits matching their MLBB archetypes (e.g. Miya's multi-arrow & conceal, Tigreal's implosion pull, Layla's destruction beam, Balmond's spinning axe, Pharsa's air strikes).
* **Controls:** Keyboard hotkeys (`Q`, `W`, `E`, `R` for skills, `B` for shop) + mobile-friendly circular buttons with radial cooldown overlays.
* **Turtle Objective:** Spawns at `(640, 300)` at 35s. When defeated, awards **+300g** to the team and grants the killer a **350 HP protective shield**.
* **Lord Objective:** Spawns at `(640, 660)` at 110s. When defeated, awards **+500g** and summons an **Allied Lord** with 3,600 HP that marches down Mid Lane to siege enemy turrets and crystals.
* **Item Shop:** 6 equipment slots. Items dynamically recalculate `hero.attackDamage`, `hero.maxHp`, and `hero.speed`. *Immortality* revives the hero once upon fatal damage with 35% HP.

---

## 4. Verification & Testing
* Syntax validated on all JavaScript files using `node --check js/*.js`.
* End-to-end automated test suite verified:
  * Hero abilities Q, W, E, R casting and cooldown ticking.
  * Turtle spawn, combat, defeat reward (+300g & shield).
  * Lord spawn, defeat, and Allied Lord summoning down Mid lane.
  * Item purchasing (Swift Boots, Blade of Despair) and stat recalculation.
  * Immortality revive upon receiving fatal damage.
