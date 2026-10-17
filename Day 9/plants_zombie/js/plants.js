// Plant creation + per-frame plant behavior. Config-driven by PLANT_TYPES:
// one code path per role (sun / shooter / defense) serves all five plants.
import { PLANT_TYPES, CELL_W, CELL_H } from './config.js';
import { spawnSun } from './suns.js';
import { spawnProjectile } from './projectiles.js';

export function createPlant(type, row, col, now) {
  const def = PLANT_TYPES[type];
  return {
    type,
    hp: def.hp,
    maxHp: def.hp,
    lastAction: now,
    row, col,
    // Multi-shot queue state (role 'shooter'; inert for other roles)
    shotsLeft: 0,
    nextShotAt: 0,
  };
}

export function updatePlants(state, now) {
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const p = state.grid[r][c];
      if (!p) continue;
      const def = PLANT_TYPES[p.type];
      if (!def) continue;

      // --- Role: sun — produce sun on a timer ---
      if (def.role === 'sun' && now - p.lastAction > def.sunInterval) {
        p.lastAction = now;
        const cx = c * CELL_W + CELL_W / 2;
        const cy = r * CELL_H + CELL_H / 2;
        spawnSun(state, cx, cy, cy + 30);
      }

      // --- Role: shooter — shared by Peashooter, Snow Pea and Repeater ---
      if (def.role === 'shooter') {
        // Start an attack when off cooldown and a zombie is in this lane
        // (to the right of the plant).
        if (p.shotsLeft === 0 && now - p.lastAction > def.shootInterval) {
          const hasZombie = state.zombies.some(z => z.row === r && z.x > c * CELL_W);
          if (hasZombie) {
            p.lastAction = now;
            p.shotsLeft = def.shotsPerAttack;
            p.nextShotAt = now;
          }
        }
        // Release queued shots on schedule. The first shot fires in the same
        // frame the attack starts (identical to the original single-shot
        // behavior); additional shots wait `shotDelay` ms (Repeater: 200ms).
        while (p.shotsLeft > 0 && now >= p.nextShotAt) {
          spawnProjectile(state, r, c);
          p.shotsLeft -= 1;
          p.nextShotAt = now + def.shotDelay;
        }
      }

      // --- Role: defense (Wall-nut) — nothing to do here: no sun, no shot.
      //     High HP only; zombies eat it through the shared eating system.
    }
  }
}
