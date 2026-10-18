// Zombie spawning, walking, eating, house breach (health 1 -> 0 lives here),
// and wave scheduling.
import { COLS, ROWS, CELL_W, LOGICAL_W, BALANCE, ZOMBIE_TYPES, SPAWN_WEIGHTS, BURST_CHANCE } from './config.js';

// Weighted type pick from the level's SPAWN_WEIGHTS row (clamped for levels
// beyond the table — and below it, so level 0 / negatives floor to row 1).
// rng is injectable so tests can drive it deterministically.
export function pickZombieType(level, rng = Math.random) {
  const row = Math.max(0, Math.min(level, SPAWN_WEIGHTS.length) - 1);
  const weights = SPAWN_WEIGHTS[row];
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

export function updateZombies(state, now, dt) {
  // --- Update zombies ---
  for (let i = state.zombies.length - 1; i >= 0; i--) {
    const z = state.zombies[i];
    z.eating = false;

    // Check if zombie is at a plant
    const col = Math.floor(z.x / CELL_W);
    if (col >= 0 && col < COLS) {
      const plant = state.grid[z.row][col];
      if (plant && z.x <= (col + 0.7) * CELL_W) {
        z.eating = true;
        // Per-type chewing speed; hand-built test zombies (no eatDps) keep the
        // legacy 8 dps baseline.
        plant.hp -= (z.eatDps ?? BALANCE.EAT_DPS) * (dt / 1000);
        if (plant.hp <= 0) {
          state.grid[z.row][col] = null;
        }
      }
    }

    if (!z.eating) {
      // Snow Pea slow: derived from the slowUntil timestamp — the base speed
      // z.speed is NEVER mutated. Expired slow reverts automatically; a fresh
      // ice hit just moves the deadline (constant multiplier => no stacking).
      const slowed = z.slowUntil !== undefined && now < z.slowUntil;
      const slowMult = slowed ? BALANCE.SLOW_MULT : 1;
      z.x -= z.speed * slowMult * (dt / 16);
    }

    // Reached the house: health 1 -> 0 => immediate Game Over.
    if (z.x < BALANCE.HOUSE_X) {
      state.zombies.splice(i, 1);
      state.health -= 1;
      if (state.health <= 0) {
        state.gameOver = true;
      }
    }
  }
}

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
