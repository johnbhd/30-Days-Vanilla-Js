// Plants vs Zombies - Simple Edition
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- Sprites (OpenGameArt: zombie by Clint Bellanger CC-BY 3.0,
//     sunflower by Robyn CC0/CC-BY, man-eating plant by bevouliin.com CC-BY 4.0) ---
const SPRITE_SRC = {
  sunflower: 'images/sunflower.png',
  peashooter: 'images/peashooter_cut.png',
  zombie: 'images/zombie.png',
};
const sprites = {};
if (typeof Image !== 'undefined') {
  for (const key of Object.keys(SPRITE_SRC)) {
    const img = new Image();
    img.src = SPRITE_SRC[key];
    sprites[key] = img;
  }
}
function spriteReady(key) {
  const s = sprites[key];
  return !!(s && s.complete && s.naturalWidth > 0);
}

const COLS = 9;
const ROWS = 5;
const CELL_W = canvas.width / COLS;
const CELL_H = canvas.height / ROWS;

// --- Game state ---
const state = {
  sun: 200,
  health: 1,
  level: 1,
  selectedPlant: null,
  grid: [],        // grid[row][col] = plant object or null
  zombies: [],     // {row, x, hp, speed, eating}
  peas: [],        // {row, x, y}
  suns: [],        // {x, y, value, ttl, falling, targetY}
  waveTimer: 0,
  waveInterval: 8000,
  spawned: 0,
  running: true,
};

// init grid
for (let r = 0; r < ROWS; r++) {
  state.grid.push(Array(COLS).fill(null));
}

// --- Plant definitions ---
const PLANTS = {
  sunflower: { cost: 50, hp: 60, sunInterval: 7000, color: '#ffd700' },
  peashooter: { cost: 100, hp: 100, shootInterval: 1800, color: '#4caf50' },
};

// --- UI references ---
const sunCountEl = document.getElementById('sun-count');
const healthEl = document.getElementById('health-count');
const levelEl = document.getElementById('level-count');

function updateUI() {
  sunCountEl.textContent = state.sun;
  healthEl.textContent = state.health;
  levelEl.textContent = state.level;
}

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
  if (gameOver) return; // restart listener handles game-over clicks
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  // Try collecting sun first
  for (let i = state.suns.length - 1; i >= 0; i--) {
    const s = state.suns[i];
    const dx = mx - s.x, dy = my - s.y;
    if (dx * dx + dy * dy < 30 * 30) {
      state.sun += s.value;
      state.suns.splice(i, 1);
      updateUI();
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
        state.grid[row][col] = {
          type: state.selectedPlant,
          hp: def.hp,
          maxHp: def.hp,
          lastAction: performance.now(),
          row, col,
        };
        updateUI();
      }
    }
  }
});

// --- Spawn a zombie ---
function spawnZombie() {
  const row = Math.floor(Math.random() * ROWS);
  const difficulty = 1 + (state.level - 1) * 0.15;
  state.zombies.push({
    row,
    x: canvas.width + 30,
    hp: 100 * difficulty,
    maxHp: 100 * difficulty,
    speed: (0.25 + Math.random() * 0.15) * difficulty,
    eating: false,
  });
}

// --- Spawn a sun from sky or sunflower ---
function spawnSun(x, y, targetY) {
  state.suns.push({
    x, y,
    targetY: targetY !== undefined ? targetY : y + 60 + Math.random() * 80,
    value: 25,
    ttl: 8000,
    falling: true,
    createdAt: performance.now(),
  });
}

// --- Main update loop ---
let lastTime = performance.now();

function update(now) {
  if (gameOver || !state.running) return;

  const dt = now - lastTime;
  lastTime = now;

  // --- Sunflowers produce sun ---
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = state.grid[r][c];
      if (p && p.type === 'sunflower' && now - p.lastAction > PLANTS.sunflower.sunInterval) {
        p.lastAction = now;
        const cx = c * CELL_W + CELL_W / 2;
        const cy = r * CELL_H + CELL_H / 2;
        spawnSun(cx, cy, cy + 30);
      }
      // Peashooter shoots if zombie in same row
      if (p && p.type === 'peashooter' && now - p.lastAction > PLANTS.peashooter.shootInterval) {
        const hasZombie = state.zombies.some(z => z.row === r && z.x > c * CELL_W);
        if (hasZombie) {
          p.lastAction = now;
          state.peas.push({
            row: r,
            x: c * CELL_W + CELL_W * 0.7,
            y: r * CELL_H + CELL_H / 2,
          });
        }
      }
    }
  }

  // --- Random sky sun ---
  if (Math.random() < dt / 6000) {
    const x = 50 + Math.random() * (canvas.width - 100);
    spawnSun(x, -20, 80 + Math.random() * (canvas.height - 160));
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

  // --- Update peas ---
  for (let i = state.peas.length - 1; i >= 0; i--) {
    const p = state.peas[i];
    p.x += 4 * (dt / 16);
    if (p.x > canvas.width + 20) { state.peas.splice(i, 1); continue; }
    // Hit zombie?
    for (let j = state.zombies.length - 1; j >= 0; j--) {
      const z = state.zombies[j];
      if (z.row === p.row && Math.abs(p.x - z.x) < 20) {
        z.hp -= 25;
        state.peas.splice(i, 1);
        if (z.hp <= 0) {
          state.zombies.splice(j, 1);
          state.sun += 10; // small reward
          updateUI();
        }
        break;
      }
    }
  }

  // --- Update zombies ---
  for (let i = state.zombies.length - 1; i >= 0; i--) {
    const z = state.zombies[i];
    z.eating = false;

    // Check if zombie is at a plant
    const col = Math.floor(z.x / CELL_W);
    if (col >= 0 && col < COLS) {
      const plant = state.grid[z.row][col];
      if (plant && z.x <= (col + 0.7) * CELL_W) {
        z.eating = true;
        plant.hp -= 8 * (dt / 1000);
        if (plant.hp <= 0) {
          state.grid[z.row][col] = null;
        }
      }
    }

    if (!z.eating) {
      z.x -= z.speed * (dt / 16);
    }

    // Reached the house
    if (z.x < 10) {
      state.zombies.splice(i, 1);
      state.health -= 1;
      updateUI();
      if (state.health <= 0) {
        gameOver = true;
        showGameOver();
      }
    }
  }

  // --- Wave spawning ---
  state.waveTimer += dt;
  if (state.waveTimer > state.waveInterval) {
    state.waveTimer = 0;
    spawnZombie();
    state.spawned = (state.spawned || 0) + 1;
    // Level up every 8 zombies, speed up the wave
    if (state.spawned % 8 === 0) {
      state.level += 1;
      state.waveInterval = Math.max(2500, state.waveInterval - 800);
      updateUI();
    }
  }
}

// --- Drawing ---
function drawGrid() {
  // Lawn background
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#6aad3a' : '#5c9e32';
      ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H);
    }
  }
  // Grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL_H);
    ctx.lineTo(canvas.width, r * CELL_H);
    ctx.stroke();
  }
  // House area on left
  ctx.fillStyle = '#8d6e3a';
  ctx.fillRect(0, 0, 8, canvas.height);
}

function drawPlant(p) {
  const cx = p.col * CELL_W + CELL_W / 2;
  const cy = p.row * CELL_H + CELL_H / 2;
  const r = Math.min(CELL_W, CELL_H) * 0.32;

  if (spriteReady(p.type)) {
    // Sprite image, anchored to the bottom of its cell
    const img = sprites[p.type];
    const scale = Math.min(
      (CELL_W * 0.9) / img.naturalWidth,
      (CELL_H * 0.95) / img.naturalHeight
    );
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const bottom = (p.row + 1) * CELL_H - CELL_H * 0.06;
    ctx.drawImage(img, cx - dw / 2, bottom - dh, dw, dh);
  } else if (p.type === 'sunflower') {
    // Petals
    ctx.fillStyle = '#ffd700';
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * r * 0.7, cy + Math.sin(angle) * r * 0.7, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Face
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.15, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.05, r * 0.2, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (p.type === 'peashooter') {
    // Stem
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.5, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Mouth (barrel pointing right)
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.7, cy - r * 0.1, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.15, cy - r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy - r * 0.3, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP bar if damaged
  if (p.hp < p.maxHp) {
    const bw = CELL_W * 0.6;
    const bh = 4;
    const bx = cx - bw / 2;
    const by = cy - r - 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#76ff03';
    ctx.fillRect(bx, by, bw * (p.hp / p.maxHp), bh);
  }
}

function drawZombie(z) {
  const cx = z.x;
  const cy = z.row * CELL_H + CELL_H / 2;
  const r = Math.min(CELL_W, CELL_H) * 0.35;

  if (spriteReady('zombie')) {
    // Sprite sheet: 36 cols x 8 rows of 128px tiles.
    // Row 0 = left-facing profile; frames 4-11 = lurch walk, 16-19 = bite.
    const T = 128;
    let frame;
    if (z.eating) {
      frame = 16 + (Math.floor(performance.now() / 150) % 4);
    } else {
      frame = 4 + (Math.floor(performance.now() / 140) % 8);
    }
    const size = CELL_H * 1.25;
    ctx.drawImage(
      sprites.zombie,
      frame * T, 0, T, T,
      cx - size / 2, cy - size / 2, size, size
    );
  } else {
    // Body
    ctx.fillStyle = '#7e9c5e';
    ctx.fillRect(cx - r * 0.5, cy - r * 0.3, r, r * 1.1);
    // Head
    ctx.fillStyle = '#9ccc65';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.6, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.15, cy - r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r * 0.12, cy - r * 0.7, r * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.18, cy - r * 0.7, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(cx - r * 0.2, cy - r * 0.35, r * 0.4, r * 0.15);
    // Arms reaching forward
    ctx.fillStyle = '#7e9c5e';
    ctx.fillRect(cx - r * 0.9, cy - r * 0.2, r * 0.5, r * 0.2);
    ctx.fillRect(cx - r * 0.9, cy + r * 0.1, r * 0.5, r * 0.2);
    // Torn shirt
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - r * 0.5, cy + r * 0.1, r, r * 0.3);
  }

  // HP bar
  const bw = CELL_W * 0.7;
  const bh = 5;
  const bx = cx - bw / 2;
  const by = cy - r - 12;
  ctx.fillStyle = '#333';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#f44336';
  ctx.fillRect(bx, by, bw * Math.max(0, z.hp / z.maxHp), bh);
}

function drawPea(p) {
  ctx.fillStyle = '#76ff03';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#33691e';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSun(s) {
  const alpha = s.ttl - (performance.now() - s.createdAt) < 2000
    ? 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 200))
    : 1;
  ctx.globalAlpha = alpha;
  // Rays
  ctx.fillStyle = '#ffee58';
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2 + performance.now() / 500;
    ctx.beginPath();
    ctx.ellipse(
      s.x + Math.cos(angle) * 14,
      s.y + Math.sin(angle) * 14,
      7, 7, 0, 0, Math.PI * 2
    );
    ctx.fill();
  }
  // Core
  ctx.fillStyle = '#fdd835';
  ctx.beginPath();
  ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff59d';
  ctx.beginPath();
  ctx.arc(s.x - 3, s.y - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlantingPreview() {
  if (!state.selectedPlant) return;
  ctx.globalAlpha = 0.5;
  // Highlight empty cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!state.grid[r][c]) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(c * CELL_W + 2, r * CELL_H + 2, CELL_W - 4, CELL_H - 4);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function draw() {
  drawGrid();

  // Plants
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.grid[r][c]) drawPlant(state.grid[r][c]);
    }
  }

  // Peas
  state.peas.forEach(drawPea);

  // Zombies (sorted by row for consistent overlap)
  state.zombies.forEach(drawZombie);

  // Suns
  state.suns.forEach(drawSun);

  // Planting preview
  drawPlantingPreview();

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f44336';
    ctx.font = 'bold 40px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Segoe UI';
    ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
  }
}

let gameOver = false;

function showGameOver() {
  gameOver = true;
}

canvas.addEventListener('click', () => {
  if (gameOver) restartGame();
});

function restartGame() {
  state.sun = 200;
  state.health = 1;
  state.level = 1;
  state.selectedPlant = null;
  state.zombies = [];
  state.peas = [];
  state.suns = [];
  state.waveTimer = 0;
  state.waveInterval = 8000;
  state.spawned = 0;
  for (let r = 0; r < ROWS; r++) state.grid[r].fill(null);
  document.querySelectorAll('.plant-slot').forEach(s => s.classList.remove('selected'));
  gameOver = false;
  updateUI();
  lastTime = performance.now();
}

// --- Game loop ---
function gameLoop(now) {
  update(now);
  draw();
  requestAnimationFrame(gameLoop);
}

updateUI();
requestAnimationFrame(gameLoop);
