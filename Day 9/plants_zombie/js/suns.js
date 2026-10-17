// Sun spawning and falling (sunflower suns, random sky suns, TTL expiry).
import { LOGICAL_W, LOGICAL_H, BALANCE } from './config.js';

// --- Spawn a sun from sky or sunflower ---
export function spawnSun(state, x, y, targetY) {
  state.suns.push({
    x, y,
    targetY: targetY !== undefined ? targetY : y + 60 + Math.random() * 80,
    value: 25,
    ttl: BALANCE.SUN_TTL,
    falling: true,
    createdAt: performance.now(),
  });
}

export function updateSuns(state, now, dt) {
  // --- Random sky sun ---
  if (Math.random() < dt / BALANCE.SKY_SUN_EVERY_MS) {
    const x = 50 + Math.random() * (LOGICAL_W - 100);
    spawnSun(state, x, -20, 80 + Math.random() * (LOGICAL_H - 160));
  }

  // --- Update suns ---
  for (let i = state.suns.length - 1; i >= 0; i--) {
    const s = state.suns[i];
    if (s.falling) {
      s.y += 0.4 * (dt / 16);
      if (s.y >= s.targetY) s.y = s.targetY, s.falling = false;
    }
    if (now - s.createdAt > s.ttl) state.suns.splice(i, 1);
  }
}
