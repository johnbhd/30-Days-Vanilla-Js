// Zombie spawning, walking, eating, house breach (health 1 -> 0 lives here),
// and wave scheduling.
import { COLS, ROWS, CELL_W, LOGICAL_W } from './config.js';

// --- Spawn a zombie ---
export function spawnZombie(state) {
  const row = Math.floor(Math.random() * ROWS);
  const difficulty = 1 + (state.level - 1) * 0.15;
  state.zombies.push({
    row,
    x: LOGICAL_W + 30,
    hp: 100 * difficulty,
    maxHp: 100 * difficulty,
    speed: (0.25 + Math.random() * 0.15) * difficulty,
    eating: false,
  });
}

export function updateZombies(state, dt) {
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
        plant.hp -= 8 * (dt / 1000);
        if (plant.hp <= 0) {
          state.grid[z.row][col] = null;
        }
      }
    }

    if (!z.eating) {
      z.x -= z.speed * (dt / 16);
    }

    // Reached the house: health 1 -> 0 => immediate Game Over.
    if (z.x < 10) {
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
      state.waveInterval = Math.max(2500, state.waveInterval - 800);
    }
  }
}
