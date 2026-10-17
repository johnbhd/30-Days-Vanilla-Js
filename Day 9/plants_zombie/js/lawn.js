// Lawn / grid background drawing. Visual only — no game state.
import { LOGICAL_W, LOGICAL_H, COLS, ROWS, CELL_W, CELL_H } from './config.js';

export function drawLawn(ctx) {
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
