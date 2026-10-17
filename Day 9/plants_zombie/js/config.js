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

  PEA_DAMAGE: 25,          // damage per pea / ice pea
  PEA_SPEED: 4,            // projectile px per (dt/16) tick

  EAT_DPS: 8,              // zombie bite damage per second
  HOUSE_X: 10,             // zombie past this x => house breach (health 1 -> 0)

  ZOMBIE_BASE_HP: 100,
  ZOMBIE_DIFFICULTY_STEP: 0.15, // +15% hp/speed per level
  WAVE_INTERVAL: 8000,     // ms between zombie spawns
  WAVE_INTERVAL_MIN: 2500, // floor for the interval
  WAVE_INTERVAL_STEP: 800, // interval reduction per level

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
