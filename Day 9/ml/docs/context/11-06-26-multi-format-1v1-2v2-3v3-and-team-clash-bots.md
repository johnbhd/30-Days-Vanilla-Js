# Multi-Format (1v1, 2v2, 3v3) & Team Clash Bots AI

**Date:** 11-06-2026  
**Type:** Feature  
**Status:** Complete  

---

## 1. Summary & Motivation
- **Pre-Hero Mode Selection:**
  - Before entering hero selection, present a dedicated mode selector:
    - **1v1 Duel:** 1 Player vs 1 Enemy Bot (Mid Lane solo duel).
    - **2v2 Skirmish:** 2 Blue (Player + 1 Ally Bot) vs 2 Red Enemy Bots (Duo Lane push).
    - **3v3 Classic MOBA:** 3 Blue (Player + 2 Ally Bots) vs 3 Red Enemy Bots (3-Lane warfare: Top, Mid, Bot).
- **2-Column Hero Selection Screen:**
  - **Column 1 (BLUE TEAM):** Shows Player in Slot 1 and Blue Ally Bots in Slots 2 & 3.
  - **Column 2 (RED TEAM):** Shows Red Enemy Bots in Slots 1, 2, and 3.
  - Each slot displays hero portrait, name, role badge, and assigned lane.
  - Live preview updates as player picks different heroes, auto-populating balanced ally and enemy team lineups with zero duplicate heroes per team.
- **Multi-Bot AI for Both Teams (Blue & Red):**
  - Bots can be created on either **BLUE team** (Allies) or **RED team** (Enemies).
  - **Lane Focus:** Bots spawn at their respective base, navigate to their assigned lane (Top, Mid, or Bot), push the lane, kill enemy minions, and attack enemy turrets.
  - **Dueling & Hero Combat:** Bots engage opposing heroes and minions in range, casting Q/W/R abilities.
  - **Base Healing & Safe Retreat:** Low HP bots (<28%) retreat and heal at their friendly base fountain or recall safely.
  - **Dynamic Lane Changing & Team Clash:**
    - Periodically (every 25-45s) or when an objective (Turtle/Lord) or teamfight breaks out, bots rotate out of their lane into a `CLASH` / `ROAM` mode.
    - Blue and Red bots meet for 2v2 and 3v3 teamfights.
    - After the clash resolves or timer expires, bots return to their assigned lane.
- **Scoreboard & UI Updates:**
  - Updated Scoreboard to display all Blue and Red team heroes with individual K/D/A, CS, Net Worth, and builds.

## 2. File Updates Plan
- `Day 9/ml/index.html`:
  - Added `#modeSelectOverlay` with cards for 1v1, 2v2, and 3v3.
  - Redesigned `#heroSelectOverlay` with 2-column team lineup panels (`#blueTeamColumn`, `#redTeamColumn`).
- `Day 9/ml/css/style.css`:
  - Added styles for mode select cards, 2-column hero preview slots, and mobile responsive adjustments.
- `Day 9/ml/js/bots.js`:
  - Supported `team` ("BLUE" or "RED"), spawn positions, target bases, enemy filtering, and `CLASH` roaming logic.
- `Day 9/ml/js/main.js`:
  - Implemented match mode state, bot team generation, and game loop integration for `bots` array.
- `Day 9/ml/js/hero.js`, `Day 9/ml/js/minions.js`, `Day 9/ml/js/skills.js`, `Day 9/ml/js/map.js`, `Day 9/ml/js/objectives.js`, `Day 9/ml/js/renderer.js`, `Day 9/ml/js/scoreboard.js`:
  - Supported `bots` list for targeting, combat, rendering, and stats tracking.

## 3. Verification & Results
- Verified that choosing 1v1 generates 1 Blue (Player) vs 1 Red Enemy Bot in the Mid Lane.
- Verified that choosing 2v2 generates 2 Blue (Player + 1 Ally Bot) vs 2 Red Enemy Bots with matching lanes.
- Verified that choosing 3v3 generates 3 Blue vs 3 Red across Top, Mid, and Bot lanes with 6 unique champions.
- Verified that Blue bots spawn at Blue Base `(80, 480)` and Red bots spawn at Red Base `(1160, 480)`.
- Verified lane frontline boundaries for Blue bots (`worldX + 80`) and Red bots (`worldX - 80`) to prevent reckless fountain diving.
- Verified Scoreboard handles all Blue allies and Red enemies with individual K/D/A, CS, and gold.
- All 15 JavaScript files passed `node -c` syntax validation without errors.
