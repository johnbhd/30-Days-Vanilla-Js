// Plants vs Zombies - Simple Edition — centralized configuration.
// Logical game-space size. All gameplay coordinates, grid math, spawning and
// collisions use these constants (NOT the canvas backing-store size, which may
// be scaled up by devicePixelRatio for crisp rendering on hi-DPI screens).
export const LOGICAL_W = 600;
export const LOGICAL_H = 400;

export const COLS = 9;
export const ROWS = 5;
export const CELL_W = LOGICAL_W / COLS;
export const CELL_H = LOGICAL_H / ROWS;

// --- Balance: every gameplay number lives here (no magic numbers elsewhere) ---
export const BALANCE = {
  START_SUN: 200,          // starting sun; restart resets to this
  KILL_SUN_REWARD: 10,     // sun granted per zombie kill

  SHOVEL_REFUND_RATE: 0.5, // shovel refund = floor(cost * rate), e.g. Snow Pea 175 -> 87

  PEA_DAMAGE: 25,          // damage per pea / ice pea
  PEA_SPEED: 4,            // projectile px per (dt/16) tick

  EAT_DPS: 8,              // zombie bite damage per second
  HOUSE_X: 10,             // zombie past this x => house breach (health 1 -> 0)

  ZOMBIE_BASE_HP: 100,
  ZOMBIE_DIFFICULTY_STEP: 0.15, // +15% hp/speed per level
  WAVE_INTERVAL: 8000,     // ms between zombie spawns
  WAVE_INTERVAL_MIN: 2500, // floor for the interval
  WAVE_INTERVAL_STEP: 900, // interval reduction per level (steepened for the enemy expansion)

  SKY_SUN_EVERY_MS: 6000,  // expected time between free sky suns
  SUN_TTL: 8000,           // ms before a sun expires

  SLOW_MULT: 0.65,         // Snow Pea: slowed speed = base * SLOW_MULT
  SLOW_MS: 3000,           // slow duration; a re-hit refreshes, never stacks
  REPEATER_DELAY: 200,     // ms between the Repeater's two shots
};

// --- Plant definitions (single source of truth: stats, roles, card labels) ---
// role drives behavior in plants.js — no per-plant if/else forests:
//   'sun'     => produces sun on a timer
//   'shooter' => fires `projectile` every `shootInterval`, `shotsPerAttack`
//                projectiles per attack separated by `shotDelay` ms
//   'defense' => no sun, no projectile; just high HP (eats like any plant)
export const PLANT_TYPES = {
  sunflower: {
    name: 'Sunflower', cost: 50, hp: 60, role: 'sun', sunInterval: 7000,
  },
  peashooter: {
    name: 'Pea Shooter', cost: 100, hp: 100, role: 'shooter',
    shootInterval: 1800, shotsPerAttack: 1, shotDelay: 0, projectile: 'pea',
  },
  wallnut: {
    name: 'Wall-nut', cost: 50, hp: 400, role: 'defense',
  },
  snowpea: {
    name: 'Snow Pea', cost: 175, hp: 100, role: 'shooter',
    shootInterval: 1800, shotsPerAttack: 1, shotDelay: 0, projectile: 'icePea',
  },
  repeater: {
    name: 'Repeater', cost: 200, hp: 100, role: 'shooter',
    shootInterval: 1800, shotsPerAttack: 2, shotDelay: BALANCE.REPEATER_DELAY,
    projectile: 'pea',
  },
};

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
// (Rendering-only fields — visualFrac, barWidthFrac, animation rows/timing —
// live in ZOMBIE_ANIM (spec §7), one home per number.)

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
