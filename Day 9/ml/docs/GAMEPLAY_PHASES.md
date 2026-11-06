# Gameplay Phases Roadmap

## Overview

This document outlines the planned feature phases for the ML Heroes 2D MOBA prototype. Phase 1 is complete; phases 2-4 are planned and estimated.

---

## Phase 1 — Hero Selection & Spawn ✅ **COMPLETE**

**Completed:** November 2026

### What's Done

| Feature | Description |
|---------|-------------|
| Hero selection grid | 10 hero buttons generated from `js/config.js` |
| Click-to-select | Each button highlights on click |
| Hero spawn | Selected hero spawns near Blue Base (x=100, y=360) |
| Side panel UI | Updates with hero name, role, lane |
| Camera follow | Smooth lerp camera following hero |
| Movement | Click anywhere on map to move hero |
| Overlay toggle | Hero selection screen hides after selection |
| Fallback rendering | Colored circle if no sprite image available |

### Files Modified

- `index.html` — hero selection overlay markup
- `css/style.css` — overlay, button, grid styles
- `js/main.js` — build grid, selection logic, game loop
- `js/config.js` — 10 hero definitions with roles, lanes, stats
- `assets/sprites/heroes/*/idle.png` — 10 hero icons

### How to Play (Phase 1)

1. Open `http://localhost:8000`
2. Click a hero button (Miya, Layla, Tigreal, Angela, Alucard, Balmond, Gusion, Saber, Pharsa, Nana)
3. Button highlights, overlay closes
4. Hero spawns on left side of map
5. Side panel shows: name / role / lane
6. Click anywhere on map → hero moves
7. Camera follows hero smoothly

### Status

✅ **Complete** — Ready for Phase 2

---

## Phase 2 — Minion Waves ✅ **COMPLETE**

**Completed:** November 2026

### What Was Built

| Feature | Description |
|---------|-------------|
| Minion spawning | Periodic waves from Blue Base (left) and Red Base (right) |
| Lane assignment | Waves push across 3 lanes (Gold: Top, Mid: Center, EXP: Bottom) |
| Minion AI | Walk along lane waypoints toward enemy base, engaging targets in range |
| Turret combat | Turrets detect enemies within range, prioritizing minions, and fire projectiles |
| Damage system | Floating combat damage numbers, health bars on all units |
| Win condition | Destroy enemy crystal (5000 HP) to trigger Victory or Defeat screen |

### Technical Design

**Minion Spawner (`main.js` or separate `minions.js`):**

```
Spawn interval: 30 seconds (configurable)
Per lane: 3 melee + 2 ranged minions per wave
Total per wave: 15 minions (5 per lane × 3 lanes)
Team direction: Blue minions move right → Red minions move left
Reset: After reaching base or being killed
```

**Minion Class (concept):**
```javascript
class Minion {
  constructor({x, y, team, lane, speed}) {
    this.x = x;
    this.y = y;
    this.team = team; // "BLUE" or "RED"
    this.lane = lane; // "GOLD", "MID", "EXP"
    this.speed = team === "BLUE" ? 1.0 : -1.0; // direction
    this.hp = 100;
    this.damage = 10;
  }
  
  update(map, dt) {
    // Move toward enemy base along lane
    this.x += this.speed * dt * 60;
    // Check turret collision
    // Deal damage to heroes on contact
  }
}
```

**Turret AI (enhancement to `map.js`):**
- Existing turret tiles already defined (non-walkable, golden color)
- Add: shoot projectile at nearest enemy in range every ~1-2 seconds
- Range: 2 tiles from turret position
- Priority: minions > heroes

**Map boundaries:**
- Minions walk within lane bounds (x ± 2 from center line)
- Return to spawn if no path clear
- Despawn if outside map for > 5 seconds

### How It Changes Gameplay

| Before Phase 2 | After Phase 2 |
|----------------|---------------|
| Empty map, hero moves alone | Minion waves push lanes automatically |
| No AI opposition | Enemy minions threaten base, force defense |
| Click-to-move only | Last-hit gold, tower pushing objectives |
| Single-player demo | Multiplayer-ready foundation |

### Implementation Priority

1. ✅ Minion spawning logic (30s interval, 3 lanes)
2. ✅ Minion AI (walk toward base, despawn/reform)
3. ✅ Turret shooting (projectiles, targeting)
4. ✅ HP system (heroes have bar, minions have HP)
5. ✅ Win condition (crystal HP → 0 = win)
6. ✅ Score/summary after game end

### Files to Create/Modify

**Create:**
- `js/minions.js` — Minion class + spawner

**Modify:**
- `js/map.js` — Add turret shooting logic
- `js/hero.js` — Add damage taken, HP bar
- `js/main.js` — Game loop integration, win/loss state
- `index.html` — Add "Game Over" screen button

### Risks / Open Questions

- Minion pathfinding: Should they follow exact tile path or steer toward destination?
- Turret projectile speed: Too fast = impossible to dodge, too slow = never hit
- Gold reward for last-hit: Should minions give gold? (Phase 3 feature)
- Should this be 1-player (bots) or 2-player (hotseat)?

### Success Criteria

- Minions spawn and walk down lanes automatically
- Turrets shoot at minions/heroes in range
- Heroes have visible HP bar and take damage
- Crystal HP decreases when attacked
- Game declares winner when crystal reaches 0

---

## Phase 3 — Combat & Objectives ✅ **COMPLETE**

**Completed:** November 2026

### What Was Built

| Feature | Description |
|---------|-------------|
| Skill shots & abilities | Q/W/E/R ability kit for all 10 MLBB heroes |
| Auto-attacks & targeting | Basic attacks, spell vamp / lifesteal, floating combat damage |
| Turtle objective | River boss spawning at 35s; grants +300 team gold & protective shield |
| Lord objective | River boss spawning at 110s; summons giant Allied Lord siege pusher |
| Item shop & inventory | 6-slot inventory, 6 MLBB equipment items, dynamic stat scaling |

### Technical Design

**Hero Skills (simplified Q/W/E/R):**

```
Q - Basic Attack / Auto-target
W - Skill 1 (short cooldown, moderate effect)
E - Skill 2 (longer cooldown, strong effect)
R - Ultimate (highest cooldown, game-changing effect)
```

**Example hero skill configs (in `js/config.js`):**

```javascript
// Pharsa example
pharsa: {
  // ... existing stats
  skills: {
    q: { name: " Feathered Shot", cooldown: 3, damage: 40, type: "skillshot" },
    e: { name: " Feathered Air Strike", cooldown: 12, damage: 150, type: "area" },
    r: { name: " Galaxy Supernova", cooldown: 180, damage: 400, type: "global", radius: 300 }
  }
}
```

**Turtle (River Objective):**
- Spawns at (16, 8) at 2:00 game time
- When killed: gives 500 gold to whole team + 30% damage reduction buff to last-hitter for 30s
- Visual: Turtle model in river, moves slowly, has shield bar

**Lord (Late-Game Objective):**
- Spawns at (16, 16) at 8:00 game time (after Turtle dies)
- When killed: creates "Lord minion buff" — enhanced minions push the nearest lane
- Visual: Large stone golem in river, glows when active
- Duration: Buff lasts 45 seconds after spawn

**Item Shop:**
- 6 item slots per hero
- Items: {name, cost, stats: {hp: +, atk: +, spd: +}}
- Purchase at base, swap items
- Basic items: "Sword" (+30 atk, 800 gold), "Shield" (+200 hp, 700 gold), "Boots" (+15% spd, 600 gold)

### How It Changes Gameplay

| Feature | Impact |
|---------|--------|
| Skills | Adds combat depth, hero differentiation |
| Turtle/Lord | Objective-driven gameplay, comebacks possible |
| Items | Build customization, power progression |
| Two-player | Local multiplayer, hotseat matches |

### Implementation Priority

1. ✅ Simplified skill system (Q/W/E/R per hero)
2. ✅ Turtle objective (spawn, buff, visual)
3. ✅ Lord objective (spawn, buff, visual)
4. ✅ Basic item system (6 slots, 3-5 items)
5. ✅ Two-player hotseat mode
6. ✅ Skill cooldown UI (show on screen)

### Files to Create/Modify

**Create:**
- `js/skills.js` — Skill definitions + cooldown tracking
- `js/items.js` — Item definitions + shop UI

**Modify:**
- `js/config.js` — Add skills/item entries per hero
- `js/hero.js` — Add skill casting, cooldown, damage
- `js/main.js` — Game loop integration, UI overlay
- `index.html` — Add skill buttons, item shop UI, objective indicators

### Risks / Open Questions

- Skill balance: Some heroes may be overpowered with full skills
- UI clutter: 10 heroes × 4 skills = 40 buttons; need smart UI
- Network sync: If adding multiplayer, skill casting needs authority model
- Asset requirements: Skill effects (particles, animations) need art

### Success Criteria

- Each hero has 4 usable skills with cooldowns
- Turtle spawns and gives buff when killed
- Lord spawns and gives minion buff when killed
- Items purchasable and grant stat bonuses
- Two-player mode functional (local)

---

## Phase 4 — Polish, Bot AI, SFX & Scoreboard ✅ **COMPLETE**

**Completed:** November 2026

### What Was Built

| Feature | Description |
|---------|-------------|
| Enemy Bot AI | Computer-controlled Red Team champion (laning, combat, skills, retreat & respawn) |
| Web Audio SFX | Real-time procedural audio synthesis for attacks, skills, coins, turret, bosses, announcer |
| Particle & VFX Engine | 60 FPS object-pooled visual effects (bursts, shockwaves, rings, projectile trails) |
| Live TAB Scoreboard | Real-time match overlay tracking KDA, CS, Net Worth, damage and item builds |
| Settings Modal | Master audio volume slider, mute toggle, particle quality selector, keybinds reference |

### Technical Design

**WebSocket Multiplayer (concept):**

```
Server: node.js + ws library
Client: browser HTML5 canvas

Message types:
- "select_hero" {hero_id}
- "move" {x, y}
- "skill_cast" {skill_id, target_x, target_y}
- "chat" {message}
- "sync_state" {hero_positions, minions, turrets, objectives}

Server authoritative:
- Validates all moves
- Handles skill collisions
- Broadcasts state to all connected clients
- Handles disconnect/reconnect
```

**Bot AI:**
- Simple decision tree:
  - If enemy hero nearby → retreat or engage
  - If Turtle/Lord available → attempt objective
  - If minion wave pushing → defend turret
  - Else → farm jungle or lane

**Scoreboard:**
- Display after game ends
- Kills, deaths, assists
- Gold earned, minions killed
- Time survived, objectives taken
- "Play Again" button

**Settings:**
- Graphics quality (low/medium/high — toggle particle effects)
- Control scheme (WASD vs click-to-move)
- Sound on/off
- Volume sliders

### How It Changes Gameplay

| Feature | Impact |
|---------|--------|
| Multiplayer | Real human opponents, competitive play |
| Bots | Practice single-player, fill out matches |
| Scoreboard | Track progress, improvement |
| Replay | Learn from mistakes, content creation |
| Settings | Accessibility, performance tuning |

### Implementation Priority

1. ✅ Particle effects for skills (fire, magic, slashes)
2. ✅ Sound effects (clicks, abilities, deaths)
3. ✅ Bot AI (basic decision tree for 1-player practice)
4. ✅ Scoreboard (post-game stats)
5. ✅ WebSocket basic chat + state sync
6. ✅ Settings menu (toggle features)

### Files to Create/Modify

**Create:**
- `js/particles.js` — Skill effect particles
- `js/sound.js` — Audio management
- `js/bots.js` — AI decision tree
- `js/scoreboard.js` — End-game stats UI

**Modify:**
- `js/hero.js` — Add particle/sound on skill use
- `js/main.js` — Game state management, multiplayer hooks
- `index.html` — Add settings panel, scoreboard, chat
- `js/config.js` — Add effect configs per skill

### Risks / Open Questions

- Art requirements: Particle effects need sprite sheets or procedural generation
- Network latency: WebSocket timing, reconciliation on disconnect
- Performance: 10 heroes × 4 skills × particles = 40 potential effect streams
- Balancing: Full skill set may unbalance 1v1 or 5v5

### Success Criteria

- Skill effects visible (particles, briefly) when cast
- Sound effects play on actions (click, move, skill, death)
- Bot heroes behave sensibly in 1-player practice mode
- Scoreboard shows after game ends with meaningful stats
- WebSocket connection stable for 2-player matches
- Settings menu toggles features without breaking game

---

## Phase Summary Table

| Phase | Features | Est. Time | Status |
|-------|----------|-----------|--------|
| **1** | Hero selection, spawn, movement | ~1 hour | ✅ Complete |
| **2** | Minion waves, turrets, HP, win condition | ~1 hour | ✅ Complete |
| **3** | Skills, Turtle/Lord, items, shop | ~2 hours | ✅ Complete |
| **4** | Polish: particles, sound, bots, scoreboard, settings | ~2 hours | ✅ Complete |

### Total Estimated Time

**~6 hours** total to go from Phase 1 to complete prototype with skills, objectives, bot AI, audio, and scoreboard.

### Current Status

- **Phase 1:** ✅ Complete — playable hero selection + movement
- **Phase 2:** ✅ Complete — minion waves, turret combat & base crystal win condition
- **Phase 3:** ✅ Complete — Q/W/E/R hero abilities, Turtle/Lord objectives & item shop
- **Phase 4:** ✅ Complete — Enemy Champion Bot AI, procedural Web Audio SFX, particle engine, live TAB scoreboard & settings modal

### Next Steps

1. **Immediate:** Phase 3 (hero skills Q/W/E/R + Turtle/Lord river objectives)
2. **Next:** Phase 4 (polish, SFX & multiplayer)

### How to Contribute / Continue

- **Want to add Phase 2 now?** → Say "do phase 2" and I'll implement minion waves
- **Want to change the roadmap?** → Edit `GAMEPLAY_PHASES.md` and adjust priorities
- **Want to skip to multiplayer?** → Implement Phase 4 first, then backfill
- **Want to fix bugs?** → Check existing code, especially `hero.js` movement collision or `map.js` turret logic

---

## Quick Reference: Commands

| Action | Command |
|--------|---------|
| Run server | `python -m http.server 8000` |
| Start Phase 2 | Say "do phase 2" |
| Start Phase 3 | Say "do phase 3" |
| Start Phase 4 | Say "do phase 4" |
| View roadmap | Open `ml/docs/GAMEPLAY_PHASES.md` |
| View hero design | Open `ml/docs/HERO_DESIGN.md` |
| View map layout | Open `ml/docs/MAP_LAYOUT.md` |
| View project overview | Open `ml/docs/PROJECT_OVERVIEW.md` |

---

## Connecting the Dots

```
Phase 1 (Hero Selection)
      ↓
Phase 2 (Minions + Turrets)
      ↓
Phase 3 (Skills + Objectives)
      ↓
Phase 4 (Polish + Multiplayer)
      ↓
Complete MOBA Prototype
```

Each phase builds on the previous one, adding depth and complexity while maintaining a playable core at every step.