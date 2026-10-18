# Enemy Expansion (3 Zombies + Music + Difficulty) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three config-driven zombie types (Sprinter/Brute/Biter) with CC0 sprites, looping CC0 background music with a HUD mute button, and a fair-but-harder difficulty curve — without touching health rules, plants, the shovel, or the normal zombie's feel.

**Architecture:** Pure-data `ZOMBIE_TYPES` + one shared movement/eating/collision path for every zombie; renderer driven by per-sheet `ZOMBIE_ANIM` metadata; a tiny standalone `js/audio.js` owning a single `Audio` singleton with autoplay-safe start. All gameplay differences are configuration; no per-type branching in logic modules.

**Tech Stack:** Vanilla ES modules, canvas 2D, node:test-free assertion harness (`tests/pvz-test.mjs`), pngjs (asset repack, /tmp only), ffmpeg (music encode), Node 20+.

**Spec:** `task-enemies-music.md` (project root). The plan argues from the spec; executors read both. Baseline commit `a227958`, clean tree, 164/164 assertions green in both modes before Task 1 starts.

Spec §49 → plan task mapping: STEP 1-2 → Task 1-2; STEP 3 → Task 3; STEP 4-6 → data in Task 1 + generic logic in Task 2 (config-driven: one code path delivers all three); STEP 7 → Task 4; STEP 8 → tests in Task 2 §25; STEP 9-10 → Task 2 (weights) + Task 5 (burst/interval); STEP 11 → Task 5 §34; STEP 12-14 → Task 6-7; STEP 15 → Task 7; STEP 16-17 → Task 8.

## Global Constraints

- Health strictly binary: 1 = alive, 0 = immediate Game Over; any type crossing `BALANCE.HOUSE_X` drains exactly 1 -> 0.
- The existing 164 assertions pass UNMODIFIED after every task; new tests are appended additions.
- The Normal Zombie is behaviorally and visually identical (HP 100 x difficulty, speed band 0.25-0.40 x difficulty, 8 dps, reward 10, same sprite sheet frames).
- Snow Pea slow architecture untouched: `slowUntil` timestamp x `BALANCE.SLOW_MULT`, base speed never mutated, no stacking.
- Shovel untouched: dig -> floor(cost x 0.5) refund -> auto-deselect; eating zombie resumes when its plant is removed.
- No new modules except `js/audio.js`. No sound effects, bosses, lane switching, power-ups, multiple tracks, or plant rebalancing.
- Every gameplay number lives in `js/config.js` (no magic numbers elsewhere).
- No official Plants vs. Zombies sprites or music — only the CC0 assets named in the spec §2.
- Test commands (both must exit 0): `node tests/pvz-test.mjs` and `SPRITE_STUB=1 node tests/pvz-test.mjs`.
- Git commits in this environment: prefix with `git -c user.name=root -c user.email=root@localhost commit ...`.
- Generator scripts and downloaded originals live in /tmp/opencode — never committed.

## Review Focus

(input classes / failure modes the spec implies; each gets its test in the owning task)

1. **rng edge in weighted picking** — an injected rng returning exactly 1.0, or rolling exactly on a band boundary, must never yield an invalid type. -> Task 2 §23: rng=1.0 fallback assertion + 1000-roll sweeps per level.
2. **Burst spawn vs level pacing** — the burst zombie must run the full spawn pipeline (own type/row) and count toward `state.spawned`, and burst must be off at L1-2. -> Task 5 §31: double-spawn counts per roll + exact interval curve with `spawned` forced to 7.
3. **Normal-zombie visual parity** — `ZOMBIE_ANIM`'s `body` mode must reproduce the legacy draw math exactly (frames 4-11 / 16-19, tile 128, body-center on z.x, foot at lane bottom). -> Task 4 §30: exact source-rect + unified anchor invariants in SPRITE_STUB mode.
4. **Repack anchor drift** — repacked frames must be bottom- and center-anchored or feet float/jitter across frames. -> Task 4 §30: per-type invariant `content-center == z.x` and `tile bottom == lane bottom - 4` from recorded draw args; plus visual inspection of the PNGs in Task 3.
5. **Audio singleton & autoplay** — never two instances; a rejecting `play()` must not throw or spam; a persisted mute must prevent the first-gesture play. -> Task 6 §32 (fakes) and Task 7 §33 (through the real installed document listener).

---

### Task 1: Zombie type config (pure data, no behavior change)

**Files:**
- Modify: `js/config.js` (append `ZOMBIE_TYPES`, `SPAWN_WEIGHTS`, `BURST_CHANCE`; change `WAVE_INTERVAL_STEP` 800 -> 900)
- Modify: `tests/pvz-test.mjs` (append §22 before the final summary `console.log`)

**Interfaces:**
- Produces: `ZOMBIE_TYPES: {normal, sprinter, brute, biter}` each `{name, hp, speedMin, speedMax, eatDps, reward, sprite}`; `SPAWN_WEIGHTS: Array<{normal, sprinter, brute, biter}>` (4 rows, index = level-1, clamped); `BURST_CHANCE: number[]` (5 entries); `BALANCE.WAVE_INTERVAL_STEP === 900`.
- Nothing consumes these yet in this task — later tasks do.

- [ ] **Step 1: Write the failing test (§22, appended before the final `console.log(failures.length ...)` line of tests/pvz-test.mjs)**

```js
// ================= §22. Zombie type config & normal-equivalence =================
const { ZOMBIE_TYPES, SPAWN_WEIGHTS, BURST_CHANCE } =
  await import(new URL('../js/config.js', import.meta.url).href);
const ZTYPE_KEYS = ['normal', 'sprinter', 'brute', 'biter'];
A(ZTYPE_KEYS.every(t => ZOMBIE_TYPES && ZOMBIE_TYPES[t]),
  'ZOMBIE_TYPES defines all four zombie types');
A(ZTYPE_KEYS.every(t => {
  const d = ZOMBIE_TYPES[t];
  return typeof d.name === 'string' && d.name.length > 0 &&
    typeof d.hp === 'number' && d.hp > 0 &&
    typeof d.speedMin === 'number' && typeof d.speedMax === 'number' &&
    d.speedMax > d.speedMin && d.speedMin > 0 &&
    typeof d.eatDps === 'number' && d.eatDps > 0 &&
    typeof d.reward === 'number' && d.reward > 0 &&
    typeof d.sprite === 'string';
}), 'every type has numeric hp/speedMin/speedMax/eatDps/reward/name/sprite');
A(ZOMBIE_TYPES.normal.hp === 100 && ZOMBIE_TYPES.normal.speedMin === 0.25 &&
  ZOMBIE_TYPES.normal.speedMax === 0.40 && ZOMBIE_TYPES.normal.eatDps === 8 &&
  ZOMBIE_TYPES.normal.reward === 10 && ZOMBIE_TYPES.normal.reward === BALANCE.KILL_SUN_REWARD,
  'normal reproduces the legacy baseline exactly (100 hp, .25-.40, 8 dps, 10 sun)');
A(ZOMBIE_TYPES.sprinter.hp < ZOMBIE_TYPES.normal.hp &&
  ZOMBIE_TYPES.sprinter.speedMin > ZOMBIE_TYPES.normal.speedMax,
  'sprinter: less HP and a strictly faster band than normal');
A(ZOMBIE_TYPES.brute.hp >= 2 * ZOMBIE_TYPES.normal.hp &&
  ZOMBIE_TYPES.brute.speedMax < ZOMBIE_TYPES.normal.speedMin,
  'brute: >= 2x HP and a strictly slower band');
A(ZOMBIE_TYPES.biter.eatDps > ZOMBIE_TYPES.normal.eatDps &&
  ZOMBIE_TYPES.biter.hp > ZOMBIE_TYPES.normal.hp &&
  ZOMBIE_TYPES.biter.hp < ZOMBIE_TYPES.brute.hp,
  'biter: higher eat dps, medium HP between normal and brute');
A(SPAWN_WEIGHTS.length === 4 && SPAWN_WEIGHTS.every(w =>
  ZTYPE_KEYS.every(t => typeof w[t] === 'number') &&
  w.normal + w.sprinter + w.brute + w.biter > 0),
  'SPAWN_WEIGHTS: 4 rows, every type listed, every row spawnable');
A(SPAWN_WEIGHTS[0].normal === 85 && SPAWN_WEIGHTS[0].sprinter === 15 &&
  SPAWN_WEIGHTS[0].brute === 0 && SPAWN_WEIGHTS[0].biter === 0 &&
  SPAWN_WEIGHTS[1].biter === 0 && SPAWN_WEIGHTS[2].biter > 0,
  'staged introduction: L1 normal+sprinter only, L2 adds brute, L3 adds biter');
A(BURST_CHANCE.length === 5 && BURST_CHANCE[0] === 0 && BURST_CHANCE[1] === 0 &&
  BURST_CHANCE[2] > 0 && BURST_CHANCE[4] >= BURST_CHANCE[3],
  'BURST_CHANCE: none at L1-2, grows from L3');
A(BALANCE.WAVE_INTERVAL_STEP === 900 && BALANCE.WAVE_INTERVAL_MIN === 2500,
  'interval step steepened to 900ms/level, floor still 2500ms');
```

- [ ] **Step 2: Run tests to verify §22 fails**

Run: `node tests/pvz-test.mjs 2>&1 | grep -E 'FAIL|ZOMBIE_TYPES|TEST'`
Expected: FAIL lines for the ZOMBIE_TYPES assertions (ReferenceError/undefined — config does not export them yet).

- [ ] **Step 3: Add the config to js/config.js (append at end of file)**

```js
// --- Zombie type definitions (single source of truth: stats, roles, sprites).
// Every type shares ONE movement/eating/collision code path; the differences
// live here. At spawn time each type scales by the existing difficulty law:
//   hp    = type.hp * difficulty
//   speed = random in [speedMin, speedMax] * difficulty
export const ZOMBIE_TYPES = {
  normal:   { name: 'Normal Zombie', hp: 100, speedMin: 0.25, speedMax: 0.40,
              eatDps: 8,  reward: BALANCE.KILL_SUN_REWARD, sprite: 'zombie' },
  sprinter: { name: 'Sprinter',      hp:  75, speedMin: 0.40, speedMax: 0.55,
              eatDps: 8,  reward: 12, sprite: 'zombieSprinter' },
  brute:    { name: 'Brute',         hp: 240, speedMin: 0.20, speedMax: 0.26,
              eatDps: 8,  reward: 25, sprite: 'zombieBrute' },
  biter:    { name: 'Biter',         hp: 130, speedMin: 0.24, speedMax: 0.38,
              eatDps: 14, reward: 16, sprite: 'zombieBiter' },
};

// Level-based spawn weights (index = level - 1; levels beyond the table clamp
// to the last row). Values are relative weights summing to 100 per row.
export const SPAWN_WEIGHTS = [
  { normal: 85, sprinter: 15, brute: 0,  biter: 0  }, // level 1: mostly normal
  { normal: 60, sprinter: 25, brute: 15, biter: 0  }, // level 2: brute appears
  { normal: 45, sprinter: 25, brute: 15, biter: 15 }, // level 3: biter appears
  { normal: 35, sprinter: 25, brute: 20, biter: 20 }, // level 4+: full mix
];

// Chance that a spawn event drops a SECOND weighted zombie immediately
// (same-lane pressure emerges naturally from random rows — no forced fairness).
// Index = level - 1, clamped for levels beyond the table.
export const BURST_CHANCE = [0, 0, 0.15, 0.25, 0.35];
```

Also change in the `BALANCE` block: `WAVE_INTERVAL_STEP: 800, // interval reduction per level` -> `WAVE_INTERVAL_STEP: 900, // interval reduction per level (steepened for the enemy expansion)`.

- [ ] **Step 4: Run BOTH modes to verify §22 passes and nothing regressed**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED` (§22 adds assertions; total is now 164 + ~12).

- [ ] **Step 5: Commit (includes the spec + this plan as the committed design docs)**

```bash
git add js/config.js tests/pvz-test.mjs task-enemies-music.md docs/superpowers/plans/2026-10-18-enemies-music-difficulty.md
git -c user.name=root -c user.email=root@localhost commit -m "Add zombie type config, spawn weights, and burst table"
```

---

### Task 2: Type-driven spawn, eating, rewards (one shared path for all four types)

**Files:**
- Modify: `js/zombies.js` (imports; new `pickZombieType`; rewrite `spawnZombie`; one eating line in `updateZombies`)
- Modify: `js/projectiles.js` (kill reward line)
- Modify: `tests/pvz-test.mjs` (append §23-§28)

**Interfaces:**
- Consumes: `ZOMBIE_TYPES`, `SPAWN_WEIGHTS` from Task 1.
- Produces: `spawnZombie(state, rng = Math.random)` — spawns exactly ONE zombie; `pickZombieType(level, rng = Math.random) -> string` (exported for tests); zombie objects shaped `{type, row, x, speed, hp, maxHp, eatDps, reward, eating, slowUntil?}`. Later tasks rely on the field names `speed` (per-zombie base, never mutated), `eatDps`, `reward`, `type`.

- [ ] **Step 1: Write the failing tests (§23-§28, appended after §22; `resetBoard` + `spawnAs` are defined in §23 and reused by later sections)**

```js
// ================= §23. Weighted zombie spawning =================
const { spawnZombie, pickZombieType, updateZombies, updateWaves } =
  await import(new URL('../js/zombies.js', import.meta.url).href);
const { updateProjectiles } =
  await import(new URL('../js/projectiles.js', import.meta.url).href);
const resetBoard = () => {
  for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
  state.zombies = []; state.projectiles = []; state.suns = [];
  state.health = 1; state.gameOver = false; state.level = 1;
  state.selectedPlant = null; state.selectedTool = null;
  state.waveInterval = 1e9; state.waveTimer = 0; // waves off unless a test re-enables them
};
resetBoard();
state.zombies = [];
spawnZombie(state, () => 0.0); // roll 0 -> first weighted type at L1
A(state.zombies.length === 1 && state.zombies[0].type === 'normal',
  'L1 low roll spawns a normal zombie');
state.zombies = [];
spawnZombie(state, () => 0.90); // roll 90 of 100 -> past normal (85), into sprinter
A(state.zombies[0].type === 'sprinter', 'L1 high roll spawns the rare sprinter');
// rng = 1.0 (degenerate edge) must still yield a valid type
state.zombies = [];
spawnZombie(state, () => 1.0);
A(!!ZOMBIE_TYPES[state.zombies[0].type], 'rng=1.0 falls back to a valid type (never undefined)');
// full sweeps: staged introduction holds at every roll position
const sweepTypes = lvl => {
  const found = new Set();
  for (let r = 0; r < 1000; r++) { state.zombies = []; spawnZombie(state, () => r / 1000); found.add(state.zombies[0].type); }
  return found;
};
state.level = 1;
const l1 = sweepTypes(1);
A(l1.size === 2 && l1.has('normal') && l1.has('sprinter'),
  'L1 1000-roll sweep yields ONLY normal + sprinter');
const l2 = sweepTypes(2);
A(l2.size === 3 && !l2.has('biter'), 'L2 sweep adds brute, still no biter');
const l3 = sweepTypes(3);
A(l3.size === 4, 'L3 sweep yields all four types');
const l9 = sweepTypes(9);
A(l9.size === 4 && [...l9].every(t => ZOMBIE_TYPES[t]),
  'levels beyond the table clamp to L4+ weights; only valid types spawn');
state.zombies = [];
// spawned zombies carry the full generic shape
state.level = 1;
spawnZombie(state, () => 0.1);
const zShape = state.zombies[0];
A(zShape.type === 'normal' && zShape.row === 0 && zShape.x === 630 &&
  typeof zShape.speed === 'number' && zShape.hp === 100 && zShape.maxHp === 100 &&
  zShape.eatDps === 8 && zShape.reward === 10 && zShape.eating === false,
  'spawned zombie: {type,row,x,speed,hp,maxHp,eatDps,reward,eating} all populated');

// ================= §24. Per-type stats & kill rewards =================
// Deterministic exact-type spawn: pick a roll inside the type's weight band
// (rows sum to 100; the same rng value feeds row/speed rolls harmlessly).
const spawnAs = (type, lvl) => {
  state.level = lvl;
  const weights = SPAWN_WEIGHTS[Math.min(lvl, SPAWN_WEIGHTS.length) - 1];
  let lo = 0;
  for (const t of Object.keys(weights)) { if (t === type) break; lo += weights[t]; }
  state.zombies = [];
  spawnZombie(state, () => (lo + 0.5) / 100);
  return state.zombies[0];
};
resetBoard();
const zN = spawnAs('normal', 1), zS = spawnAs('sprinter', 1);
const zB = spawnAs('brute', 3), zBi = spawnAs('biter', 3);
A(zN.hp === 100 && zN.speed >= 0.25 && zN.speed <= 0.40 && zN.eatDps === 8 && zN.reward === 10,
  'L1 normal spawn: 100 hp, speed in [.25,.40], 8 dps, 10 sun reward');
A(zS.hp === 75 && zS.speed > 0.40 && zS.reward === 12,
  'L1 sprinter spawn: 75 hp, speed > 0.40, 12 sun reward');
A(zB.hp === 240 && zB.speed >= 0.20 && zB.speed <= 0.26 && zB.reward === 25,
  'L3 brute spawn: 240 hp, speed in [.20,.26], 25 sun reward');
A(zBi.hp === 130 && zBi.eatDps === 14 && zBi.reward === 16,
  'L3 biter spawn: 130 hp, 14 dps, 16 sun reward');
A(Math.abs(spawnAs('brute', 3).hp - 240 * 1.3) < 1e-9,
  'difficulty law still scales every type (L3 brute = 240 x 1.3)');
// kill rewards flow through the SHARED projectile path
const killRewardOf = z => {
  state.zombies = [z]; state.projectiles = [];
  z.hp = 10; // one pea finishes it; reward must come from z.reward
  const before = state.sun;
  state.projectiles.push({ row: z.row, x: z.x - 5, y: 0, type: 'pea' });
  updateProjectiles(state, nowValue(), 16);
  return state.sun - before;
};
A(killRewardOf(spawnAs('normal', 1)) === 10, 'kill reward: normal = 10 (legacy flat value)');
A(killRewardOf(spawnAs('sprinter', 1)) === 12, 'kill reward: sprinter = 12');
A(killRewardOf(spawnAs('brute', 3)) === 25, 'kill reward: brute = 25');
A(killRewardOf(spawnAs('biter', 3)) === 16, 'kill reward: biter = 16');
resetBoard();

// ================= §25. Snow Pea slow: each type slows AND restores ITS OWN speed =================
for (const typeName of ZTYPE_KEYS) {
  resetBoard();
  const z = spawnAs(typeName, typeName === 'brute' || typeName === 'biter' ? 3 : 1);
  z.row = 2; z.x = 500; z.hp = 1e6; z.maxHp = 1e6;
  state.zombies = [z];
  const baseSpeed = z.speed; // capture the type+difficulty speed actually spawned
  let x0 = z.x; step(10);
  const dxBase = (x0 - z.x) / 10;
  A(Math.abs(dxBase - baseSpeed) < 0.01,
    `${typeName}: walks at its own base speed (${baseSpeed.toFixed(3)}/frame)`);
  z.slowUntil = nowValue() + BALANCE.SLOW_MS; // exactly what an icePea hit writes
  x0 = z.x; step(10);
  const dxSlow = (x0 - z.x) / 10;
  A(Math.abs(dxSlow - baseSpeed * BALANCE.SLOW_MULT) < 0.01,
    `${typeName}: slowed = own base x ${BALANCE.SLOW_MULT} (measured ${dxSlow.toFixed(3)}/frame)`);
  A(z.speed === baseSpeed, `${typeName}: base speed never mutated by the slow`);
  z.slowUntil = nowValue() + 50; // fast-forward past expiry
  for (let f = 0; f < 200 && nowValue() < z.slowUntil; f++) step(1);
  x0 = z.x; step(10);
  const dxAfter = (x0 - z.x) / 10;
  A(Math.abs(dxAfter - z.speed) < 0.01,
    `${typeName}: expiry restores ITS OWN speed (${dxAfter.toFixed(3)}/frame)`);
}
resetBoard();

// ================= §26. Durability & chewing speed =================
const shotsToKill = z => {
  let n = 0;
  while (z.hp > 0 && n < 1000) { z.hp -= BALANCE.PEA_DAMAGE; n++; }
  return n;
};
A(shotsToKill(spawnAs('brute', 3)) > 2 * shotsToKill(spawnAs('normal', 1)),
  'brute needs > 2x the peas of a normal zombie (tank durability)');
A(shotsToKill(spawnAs('sprinter', 1)) < shotsToKill(spawnAs('normal', 1)),
  'sprinter dies to fewer peas than normal (glass cannon)');
const chewLoss = z => {
  resetBoard();
  state.grid[4][2] = createPlant('wallnut', 4, 2, nowValue());
  Object.assign(z, { row: 4, x: (2 + 0.7) * (600 / 9) - 2, eating: false, hp: 1e6 });
  state.zombies = [z];
  const hp0 = state.grid[4][2].hp;
  step(125); // 2 seconds of continuous biting
  return hp0 - state.grid[4][2].hp;
};
const normalLoss = chewLoss(spawnAs('normal', 1));
const biterLoss = chewLoss(spawnAs('biter', 3));
A(normalLoss >= 15 && normalLoss <= 17,
  `normal chews ~16 plant-HP over 2s at 8 dps (measured ${normalLoss})`);
A(biterLoss >= 27 && biterLoss <= 29,
  `biter chews ~28 plant-HP over 2s at 14 dps (measured ${biterLoss})`);
A(biterLoss > 1.5 * normalLoss, 'biter destroys plants meaningfully faster than normal');
resetBoard();

// ================= §27. Home breach: every type => health 1 -> 0 =================
for (const typeName of ZTYPE_KEYS) {
  resetBoard();
  const z = spawnAs(typeName, typeName === 'brute' || typeName === 'biter' ? 3 : 1);
  z.x = BALANCE.HOUSE_X - 1; z.row = 0; z.speed = 0;
  state.zombies = [z];
  step(1);
  A(state.health === 0 && state.gameOver === true,
    `${typeName}: crossing HOUSE_X drains 1 -> 0 and ends the game immediately`);
}
resetBoard();

// ================= §28. Shovel vs new types: eating target removed -> resume =================
// (L4 weights: all three new types are spawnable there; L1 lacks brute/biter.)
for (const typeName of ['brute', 'biter', 'sprinter']) {
  resetBoard();
  state.grid[2][1] = createPlant('wallnut', 2, 1, nowValue());
  const z = spawnAs(typeName, 4);
  Object.assign(z, { row: 2, x: (1 + 0.7) * (600 / 9) - 2, eating: false, hp: 1e6, maxHp: 1e6 });
  state.zombies = [z];
  step(5);
  A(z.eating === true, `${typeName}: stops and eats the wall-nut (shared eating system)`);
  removePlantWithRefund(state, 2, 1); // the shovel's actual removal path
  const xAfter = z.x;
  step(3);
  A(z.eating === false && z.x < xAfter,
    `${typeName}: resumes walking the moment the wall-nut is shoveled`);
}
resetBoard();
```

Note: `createPlant`, `removePlantWithRefund`, `BALANCE`, `ZOMBIE_TYPES`, `SPAWN_WEIGHTS`, `step`, `nowValue` are already imported/defined earlier in the test file — reuse them; do NOT re-declare those names (the file is one flat scope; a duplicate `const` is a SyntaxError). `updateProjectiles` is imported fresh in §23 above because nothing else in the harness pulls it in.

- [ ] **Step 2: Run tests to verify §23-§28 fail**

Run: `node tests/pvz-test.mjs 2>&1 | grep -E '^FAIL|TEST' | head -20`
Expected: FAILs — `pickZombieType` is not exported, zombie.type undefined, rewards still flat 10, etc. (The `import` of `pickZombieType` may throw first; that is the expected failure signal.)

- [ ] **Step 3: Implement — js/zombies.js**

Update the import (line 3):

```js
import { COLS, ROWS, CELL_W, LOGICAL_W, BALANCE, ZOMBIE_TYPES, SPAWN_WEIGHTS, BURST_CHANCE } from './config.js';
```

Replace `spawnZombie` (keep it above `updateZombies`) with:

```js
// Weighted type pick from the level's SPAWN_WEIGHTS row (clamped for levels
// beyond the table). rng is injectable so tests can drive it deterministically.
export function pickZombieType(level, rng = Math.random) {
  const weights = SPAWN_WEIGHTS[Math.min(level, SPAWN_WEIGHTS.length) - 1];
  let total = 0;
  for (const w of Object.values(weights)) total += w;
  let roll = rng() * total;
  for (const [type, w] of Object.entries(weights)) {
    if (w > 0 && roll < w) return type;
    roll -= w;
  }
  return 'normal'; // degenerate rng result (e.g. exactly 1.0) -> baseline type
}

// --- Spawn a zombie (ONE generic shape for every type; stats from config) ---
export function spawnZombie(state, rng = Math.random) {
  const type = pickZombieType(state.level, rng);
  const def = ZOMBIE_TYPES[type];
  const row = Math.floor(rng() * ROWS);
  const difficulty = 1 + (state.level - 1) * BALANCE.ZOMBIE_DIFFICULTY_STEP;
  state.zombies.push({
    type,
    row,
    x: LOGICAL_W + 30,
    hp: def.hp * difficulty,
    maxHp: def.hp * difficulty,
    speed: (def.speedMin + rng() * (def.speedMax - def.speedMin)) * difficulty,
    eatDps: def.eatDps,
    reward: def.reward,
    eating: false,
  });
}
```

In `updateZombies`, replace the eating-damage line

```js
        plant.hp -= BALANCE.EAT_DPS * (dt / 1000);
```

with

```js
        // Per-type chewing speed; hand-built test zombies (no eatDps) keep the
        // legacy 8 dps baseline.
        plant.hp -= (z.eatDps ?? BALANCE.EAT_DPS) * (dt / 1000);
```

- [ ] **Step 4: Implement — js/projectiles.js**

Replace the kill-reward line

```js
          state.sun += BALANCE.KILL_SUN_REWARD; // small reward
```

with

```js
          // Per-type reward; hand-built test zombies (no reward) fall back to
          // the legacy flat KILL_SUN_REWARD.
          state.sun += z.reward ?? BALANCE.KILL_SUN_REWARD;
```

- [ ] **Step 5: Run BOTH modes to verify §23-§28 pass with zero regressions**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED`. If any pre-existing assertion fails, the change broke legacy equivalence — fix the implementation, never the old assertions.

- [ ] **Step 6: Commit**

```bash
git add js/zombies.js js/projectiles.js tests/pvz-test.mjs
git -c user.name=root -c user.email=root@localhost commit -m "Drive zombie spawning, eating, and rewards from ZOMBIE_TYPES"
```

---

### Task 3: Licensed assets — repack sprite sheets, encode music, register sources

**Files:**
- Create (NOT committed): `/tmp/opencode/repack-zombies.js`
- Create: `images/zombie_sprinter.png`, `images/zombie_brute.png`, `images/zombie_biter.png`
- Create: `audio/bgm/tower-defense-theme.ogg`
- Modify: `js/assets.js` (three new `SPRITE_SRC` entries + credit comment)
- Modify: `tests/pvz-test.mjs` (append §29)

**Interfaces:**
- Consumes: downloaded originals already at `/tmp/opencode/research/` (zombie_type{A,B,C}_{walk,attack}_spritesheet.png, DST-TowerDefenseTheme.mp3). If missing, re-download per spec §2 URLs (CC0).
- Produces: `SPRITE_SRC.zombieSprinter/zombieBrute/zombieBiter`; PNGs are uniform 4-col x 2-row grids (walk row 0, attack row 1), frames bottom- and center-anchored; the script prints each tile size — Task 4's `ZOMBIE_ANIM` MUST use those printed values.

- [ ] **Step 1: Write the failing test (§29, appended after §28)**

```js
// ================= §29. New zombie + music assets registered =================
const { SPRITE_SRC } = await import(new URL('../js/assets.js', import.meta.url).href);
A(SPRITE_SRC.zombieSprinter === 'images/zombie_sprinter.png' &&
  SPRITE_SRC.zombieBrute === 'images/zombie_brute.png' &&
  SPRITE_SRC.zombieBiter === 'images/zombie_biter.png' &&
  SPRITE_SRC.zombie === 'images/zombie.png',
  'assets.js registers the three new sheets and keeps the original zombie');
A(existsSync(new URL('../images/zombie_sprinter.png', import.meta.url)) &&
  existsSync(new URL('../images/zombie_brute.png', import.meta.url)) &&
  existsSync(new URL('../images/zombie_biter.png', import.meta.url)),
  'the three repacked PNGs exist on disk');
A(existsSync(new URL('../audio/bgm/tower-defense-theme.ogg', import.meta.url)),
  'background music file exists on disk');
```

- [ ] **Step 2: Run to verify §29 fails**

Run: `node tests/pvz-test.mjs 2>&1 | grep -E '^FAIL|TEST'`
Expected: 4 FAILs (missing SPRITE_SRC keys + missing files).

- [ ] **Step 3: Write /tmp/opencode/repack-zombies.js**

```js
// Repack ashuuya's CC0 zombie sheets (OpenGameArt "128x128 2D Zombies
// Spritesheet") into uniform 4x2 grids: walk = row 0, attack = row 1.
// Each frame is cropped to its content, horizontally centered and
// bottom-anchored in its tile (feet constant), so the renderer can use a
// single bottom-center anchor. NOT committed — asset pipeline, like the
// shovel/snowpea generators. Usage: node repack-zombies.js <out-images-dir>
const { PNG } = require('/tmp/opencode/node_modules/pngjs');
const fs = require('fs');
const path = require('path');

const SRC = '/tmp/opencode/research';
const OUT_DIR = process.argv[2];
if (!OUT_DIR) { console.error('usage: node repack-zombies.js <out-images-dir>'); process.exit(1); }

const JOBS = [
  { prefix: 'zombie_typeC', out: 'zombie_sprinter.png' }, // fast
  { prefix: 'zombie_typeB', out: 'zombie_brute.png' },    // tank
  { prefix: 'zombie_typeA', out: 'zombie_biter.png' },    // attacker
];

function contentRuns(png) {
  const { width: W, height: H, data } = png;
  const runs = [];
  let start = null, gapStart = null;
  for (let x = 0; x <= W; x++) {
    let opaque = false;
    if (x < W) {
      for (let y = 0; y < H; y++) {
        if (data[(y * W + x) * 4 + 3] > 10) { opaque = true; break; }
      }
    }
    if (opaque) {
      if (start === null) start = x;
      gapStart = null;
    } else if (start !== null) {
      if (gapStart === null) gapStart = x;
      else if (x - gapStart >= 3) { runs.push([start, gapStart - 1]); start = null; gapStart = null; }
    }
  }
  if (start !== null) runs.push([start, W - 1]);
  return runs.filter(([a, b]) => b - a + 1 >= 20); // drop 1px antialias specks
}

for (const job of JOBS) {
  const frames = [];
  let globalFoot = 0; // deepest content row across all 8 frames (feet line)
  for (const kind of ['walk', 'attack']) {
    const png = PNG.sync.read(fs.readFileSync(path.join(SRC, `${job.prefix}_${kind}_spritesheet.png`)));
    for (const [x0, x1] of contentRuns(png)) {
      let top = png.height, bottom = 0;
      for (let y = 0; y < png.height; y++) {
        for (let x = x0; x <= x1; x++) {
          if (png.data[(y * png.width + x) * 4 + 3] > 10) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            break;
          }
        }
      }
      globalFoot = Math.max(globalFoot, bottom);
      frames.push({ png, x0, top, x1, bottom, w: x1 - x0 + 1, h: bottom - top + 1 });
    }
  }
  if (frames.length !== 8) {
    console.error(`${job.prefix}: expected 8 frames, got ${frames.length} — inspect the sheet`);
    process.exit(1);
  }
  const tileW = Math.max(...frames.map(f => f.w));
  const tileH = Math.max(...frames.map(f => f.h));
  const out = new PNG({ width: tileW * 4, height: tileH * 2 });
  frames.forEach((f, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const ox = col * tileW + Math.floor((tileW - f.w) / 2);      // centered
    const oy = (row + 1) * tileH - f.h - (globalFoot - f.bottom); // feet aligned
    for (let y = 0; y < f.h; y++) {
      const src = ((f.top + y) * f.png.width + f.x0) * 4;
      f.png.data.copy(out.data, ((oy + y) * out.width + ox) * 4, src, src + f.w * 4);
    }
  });
  fs.writeFileSync(path.join(OUT_DIR, job.out), PNG.sync.write(out));
  console.log(`${job.out}: tile ${tileW}x${tileH} (${tileW * 4}x${tileH * 2}) ` +
    `frames ${frames.map(f => f.w + 'x' + f.h).join(' ')}`);
}
```

- [ ] **Step 4: Run the repack and capture the printed tile sizes**

Run: `node /tmp/opencode/repack-zombies.js "$(pwd)/images"`
Expected: three lines, e.g. `zombie_sprinter.png: tile 74x119 (296x238) frames ...` — record the exact tile sizes; Task 4 uses them verbatim. Any `expected 8 frames` error means the sheet detection needs investigation (do not proceed with a wrong frame count).

- [ ] **Step 5: Visually verify each output PNG (read tool renders images)**

Read `images/zombie_sprinter.png`, `images/zombie_brute.png`, `images/zombie_biter.png`. Expected: 8 intact cartoon frames in a 4x2 grid, characters facing LEFT, no cut-off limbs, no stray specks, walk on top / attack (arms lunging) below.

- [ ] **Step 6: Encode the music to OGG**

Run:
```bash
mkdir -p audio/bgm && ffmpeg -v error -y -i /tmp/opencode/research/DST-TowerDefenseTheme.mp3 -c:a libvorbis -q:a 3 audio/bgm/tower-defense-theme.ogg && ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 audio/bgm/tower-defense-theme.ogg && ls -la audio/bgm/
```
Expected: duration ~199.4 s, file ~2-3 MB.

- [ ] **Step 7: Register the sprites in js/assets.js**

In the `SPRITE_SRC` object add (keeping every existing entry):

```js
  zombie: 'images/zombie.png',
  // New enemy sheets: CC0 sprite pack by ashuuya (OpenGameArt "128x128 2D
  // Zombies Spritesheet"), repacked into uniform walk/attack grids.
  zombieSprinter: 'images/zombie_sprinter.png', // fast enemy (type C)
  zombieBrute: 'images/zombie_brute.png',       // tank enemy (type B)
  zombieBiter: 'images/zombie_biter.png',       // strong attacker (type A)
```

- [ ] **Step 8: Run BOTH modes to verify §29 passes**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED`.

- [ ] **Step 9: Commit**

```bash
git add images/zombie_sprinter.png images/zombie_brute.png images/zombie_biter.png audio/bgm/tower-defense-theme.ogg js/assets.js tests/pvz-test.mjs
git -c user.name=root -c user.email=root@localhost commit -m "Add CC0 zombie sprite sheets and background music assets"
```

---

### Task 4: Config-driven renderer (ZOMBIE_ANIM + unified drawZombie)

**Files:**
- Modify: `js/config.js` (append `ZOMBIE_ANIM` using Task 3's printed tile sizes)
- Modify: `js/rendering.js` (replace the zombie constants + `zombieSpriteBox` + `drawZombie` with the metadata-driven version)
- Modify: `tests/pvz-test.mjs` (append §30)

**Interfaces:**
- Consumes: `SPRITE_SRC` keys from Task 3; `ZOMBIE_TYPES` from Task 1; the exact tile sizes printed by Task 3 Step 4.
- Produces: `ZOMBIE_ANIM: {zombie, zombieSprinter, zombieBrute, zombieBiter}` each `{spriteKey, tileW, tileH, mode: 'body'|'tile', walk: {row,start,count,ms}, attack: {row,start,count,ms}, visualFrac, barWidthFrac}` (+ `top/foot/cx` for `mode:'body'`). Renderer reads only this metadata.

- [ ] **Step 1: Write the failing test (§30, appended after §29)**

```js
// ================= §30. Renderer: config-driven zombie animation =================
const { ZOMBIE_ANIM } = await import(new URL('../js/config.js', import.meta.url).href);
const { getSprite } = await import(new URL('../js/assets.js', import.meta.url).href);
A(ZTYPE_KEYS.every(t => ZOMBIE_ANIM[ZOMBIE_TYPES[t].sprite]),
  'every type sprite has ZOMBIE_ANIM metadata');
A(ZTYPE_KEYS.every(t => {
  const a = ZOMBIE_ANIM[ZOMBIE_TYPES[t].sprite];
  return a.tileW > 0 && a.tileH > 0 && (a.mode === 'body' || a.mode === 'tile') &&
    a.walk.count > 0 && a.attack.count > 0 && a.walk.ms > 0 && a.attack.ms > 0 &&
    a.visualFrac >= 0.7 && a.visualFrac <= 0.9 && a.barWidthFrac > 0;
}), 'every metadata entry: positive tile size, valid mode, timing, 70-90% lane height');
A(ZOMBIE_ANIM.zombie.tileW === 128 && ZOMBIE_ANIM.zombie.mode === 'body' &&
  ZOMBIE_ANIM.zombie.walk.start === 4 && ZOMBIE_ANIM.zombie.walk.count === 8 &&
  ZOMBIE_ANIM.zombie.attack.start === 16 && ZOMBIE_ANIM.zombie.attack.count === 4 &&
  ZOMBIE_ANIM.zombie.walk.ms === 140 && ZOMBIE_ANIM.zombie.attack.ms === 150,
  "normal metadata encodes the ORIGINAL sheet exactly (frames 4-11 / 16-19 @140/150ms)");
if (process.env.SPRITE_STUB) {
  resetBoard();
  for (const typeName of ZTYPE_KEYS) {
    const anim = ZOMBIE_ANIM[ZOMBIE_TYPES[typeName].sprite];
    const z = spawnAs(typeName, 1);
    z.row = 1; z.x = 300; z.hp = z.maxHp = 100;
    state.zombies = [z];
    // --- walk frame ---
    drawCalls.length = 0;
    draw();
    const sheet = getSprite(anim.spriteKey);
    const walkFrame = anim.walk.start + (Math.floor(nowValue() / anim.walk.ms) % anim.walk.count);
    const spr = drawCalls.filter(c => c.fn === 'drawImage' && c.args[0] === sheet);
    A(spr.length === 1, `${typeName}: exactly one sprite draw per zombie per frame`);
    const [, sx, sy, sw, sh, dx, dy, dw, dh] = spr[0].args;
    A(sx === walkFrame * anim.tileW && sy === anim.walk.row * anim.tileH &&
      sw === anim.tileW && sh === anim.tileH,
      `${typeName}: walk source rect = frame ${walkFrame} of row ${anim.walk.row} (${sx},${sy},${sw},${sh})`);
    const cxFrac = anim.mode === 'body' ? anim.cx / anim.tileW : 0.5;
    const footFrac = anim.mode === 'body' ? anim.foot / anim.tileH : 1;
    A(Math.abs(dx + cxFrac * dw - 300) < 0.05,
      `${typeName}: content center anchored on z.x (off by ${Math.abs(dx + cxFrac * dw - 300).toFixed(3)}px)`);
    A(Math.abs(dy + footFrac * dh - (z.row + 1) * 80 + 4) < 0.05,
      `${typeName}: feet anchored at lane bottom - 4px`);
    // --- attack frame (eating) ---
    z.eating = true;
    drawCalls.length = 0;
    draw();
    const atk = drawCalls.find(c => c.fn === 'drawImage' && c.args[0] === sheet);
    A(atk.args[2] === anim.attack.row * anim.tileH,
      `${typeName}: eating draws the attack row (${anim.attack.row})`);
    // --- HP bar width follows the type ---
    z.eating = false;
    drawCalls.length = 0;
    draw();
    const barW = CELL_W * anim.barWidthFrac + 2;
    A(drawCalls.some(c => c.fn === 'fillRect' && Math.abs(c.args[2] - barW) < 0.01 && c.args[3] === 7),
      `${typeName}: HP bar drawn at its configured width (${barW.toFixed(1)}px)`);
  }
  state.zombies = [];
} else {
  // Procedural mode: the fallback vector path renders every new type safely.
  resetBoard();
  for (const typeName of ['sprinter', 'brute', 'biter']) {
    const z = spawnAs(typeName, 3);
    z.row = 1; z.x = 300;
    state.zombies = [z];
    drawCalls.length = 0;
    draw();
    A(drawCalls.some(c => c.fn === 'fillRect'),
      `${typeName}: fallback vector zombie drawn headless`);
  }
  state.zombies = [];
}
resetBoard();
```

Note: `CELL_W` is NOT currently imported by the test file — add it to the existing config import in §11 (line ~258): `const { PLANT_TYPES, BALANCE, CELL_W } = await import(...)`. That line is a modification of an existing test import, allowed because it adds an identifier without changing any assertion.

- [ ] **Step 2: Run SPRITE_STUB mode to verify §30 fails**

Run: `SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | grep -E '^FAIL|TEST' | head`
Expected: FAILs — `ZOMBIE_ANIM` undefined.

- [ ] **Step 3: Add ZOMBIE_ANIM to js/config.js (append; REPLACE the two printed tile sizes with Task 3's actual output)**

```js
// --- Zombie sprite-sheet animation metadata (rendering only; gameplay stats
// live in ZOMBIE_TYPES). mode 'body': legacy semantics — scale so the body
// span (top..foot within the tile) fills visualFrac of the lane, anchor the
// body's foot line + horizontal center (byte-identical to the original render).
// mode 'tile': repacked sheets — the tile itself is bottom-center anchored,
// content already packed to the tile edges.
export const ZOMBIE_ANIM = {
  zombie: { // original Clint Bellanger sheet: 36 cols x 8 rows of 128px tiles
    spriteKey: 'zombie', tileW: 128, tileH: 128, mode: 'body',
    top: 47, foot: 102.5, cx: 61.5,
    walk:   { row: 0, start: 4,  count: 8, ms: 140 },
    attack: { row: 0, start: 16, count: 4, ms: 150 },
    visualFrac: 0.80, barWidthFrac: 0.60,
  },
  zombieSprinter: { // small & quick — slightly under lane height
    spriteKey: 'zombieSprinter', tileW: 74, tileH: 119, mode: 'tile',
    walk:   { row: 0, start: 0, count: 4, ms: 110 },
    attack: { row: 1, start: 0, count: 4, ms: 150 },
    visualFrac: 0.76, barWidthFrac: 0.60,
  },
  zombieBrute: { // imposing bulk + wide HP bar
    spriteKey: 'zombieBrute', tileW: 74, tileH: 127, mode: 'tile',
    walk:   { row: 0, start: 0, count: 4, ms: 190 },
    attack: { row: 1, start: 0, count: 4, ms: 190 },
    visualFrac: 0.88, barWidthFrac: 0.75,
  },
  zombieBiter: {
    spriteKey: 'zombieBiter', tileW: 76, tileH: 128, mode: 'tile',
    walk:   { row: 0, start: 0, count: 4, ms: 140 },
    attack: { row: 1, start: 0, count: 4, ms: 150 },
    visualFrac: 0.80, barWidthFrac: 0.60,
  },
};
```

- [ ] **Step 4: Rewrite the zombie renderer in js/rendering.js**

Replace the block from the comment `const Z_TILE = 128;` through the end of `drawZombie` (the constants `Z_TILE`, `Z_BODY_TOP`, `Z_BODY_FOOT`, `Z_BODY_CX`, `Z_VISUAL_FRAC`, `zombieSpriteBox`, and `drawZombie`) with:

```js
// Zombie drawing is fully metadata-driven: ZOMBIE_ANIM (config.js) describes
// each sheet's tile size, animation rows/timing, visual size, and anchoring.
// The 'zombie' entry reproduces the original sheet's math exactly.
const Z_FOOT_INSET = 4; // feet sit this far above the lane bottom line
const FALLBACK_TINTS = { // procedural vector fallback colors, per type
  normal:   { body: '#7e9c5e', head: '#9ccc65', shirt: '#5d4037' },
  sprinter: { body: '#5e8c9c', head: '#65c0cc', shirt: '#37474f' },
  brute:    { body: '#8c7e9c', head: '#b3a8d8', shirt: '#4a148c' },
  biter:    { body: '#7e9c5e', head: '#9ccc65', shirt: '#b71c1c' },
};

function drawZombie(z) {
  const cx = z.x;
  const def = ZOMBIE_TYPES[z.type || 'normal']; // hand-built test zombies -> normal
  const anim = ZOMBIE_ANIM[def ? def.sprite : 'zombie'];
  let barTop; // top of the visible head, for HP bar placement

  if (spriteReady(anim.spriteKey)) {
    const a = z.eating ? anim.attack : anim.walk;
    const frame = a.start + (Math.floor(performance.now() / a.ms) % a.count);
    let scale, dx, dy;
    if (anim.mode === 'body') {
      scale = (CELL_H * anim.visualFrac) / (anim.foot - anim.top);
      dx = cx - anim.cx * scale;
      dy = (z.row + 1) * CELL_H - Z_FOOT_INSET - anim.foot * scale;
    } else {
      scale = (CELL_H * anim.visualFrac) / anim.tileH;
      dx = cx - (anim.tileW / 2) * scale;
      dy = (z.row + 1) * CELL_H - Z_FOOT_INSET - anim.tileH * scale;
    }
    const dw = anim.tileW * scale, dh = anim.tileH * scale;
    ctx.drawImage(
      getSprite(anim.spriteKey),
      frame * anim.tileW, a.row * anim.tileH, anim.tileW, anim.tileH,
      dx, dy, dw, dh
    );
    barTop = dy + (anim.mode === 'body' ? anim.top : 0) * scale;
  } else {
    // Fallback vector zombie — same visible size and anchor as the sprite,
    // tinted per type so mixed lanes stay readable in headless/loading states.
    const tint = FALLBACK_TINTS[z.type] || FALLBACK_TINTS.normal;
    const bodyH = CELL_H * anim.visualFrac;
    const r = bodyH * 0.35;
    const feetY = (z.row + 1) * CELL_H - Z_FOOT_INSET;
    const fcy = feetY - bodyH / 2; // shape is roughly symmetric about this
    // Body
    ctx.fillStyle = tint.body;
    ctx.fillRect(cx - r * 0.5, fcy - r * 0.3, r, r * 1.1);
    // Head
    ctx.fillStyle = tint.head;
    ctx.beginPath();
    ctx.arc(cx, fcy - r * 0.6, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, fcy - r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.15, fcy - r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r * 0.12, fcy - r * 0.7, r * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.18, fcy - r * 0.7, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(cx - r * 0.2, fcy - r * 0.35, r * 0.4, r * 0.15);
    // Arms reaching forward
    ctx.fillStyle = tint.body;
    ctx.fillRect(cx - r * 0.9, fcy - r * 0.2, r * 0.5, r * 0.2);
    ctx.fillRect(cx - r * 0.9, fcy + r * 0.1, r * 0.5, r * 0.2);
    // Torn shirt
    ctx.fillStyle = tint.shirt;
    ctx.fillRect(cx - r * 0.5, fcy + r * 0.1, r, r * 0.3);
    barTop = fcy - r * 1.1;
  }

  // (the Snow Pea frost block stays EXACTLY as-is, immediately after this)

  // HP bar, floating just above the head and following the zombie
  const bw = CELL_W * anim.barWidthFrac;
  const bh = 5;
  const bx = cx - bw / 2;
  const by = barTop - bh - 4;
  ctx.fillStyle = 'rgba(20,15,10,0.85)';
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx, by, bw, bh);
  const ratio = Math.max(0, z.hp / z.maxHp);
  ctx.fillStyle = ratio > 0.5 ? '#6fce4a' : ratio > 0.25 ? '#e5c93c' : '#f44336';
  ctx.fillRect(bx, by, bw * ratio, bh);
}
```

Update the import at the top of rendering.js to include the new config exports:

```js
import { LOGICAL_W, LOGICAL_H, COLS, ROWS, CELL_W, CELL_H, ZOMBIE_TYPES, ZOMBIE_ANIM } from './config.js';
```

The frost-aura block between the sprite/fallback branches and the HP bar is unchanged — keep it exactly where it was.

- [ ] **Step 5: Run BOTH modes**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED` — including every pre-existing draw assertion (shovel outline, float text), which proves the refactor is behavior-neutral.

- [ ] **Step 6: Commit**

```bash
git add js/config.js js/rendering.js tests/pvz-test.mjs
git -c user.name=root -c user.email=root@localhost commit -m "Make zombie rendering config-driven via ZOMBIE_ANIM metadata"
```

---

### Task 5: Wave bursts + interval progression + difficulty sanity

**Files:**
- Modify: `js/zombies.js` (`updateWaves` only)
- Modify: `tests/pvz-test.mjs` (append §31 + §34)

**Interfaces:**
- Consumes: `BURST_CHANCE` from Task 1; `spawnZombie(state, rng)` from Task 2.
- Produces: `updateWaves(state, dt, rng = Math.random)` — optional rng passthrough (existing callers unchanged).

- [ ] **Step 1: Write the failing tests (§31 + §34, appended after §30)**

```js
// ================= §31. Waves: burst spawns + interval progression =================
resetBoard();
state.waveInterval = BALANCE.WAVE_INTERVAL; state.waveTimer = 0; state.spawned = 0; state.level = 1;
// L1: burst off — a full roll sweep never doubles a spawn
let doubled = 0;
for (let r = 0; r < 200; r++) {
  state.zombies = [];
  updateWaves(state, BALANCE.WAVE_INTERVAL + 1, () => r / 200);
  if (state.zombies.length > 1) doubled++;
}
A(doubled === 0 && state.zombies.length === 1,
  'L1: burst never fires (200-roll sweep, exactly one zombie per event)');
// L5: burst fires for rolls below BURST_CHANCE[4] = 0.35, second zombie is a real spawn
state.level = 5; state.spawned = 0; state.waveInterval = 4400;
let burstCount = 0, secondOk = true;
for (let r = 0; r < 100; r++) {
  state.zombies = [];
  updateWaves(state, 5000, () => r / 100);
  if (state.zombies.length === 2) {
    burstCount++;
    if (!ZOMBIE_TYPES[state.zombies[1].type] || state.zombies[1].row === undefined) secondOk = false;
  }
}
A(burstCount === 35, `L5: exactly 35/100 rolls burst (BURST_CHANCE[4] = 0.35; got ${burstCount})`);
A(secondOk, 'the burst zombie is a fully-populated generic spawn (own type/row)');
// both burst zombies count toward level pacing (spawned increments twice)
state.level = 1; state.spawned = 7; state.waveInterval = BALANCE.WAVE_INTERVAL;
state.zombies = [];
updateWaves(state, BALANCE.WAVE_INTERVAL + 1, () => 0.9); // L1: sprinter, no burst
A(state.spawned === 8 && state.level === 2, 'spawned counts every zombie; level-up still at 8');
// interval progression: 8000 -> 7100 -> 6200 -> 5300 -> 4400 -> 3500 -> 2600 -> 2500 floor
resetBoard();
const intervals = [];
state.level = 1; state.waveInterval = BALANCE.WAVE_INTERVAL;
for (let i = 0; i < 9; i++) {
  state.spawned = 7; // every spawn is an 8th -> level up each iteration
  state.zombies = [];
  updateWaves(state, 1e6); // default rng (0.5): no burst at any level
  intervals.push(state.waveInterval);
}
A(intervals.join(',') === '7100,6200,5300,4400,3500,2600,2500,2500,2500',
  `interval curve steepens then floors at 2500 (got ${intervals.join(',')})`);
resetBoard();

// ================= §34. Difficulty sanity: Level 1 stays fair =================
A(SPAWN_WEIGHTS[0].normal === 85 && SPAWN_WEIGHTS[0].sprinter === 15,
  'L1 remains 85% normal zombies (fair opening)');
A(BALANCE.WAVE_INTERVAL === 8000, 'L1 spawn interval unchanged at 8000ms');
A(BALANCE.WAVE_INTERVAL_MIN === 2500, 'spawn interval floor still 2500ms');
A(BURST_CHANCE[0] === 0 && BURST_CHANCE[1] === 0, 'no burst pressure at L1-2');
```

- [ ] **Step 2: Run to verify §31 fails**

Run: `node tests/pvz-test.mjs 2>&1 | grep -E '^FAIL|TEST' | head`
Expected: FAILs — `updateWaves` ignores rng/burst (doubled === 0 may pass, but `burstCount === 35` fails; the interval-curve assertion fails at 2600/2500 only after Step... note: the interval curve may already pass because WAVE_INTERVAL_STEP=900 landed in Task 1 — that is fine; the burst assertions are the failing signal).

- [ ] **Step 3: Implement — updateWaves in js/zombies.js**

Replace `updateWaves` with:

```js
export function updateWaves(state, dt, rng = Math.random) {
  // --- Wave spawning (with level-scaled burst pressure) ---
  state.waveTimer += dt;
  if (state.waveTimer > state.waveInterval) {
    state.waveTimer = 0;
    const noteSpawn = () => {
      state.spawned = (state.spawned || 0) + 1;
      // Level up every 8 zombies, speed up the wave
      if (state.spawned % 8 === 0) {
        state.level += 1;
        state.waveInterval = Math.max(BALANCE.WAVE_INTERVAL_MIN,
          state.waveInterval - BALANCE.WAVE_INTERVAL_STEP);
      }
    };
    spawnZombie(state, rng);
    noteSpawn();
    // Burst: a level-scaled chance to drop a SECOND zombie immediately. Both
    // count toward level pacing; random rows keep same-lane pressure natural.
    const idx = Math.min(state.level, BURST_CHANCE.length) - 1;
    if (rng() < BURST_CHANCE[idx]) {
      spawnZombie(state, rng);
      noteSpawn();
    }
  }
}
```

Add `BURST_CHANCE` to the config import in zombies.js (Task 2 already added it — verify the import line reads `import { COLS, ROWS, CELL_W, LOGICAL_W, BALANCE, ZOMBIE_TYPES, SPAWN_WEIGHTS, BURST_CHANCE } from './config.js';`).

- [ ] **Step 4: Run BOTH modes**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED`. In particular §7's "level increases after enough zombie spawns" (existing test) still passes because L1 burst is 0.

- [ ] **Step 5: Commit**

```bash
git add js/zombies.js tests/pvz-test.mjs
git -c user.name=root -c user.email=root@localhost commit -m "Add level-scaled burst spawning to the wave system"
```

---

### Task 6: Audio module (single Audio instance, autoplay-safe, mute + persistence)

**Files:**
- Create: `js/audio.js`
- Modify: `tests/pvz-test.mjs` (append §32)

**Interfaces:**
- Consumes: nothing (zero imports — audio owns all music state).
- Produces: `startOnGesture()`, `toggleMute() -> boolean`, `isMuted() -> boolean`, `pause()`, `resume()`, `_resetForTests()` (test seam). All functions safe when `globalThis.Audio` is undefined (headless). Task 7 wires these into ui/main.

- [ ] **Step 1: Write the failing test (§32, appended after §34)**

```js
// ================= §32. Audio module: singleton, autoplay, mute =================
const audioMod = await import(new URL('../js/audio.js', import.meta.url).href);
let fakeInstances = [];
globalThis.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] ?? null; },
  setItem(k, v) { this._store[k] = String(v); },
};
class FakeAudio {
  constructor(src) {
    this.src = src; this.loop = false; this.volume = 1; this.muted = false;
    this.paused = true; this.playCalls = 0;
    fakeInstances.push(this);
  }
  play() { this.playCalls++; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
globalThis.Audio = FakeAudio;

A(audioMod.isMuted() === false, 'default state is unmuted');
audioMod.startOnGesture();
const a1 = fakeInstances[0];
A(fakeInstances.length === 1, 'the first gesture creates exactly ONE Audio instance');
A(a1.src === 'audio/bgm/tower-defense-theme.ogg', 'src points at the local ogg (no hotlink)');
A(a1.loop === true, 'music loops');
A(a1.volume >= 0.25 && a1.volume <= 0.40, `volume stays moderate (${a1.volume})`);
A(a1.playCalls === 1 && a1.paused === false, 'first gesture starts playback');
audioMod.startOnGesture();
A(fakeInstances.length === 1 && a1.playCalls === 1,
  'later gestures never create a second instance or restart the track');
audioMod.pause();
A(a1.paused === true, 'pause() stops the music (Game Over path)');
audioMod.resume();
A(a1.paused === false && a1.playCalls === 2, 'resume() restarts the SAME instance');
A(audioMod.toggleMute() === true && a1.muted === true && a1.paused === false,
  'mute flips the element muted flag WITHOUT pausing (position preserved)');
A(globalThis.localStorage._store.pvzMusicMuted === '1', 'mute persists to localStorage');
A(audioMod.toggleMute() === false && a1.muted === false && a1.paused === false &&
  a1.playCalls === 2,
  'unmute restores sound on the same instance with no replay');
// autoplay rejection must be swallowed silently
audioMod._resetForTests();
fakeInstances = [];
globalThis.Audio = class extends FakeAudio {
  play() { this.playCalls++; return Promise.reject(new Error('NotAllowedError')); }
};
let threw = false;
try { audioMod.startOnGesture(); await Promise.resolve(); } catch { threw = true; }
A(threw === false, 'autoplay play() rejection is swallowed without throwing');
// persisted mute: first gesture must NOT attempt playback
audioMod._resetForTests();
fakeInstances = [];
globalThis.Audio = FakeAudio;
globalThis.localStorage._store.pvzMusicMuted = '1';
audioMod._resetForTests();
audioMod.startOnGesture();
const a2 = fakeInstances[0];
A(a2.playCalls === 0, 'a persisted mute means the first gesture starts SILENT (no autoplay attempt)');
A(audioMod.toggleMute() === false, 'unmuting returns false (now unmuted)');
audioMod.resume();
A(a2.playCalls === 1 && a2.paused === false, 'unmute after the silent start resumes playback');
// headless safety: no Audio global -> every call is a safe no-op
audioMod._resetForTests();
delete globalThis.Audio;
let headlessThrew = false;
try { audioMod.startOnGesture(); audioMod.pause(); audioMod.resume(); audioMod.toggleMute(); } catch { headlessThrew = true; }
A(headlessThrew === false, 'all audio calls are safe no-ops without an Audio global');
audioMod._resetForTests();
delete globalThis.localStorage;
```

- [ ] **Step 2: Run to verify §32 fails**

Run: `node tests/pvz-test.mjs 2>&1 | grep -E '^FAIL|TEST' | head`
Expected: the dynamic import of js/audio.js throws (module does not exist) — that is the failing signal.

- [ ] **Step 3: Create js/audio.js**

```js
// Background music: ONE shared Audio instance, autoplay-safe start on the
// first user gesture, mute with localStorage persistence. All music state
// lives here — combat state (state.js) never sees it. Import-safe in Node:
// without an Audio global every playback call is a silent no-op while the
// mute flag still behaves, so headless tests can drive the logic.
//
// Browser autoplay policy: audio may only start after a user gesture, and
// play() can still reject — every play() goes through playSafe(), which
// swallows the rejection without console spam.

let el = null;      // the singleton — constructed exactly once, ever
let started = false; // a gesture has (attempted to) start playback

const SRC = 'audio/bgm/tower-defense-theme.ogg';
const VOLUME = 0.32;        // moderate background level (spec: 0.25-0.40)
const STORAGE_KEY = 'pvzMusicMuted';

let muted = readMuted();

function readMuted() {
  try { return globalThis.localStorage?.getItem(STORAGE_KEY) === '1'; }
  catch { return false; } // private mode / blocked storage: session-only flag
}
function persistMuted() {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, muted ? '1' : '0'); }
  catch { /* session-only fallback */ }
}
function ensureAudio() {
  if (el || typeof globalThis.Audio === 'undefined') return el;
  el = new globalThis.Audio(SRC);
  el.loop = true;
  el.volume = VOLUME;
  el.muted = muted;
  return el;
}
function playSafe() {
  const p = el.play();
  if (p && typeof p.catch === 'function') p.catch(() => {}); // autoplay rejection: silent
}

// Called from the first user gesture (pointerdown/keydown). Idempotent.
export function startOnGesture() {
  const a = ensureAudio();
  if (!a || started) return;
  started = true;
  if (muted) return; // persisted mute: stay silent until the player unmutes
  playSafe();
}
export function toggleMute() {
  muted = !muted;
  persistMuted();
  const a = ensureAudio();
  if (a) a.muted = muted; // muted, not paused: position preserved for seamless unmute
  return muted;
}
export function isMuted() { return muted; }
export function pause() {
  const a = ensureAudio();
  if (a && !a.paused) a.pause(); // idempotent: called every frame during Game Over
}
export function resume() {
  const a = ensureAudio();
  if (!a || !started || muted) return;
  playSafe();
}
// Test seam: drop the singleton and re-read the persisted flag.
export function _resetForTests() {
  el = null;
  started = false;
  muted = readMuted();
}
```

- [ ] **Step 4: Run BOTH modes to verify §32 passes**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED`.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/pvz-test.mjs
git -c user.name=root -c user.email=root@localhost commit -m "Add background music module with singleton Audio and mute persistence"
```

---

### Task 7: Music button UI, first-gesture wiring, game hooks, credits

**Files:**
- Modify: `index.html` (HUD button + credits lines)
- Modify: `style.css` (`.hud-music` styles)
- Modify: `js/ui.js` (imports; toggle wiring + gesture listeners inside `wireInput`)
- Modify: `js/main.js` (audio import; Game Over pause; restart resume)
- Modify: `tests/pvz-test.mjs` (harness: `makeToggle` + `music-toggle` element; append §33)

**Interfaces:**
- Consumes: the audio module API from Task 6; `elements['music-toggle']` stub (textContent + click/keydown listeners).
- Produces: `#music-toggle` in the HUD; document-level one-time `pointerdown`/`keydown` unlock listeners; `update()` pauses music while `state.gameOver`; `restartGame()` resumes it.

- [ ] **Step 1: Harness first (tests/pvz-test.mjs) — add the element stub BEFORE the module import runs**

Add `makeToggle` next to `makeTool` (function declarations hoist, so placing it after `elements` also works, but keep it with the other factories):

```js
// Music toggle is a plain HUD button (no dataset semantics): it only needs
// textContent + listener storage for click/keydown in headless tests.
function makeToggle(label) {
  const h = {};
  return {
    textContent: label,
    addEventListener(ev, fn) { h[ev] = fn; },
    fire(ev, e = {}) { h[ev] && h[ev](e); },
    click() { h.click && h.click({}); },
  };
}
```

Register it in the `elements` map (line ~34):

```js
const elements = {
  'game-canvas': canvas,
  'sun-count': { textContent: '' },
  'health-count': { textContent: '' },
  'level-count': { textContent: '' },
  'music-toggle': makeToggle('🔊'),
};
```

- [ ] **Step 2: Write the failing test (§33, appended after §32)**

```js
// ================= §33. Music button UI + autoplay/game hooks =================
globalThis.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] ?? null; },
  setItem(k, v) { this._store[k] = String(v); },
};
let uiMusic = [];
globalThis.Audio = class {
  constructor(src) {
    this.src = src; this.loop = false; this.volume = 1; this.muted = false;
    this.paused = true; this.playCalls = 0;
    uiMusic.push(this);
  }
  play() { this.playCalls++; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
};
audioMod._resetForTests();
const musicEl = elements['music-toggle'];
A(!!musicEl && musicEl.textContent === '🔊', 'music toggle element stub registered, sound-on icon');
fireDocument('pointerdown'); // the REAL installed first-gesture listener
A(uiMusic.length === 1 && uiMusic[0].playCalls === 1,
  'the installed gesture listener starts the music exactly once');
A(musicEl.textContent === '🔊', 'icon shows sound-on after the gesture');
musicEl.fire('click');
A(audioMod.isMuted() === true && musicEl.textContent === '🔇' && uiMusic[0].muted === true,
  'tapping the button mutes and swaps the icon');
musicEl.fire('click');
A(audioMod.isMuted() === false && musicEl.textContent === '🔊' &&
  uiMusic[0].paused === false && uiMusic[0].playCalls === 2,
  'tapping again unmutes and resumes the SAME instance');
A(uiMusic.length === 1, 'toggles never spawn a second music instance');
musicEl.fire('keydown', { key: 'Enter', preventDefault() {} });
A(audioMod.isMuted() === true && musicEl.textContent === '🔇', 'Enter key activates the button');
musicEl.fire('keydown', { key: 'a', preventDefault() {} });
A(audioMod.isMuted() === true, 'other keys are ignored');
musicEl.fire('click'); // unmute for the hook tests
// Game Over pauses the music; restart resumes it (same instance)
state.gameOver = true;
update(nowValue());
A(uiMusic[0].paused === true, 'Game Over pauses the background music');
restartGame();
A(state.gameOver === false && state.health === 1 &&
  uiMusic[0].paused === false && uiMusic.length === 1,
  'restart resumes music on the same instance (never overlapping copies)');
// shipped-markup regression guards (real index.html, like the shovel §21)
A(/id="music-toggle"/.test(html) && /aria-label="Toggle music"/.test(html),
  'index.html declares the music toggle as an accessible HUD button');
A(/hud-music[^>]*>🔊|>🔊</.test(html), 'the markup ships the sound-on icon');
A(/class="hud-item hud-music"/.test(html), 'the toggle uses the shared .hud-item chip styling');
A(/ashuuya/.test(html) && /128x128 2D Zombies/.test(html) && /CC0/.test(html),
  'credits include the ashuuya zombie sprite pack (title + license)');
A(/Tower Defense Theme/.test(html) && /DST/.test(html),
  'credits include the DST music track');
A(/zombie-sprites/.test(html) && /Clint Bellanger/.test(html),
  'ALL pre-existing credits preserved (original zombie credit intact)');
audioMod._resetForTests();
delete globalThis.Audio;
delete globalThis.localStorage;
resetBoard();
```

- [ ] **Step 3: Run to verify §33 fails**

Run: `node tests/pvz-test.mjs 2>&1 | grep -E '^FAIL|TEST' | head`
Expected: FAILs — gesture listener not installed yet, markup missing, etc. (If instead the run CRASHES at `initializeGame()` because `document.getElementById('music-toggle')` returns undefined, that confirms ui.js must be wired together with the harness change in the same step — proceed.)

- [ ] **Step 4: Markup + styles**

index.html — after the `.hud-level` div inside `.hud`, add:

```html
      <div id="music-toggle" class="hud-item hud-music" role="button" tabindex="0"
           aria-label="Toggle music" title="Music on/off">🔊</div>
```

index.html — in the `<footer class="credits">`, after the shovel line, add:

```html
      Zombie sprites (Sprinter, Brute, Biter): "128x128 2D Zombies Spritesheet" by ashuuya,
      from OpenGameArt — CC0 1.0 (Public Domain); frames repacked for this game.
      Background music: "Tower Defense Theme" by DST, from OpenGameArt — CC0 1.0.
```

style.css — after the `.hud-sun .hud-value { ... }` block, add:

```css
/* Music toggle: same chip look, comfortable tablet tap target */
.hud-music {
  cursor: pointer;
  user-select: none;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  font-size: clamp(16px, 2.6vw, 20px);
  color: var(--cream);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.hud-music:focus-visible {
  outline: 2px solid var(--sun);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Wire js/ui.js**

Add the import at the top:

```js
import * as audio from './audio.js';
```

Inside `wireInput`, after the shovel tool-slot block and BEFORE the existing Escape keydown listener, add:

```js
  // --- Music toggle (all music state lives in audio.js; combat state untouched) ---
  const musicBtn = document.getElementById('music-toggle');
  const syncMusicIcon = () => { musicBtn.textContent = audio.isMuted() ? '🔇' : '🔊'; };
  syncMusicIcon(); // initial icon reflects the persisted preference
  musicBtn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    syncMusicIcon();
    if (!muted) audio.resume(); // unmute mid-game resumes seamlessly
  });
  musicBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      musicBtn.click();
    }
  });

  // Browser autoplay policy: the music may only begin after a user gesture.
  // startOnGesture is idempotent, so both listeners may fire freely.
  document.addEventListener('pointerdown', () => audio.startOnGesture());
  document.addEventListener('keydown', () => audio.startOnGesture());
```

- [ ] **Step 6: Wire js/main.js**

Add the import:

```js
import * as audio from './audio.js';
```

Replace the first two lines of `update()`:

```js
export function update(now) {
  if (state.gameOver) { audio.pause(); return; } // idempotent: stops BGM on Game Over
  if (!state.running) return;
```

In `restartGame()`, add before the final `lastTime = performance.now();`:

```js
  audio.resume(); // no-op while muted or before the first gesture
```

- [ ] **Step 7: Run BOTH modes**

Run: `node tests/pvz-test.mjs 2>&1 | tail -3 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -3`
Expected: both `ALL TESTS PASSED`.

- [ ] **Step 8: Commit**

```bash
git add index.html style.css js/ui.js js/main.js tests/pvz-test.mjs
git -c user.name=root -c user.email=root@localhost commit -m "Add music HUD toggle, autoplay-safe start, and asset credits"
```

---

### Task 8: Final verification, acceptance walk, report

**Files:**
- Modify (status line only): `task-enemies-music.md`
- No code changes expected — if anything fails here, fix in the owning module and re-run everything.

- [ ] **Step 1: Full suite, both modes**

Run: `node tests/pvz-test.mjs 2>&1 | tail -1 && SPRITE_STUB=1 node tests/pvz-test.mjs 2>&1 | tail -1`
Expected: `ALL TESTS PASSED` twice; also confirm exit codes: `node tests/pvz-test.mjs >/dev/null 2>&1; echo $?` -> `0`.

- [ ] **Step 2: HTTP smoke test (every shipped asset resolves)**

Run:
```bash
python3 -m http.server 8137 >/tmp/opencode/http.log 2>&1 &
sleep 1
for f in images/zombie.png images/zombie_sprinter.png images/zombie_brute.png images/zombie_biter.png images/sunflower.png images/peashooter_cut.png images/wallnut.png images/snowpea.png images/repeater.png images/shovel.png audio/bgm/tower-defense-theme.ogg js/audio.js index.html style.css; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8137/$f"); echo "$code $f";
done
kill %1
```
Expected: every line `200 <path>`.

- [ ] **Step 3: Live browser check (best effort — skip cleanly if the browser tool is unavailable)**

Open `http://127.0.0.1:8137/` in a browser tab. Verify: HUD shows the 🔊 chip; first click starts music; mute/unmute swaps icons; plant a Peashooter, wait for a wave, confirm mixed zombies render at correct sizes with HP bars (Brute wider); shoveled plants still refund; Game Over pauses music and restart resumes. Record results (or "browser unavailable — headless + HTTP smoke only") in the final report.

- [ ] **Step 4: Acceptance checklist walk (spec §12)**

Re-read spec `task-enemies-music.md` §12 and confirm every box against evidence (test names, file contents, browser check). Note anything unverifiable headless (tablet feel) as user-side follow-ups.

- [ ] **Step 5: Update the spec status + commit**

Change the spec's first lines to `Status: COMPLETE (see git log for task commits)` and:

```bash
git add task-enemies-music.md
git -c user.name=root -c user.email=root@localhost commit -m "Mark enemy expansion spec complete after full verification"
```

- [ ] **Step 6: Deliver the final report (spec §51's 23 items)**

Report to the user: files changed/created, module structure, asset + music URLs/authors/licenses, final stats table, weights, interval progression, burst design, per-type behavior explanations, Snow Pea verification evidence, autoplay/mute implementation, test totals (both modes), browser/manual results, tablet caveats, and the explicit confirmations: no official PvZ assets used; health strictly 1 = alive / 0 = immediate Game Over.
