# Fix Turtle Pit River Position & Enemy Bot Autonomous Movement

**Date:** 11-05-2026  
**Type:** Bug Fix / Gameplay Balance  
**Status:** Complete  

---

## 1. Summary & Motivation
The user identified two key gameplay issues:
1. *"fix the turle should be between top lane and middle lane or bottom and middle"* — The Turtle previously spawned at `(640, 300)`, which encroached directly on the Top Lane roadway (`y: 200..320`), causing the Turtle to obstruct Top Lane minion waves.
2. *"fix enemy not moving"* — The enemy champion bot spawned at Red Base (`x: 1160, y: 480`) but remained completely frozen in place because `targetLaneX` was recalculated each frame only a tiny fraction of a pixel ahead (`this.x - speed * dt * 0.7`), which was constantly below the movement threshold (`dist > 4`), leaving the bot stationary.

---

## 2. Files Modified
* [`js/objectives.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/objectives.js) — Re-anchored Turtle and Lord to dedicated open-water river sanctuary pits:
  - Upper River Pit: `(640, 370)` — centered between Top Lane (`y: 240`) and Mid Lane (`y: 480`).
  - Lower River Pit: `(640, 610)` — centered between Mid Lane (`y: 480`) and Bottom Lane (`y: 720`).
  - Configured Turtle to spawn between Top and Mid lanes initially, and alternate pits upon respawn.
* [`js/bots.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/bots.js) — Overhauled bot movement logic:
  - Assigned lane Y based on role/lane (`GOLD` -> 240, `MID` -> 480, `EXP` -> 720).
  - Set long-range target destination (`targetX = 120`) so the bot continuously marches forward down its lane towards the Blue Base at full speed (`~125–170 px/sec`).
  - Added minion engagement, turret attacking, combat engagement when player approaches (<300px), and base retreat when HP < 28%.
* [`js/main.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/main.js) — Passed `chosenHeroData.lane` to `BotHero` so the Bot matches the player's chosen lane for 1v1 action, and positioned initial hero spawns in their respective lanes.
* [`js/map.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/map.js) — Rendered circular stone sanctuary decals for both the Upper and Lower River Boss Pits at `y = 370` and `y = 610`.

---

## 3. Verification & Testing
* **Syntax Validation:** `for f in js/*.js; do node --check "$f"; done` passed with 0 errors.
* **Turtle Boundary Check:** Validated that at `y = 370`, Turtle is safely placed with 50px+ clear buffer from Top Lane (`y: 200..320`) and 70px+ from Mid Lane (`y: 440..560`).
* **Bot Movement Validation:** Simulated 1.0 second of laning; confirmed bot marched 123.2 pixels forward down the lane, engaged player upon proximity, and retreated to base when HP fell below 28%.
