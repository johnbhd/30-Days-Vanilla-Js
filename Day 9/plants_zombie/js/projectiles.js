// Pea movement + hit resolution (pure state transitions; UI updated once per
// frame by the orchestrator in main.js — no ui dependency here).
import { CELL_W, CELL_H, LOGICAL_W, BALANCE } from './config.js';

export function spawnProjectile(state, row, col) {
  state.peas.push({
    row,
    x: col * CELL_W + CELL_W * 0.7,
    y: row * CELL_H + CELL_H / 2,
  });
}

export function updateProjectiles(state, dt) {
  // --- Update peas ---
  for (let i = state.peas.length - 1; i >= 0; i--) {
    const p = state.peas[i];
    p.x += BALANCE.PEA_SPEED * (dt / 16);
    if (p.x > LOGICAL_W + 20) { state.peas.splice(i, 1); continue; }
    // Hit zombie?
    for (let j = state.zombies.length - 1; j >= 0; j--) {
      const z = state.zombies[j];
      if (z.row === p.row && Math.abs(p.x - z.x) < 20) {
        z.hp -= BALANCE.PEA_DAMAGE;
        state.peas.splice(i, 1);
        if (z.hp <= 0) {
          state.zombies.splice(j, 1);
          state.sun += BALANCE.KILL_SUN_REWARD; // small reward
        }
        break;
      }
    }
  }
}
