// Plants vs Zombies - Simple Edition — configuration
// Logical game-space size. All gameplay coordinates, grid math, spawning and
// collisions use these constants (NOT the canvas backing-store size, which may
// be scaled up by devicePixelRatio for crisp rendering on hi-DPI screens).
export const LOGICAL_W = 600;
export const LOGICAL_H = 400;

export const COLS = 9;
export const ROWS = 5;
export const CELL_W = LOGICAL_W / COLS;
export const CELL_H = LOGICAL_H / ROWS;

// --- Plant definitions ---
export const PLANTS = {
  sunflower: { cost: 50, hp: 60, sunInterval: 7000, color: '#ffd700' },
  peashooter: { cost: 100, hp: 100, shootInterval: 1800, color: '#4caf50' },
};
