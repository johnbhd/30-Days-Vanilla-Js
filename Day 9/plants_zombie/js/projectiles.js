// Projectile movement + hit resolution (pure state transitions; UI updated
// once per frame by the orchestrator in main.js — no ui dependency here).
// One engine serves every projectile type; `type` distinguishes them:
//   'pea'    — plain damage (Peashooter, Repeater)
//   'icePea' — damage + temporary slow (Snow Pea)
import { CELL_W, CELL_H, LOGICAL_W, BALANCE } from './config.js';

export function spawnProjectile(state, row, col, type) {
  state.projectiles.push({
    row,
    x: col * CELL_W + CELL_W * 0.7,
    y: row * CELL_H + CELL_H / 2,
    type: type || 'pea',
  });
}

export function updateProjectiles(state, now, dt) {
  // --- Update projectiles ---
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.x += BALANCE.PEA_SPEED * (dt / 16);
    if (p.x > LOGICAL_W + 20) { state.projectiles.splice(i, 1); continue; }
    // Hit zombie?
    for (let j = state.zombies.length - 1; j >= 0; j--) {
      const z = state.zombies[j];
      if (z.row === p.row && Math.abs(p.x - z.x) < 20) {
        z.hp -= BALANCE.PEA_DAMAGE;
        // Ice pea: set/refresh the slow deadline. This only writes a timestamp —
        // the zombie's base speed is never modified, and a re-hit replaces the
        // deadline (refresh), so slows can never stack or multiply.
        if (p.type === 'icePea') {
          z.slowUntil = now + BALANCE.SLOW_MS;
        }
        state.projectiles.splice(i, 1);
        if (z.hp <= 0) {
          state.zombies.splice(j, 1);
          // Per-type reward; hand-built test zombies (no reward) fall back to
          // the legacy flat KILL_SUN_REWARD.
          state.sun += z.reward ?? BALANCE.KILL_SUN_REWARD;
        }
        break;
      }
    }
  }
}
