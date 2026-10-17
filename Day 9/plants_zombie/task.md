# Task: Add 3 New Plants (Wall-nut, Snow Pea, Repeater) + Modularize JavaScript

**Status:** Design proposed — awaiting approval before implementation.
**Type:** Architectural. Preserve all existing game logic and UI polish. Health stays strictly `1 = alive`, `0 = immediate Game Over`.

---

## 1. Asset research findings (verification report)

Searched OpenGameArt (direct + keyword searches: *pea shooter, ice/frost plant shooter, nut, acorn, cactus, plant tower defense*), Kenney, and itch.io listings; opened the actual asset/license pages.

**Result: no openly-licensed cartoon side-view "plant shooter" or "wall-nut" sprite exists that matches the current bevouliin.com art style.** Candidates found and rejected:

| Candidate | Source | License | Why rejected |
|---|---|---|---|
| CC0 Food Icons (AntumDeluge) | OpenGameArt node/114088 | **CC0** ✓ | 32×32 pixel-art icons — style mismatch with cartoon vector plants |
| Kenney Tower Defense (Top-Down) | OpenGameArt | **CC0** ✓ | Top-down tiles, wrong perspective/style |
| LPC Plant Repack / cactus packs | OpenGameArt | CC-BY-SA etc. | Pixel-art, wrong style; SA would infect the project |

### Selected approach (allowed fallback: original/closest-open-licensed art)

Derive new art from the project's **already-licensed** sprite — `peashooter_cut.png` by **bevouliin.com, CC-BY 4.0** (page verified: OGA "Shadow Man-Eating Plant Sprites", CC-BY 4.0 — same artist as the current peashooter):

| New plant | Asset plan | License basis |
|---|---|---|
| **Wall-nut** | **Original cartoon walnut PNG generated for this project** (pngjs, supersampled anti-aliasing: body + cap + seam + highlight, matched palette) | Original work — no third-party rights; credited as such |
| **Snow Pea** | Recolor (hue-shift green → ice blue) of `peashooter_cut.png` | CC-BY 4.0 permits adaptations; attribution kept + noted as recolor |
| **Repeater** | Same sprite + programmatically drawn **second barrel** + deeper-green tint | CC-BY 4.0 derivative, attributed |

- All attributions preserved in footer; new lines added (e.g. *Snow Pea / Repeater recolors derived from bevouliin.com peashooter — CC-BY 4.0; Wall-nut original art for this project*).
- **No official PvZ artwork anywhere.**
- Repeater fallback if the drawn second barrel fails visual verification: reuse plain peashooter sprite (behavior distinguishes it) — will be reported.

---

## 2. Module structure (after)

Flat, ~11 files, no bundler, native `<script type="module">` (served over HTTP as today; `file://` does not work with ES modules — already required the local server):

```
js/
  main.js         — canvas + DPR setup, game loop, restart, init
  config.js       — LOGICAL_W/H, COLS/ROWS/CELL sizes, BALANCE, PLANT_TYPES (all 5)
  state.js        — createState() + grid init
  assets.js       — SPRITE_SRC, one-time image loading, spriteReady(), sprite content-bounds metadata
  plants.js       — createPlant(), updatePlants(state, now): sun production + shared shooter behavior (multi-shot queue)
  zombies.js      — spawnZombie(), updateZombies(state, now, dt): movement w/ slow, eating, house breach (health 1→0 lives here, verbatim)
  projectiles.js  — spawnProjectile(), updateProjectiles(state): movement, hits, slow application, kill reward
  suns.js         — spawnSun(), updateSuns(), sky-sun spawn
  ui.js           — updateUI(), seed-card wiring, canvas click (collect/plant/restart), hover cursor
  rendering.js    — draw(state): orchestrator + entities + preview + Game Over overlay
  lawn.js         — drawLawn() (current drawGrid, unchanged visually)
```

### Code mapping (current game.js → module)

| Current game.js content | Destination |
|---|---|
| DPR/canvas setup, gameLoop, restartGame, gameOver flag | `main.js` (flag moves to `state.gameOver`, logic unchanged) |
| LOGICAL_W/H, COLS/ROWS, CELL_W/H, PLANTS defs | `config.js` (generalized → PLANT_TYPES + BALANCE) |
| state object + grid init | `state.js` |
| SPRITE_SRC, sprite loading, spriteReady, PLANT_SPRITE bounds | `assets.js` |
| sunflower/shooter logic inside update() | `plants.js` (config-driven) |
| spawnZombie + zombie update/eat/breach block | `zombies.js` |
| pea update/hit block + spawn of peas | `projectiles.js` (`state.peas` → `state.projectiles`, type field added) |
| spawnSun + sun update + sky-sun block | `suns.js` |
| updateUI, seed-card listeners, canvas click, mousemove | `ui.js` |
| draw(), drawPlant, drawZombie, drawPea, drawSun, preview, Game Over overlay | `rendering.js` |
| drawGrid | `lawn.js` |

**Dependency direction is one-way** (config ← everything; plants → suns/projectiles; rendering → assets/lawn; ui → config/state) — **no circular imports**; systems receive `state` as an argument; no `window.*` globals.

---

## 3. Config-driven plants (no if/else forests)

```js
PLANT_TYPES = {
  sunflower: { name:'Sunflower', cost:50,  hp:60,  role:'sun',     sunInterval:7000 },
  peashooter:{ name:'Peashooter',cost:100, hp:100, role:'shooter', shotsPerAttack:1, projectile:'pea' },
  wallnut:   { name:'Wall-nut', cost:50,  hp:400, role:'defense' },
  snowpea:   { name:'Snow Pea', cost:175, hp:100, role:'shooter', shotsPerAttack:1, projectile:'icePea' },
  repeater:  { name:'Repeater', cost:200, hp:100, role:'shooter', shotsPerAttack:2, shotDelay:200, projectile:'pea' },
}
```

All balance centralized here plus `BALANCE = { PEA_DAMAGE:25, PEA_SPEED:4, EAT_DPS:8, SLOW_MULT:0.65, SLOW_MS:3000, REPEATER_DELAY:200, ... }` — no scattered magic numbers.

### Shared shooter behavior (one code path for all 3 shooters)

On cooldown + zombie in lane → `p.shotsLeft = shotsPerAttack`, `p.nextShotAt = now`; each frame while `shotsLeft > 0 && now >= nextShotAt`: `spawnProjectile(plant, type)`, `shotsLeft--`, `nextShotAt += shotDelay`.
- Peashooter / Snow Pea: 1 shot
- Repeater: 2 shots 200ms apart (PEA → PEA feel, two real projectiles, not double damage)

### Wall-nut

Same eating path as every plant (zombie stops, deals EAT_DPS, resumes at 0 HP) — only `hp: 400` differs. No projectile, no sun. Optional visual: simple canvas crack overlay at ≤50% / ≤25% HP (no extra sprite states).

### Snow Pea slow state

Zombie gains `slowUntil` timestamp; `z.speed` (base) never overwritten.
Movement: `speed = now < z.slowUntil ? z.speed * SLOW_MULT : z.speed` — auto-reverts on expiry.
Ice hit: `z.slowUntil = now + SLOW_MS` (refresh; multiplier is a fixed constant → structurally impossible to stack exponentially).
Projectile: `{ row, x, y, damage, speed, type: 'pea'|'icePea' }` — one engine, render switches on type.
Visual: soft cyan aura ellipse + 2 frost specks while slowed (lightweight, no filters, sprite not obscured).

### Placement rule

Current code **already allows any plant on any empty tile** (no column restriction exists — verified in click handler). §9 requires **no logic change** — only new tests locking the rule in.

---

## 4. Balance (derived from current baseline)

Baseline: zombie 100 HP, pea 25 dmg (4 peas kill), bite 8 dps, zombie speed 15–24 px/s, peashooter 1 shot/1.8s.

| Plant | Cost | HP | Behavior |
|---|---|---|---|
| Sunflower | 50 | 60 | unchanged (sun every 7s) |
| Peashooter | 100 | 100 | unchanged (25 dmg/1.8s) |
| **Wall-nut** | 50 | **400** | 4× peashooter HP → ~50s solo / ~17s vs 3 zombies at 8 dps |
| **Snow Pea** | 175 | 100 | same DPS as peashooter + 35% slow, 3s, refresh-on-hit |
| **Repeater** | 200 | 100 | 50 dmg/1.8s ≈ 2× peashooter DPS for 2× cost |

---

## 5. Seed bank & credits

- 3 new static cards appended in `index.html` (sprite/name/cost; existing seed-packet styles; tray already scrolls horizontally on narrow screens — 5 cards stay readable, landscape tablet priority).
- `ui.js` syncs card name + cost text from `PLANT_TYPES` at init → config is the single source of truth for numbers.
- Footer gains the new attribution lines; existing credits untouched.

---

## 6. Testing

- **Harness rewrite required:** current test `vm`-concatenates one file. New approach: install DOM/canvas/performance stubs on `globalThis`, then `await import('js/main.js')` — real ES modules, same assertions adapted to `state.gameOver` / `state.projectiles`; run in both procedural + sprite modes.
- **Existing assertions must keep passing** (health 1→0→Game Over, restart, economy, waves, placement, affordability classes…).
- **New assertions:**
  - Sunflower: any empty column (left/center/right), still makes sun, no overlap.
  - Peashooter: 1 normal pea, unchanged.
  - Wall-nut: placed, correct cost (50), no shoot, no sun, blocks zombie, survives ≫ normal plant, removed at 0 HP.
  - Snow Pea: cost 175, ice projectile, damages zombie, zombie slows, expiry restores speed, re-hit refreshes (no multiplication).
  - Repeater: cost 200, two separate peas with delay, both hit, silent when lane empty.
  - Health: 1 → zombie home → 0 → Game Over immediately.
  - Restart: arrays/health/selection reset; all new mechanics work after restart.
  - Seed bank: 5 cards, exact costs (50/100/50/175/200).
- **Manual:** headless env limits verification to headless simulation + pngjs render mocks + HTTP smoke checks; live play-testing (all 5 plants, unusual layouts, slow timing, two-shot feel) stays on your side.

---

## 7. Strictly NOT changed

- Health: **1 = alive, 0 = immediate Game Over** — logic untouched (moves verbatim into `zombies.js`).
- Existing balance numbers (costs 50/100, HP 60/100, pea 25, bite 8 dps, intervals, speeds, wave/level rules, +10 kill reward, starting sun 200).
- Lawn / HUD / zombie size / seed-packet / Game Over visual polish.
- Existing assets and their credits. No frameworks, bundlers, or dependencies. No official PvZ artwork.

---

## 8. Implementation order (after approval)

1. Modularize current game without behavior change → prove parity (tests + HTTP smoke).
2. Centralized plant configuration (PLANT_TYPES + BALANCE).
3. Any-tile placement rule tests (no logic change expected).
4. Wall-nut.
5. Shared projectile types.
6. Snow Pea + zombie slow state.
7. Shared multi-shot behavior.
8. Repeater.
9. Three new seed cards (+ config-synced labels).
10. Integrate generated/derived sprites.
11. Update credits.
12. Responsive seed-bank check.
13. Full automated suite (both modes).
14. Headless/manual verification + render mocks.

---

## 9. Acceptance criteria

- [x] Existing game still works (all pre-existing assertions pass).
- [x] JavaScript split into multiple sensible ES modules; `game.js` removed.
- [x] Browser uses `type="module"`; no bundler added; no circular imports.
- [x] Plant stats centralized in config; no scattered magic numbers.
- [x] Sunflower plantable on ANY empty lawn tile (test-locked).
- [x] Peashooter remains functional (1 normal pea).
- [x] Wall-nut added: high-HP defense, cost 50, no attack, no sun.
- [x] Snow Pea added: cost 175, ice projectile, temporary slow, expiry works, no exponential stacking.
- [x] Repeater added: cost 200, two separate peas with short delay, both hit.
- [x] Five seed cards; costs exactly 50 / 100 / 50 / 175 / 200.
- [x] Health remains strictly 1 → 0 → immediate Game Over.
- [x] Existing zombie size/lawn/HUD/UI polish intact; responsive layout kept.
- [x] New sprites: original or CC-BY 4.0 derivatives; no official PvZ assets; credits preserved/updated.
- [x] Existing + new automated tests pass (procedural and sprite modes).

## 10. Final report must include

Module structure before/after · files created/changed · asset sources + licenses · plant stats · wallnut/snowpea/slow/repeater implementations · placement rule status · whether existing gameplay changed · automated results · manual/visual verification · tablet/responsive check · confirmation Health remains exactly 1 → 0 → Game Over.

---

## 11. Implementation results (2026-10-17)

All steps completed in the approved order. Milestones committed individually
(modularize-parity → config+placement → wall-nut → projectile types+snow pea →
repeater → cards+assets+credits).

**Verification:** 73 assertions × 2 modes (procedural + sprite) all pass; HTTP
smoke of index.html, all 11 JS modules, and all 6 images → 200; full-board
pngjs mock render of the final scene (all 5 plants, ice aura, typed peas)
visually verified. Browser tool unavailable in this environment — live
play-testing remains on the user's side.

**Corrections vs. the original design notes (verified against the real PNGs):**
- `peashooter_cut.png` (bevouliin.com "Shadow Man-Eating Plant") is a
  **dark-gray** chomper with transparent background — not green. The Snow Pea
  recolor is therefore an **ice-blue luminance remap** (black outlines and
  white teeth preserved), not a green hue-shift.
- The Repeater's "second barrel" is a **drawn second jaw strip** (gray gum +
  black teeth) composited into the mouth gape below the existing upper jaw,
  plus the promised darker body tint.
- Wall-nut sprite is original project art: analytic tan walnut with dark hull
  cap, seam groove, determined face, and green sprout (256×256 PNG,
  content bounds cw 186 × ch 224, bottom 247).

**Health confirmation:** the only breach path is `zombies.js`
`state.health -= 1` → `state.health <= 0` → `state.gameOver = true`; tests
assert health is exactly 0 at game over and 1 after restart. No maxHealth,
lives, hearts, or healing exist anywhere.
