// Entry module: canvas/DPR setup, orchestration (update order identical to the
// original single-file game), game loop, restart, and browser auto-start.
//
// Testability: importing this module has NO side effects in Node (no `window`
// => nothing auto-starts). Tests call initializeGame() explicitly and then
// step update()/draw() manually. The browser calls initializeGame() + startGame()
// via the guarded entry at the bottom of this file.
import { LOGICAL_W, LOGICAL_H, BALANCE } from './config.js';
import { createState } from './state.js';
import { loadSprites } from './assets.js';
import { updatePlants } from './plants.js';
import { updateSuns } from './suns.js';
import { updateProjectiles } from './projectiles.js';
import { updateZombies, updateWaves } from './zombies.js';
import { updateUI, wireInput } from './ui.js';
import { setupRenderer, draw as drawGame } from './rendering.js';
import * as audio from './audio.js';

export const state = createState();

let canvas = null;
let lastTime = 0;

export function initializeGame() {
  canvas = document.getElementById('game-canvas');
  // Optional polish: scale only the backing store; CSS still sizes the canvas.
  // dpr = 1 when window/devicePixelRatio is unavailable (e.g. headless tests).
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio)
    ? Math.min(window.devicePixelRatio, 2) : 1;
  canvas.width = LOGICAL_W * dpr;
  canvas.height = LOGICAL_H * dpr;
  const ctx = setupRenderer(canvas);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  loadSprites();
  wireInput(state, canvas, restartGame);
  lastTime = performance.now();
  updateUI(state);
}

// --- Main update loop ---
export function update(now) {
  if (state.gameOver) { audio.pause(); return; } // idempotent: stops BGM on Game Over
  if (!state.running) return;

  const dt = now - lastTime;
  lastTime = now;

  updatePlants(state, now);   // sunflowers produce sun, shooters shoot
  updateSuns(state, now, dt); // random sky sun + falling/expiring suns
  updateProjectiles(state, now, dt); // projectiles move, hit, apply slow
  updateZombies(state, now, dt);   // eating, walking, house breach (health 1 -> 0)
  updateWaves(state, dt);     // spawn zombies, level up
  updateUI(state);            // presentation sync (once per frame)
}

export function draw() {
  drawGame(state);
}

export function restartGame() {
  state.sun = BALANCE.START_SUN;
  state.health = 1;
  state.level = 1;
  state.selectedPlant = null;
  state.selectedTool = null; // shovel must not survive a restart (§32)
  state.hoverCell = null;
  state.floatTexts = [];
  state.zombies = [];
  state.projectiles = [];
  state.suns = [];
  state.waveTimer = 0;
  state.waveInterval = BALANCE.WAVE_INTERVAL;
  state.spawned = 0;
  for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
  document.querySelectorAll('.plant-slot').forEach(s => s.classList.remove('selected'));
  document.querySelectorAll('.tool-slot').forEach(s => s.classList.remove('selected'));
  state.gameOver = false;
  updateUI(state);
  audio.resume(); // no-op while muted or before the first gesture
  lastTime = performance.now();
}

// --- Game loop ---
function gameLoop(now) {
  update(now);
  draw();
  requestAnimationFrame(gameLoop);
}

export function startGame() {
  requestAnimationFrame(gameLoop);
}

// Browser entry point. Guarded so importing this module in Node tests never
// starts an animation loop.
if (typeof window !== 'undefined') {
  initializeGame();
  startGame();
}
