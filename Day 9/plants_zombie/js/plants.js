// Plant creation + per-frame plant behavior. Config-driven by PLANT_TYPES:
// one code path per role (sun / shooter / defense) serves all five plants.
import { PLANT_TYPES, BALANCE, CELL_W, CELL_H } from './config.js';
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

// Generic plant removal + 50% refund. ONE code path serves all five plant
// types: the refund is derived from the plant's config cost, so a future
// price change (or a new plant) automatically refunds correctly. Refund is
// independent of remaining HP — it is always a share of the ORIGINAL cost.
// Returns the refund granted (0 if there was no plant on that cell).
export function removePlantWithRefund(state, row, col) {
  const plant = state.grid[row][col];
  if (!plant) return 0;
  const refund = Math.floor(PLANT_TYPES[plant.type].cost * BALANCE.SHOVEL_REFUND_RATE);
  state.grid[row][col] = null; // grid is the only plant store -> removal is one assignment
  state.sun += refund;
  return refund;
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
          spawnProjectile(state, r, c, def.projectile);
          p.shotsLeft -= 1;
          p.nextShotAt = now + def.shotDelay;
        }
      }

      // --- Role: defense (Wall-nut) — nothing to do here: no sun, no shot.
      //     High HP only; zombies eat it through the shared eating system.
    }
  }
}
