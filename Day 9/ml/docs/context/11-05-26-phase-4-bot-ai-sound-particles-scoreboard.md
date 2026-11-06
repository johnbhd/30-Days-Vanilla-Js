# Phase 4: Enemy Champion Bot AI, Web Audio SFX, Particle Engine & Live Scoreboard

**Date:** 11-05-2026  
**Type:** Feature / Gameplay & Audio Engine  
**Status:** Complete  

---

## 1. Summary & Motivation
Phase 4 elevates the ML Heroes 2D MOBA prototype from an objective-clearing sandbox into a complete, dynamic single-player MOBA experience.

This milestone introduces:
1. **Enemy Champion Bot AI (`js/bots.js`):** A computer-controlled Red Team champion equipped with tactical behavior (lane farming, player harassment, ability casting, auto-purchasing items, and retreating to base at low HP).
2. **Procedural Web Audio SFX (`js/sound.js`):** Zero-dependency sound synthesizer powered by the browser's native Web Audio API (basic attacks, skill soundwaves/rumbles, coin pickups, boss roars, and MOBA announcer audio cues).
3. **Particle & Spell VFX Engine (`js/particles.js`):** High-performance 60 FPS particle pool for sparks, expanding shockwave rings, and ability trails.
4. **Live TAB Scoreboard & Match Analytics (`js/scoreboard.js`):** In-game TAB overlay tracking K/D/A, Creep Score (CS), Net Worth, and builds, plus an enhanced post-game breakdown.
5. **Settings & Game Options Modal:** Audio volume control, mute toggle, particle quality options, and a keybinds reference guide.

---

## 2. Files Modified / Created
* [`js/bots.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/bots.js) *(New)* — Enemy Bot AI state machine (`LANING`, `COMBAT`, `RETREAT`, `DEAD`), ability casting, item purchasing, and respawn timer.
* [`js/sound.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/sound.js) *(New)* — Native Web Audio synthesizer with oscillators and gain nodes for zero-latency procedural SFX.
* [`js/particles.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/particles.js) *(New)* — Object-pooled particle engine supporting sparks, shockwave rings, and skill trails with quality tiers.
* [`js/scoreboard.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/scoreboard.js) *(New)* — Match stats engine for K/D/A, CS, Net Worth, and item displays.
* [`index.html`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/index.html) — Added Scoreboard modal markup, Settings modal, action buttons in top-right card, and imported new scripts.
* [`css/style.css`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/css/style.css) — Styles for `.scoreboard-overlay`, `.settings-overlay`, range sliders, and action buttons.
* [`js/hero.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/hero.js) — Integrated bot targeting, attack SFX, and particle bursts.
* [`js/skills.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/skills.js) — Updated projectile and AOE collision sweeps to include `enemyBot`.
* [`js/renderer.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/renderer.js) — Added `renderBot()` and `renderParticles()`.
* [`js/main.js`](file:///data/data/com.termux/files/home/projects/codev/30-Days-Vanilla-Js/Day 9/ml/js/main.js) — Main game loop orchestration for particles, bot AI, audio gesture unlocking, and TAB event listener.

---

## 3. Technical Implementation Details

### 3.1 Bot AI State Machine
```
       [SPAWN]
          │
          ▼
     ┌─► LANING ──────────┐
     │      │ (Player < 280px)
     │      ▼             │
     │   COMBAT           │
     │      │ (HP < 28%)  │
     │      ▼             │
     │   RETREAT ◄────────┘
     │      │
     └──────┴─► [DEAD] ──(18s)──► [RESPAWN]
```

### 3.2 Procedural Audio Synthesis
All audio cues are synthesized in real-time via `AudioContext`:
* **Attack / Shot:** High-to-low exponential frequency ramps on triangle/sine oscillators.
* **Ultimate Cast (R):** Sub-bass sawtooth (220Hz -> 55Hz) coupled with low-frequency rumble.
* **Gold Pickup:** B5 (987.77Hz) to E6 (1318.51Hz) two-tone chime.
* **Announcer Fanfare:** Major chord arpeggios (C5-E5-G5-C6) for victory; descending minor chords for defeat.

### 3.3 Zero-GC Particle Pool
* Pre-allocates a fixed array of 250 particle structs at startup.
* Recycles inactive elements using active boolean flags, guaranteeing consistent 60 FPS performance.

---

## 4. Verification & Testing
* **Syntax Validation:** `for f in js/*.js; do node --check "$f"; done` passed with 0 errors.
* **Automated Node Simulation:**
  - Validated all 30 HTML element IDs.
  - Tested SoundEngine synthesis methods and volume/mute toggles.
  - Tested ParticleEngine burst, ring, and trail emitters under different quality presets.
  - Verified BotHero damage intake, state transitions, item buying, and respawn logic.
  - Simulated 10 full ticks of the live game loop including hero, bot, particles, and renderer.
