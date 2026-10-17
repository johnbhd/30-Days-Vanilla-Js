// Zombie spawning, walking, eating, house breach (health 1 -> 0 lives here),
// and wave scheduling.
import { COLS, ROWS, CELL_W, LOGICAL_W, BALANCE } from './config.js';

// --- Spawn a zombie ---
export function spawnZombie(state) {
  const row = Math.floor(Math.random() * ROWS);
  const difficulty = 1 + (state.level - 1) * BALANCE.ZOMBIE_DIFFICULTY_STEP;
  state.zombies.push({
    row,
    x: LOGICAL_W + 30,
    hp: BALANCE.ZOMBIE_BASE_HP * difficulty,
    maxHp: BALANCE.ZOMBIE_BASE_HP * difficulty,
    speed: (0.25 + Math.random() * 0.15) * difficulty,
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
        plant.hp -= BALANCE.EAT_DPS * (dt / 1000);
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

export function updateWaves(state, dt) {
  // --- Wave spawning ---
  state.waveTimer += dt;
  if (state.waveTimer > state.waveInterval) {
    state.waveTimer = 0;
    spawnZombie(state);
    state.spawned = (state.spawned || 0) + 1;
    // Level up every 8 zombies, speed up the wave
    if (state.spawned % 8 === 0) {
      state.level += 1;
      state.waveInterval = Math.max(BALANCE.WAVE_INTERVAL_MIN, state.waveInterval - BALANCE.WAVE_INTERVAL_STEP);
    }
  }
}
