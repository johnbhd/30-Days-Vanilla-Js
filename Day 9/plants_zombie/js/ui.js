// Seed-bank UI + all user input (select seed, collect sun, plant, restart).
// Owns DOM reads/writes; receives `state` as a parameter — no window.* state.
import { PLANT_TYPES, COLS, ROWS, CELL_W, CELL_H, LOGICAL_W, LOGICAL_H } from './config.js';
import { createPlant, removePlantWithRefund } from './plants.js';
import * as audio from './audio.js';

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
    const def = PLANT_TYPES[slot.dataset.plant];
    if (def) slot.classList.toggle('unaffordable', state.sun < def.cost);
  });
}

export function wireInput(state, canvas, onRestart) {
  // Selection-state helper: clearing shovel mode is needed from three places
  // (shovel toggle, seed pick, Escape) — one definition keeps them identical.
  const clearShovelSelection = () => {
    state.selectedTool = null;
    document.querySelectorAll('.tool-slot').forEach(t => t.classList.remove('selected'));
  };

  // Sync seed-card labels from config so PLANT_TYPES stays the single source
  // of truth for names and costs.
  document.querySelectorAll('.plant-slot').forEach(slot => {
    const def = PLANT_TYPES[slot.dataset.plant];
    if (!def) return;
    const nameEl = slot.querySelector('.plant-name');
    const costEl = slot.querySelector('.plant-cost');
    if (nameEl) nameEl.textContent = def.name;
    if (costEl) costEl.textContent = '☀ ' + def.cost;
  });

  // --- Plant selection ---
  document.querySelectorAll('.plant-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const plant = slot.dataset.plant;
      clearShovelSelection(); // seed and shovel selection are mutually exclusive
      document.querySelectorAll('.plant-slot').forEach(s => s.classList.remove('selected'));
      if (state.selectedPlant === plant) {
        state.selectedPlant = null;
      } else {
        state.selectedPlant = plant;
        slot.classList.add('selected');
      }
    });
  });

  // --- Shovel selection (one-use tool: dig one plant, then it deselects) ---
  document.querySelectorAll('.tool-slot').forEach(tool => {
    tool.addEventListener('click', () => {
      if (state.gameOver) return; // Game Over takes priority (§31)
      if (state.selectedTool === 'shovel') {
        clearShovelSelection(); // clicking again toggles it off
      } else {
        state.selectedTool = 'shovel';
        state.selectedPlant = null; // never both selected at once
        document.querySelectorAll('.plant-slot').forEach(s => s.classList.remove('selected'));
        tool.classList.add('selected');
      }
    });
  });

  // --- Music toggle (all music state lives in audio.js; combat state untouched) ---
  const musicBtn = document.getElementById('music-toggle');
  const syncMusicIcon = () => { musicBtn.textContent = audio.isMuted() ? '🔇' : '🔊'; };
  syncMusicIcon(); // initial icon reflects the persisted preference
  musicBtn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    syncMusicIcon();
    if (!muted) audio.resume(); // unmute mid-game resumes seamlessly
  });
  musicBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      musicBtn.click();
    }
  });

  // Browser autoplay policy: the music may only begin after a user gesture.
  // startOnGesture is idempotent, so both listeners may fire freely.
  document.addEventListener('pointerdown', () => audio.startOnGesture());
  document.addEventListener('keydown', () => audio.startOnGesture());

  // Optional desktop nicety: Escape cancels shovel mode.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selectedTool) clearShovelSelection();
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

    // Shovel mode: dig up the plant on the tapped tile for a 50% refund.
    // Runs BEFORE the planting branch and inside the gameOver guard above, so
    // a dig is impossible once the game is over. Sun collection kept priority
    // (a tap on a sun over a planted tile collects it; tap again to dig).
    if (state.selectedTool === 'shovel') {
      const col = Math.floor(mx / CELL_W);
      const row = Math.floor(my / CELL_H);
      // Outside the lawn, or an empty tile: do nothing, and the shovel STAYS
      // selected so the player can simply try another tile.
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        const refund = removePlantWithRefund(state, row, col);
        if (refund > 0) {
          state.floatTexts.push({
            x: col * CELL_W + CELL_W / 2,
            y: row * CELL_H + CELL_H / 2,
            text: `+${refund} SUN`,
            at: performance.now(),
          });
          state.selectedTool = null; // one-use: shovel returns after a dig
          document.querySelectorAll('.tool-slot').forEach(t => t.classList.remove('selected'));
          updateUI(state);
        }
      }
      return; // never falls through to planting while the shovel is armed
    }

    // Try planting
    if (state.selectedPlant) {
      const col = Math.floor(mx / CELL_W);
      const row = Math.floor(my / CELL_H);
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS && !state.grid[row][col]) {
        const def = PLANT_TYPES[state.selectedPlant];
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

  // Presentation only: pointer cursor when hovering a collectible sun, plus
  // the shovel's target cell + crosshair while the shovel is armed (desktop;
  // touch never fires mousemove, which is fine — the outline is optional).
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
    const my = (e.clientY - rect.top) * (LOGICAL_H / rect.height);
    let over = false;
    for (const s of state.suns) {
      const dx = mx - s.x, dy = my - s.y;
      if (dx * dx + dy * dy < 30 * 30) { over = true; break; }
    }
    // Track the targeted cell (null outside the lawn) for the shovel outline.
    const col = Math.floor(mx / CELL_W);
    const row = Math.floor(my / CELL_H);
    state.hoverCell = (col >= 0 && col < COLS && row >= 0 && row < ROWS)
      ? { row, col } : null;
    canvas.style.cursor = over ? 'pointer'
      : state.selectedTool === 'shovel' ? 'crosshair' : '';
  });
}
