// Plants vs Zombies - Simple Edition
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Logical game-space size. All gameplay coordinates, grid math, spawning and
// collisions use these constants (NOT the canvas backing-store size, which may
// be scaled up by devicePixelRatio below for crisp rendering on hi-DPI screens).
const LOGICAL_W = 600;
const LOGICAL_H = 400;
{
  // Optional polish: scale only the backing store; CSS still sizes the canvas.
  // dpr = 1 when window/devicePixelRatio is unavailable (e.g. headless tests).
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio)
    ? Math.min(window.devicePixelRatio, 2) : 1;
  canvas.width = LOGICAL_W * dpr;
  canvas.height = LOGICAL_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

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
const CELL_W = LOGICAL_W / COLS;
const CELL_H = LOGICAL_H / ROWS;

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
  // Presentation only: reflect the existing purchase rule (sun >= cost) on the
  // seed packets. Selection/planting logic itself is unchanged.
  document.querySelectorAll('.plant-slot').forEach(slot => {
    const def = PLANTS[slot.dataset.plant];
    if (def) slot.classList.toggle('unaffordable', state.sun < def.cost);
  });
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
    x: LOGICAL_W + 30,
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
    const x = 50 + Math.random() * (LOGICAL_W - 100);
    spawnSun(x, -20, 80 + Math.random() * (LOGICAL_H - 160));
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
    if (p.x > LOGICAL_W + 20) { state.peas.splice(i, 1); continue; }
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
  const W = LOGICAL_W;
  const H = LOGICAL_H;

  // Lawn: alternating lane tones (strips, not a checkerboard) with a subtle
  // vertical gradient per lane for depth, plus faint mowing-stripe columns so
  // placement stays readable without hard "spreadsheet" cell boxes.
  for (let r = 0; r < ROWS; r++) {
    const y = r * CELL_H;
    const g = ctx.createLinearGradient(0, y, 0, y + CELL_H);
    if (r % 2 === 0) {
      g.addColorStop(0, '#69B83D');
      g.addColorStop(1, '#5FAE35');
    } else {
      g.addColorStop(0, '#5FAE35');
      g.addColorStop(1, '#589F30');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, CELL_H);
    // very subtle alternating column shade (mowing stripes)
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let c = 0; c < COLS; c += 2) {
      ctx.fillRect(c * CELL_W, y, CELL_W, CELL_H);
    }
    // soft lane separator instead of hard grid lines
    if (r > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(0, y, W, 1);
    }
  }

  // Left edge: home / garden boundary — dark hedge over a thin soil line
  const homeW = 14;
  const hg = ctx.createLinearGradient(0, 0, homeW, 0);
  hg.addColorStop(0, '#1d4520');
  hg.addColorStop(1, '#285F2C');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, homeW, H);
  ctx.fillStyle = '#795414';
  ctx.fillRect(homeW, 0, 2, H);

  // Right edge: dirt zombie-entrance strip, fading softly into the grass
  const dirtW = 26;
  const dg = ctx.createLinearGradient(W - dirtW, 0, W, 0);
  dg.addColorStop(0, 'rgba(152,106,23,0)');
  dg.addColorStop(0.45, '#986A17');
  dg.addColorStop(1, '#795414');
  ctx.fillStyle = dg;
  ctx.fillRect(W - dirtW, 0, dirtW, H);
  // deterministic clods/pebbles so the dirt reads as soil (no per-frame flicker)
  ctx.fillStyle = 'rgba(96,66,31,0.5)';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(W - dirtW + ((i * 37) % (dirtW - 6)) + 2, (i * 83) % (H - 6), 3, 2);
  }

  // Soft inner edge shadow so the lawn sits in a frame
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, W, 1);
  ctx.fillRect(0, H - 1, W, 1);
}

// Plant sprite content bounds (opaque pixels), measured from the PNGs:
//   sunflower.png  244x525, body spans x 31..204, y 27..507 (transparent padding)
//   peashooter_cut.png 575x584, full-bleed (no padding)
// We scale each plant by its VISIBLE content so sunflower and peashooter look
// consistent (~72% of lane height), anchor the content bottom just above the
// lane bottom, and center the content horizontally in the cell. Purely visual:
// grid coordinates and collisions are untouched.
const PLANT_SPRITE = {
  sunflower: { cw: 174, ch: 481, cx: 117.5, bottom: 507 },
  peashooter: { cw: 575, ch: 584, cx: 287.5, bottom: 584 },
};
const PLANT_VISUAL_FRAC = 0.72; // visible content = 72% of lane height
const PLANT_FOOT_INSET = 3;     // content bottom sits this far above lane bottom

function plantSpriteBox(type, img, row, col) {
  const meta = PLANT_SPRITE[type];
  const scale = (CELL_H * PLANT_VISUAL_FRAC) / meta.ch;
  const cLeft = meta.cx - meta.cw / 2;
  return {
    scale,
    dx: col * CELL_W + CELL_W / 2 - meta.cx * scale,
    dy: (row + 1) * CELL_H - PLANT_FOOT_INSET - meta.bottom * scale,
    cLeft,
    top: (row + 1) * CELL_H - PLANT_FOOT_INSET - meta.ch * scale,
  };
}

function drawPlant(p) {
  const cx = p.col * CELL_W + CELL_W / 2;
  const cy = p.row * CELL_H + CELL_H / 2;
  const r = Math.min(CELL_W, CELL_H) * 0.32;
  let barY; // top of visible plant, for HP bar placement

  if (spriteReady(p.type)) {
    // Sprite image, content-anchored to the bottom of its cell
    const img = sprites[p.type];
    const box = plantSpriteBox(p.type, img, p.row, p.col);
    const dw = img.naturalWidth * box.scale;
    const dh = img.naturalHeight * box.scale;
    ctx.drawImage(img, box.dx, box.dy, dw, dh);
    barY = box.top;
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
    barY = cy - r * 1.15; // top of outermost petals
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
    barY = cy - r * 0.8; // top of the head
  }

  // HP bar if damaged, above the visible plant
  if (p.hp < p.maxHp) {
    const bw = CELL_W * 0.6;
    const bh = 4;
    const bx = cx - bw / 2;
    const by = barY - bh - 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#76ff03';
    ctx.fillRect(bx, by, bw * (p.hp / p.maxHp), bh);
  }
}

// Zombie sprite content bounds (row 0, left-facing walk/bite frames), measured
// from zombie.png: the opaque body spans tile-y 47..102 (foot line ~102.5) and
// tile-x 38..84 (horizontal center 61.5) of each 128px tile. We anchor the draw
// on the visible body, not the raw tile, so the sprite's large transparent
// padding does not shrink the zombie on the lawn. Purely visual: z.x/z.row and
// all collision/game logic use unchanged game coordinates.
const Z_TILE = 128;
const Z_BODY_TOP = 47;      // first opaque row of the body within a tile
const Z_BODY_FOOT = 102.5;  // foot line within a tile
const Z_BODY_CX = 61.5;     // horizontal center of the body within a tile
const Z_VISUAL_FRAC = 0.8;  // visible body = 80% of lane height (target 70-85%)
const Z_FOOT_INSET = 4;     // feet sit this far above the lane bottom line

function zombieSpriteBox(z) {
  const tile = CELL_H * Z_VISUAL_FRAC * Z_TILE / (Z_BODY_FOOT - Z_BODY_TOP);
  return {
    tile,
    dx: z.x - (Z_BODY_CX / Z_TILE) * tile,
    dy: (z.row + 1) * CELL_H - Z_FOOT_INSET - (Z_BODY_FOOT / Z_TILE) * tile,
  };
}

function drawZombie(z) {
  const cx = z.x;
  let barTop; // top of the visible head, for HP bar placement

  if (spriteReady('zombie')) {
    // Sprite sheet: 36 cols x 8 rows of 128px tiles.
    // Row 0 = left-facing profile; frames 4-11 = lurch walk, 16-19 = bite.
    const T = Z_TILE;
    let frame;
    if (z.eating) {
      frame = 16 + (Math.floor(performance.now() / 150) % 4);
    } else {
      frame = 4 + (Math.floor(performance.now() / 140) % 8);
    }
    const box = zombieSpriteBox(z);
    ctx.drawImage(
      sprites.zombie,
      frame * T, 0, T, T,
      box.dx, box.dy, box.tile, box.tile
    );
    barTop = box.dy + (Z_BODY_TOP / Z_TILE) * box.tile;
  } else {
    // Fallback vector zombie — same visible size and anchor as the sprite:
    // body ~80% of lane height, feet near lane bottom, centered on z.x.
    const bodyH = CELL_H * Z_VISUAL_FRAC;
    const r = bodyH * 0.35;
    const feetY = (z.row + 1) * CELL_H - Z_FOOT_INSET;
    const fcy = feetY - bodyH / 2; // shape is roughly symmetric about this
    // Body
    ctx.fillStyle = '#7e9c5e';
    ctx.fillRect(cx - r * 0.5, fcy - r * 0.3, r, r * 1.1);
    // Head
    ctx.fillStyle = '#9ccc65';
    ctx.beginPath();
    ctx.arc(cx, fcy - r * 0.6, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, fcy - r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.15, fcy - r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r * 0.12, fcy - r * 0.7, r * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.18, fcy - r * 0.7, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(cx - r * 0.2, fcy - r * 0.35, r * 0.4, r * 0.15);
    // Arms reaching forward
    ctx.fillStyle = '#7e9c5e';
    ctx.fillRect(cx - r * 0.9, fcy - r * 0.2, r * 0.5, r * 0.2);
    ctx.fillRect(cx - r * 0.9, fcy + r * 0.1, r * 0.5, r * 0.2);
    // Torn shirt
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - r * 0.5, fcy + r * 0.1, r, r * 0.3);
    barTop = fcy - r * 1.1;
  }

  // HP bar, floating just above the head and following the zombie
  const bw = CELL_W * 0.6;
  const bh = 5;
  const bx = cx - bw / 2;
  const by = barTop - bh - 4;
  ctx.fillStyle = 'rgba(20,15,10,0.85)';
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx, by, bw, bh);
  const ratio = Math.max(0, z.hp / z.maxHp);
  ctx.fillStyle = ratio > 0.5 ? '#6fce4a' : ratio > 0.25 ? '#e5c93c' : '#f44336';
  ctx.fillRect(bx, by, bw * ratio, bh);
}

function drawPea(p) {
  // Slightly larger, gradient-filled pea with outline and soft shadow
  const R = 6.5; // ~13px diameter
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;
  const g = ctx.createRadialGradient(p.x - R * 0.3, p.y - R * 0.3, R * 0.2, p.x, p.y, R);
  g.addColorStop(0, '#b9f27c');
  g.addColorStop(1, '#66bb2a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#2e5d15';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawSun(s) {
  const alpha = s.ttl - (performance.now() - s.createdAt) < 2000
    ? 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 200))
    : 1;
  ctx.globalAlpha = alpha;
  // Soft glow behind the sun
  ctx.save();
  ctx.shadowColor = 'rgba(255,215,71,0.8)';
  ctx.shadowBlur = 10;
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
  const cg = ctx.createRadialGradient(s.x - 3, s.y - 3, 2, s.x, s.y, 12);
  cg.addColorStop(0, '#ffe88a');
  cg.addColorStop(1, '#fdd835');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Specular highlight
  ctx.fillStyle = 'rgba(255,245,157,0.9)';
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
    const W = LOGICAL_W, H = LOGICAL_H;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    // Wood panel
    const pw = Math.min(360, W * 0.72), ph = 150;
    const px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = '#3a2a12';
    ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);
    ctx.fillStyle = '#60421F';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(245,232,200,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
    // Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 38px Segoe UI, sans-serif';
    ctx.fillText('GAME OVER', W / 2, py + 58);
    ctx.fillStyle = '#F5E8C8';
    ctx.font = '17px Segoe UI, sans-serif';
    ctx.fillText('The lawn was lost', W / 2, py + 92);
    ctx.fillStyle = '#FFD747';
    ctx.font = 'italic 15px Segoe UI, sans-serif';
    ctx.fillText('Click to Try Again', W / 2, py + 122);
  }
}

let gameOver = false;

function showGameOver() {
  gameOver = true;
}

canvas.addEventListener('click', () => {
  if (gameOver) restartGame();
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
