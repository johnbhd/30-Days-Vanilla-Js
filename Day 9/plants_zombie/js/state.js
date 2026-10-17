// Game state factory. The single state object is created here and passed
// explicitly into every system function — no window.* globals.
import { COLS, ROWS } from './config.js';

export function createState() {
  const state = {
    sun: 200,
    health: 1,          // 1 = alive, 0 = immediate Game Over (never maxHealth/lives)
    level: 1,
    selectedPlant: null,
    grid: [],           // grid[row][col] = plant object or null
    zombies: [],        // {row, x, hp, speed, eating}
    peas: [],           // {row, x, y}
    suns: [],           // {x, y, value, ttl, falling, targetY}
    waveTimer: 0,
    waveInterval: 8000, // ms between spawns
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
