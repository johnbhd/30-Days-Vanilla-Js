// Plant creation + per-frame plant behavior (sun production, shooting).
import { PLANTS, CELL_W, CELL_H } from './config.js';
import { spawnSun } from './suns.js';
import { spawnProjectile } from './projectiles.js';

export function createPlant(type, row, col, now) {
  const def = PLANTS[type];
  return {
    type,
    hp: def.hp,
    maxHp: def.hp,
    lastAction: now,
    row, col,
  };
}

export function updatePlants(state, now) {
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const p = state.grid[r][c];
      if (!p) continue;

      // Sunflowers produce sun on a timer.
      if (p.type === 'sunflower' && now - p.lastAction > PLANTS.sunflower.sunInterval) {
        p.lastAction = now;
        const cx = c * CELL_W + CELL_W / 2;
        const cy = r * CELL_H + CELL_H / 2;
        spawnSun(state, cx, cy, cy + 30);
      }

      // Peashooter shoots if zombie in same row
      if (p.type === 'peashooter' && now - p.lastAction > PLANTS.peashooter.shootInterval) {
        const hasZombie = state.zombies.some(z => z.row === r && z.x > c * CELL_W);
        if (hasZombie) {
          p.lastAction = now;
          spawnProjectile(state, r, c);
        }
      }
    }
  }
}
