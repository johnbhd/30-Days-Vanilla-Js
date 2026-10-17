// Seed-bank UI + all user input (select seed, collect sun, plant, restart).
// Owns DOM reads/writes; receives `state` as a parameter — no window.* state.
import { PLANTS, COLS, ROWS, CELL_W, CELL_H, LOGICAL_W, LOGICAL_H } from './config.js';
import { createPlant } from './plants.js';

// --- UI references (resolved on first use so importing this module has no
// side effects; the DOM always exists by the time the game runs) ---
let sunCountEl = null;
let healthEl = null;
let levelEl = null;
function uiRefs() {
  if (!sunCountEl) {
    sunCountEl = document.getElementById('sun-count');
    healthEl = document.getElementById('health-count');
    levelEl = document.getElementById('level-count');
  }
}

export function updateUI(state) {
  uiRefs();
  sunCountEl.textContent = state.sun;
  healthEl.textContent = state.health;
  levelEl.textContent = state.level;
  // Presentation only: reflect the existing purchase rule (sun >= cost) on the
  // seed packets. Selection/planting logic itself is unchanged.
  document.querySelectorAll('.plant-slot').forEach(slot => {
    const def = PLANTS[slot.dataset.plant];
    if (def) slot.classList.toggle('unaffordable', state.sun < def.cost);
  });
}

export function wireInput(state, canvas, onRestart) {
  // --- Plant selection ---
  document.querySelectorAll('.plant-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const plant = slot.dataset.plant;
      document.querySelectorAll('.plant-slot').forEach(s => s.classList.remove('selected'));
      if (state.selectedPlant === plant) {
        state.selectedPlant = null;
      } else {
        state.selectedPlant = plant;
        slot.classList.add('selected');
      }
    });
  });

  // --- Click to plant / collect sun ---
  canvas.addEventListener('click', (e) => {
    if (state.gameOver) return; // restart listener handles game-over clicks
    const rect = canvas.getBoundingClientRect();
    // Map client (CSS) coordinates to logical game space, independent of the
    // hi-DPI backing-store scale and of how the canvas is displayed.
    const mx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
    const my = (e.clientY - rect.top) * (LOGICAL_H / rect.height);

    // Try collecting sun first
    for (let i = state.suns.length - 1; i >= 0; i--) {
      const s = state.suns[i];
      const dx = mx - s.x, dy = my - s.y;
      if (dx * dx + dy * dy < 30 * 30) {
        state.sun += s.value;
        state.suns.splice(i, 1);
        updateUI(state);
        return;
      }
    }

    // Try planting
    if (state.selectedPlant) {
      const col = Math.floor(mx / CELL_W);
      const row = Math.floor(my / CELL_H);
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS && !state.grid[row][col]) {
        const def = PLANTS[state.selectedPlant];
        if (state.sun >= def.cost) {
          state.sun -= def.cost;
          state.grid[row][col] = createPlant(state.selectedPlant, row, col, performance.now());
          updateUI(state);
        }
      }
    }
  });

  canvas.addEventListener('click', () => {
    if (state.gameOver) onRestart();
  });

  // Presentation only: pointer cursor when hovering a collectible sun
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
    const my = (e.clientY - rect.top) * (LOGICAL_H / rect.height);
    let over = false;
    for (const s of state.suns) {
      const dx = mx - s.x, dy = my - s.y;
      if (dx * dx + dy * dy < 30 * 30) { over = true; break; }
    }
    canvas.style.cursor = over ? 'pointer' : '';
  });
}
