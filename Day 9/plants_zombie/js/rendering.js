// All canvas drawing: entities, planting preview, Game Over overlay.
// ctx is set once via setupRenderer(canvas) — held in module scope, never on window.
import { LOGICAL_W, LOGICAL_H, COLS, ROWS, CELL_W, CELL_H, ZOMBIE_TYPES, ZOMBIE_ANIM } from './config.js';
import { getSprite, spriteReady } from './assets.js';
import { drawLawn } from './lawn.js';

let ctx = null;

export function setupRenderer(canvas) {
  ctx = canvas.getContext('2d');
  return ctx;
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
  wallnut: { cw: 186, ch: 224, cx: 127.5, bottom: 247 }, // original 256x256 art
  snowpea: { cw: 575, ch: 584, cx: 287.5, bottom: 584 }, // recolor of peashooter_cut
  repeater: { cw: 575, ch: 584, cx: 287.5, bottom: 584 }, // peashooter_cut + second jaw
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
    const img = getSprite(p.type);
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
  } else if (p.type === 'wallnut') {
    // Shell (original fallback art, palette matches images/wallnut.png)
    ctx.fillStyle = '#c8945a';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
    // Dark hull cap on top
    ctx.fillStyle = '#7a4f2b';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.55, r * 0.92, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center seam
    ctx.strokeStyle = 'rgba(94,62,32,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 1.0);
    ctx.lineTo(cx, cy + r * 1.0);
    ctx.stroke();
    // Determined face
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.05, r * 0.17, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.05, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20160c';
    ctx.beginPath();
    ctx.arc(cx - r * 0.27, cy, r * 0.09, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.33, cy, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a3016';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy - r * 0.35);
    ctx.lineTo(cx - r * 0.12, cy - r * 0.2);
    ctx.moveTo(cx + r * 0.5, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.12, cy - r * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.28, cy + r * 0.45);
    ctx.lineTo(cx, cy + r * 0.4);
    ctx.lineTo(cx + r * 0.28, cy + r * 0.45);
    ctx.stroke();
    barY = cy - r * 1.05;
  } else if (p.type === 'snowpea' || p.type === 'repeater') {
    // Same geometry as the peashooter fallback; palette distinguishes them:
    // Snow Pea = icy blue, Repeater = deeper green + stacked second barrel.
    const ice = p.type === 'snowpea';
    const headC = ice ? '#7cc4e8' : '#3d8f42';
    const stemC = ice ? '#5a9fb8' : '#2f7033';
    const barC = ice ? '#3f7fa8' : '#256b2b';
    // Stem
    ctx.fillStyle = stemC;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.5, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = headC;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Mouth (barrel pointing right); Repeater gets a second stacked barrel
    ctx.fillStyle = barC;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.7, cy - r * 0.1, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.type === 'repeater') {
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.6, cy - r * 0.6, r * 0.34, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
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

// Zombie drawing is fully metadata-driven: ZOMBIE_ANIM (config.js) describes
// each sheet's tile size, animation rows/timing, visual size, and anchoring.
// The 'zombie' entry reproduces the original sheet's math exactly (the opaque
// body spans tile-y 47..102.5, horizontal center 61.5 of each 128px tile —
// anchoring on the visible body keeps the transparent padding from shrinking
// the zombie on the lawn). Purely visual: z.x/z.row and all collision/game
// logic use unchanged game coordinates.
const Z_FOOT_INSET = 4; // feet sit this far above the lane bottom line
const FALLBACK_TINTS = { // procedural vector fallback colors, per type
  normal:   { body: '#7e9c5e', head: '#9ccc65', shirt: '#5d4037' },
  sprinter: { body: '#5e8c9c', head: '#65c0cc', shirt: '#37474f' },
  brute:    { body: '#8c7e9c', head: '#b3a8d8', shirt: '#4a148c' },
  biter:    { body: '#7e9c5e', head: '#9ccc65', shirt: '#b71c1c' },
};

function drawZombie(z) {
  const cx = z.x;
  const def = ZOMBIE_TYPES[z.type || 'normal']; // hand-built test zombies -> normal
  const anim = ZOMBIE_ANIM[def ? def.sprite : 'zombie'];
  let barTop; // top of the visible head, for HP bar placement

  if (spriteReady(anim.spriteKey)) {
    const a = z.eating ? anim.attack : anim.walk;
    const frame = a.start + (Math.floor(performance.now() / a.ms) % a.count);
    let scale, dx, dy;
    if (anim.mode === 'body') {
      scale = (CELL_H * anim.visualFrac) / (anim.foot - anim.top);
      dx = cx - anim.cx * scale;
      dy = (z.row + 1) * CELL_H - Z_FOOT_INSET - anim.foot * scale;
    } else {
      scale = (CELL_H * anim.visualFrac) / anim.tileH;
      dx = cx - (anim.tileW / 2) * scale;
      dy = (z.row + 1) * CELL_H - Z_FOOT_INSET - anim.tileH * scale;
    }
    const dw = anim.tileW * scale, dh = anim.tileH * scale;
    ctx.drawImage(
      getSprite(anim.spriteKey),
      frame * anim.tileW, a.row * anim.tileH, anim.tileW, anim.tileH,
      dx, dy, dw, dh
    );
    barTop = dy + (anim.mode === 'body' ? anim.top : 0) * scale;
  } else {
    // Fallback vector zombie — same visible size and anchor as the sprite,
    // tinted per type so mixed lanes stay readable in headless/loading states.
    const tint = FALLBACK_TINTS[z.type] || FALLBACK_TINTS.normal;
    const bodyH = CELL_H * anim.visualFrac;
    const r = bodyH * 0.35;
    const feetY = (z.row + 1) * CELL_H - Z_FOOT_INSET;
    const fcy = feetY - bodyH / 2; // shape is roughly symmetric about this
    // Body
    ctx.fillStyle = tint.body;
    ctx.fillRect(cx - r * 0.5, fcy - r * 0.3, r, r * 1.1);
    // Head
    ctx.fillStyle = tint.head;
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
    ctx.fillStyle = tint.body;
    ctx.fillRect(cx - r * 0.9, fcy - r * 0.2, r * 0.5, r * 0.2);
    ctx.fillRect(cx - r * 0.9, fcy + r * 0.1, r * 0.5, r * 0.2);
    // Torn shirt
    ctx.fillStyle = tint.shirt;
    ctx.fillRect(cx - r * 0.5, fcy + r * 0.1, r, r * 0.3);
    barTop = fcy - r * 1.1;
  }

  // Snow Pea frost: soft cyan aura + frost specks while slowed (presentation
  // only — the gameplay slow itself lives in zombies.js via slowUntil).
  if (z.slowUntil !== undefined && performance.now() < z.slowUntil) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#8ee3ff';
    ctx.beginPath();
    ctx.ellipse(cx, (z.row + 0.62) * CELL_H, CELL_W * 0.3, CELL_H * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#e8fbff';
    ctx.fillRect(cx - CELL_W * 0.2, (z.row + 0.3) * CELL_H, 3, 3);
    ctx.fillRect(cx + CELL_W * 0.17, (z.row + 0.72) * CELL_H, 3, 3);
    ctx.restore();
  }

  // HP bar, floating just above the head and following the zombie
  const bw = CELL_W * anim.barWidthFrac;
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
  // Slightly larger, gradient-filled pea with outline and soft shadow.
  // 'icePea' renders icy cyan (Snow Pea); 'pea' stays green.
  const R = 6.5; // ~13px diameter
  const ice = p.type === 'icePea';
  ctx.save();
  ctx.shadowColor = ice ? 'rgba(120,220,255,0.5)' : 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = ice ? 5 : 3;
  ctx.shadowOffsetY = 2;
  const g = ctx.createRadialGradient(p.x - R * 0.3, p.y - R * 0.3, R * 0.2, p.x, p.y, R);
  if (ice) {
    g.addColorStop(0, '#eafaff');
    g.addColorStop(1, '#5ec8f2');
  } else {
    g.addColorStop(0, '#b9f27c');
    g.addColorStop(1, '#66bb2a');
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ice ? '#1f6f96' : '#2e5d15';
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

function drawPlantingPreview(state) {
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

// Shovel mode: outline ONLY the plant under the pointer (never a permanent
// tint on every plant). Desktop nicety — hoverCell is set by the mousemove
// handler, so touch simply never sees this.
function drawShovelTarget(state) {
  if (state.selectedTool !== 'shovel' || !state.hoverCell) return;
  const { row, col } = state.hoverCell;
  if (!state.grid[row] || !state.grid[row][col]) return;
  const x = col * CELL_W, y = row * CELL_H;
  ctx.fillStyle = 'rgba(255, 179, 0, 0.14)';   // subtle translucent overlay
  ctx.fillRect(x, y, CELL_W, CELL_H);
  ctx.strokeStyle = '#ffb300';                  // amber outline
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
}

// Lightweight refund feedback: a "+N SUN" label that rises and fades.
// Rendering owns the effect's lifetime: stale entries are removed here, so
// there is no separate cleanup bookkeeping anywhere else.
const FLOAT_TEXT_MS = 1200;
function drawFloatTexts(state) {
  if (!state.floatTexts.length) return;
  const now = performance.now();
  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    const ft = state.floatTexts[i];
    const age = now - ft.at;
    if (age >= FLOAT_TEXT_MS) { state.floatTexts.splice(i, 1); continue; }
    const t = age / FLOAT_TEXT_MS;
    ctx.globalAlpha = 1 - t;                    // fade out over the lifetime
    ctx.font = 'bold 15px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(42, 28, 16, 0.85)'; // dark outline for legibility
    ctx.fillStyle = '#ffd740';                  // sun-yellow text
    const y = ft.y - 26 * t;                    // rise 26px
    ctx.strokeText(ft.text, ft.x, y);
    ctx.fillText(ft.text, ft.x, y);
  }
  ctx.globalAlpha = 1;
}

function drawGameOverOverlay() {
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

export function draw(state) {
  drawLawn(ctx);

  // Plants
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.grid[r][c]) drawPlant(state.grid[r][c]);
    }
  }

  // Peas
  state.projectiles.forEach(drawPea);

  // Zombies (sorted by row for consistent overlap)
  state.zombies.forEach(drawZombie);

  // Suns
  state.suns.forEach(drawSun);

  // Planting preview
  drawPlantingPreview(state);

  // Shovel target highlight + refund float text
  drawShovelTarget(state);
  drawFloatTexts(state);

  // Game over overlay
  if (state.gameOver) drawGameOverOverlay();
}
