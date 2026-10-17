// Game state factory. The single state object is created here and passed
// explicitly into every system function — no window.* globals.
import { COLS, ROWS, BALANCE } from './config.js';

export function createState() {
  const state = {
    sun: BALANCE.START_SUN,
    health: 1,          // 1 = alive, 0 = immediate Game Over (never maxHealth/lives)
    level: 1,
    selectedPlant: null,
    grid: [],           // grid[row][col] = plant object or null
    zombies: [],        // {row, x, hp, speed, eating}
    projectiles: [],     // {row, x, y, type: 'pea'|'icePea'}
    suns: [],           // {x, y, value, ttl, falling, targetY}
    waveTimer: 0,
    waveInterval: BALANCE.WAVE_INTERVAL, // ms between spawns
    spawned: 0,
    running: true,
    gameOver: false,    // was a module-level flag; same semantics (true => overlay + restart)
  };

  // init grid
  for (let r = 0; r < ROWS; r++) {
    state.grid.push(Array(COLS).fill(null));
  }
  return state;
}
