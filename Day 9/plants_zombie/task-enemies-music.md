# Task Spec: 3 New Zombie Types + Background Music + Difficulty

Status: COMPLETE — implemented per docs/superpowers/plans/2026-10-18-enemies-music-difficulty.md
(commits e1113d5..HEAD), verified §12 acceptance walk; 293 assertions green in both
test modes; browser/tablet feel checks remain user-side.

Baseline: commit `a227958`, clean tree, 164/164 tests PASS in both modes
(`node tests/pvz-test.mjs`, `SPRITE_STUB=1 node tests/pvz-test.mjs`).

---

## 0. Goal

Add three config-driven zombie types (fast / tank / strong attacker) using CC0
sprite sheets verified on OpenGameArt; add looping CC0 background music with a
compact HUD mute button; make the game NOTICEABLY HARDER but fair via mixed
spawns, slightly faster spawn intervals, and burst pressure — without touching
health rules, plants, shovel, or the existing normal zombie's behavior.

## 1. Hard constraints (DO NOT CHANGE)

- Health strictly binary: 1 = alive, 0 = immediate Game Over. ANY type crossing
  HOUSE_X = exactly 1 -> 0. No multi-damage per type.
- Existing Normal Zombie: sprite, sheet layout, stats, feel all identical
  (HP 100 x diff, speed 0.25-0.40 x diff, 8 dps eat, reward 10).
- Plants: costs, HP, damage, fire/sun intervals, Repeater double-shot, and the
  Snow Pea slow architecture (`slowUntil` timestamp x SLOW_MULT, no stacking,
  base speed never mutated).
- Shovel: select -> dig -> floor(cost x 0.5) refund -> auto-deselect; a zombie
  whose target plant is removed resumes walking (must hold for new types).
- No new modules except `js/audio.js`. One-way module dependency edges preserved.
- No bosses, flying, lane switching, armor breaks, power-ups, multiple music
  tracks, or sound effects.
- Existing credits preserved; new credits added (sprites + music).
- The existing 164 assertions pass UNMODIFIED (new tests are additions only).

## 2. Verified assets (licenses opened & confirmed on the actual pages)

### 2.1 Zombie sprites — pack "128x128 2D Zombies Spritesheet"
- Author: ashuuya
- License: **CC0 1.0 (Public Domain)** — badge on page; author notice:
  "Feel to use anywhere you want... No credits required, but would be nice"
- Page: https://opengameart.org/content/128x128-2d-zombies-spritesheet
- Files (downloaded to /tmp/opencode/research/):
  zombie_type{A,B,C}_{walk,attack}_spritesheet.png
- Style: smooth cartoon, bold outlines, transparent PNG, faces LEFT (the game's
  direction) — no flipping needed.
- Animations: 4 walk + 4 attack frames per type. NO death/hurt frames -> keep
  the existing immediate-removal death (per user fallback rule, no death anim).

### 2.2 Music — "Tower Defense Theme" by DST (nosoapradio.us)
- License: **CC0 1.0** — verified on page; made exclusively for OpenGameArt
- Page: https://opengameart.org/content/tower-defense-theme
- Duration 199.4 s (3:19); tags: happy, cute, mellow, tower/defense, loop
- Source: 320 kbps MP3, 7.98 MB (downloaded, probed)
- Ship: re-encoded **MP3 128 kbps ~= 3.19 MB** (`ffmpeg -c:a libmp3lame -b:a 128k`),
  FULL track (no trim — preserves the designed loop seam).
  *Post-review amendment:* the plan's OGG q3 was swapped for MP3 because iOS/iPadOS
  Safari cannot play OGG — music would be dead on the tablet target. MP3 plays
  everywhere (same master, same duration, +0.3 MB).

"No official Plants vs. Zombies sprites or music are used."

### 2.3 Role mapping
| Role                | Name      | Sheet                    |
|---------------------|-----------|--------------------------|
| Fast / low HP       | Sprinter  | typeC (schoolgirl zombie)|
| Slow / high HP      | Brute     | typeB (brain-exposed)    |
| Strong attacker     | Biter     | typeA (green, heart shirt)|

## 3. Measured frame data (input to the repack pipeline)

Opaque content column-runs per sheet (1-px antialias specks filtered):

| Sheet                  | Size     | Frame runs (x0..x1)                                | Rows   |
|------------------------|----------|----------------------------------------------------|--------|
| typeA walk             | 284x138  | 5-64, 90-136, 156-207, 232-278                     | 5..132 |
| typeA attack           | 353x138  | 5-64, 85-154, 165-234, 257-332                     | 5..132 |
| typeB walk             | 257x137  | 5-67, 78-127, 138-191, 202-251                     | 5..131 |
| typeB attack           | 301x137  | 5-67, 78-143, 154-211, 222-295                     | 5..131 |
| typeC walk             | 279x129  | 5-73, 84-138, 149-209, 220-273                     | 5..123 |
| typeC attack           | 325x129  | 5-73, 84-155, 166-235, 246-319                     | 5..123 |

(typeA attack also had stray 1-px specks at x=74,246,347 — filtered by the
>= 20 px min-width rule; the four real frames survive.)

## 4. Repack pipeline (pngjs script in /tmp/opencode — NOT committed; same
pattern as the shovel/snowpea asset pipelines)

For each of A, B, C:
1. Detect content runs per sheet; drop runs narrower than 20 px.
2. Crop each of the 8 frames to its content bbox.
3. maxW / maxH = maximum across all 8 frames.
4. Repack into a uniform grid 4 cols x 2 rows, tile = maxW x maxH (transparent);
   paste each frame with its content horizontally centered and bottom-aligned.
5. Row 0 = walk, row 1 = attack.
6. Write images/zombie_sprinter.png (typeC), images/zombie_brute.png (typeB),
   images/zombie_biter.png (typeA).
7. Print actual tile size + content height and feed those into ZOMBIE_ANIM —
   expected roughly A 76x128, B 74x127, C 74x119; VERIFY programmatically,
   never hardcode blind.

Rendering note: per-frame re-centering normalizes per-frame horizontal shifts;
walk-in-place and in-place lunges are unaffected in practice (feet line is
constant across frames).

## 5. Config (js/config.js — single source of truth)

```js
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
// (Rendering-only fields — visualFrac, barWidthFrac, animation rows/timing —
// live in ZOMBIE_ANIM (spec §7), one home per number.)

// index = level-1, clamped to the last row for higher levels
export const SPAWN_WEIGHTS = [
  { normal: 85, sprinter: 15, brute: 0,  biter: 0  }, // L1
  { normal: 60, sprinter: 25, brute: 15, biter: 0  }, // L2
  { normal: 45, sprinter: 25, brute: 15, biter: 15 }, // L3
  { normal: 35, sprinter: 25, brute: 20, biter: 20 }, // L4+
];

// burst = chance the spawn event drops a SECOND weighted zombie
export const BURST_CHANCE = [0, 0, 0.15, 0.25, 0.35]; // L1,L2,L3,L4,L5+ (clamp)

// BALANCE edits:
//   WAVE_INTERVAL_STEP: 800 -> 900   (floor WAVE_INTERVAL_MIN 2500 unchanged)
```

- Every type's stats still scale by the EXISTING law
  `difficulty = 1 + (level - 1) * ZOMBIE_DIFFICULTY_STEP` at spawn time.
- `normal.reward = BALANCE.KILL_SUN_REWARD` keeps one source of truth (10).
- BALANCE.EAT_DPS stays 8 — it is the baseline/default; Biter's 14 lives only
  in its type config.

Interval progression (ms), old vs new:

| Level | 1    | 2    | 3    | 4    | 5    | 6    | 7+        |
|-------|------|------|------|------|------|------|-----------|
| Old   | 8000 | 7200 | 6400 | 5600 | 4800 | 4000 | 3200->2500|
| New   | 8000 | 7100 | 6200 | 5300 | 4400 | 3500 | 2500 floor|

New is faster than old at every level (never a nerf); the floor guarantees a
safe minimum. Level +1 per 8 spawns stays unchanged.

## 6. Zombie object & logic (js/zombies.js, js/projectiles.js)

Object: `{ type, row, x, speed, hp, maxHp, eatDps, reward, eating, slowUntil? }`

- Field name stays **`speed`** (the per-zombie type base; NEVER mutated) —
  protects existing tests that construct zombies manually.
- `spawnZombie(state, rng = Math.random)`:
  1. roll type from SPAWN_WEIGHTS[level-1] via cumulative weights + rng()
  2. row = floor(rng() * ROWS) (unchanged randomness; multi-zombie lanes
     already possible — no lane exclusivity)
  3. speed = (speedMin + rng() * (speedMax - speedMin)) * difficulty
  4. hp = maxHp = type.hp * difficulty
- Eating (updateZombies): `plant.hp -= (z.eatDps ?? EAT_DPS) * dt / 1000`
  — manually-built test zombies default to 8 (legacy behavior).
- Kill reward (projectiles): `state.sun += z.reward ?? KILL_SUN_REWARD`.
- Breach, slow application, removal: shared code path — unchanged, all types
  flow through it. Snow Pea: `slowUntil` timestamp x SLOW_MULT 0.65 of the
  zombie's OWN speed; expiry restores its own type speed automatically.
- updateWaves: after the normal spawn, `if (rng() < BURST_CHANCE[clamp(level-1)])
  spawnZombie(state, rng)` — second zombie with its own type/row roll.

## 7. Renderer (js/rendering.js)

- Replace the hardcoded frame math with per-type metadata ZOMBIE_ANIM[spriteKey]:
  - normal: encodes the EXISTING sheet exactly — tile 128, bodyTop 47,
    foot 102.5, cx 61.5, walk { row 0, start 4, count 8, ms 140 },
    attack { row 0, start 16, count 4, ms 150 }, visualFrac 0.80
    => byte-identical visual behavior for the existing zombie.
  - new types: uniform repacked grid — walk { row 0, start 0, count 4, ms walkMs },
    attack { row 1, start 0, count 4, ms attackMs };
    anchor: tile center = z.x, tile bottom = lane bottom - 4 (foot inset);
    scale = (CELL_H * visualFrac) / tileH.
- Frame pick keeps the existing pattern:
  `start + floor(now / ms) % count`; eating -> attack row, else walk.
  Zombies without `type` (manual tests) render as 'normal'.
- HP bar width: `CELL_W * barWidthFrac` (Brute wider); position/height unchanged.
- Procedural fallback (headless or load failure): existing vector zombie with
  per-type tint + scale (sprinter slim/teal, brute large/gray, biter red-eyed).
- Frost slow visual: existing generic effect, untouched.

## 8. Audio (js/audio.js, new, small)

- Singleton: `let el = null`; `ensureAudio()` creates ONE
  `Audio('audio/bgm/tower-defense-theme.mp3')`, loop = true, volume = 0.32,
  applies the persisted mute flag.
- Autoplay-safe start: one-time document `pointerdown`/`keydown` listener
  (installed by ui/main) -> ensureAudio() + `el.play().catch(() => {})`.
- API: `toggleMute()` (flips flag, sets el.muted, persists
  localStorage['pvzMusicMuted'] in try/catch, returns new state), `isMuted()`,
  `pause()`, `resume()` (no-op unless already started AND unmuted).
- Mute uses el.muted (playback position preserved -> seamless unmute).
- Game Over -> pause(); restart -> resume().
- Node-safe: `typeof Audio === 'undefined'` guard; flag logic works headless,
  playback no-ops. Testable via an injected fake Audio (read at call time).
- NEVER constructs a second element — no overlapping copies, ever.

## 9. UI (index.html, js/ui.js, style.css)

- HUD (after Level):
  `<div id="music-toggle" class="hud-item hud-music" role="button" tabindex="0"
        aria-label="Toggle music">&#128266;</div>`
- Click / Enter / Space -> toggleMute(); icon swaps <-> immediately.
- Styled to match existing HUD items; comfortable tablet tap target (~40 px+).
- Credits: add ashuuya sprite line + DST music line; preserve everything else.
- state.js: NO music fields — the audio module owns all music state.

## 10. Files

Modify: js/config.js, js/zombies.js, js/projectiles.js, js/rendering.js,
js/assets.js, js/main.js, js/ui.js, index.html, style.css, tests/pvz-test.mjs
Create: js/audio.js, images/zombie_sprinter.png, images/zombie_brute.png,
images/zombie_biter.png, audio/bgm/tower-defense-theme.mp3
(Generator scripts live in /tmp/opencode and are NOT committed — consistent with
the shovel/snowpea pipelines.)

## 11. Test plan (additions to tests/pvz-test.mjs; the existing 164 stay green)

- §22 Config & normal-equivalence: ZOMBIE_TYPES shape; normal reproduces legacy
  values exactly (hp 100, .25-.40, 8 dps, reward 10).
- §23 Spawning: weighted pick deterministic with injected rng; L1 never yields
  brute/biter at any rng; spawn interval floor respected at high level; burst
  fires only at L3+; no invalid type ever spawned.
- §24 Per-type stats & rewards: sprinter hp<normal & faster; brute hp>=2x &
  slower; biter eatDps>normal; kill rewards 10/12/25/16.
- §25 Slow (all four types): ice hit sets slowUntil; movement reduced; expiry
  restores each type's OWN speed (fast returns fast, tank returns slow).
- §26 Durability & chewing: tank survives measurably more peas than normal;
  biter kills a plant ~1.75x faster than normal.
- §27 Breach: each new type below HOUSE_X -> health 1 -> 0 Game Over.
- §28 Shovel regression: brute eating a wall-nut, wall-nut shoveled -> brute
  resumes walking (also covered generically by existing tests).
- §29 Audio (fake Audio injected): single instance across restarts; loop=true;
  volume within 0.25-0.40; play() rejection swallowed without throwing;
  toggleMute flips + persists; unmute restores; pause on Game Over; resume
  suppressed when muted; import-safe when Audio is undefined.
- §30 Difficulty sanity: L1 = 85% normal @ 8000 ms; brute/biter impossible at
  L1; interval never below 2500.

Verification commands (after every task):
`node tests/pvz-test.mjs` && `SPRITE_STUB=1 node tests/pvz-test.mjs` (both green)
+ HTTP smoke (python http.server; curl 200 for new PNGs and the OGG).

## 12. Acceptance criteria (user's checklist)

- [ ] Existing Normal Zombie remains.
- [ ] Three new enemy types are added.
- [ ] Fast enemy is visibly faster and less durable.
- [ ] Tank enemy is slower and significantly tougher.
- [ ] Strong attacker damages plants faster.
- [ ] All enemies use shared movement/collision/eating architecture.
- [ ] All enemies support Snow Pea slow.
- [ ] Slow expiration restores each enemy's OWN base speed.
- [ ] All enemies show working HP bars.
- [ ] All enemies can trigger the same Health 1 -> 0 Game Over condition.
- [ ] New enemies use legally reusable sprite sheets.
- [ ] Asset sources/licenses verified.
- [ ] No official PvZ enemy sprite used.
- [ ] Background music comes from a legally reusable source.
- [ ] No official/remixed/copied PvZ soundtrack used.
- [ ] Music loops properly.
- [ ] Browser autoplay restrictions handled.
- [ ] Music mute/unmute works.
- [ ] Only one music instance plays.
- [ ] Game is noticeably harder than before.
- [ ] Level 1 remains fair.
- [ ] Later levels use mixed enemies.
- [ ] Spawn rate increases gradually.
- [ ] No extreme tank spam.
- [ ] Existing plants still useful.
- [ ] Wall-nut becomes strategically valuable.
- [ ] Snow Pea slow becomes strategically valuable.
- [ ] Repeater becomes useful against tank enemies.
- [ ] Shovel still works.
- [ ] Health remains exactly 1 or 0.
- [ ] Existing automated tests still pass.
- [ ] New tests pass.
- [ ] Tablet UI remains usable.

## 13. Out of scope

Sound effects, death animations, plant rebalancing, bosses/flying/lane
switching, multiple music tracks, flipping sprites, music fields in state.js.
