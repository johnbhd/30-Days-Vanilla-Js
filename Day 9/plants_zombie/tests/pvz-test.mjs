// Headless functional test for the modular plants_zombie game (native ES modules).
// Run:  node tests/pvz-test.mjs            (procedural fallback drawing)
//       SPRITE_STUB=1 node tests/pvz-test.mjs   (sprite drawing path)
//
// Strategy: install DOM/canvas/performance stubs on globalThis, then import the
// real modules. main.js does NOT auto-start (guarded by `typeof window`), so the
// test steps update()/draw() explicitly — deterministic and loop-free.
import { readFileSync, existsSync } from 'node:fs';

let now = 0;

// --- Stub 2D context: every method no-ops and returns a self-stub so chained
//     calls like createLinearGradient().addColorStop() work; props settable.
//     Calls are also RECORDED (fn name + args) so tests can assert what was
//     actually drawn — e.g. that the shovel target outline or a float text
//     was emitted — without a real canvas.
const drawCalls = [];
let lastCtxProp = null;
const ctx2d = new Proxy(function () {}, {
  get: (t, prop) => { if (prop !== 'then') lastCtxProp = prop; return ctx2d; },
  set: () => true,
  apply: (t, thisArg, args) => { drawCalls.push({ fn: lastCtxProp, args }); return ctx2d; },
});

const canvas = {
  width: 600, height: 400,
  style: {},
  listeners: {},
  addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
  getContext: () => ctx2d,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 400 }),
};

const elements = {
  'game-canvas': canvas,
  'sun-count': { textContent: '' },
  'health-count': { textContent: '' },
  'level-count': { textContent: '' },
};

function makeSlot(plant) {
  const h = {};
  const classes = new Set();
  const nameEl = { textContent: '' };
  const costEl = { textContent: '' };
  return {
    dataset: { plant },
    classes,
    nameEl,
    costEl,
    querySelector(sel) {
      if (sel === '.plant-name') return nameEl;
      if (sel === '.plant-cost') return costEl;
      return null;
    },
    classList: {
      add(c) { classes.add(c); },
      remove(c) { classes.delete(c); },
      toggle(c, on) {
        if (on === undefined) on = !classes.has(c);
        if (on) classes.add(c); else classes.delete(c);
        return on;
      },
    },
    addEventListener(ev, fn) { h[ev] = fn; },
    fire(ev) { h[ev] && h[ev]({}); },
  };
}
export const slots = [
  makeSlot('sunflower'),
  makeSlot('peashooter'),
  makeSlot('wallnut'),
  makeSlot('snowpea'),
  makeSlot('repeater'),
];

// Shovel is a TOOL slot (class .tool-slot, not .plant-slot) so the seed-card
// loops and cost logic never touch it. Its label lives in the markup, so the
// stub is pre-set with the name (no cost element at all).
function makeTool(tool, label) {
  const h = {};
  const classes = new Set();
  const nameEl = { textContent: label };
  return {
    dataset: { tool },
    classes,
    nameEl,
    querySelector(sel) { return sel === '.tool-name' ? nameEl : null; },
    classList: {
      add(c) { classes.add(c); },
      remove(c) { classes.delete(c); },
      toggle(c, on) {
        if (on === undefined) on = !classes.has(c);
        if (on) classes.add(c); else classes.delete(c);
        return on;
      },
    },
    addEventListener(ev, fn) { h[ev] = fn; },
    fire(ev) { h[ev] && h[ev]({}); },
  };
}
export const tools = [makeTool('shovel', 'Shovel')];

// --- globalThis stubs (installed BEFORE importing the modules) ---
Object.defineProperty(globalThis, 'performance', {
  value: { now: () => now },
  configurable: true, writable: true,
});
globalThis.requestAnimationFrame = () => 1; // captured, never loops in tests
globalThis.document = {
  getElementById: id => elements[id],
  querySelectorAll: sel =>
    sel === '.plant-slot' ? slots : sel === '.tool-slot' ? tools : [],
  // keydown listeners (Escape cancels the shovel) — fired by the tests only
  _listeners: {},
  addEventListener(ev, fn) { (this._listeners[ev] ||= []).push(fn); },
};
if (process.env.SPRITE_STUB) {
  // simulate fully-loaded sprite images to exercise the sprite draw path
  globalThis.Image = class Image {
    set src(v) { this._src = v; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100; }
    get src() { return this._src; }
  };
}
Math.random = () => 0.5; // deterministic: zombie row = 2, no sky suns

// --- import the game (side-effect-free in Node) ---
const game = await import(new URL('../js/main.js', import.meta.url).href);
const { state, update, draw, initializeGame, restartGame } = game;
const { updateUI } = await import(new URL('../js/ui.js', import.meta.url).href);
initializeGame();

const failures = [];
const A = (cond, msg) => {
  if (cond) console.log('PASS: ' + msg);
  else { failures.push(msg); console.log('FAIL: ' + msg); }
};
export { A, failures };

const cellX = c => c * (600 / 9) + (600 / 9) / 2;
const cellY = r => r * (400 / 5) + (400 / 5) / 2;
const clickCanvas = (x, y) => canvas.listeners.click.forEach(fn => fn({ clientX: x, clientY: y }));
const fireDocument = (ev, e = {}) => (globalThis.document._listeners[ev] || []).forEach(fn => fn(e));

export function step(n) {
  for (let i = 0; i < n; i++) { now += 16; update(now); draw(); }
}
export { canvas, cellX, cellY, clickCanvas, game, drawCalls };
export function nowValue() { return now; }

// --- 1. initial state ---
A(state.sun === 200 && state.health === 1, 'initial sun=200, health=1');
A(elements['sun-count'].textContent === 200, 'UI sun element shows 200');

// --- 2. select and plant a sunflower at (0,0) ---
slots[0].fire('click');
A(state.selectedPlant === 'sunflower', 'sunflower slot selected');
clickCanvas(cellX(0), cellY(0));
A(state.grid[0][0] && state.grid[0][0].type === 'sunflower', 'sunflower planted at row0,col0');
A(state.sun === 150, 'sunflower cost deducted (200 -> 150)');
clickCanvas(cellX(3), cellY(3));
A(state.grid[3][3] && state.grid[3][3].type === 'sunflower', 'second sunflower plants too (150 >= 50)');
A(state.sun === 100, 'second sunflower deducted (150 -> 100)');

// --- 3. sunflowers produce a sun after ~7s; collect it ---
step(450); // 7.2s
A(state.suns.length >= 2, 'both sunflowers produced a sun');
const sunBefore = state.sun;
const s0 = state.suns[0];
clickCanvas(s0.x, s0.y);
A(state.sun === sunBefore + 25, 'clicking a sun collects +25');

// --- 4. select and plant a peashooter at (2,2) ---
slots[1].fire('click');
A(state.selectedPlant === 'peashooter', 'peashooter slot selected');
const sunPrePea = state.sun;
clickCanvas(cellX(2), cellY(2));
A(state.grid[2][2] && state.grid[2][2].type === 'peashooter', 'peashooter planted at row2,col2');
A(state.sun === sunPrePea - 100, 'peashooter cost deducted (100)');

// --- 5. wave: zombie spawns, peashooter shoots, zombie dies ---
let maxZombies = 0, sawPea = false, minZombieHp = Infinity, killObserved = false;
const projTypes = new Set();
for (let f = 0; f < 3000; f++) {
  step(1);
  const z = state.zombies;
  if (z.length > maxZombies) maxZombies = z.length;
  if (state.projectiles.length > 0) {
    sawPea = true;
    state.projectiles.forEach(p => projTypes.add(p.type));
  }
  if (z.length > 0) minZombieHp = Math.min(minZombieHp, z[0].hp);
  if (maxZombies >= 1 && z.length === 0 && state.grid[2][2]) { killObserved = true; break; }
}
A(maxZombies >= 1, 'zombie spawned in wave');
A(sawPea, 'peashooter fired peas');
A(projTypes.size === 1 && projTypes.has('pea'), "peashooter projectiles are typed 'pea'");
A(minZombieHp < 100, 'peas damaged the zombie (hp dropped from 100)');
A(killObserved, 'zombie was killed by peashooter');
A(state.sun === sunPrePea - 100 + 10, 'kill reward +10 sun credited (25 + 10 = 35)');

// --- 6. game over: strip defenses, let a zombie reach the house ---
state.grid[2][2] = null;
state.grid[0][0] = null;
state.health = 1;
for (let f = 0; f < 60000 && !state.gameOver; f++) step(1);
A(state.gameOver === true, 'zombie reaching house with health=1 triggers game over');
A(state.health === 0, 'health is exactly 0 at game over (strict 1 -> 0, no lives system)');

// --- 7. restart via canvas click ---
const sunAfterDeath = state.sun;
clickCanvas(300, 200);
A(state.gameOver === false, 'click after game over restarts the game');
A(state.health === 1 && state.sun === 200, 'restart resets health=1, sun=200');
A(state.zombies.length === 0 && state.grid.every(r => r.every(c => c === null)), 'restart clears zombies and plants');

// --- 8. level scaling ---
state.waveInterval = 1;
let f2 = 0;
while (state.level === 1 && f2 < 5000) { step(1); f2++; }
A(state.level > 1, 'level increases after enough zombie spawns');

// --- 9. seed-packet affordability class (presentation only) ---
state.sun = 200;
updateUI(state);
A(!slots[0].classes.has('unaffordable') && !slots[1].classes.has('unaffordable'),
  'both packets affordable at sun=200');
state.sun = 60;
updateUI(state);
A(!slots[0].classes.has('unaffordable') && slots[1].classes.has('unaffordable'),
  'peashooter unaffordable at sun=60, sunflower still affordable');
state.sun = 25;
updateUI(state);
A(slots[0].classes.has('unaffordable') && slots[1].classes.has('unaffordable'),
  'both unaffordable at sun=25');

// --- 10. any-empty-tile placement rule (all plant types share one code path) ---
state.sun = 500;
updateUI(state);
slots[0].fire('click'); // sunflower selected
clickCanvas(cellX(0), cellY(1));   // left column
clickCanvas(cellX(4), cellY(0));   // center column
clickCanvas(cellX(8), cellY(4));   // right column
A(state.grid[1][0] && state.grid[1][0].type === 'sunflower', 'sunflower plants in left column (col0)');
A(state.grid[0][4] && state.grid[0][4].type === 'sunflower', 'sunflower plants in center column (col4)');
A(state.grid[4][8] && state.grid[4][8].type === 'sunflower', 'sunflower plants in right column (col8)');
A(state.sun === 500 - 50 * 3, 'three sunflowers charged exactly 50 each');
const sunAfterPlace = state.sun;
clickCanvas(cellX(0), cellY(1)); // same occupied cell again
A(state.grid[1][0].type === 'sunflower' && state.sun === sunAfterPlace,
  'occupied cell rejects a second plant (no double charge)');
slots[1].fire('click'); // peashooter selected
clickCanvas(cellX(7), cellY(3));
A(state.grid[3][7] && state.grid[3][7].type === 'peashooter', 'peashooter plants on any empty tile');
A(state.sun === sunAfterPlace - 100, 'peashooter charged exactly 100');

// --- 11. centralized costs for all five plants ---
const { PLANT_TYPES, BALANCE } = await import(new URL('../js/config.js', import.meta.url).href);
A(PLANT_TYPES.sunflower.cost === 50 && PLANT_TYPES.peashooter.cost === 100 &&
  PLANT_TYPES.wallnut.cost === 50 && PLANT_TYPES.snowpea.cost === 175 &&
  PLANT_TYPES.repeater.cost === 200,
  'config costs exactly 50 / 100 / 50 / 175 / 200');
A(PLANT_TYPES.wallnut.role === 'defense' && PLANT_TYPES.wallnut.hp === 400,
  'wall-nut: role=defense, hp=400');
A(PLANT_TYPES.wallnut.hp >= 4 * PLANT_TYPES.peashooter.hp,
  'wall-nut HP >= 4x peashooter');

// --- 12. Wall-nut blocking / high HP / no attack / no sun ---
const { createPlant } = await import(new URL('../js/plants.js', import.meta.url).href);
// Controlled scenario: stop waves, clear the board, place only the Wall-nut.
state.waveInterval = 1e9;
state.zombies = [];
state.suns = [];
state.projectiles = [];
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.grid[2][1] = createPlant('wallnut', 2, 1, nowValue());
// One zombie parked at the Wall-nut's cell, in eating range.
state.zombies.push({
  row: 2, x: (1 + 0.7) * (600 / 9) - 2,
  speed: 0.3, hp: 100, maxHp: 100, eating: false,
});
const zStartX = state.zombies[0].x;
step(625); // ~10 seconds of continuous biting
const wall = state.grid[2][1];
A(!!wall, 'wall-nut survives 10s of continuous biting (a 100-HP plant would be long dead)');
A(wall && wall.hp <= 400 - 8 * 9 && wall.hp >= 400 - 8 * 11,
  'wall-nut lost only bite damage (~80 over 10s at 8 dps)');
A(Math.abs(state.zombies[0].x - zStartX) < 1 && state.zombies[0].eating === true,
  'zombie stops at wall-nut and eats (shared eating system, no pass-through)');
A(state.suns.length === 0, 'wall-nut generates no sun');
A(state.projectiles.length === 0, 'wall-nut fires no projectile');
// Same removal rule as every plant: hp <= 0 => removed from grid.
state.grid[2][1].hp = 0.1; // one more bite pushes it under 0
step(1);
A(state.grid[2][1] === null, 'wall-nut removed from grid at 0 HP');
step(3);
A(state.zombies[0].eating === false && state.zombies[0].x < zStartX,
  'zombie resumes walking once wall-nut is gone');

// --- 13. Snow Pea: ice projectile, temporary slow, expiry, refresh-not-stack ---
A(PLANT_TYPES.snowpea.projectile === 'icePea' && PLANT_TYPES.snowpea.cost === 175 &&
  PLANT_TYPES.snowpea.role === 'shooter',
  'snowpea config: cost 175, role shooter, projectile icePea');
// Controlled scenario: board cleared, waves stopped (waveInterval=1e9 from §12).
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.zombies = [];
state.suns = [];
state.projectiles = [];
state.health = 1;
state.gameOver = false;
state.grid[2][4] = createPlant('snowpea', 2, 4, nowValue());
const slowZ = { row: 2, x: 400, speed: 0.25, hp: 100, maxHp: 100, eating: false };
state.zombies.push(slowZ);
const slowTypes = new Set();
let tHit1 = -1;
for (let f = 0; f < 4000 && tHit1 < 0; f++) {
  step(1);
  state.projectiles.forEach(p => slowTypes.add(p.type));
  if (slowZ.slowUntil !== undefined) tHit1 = nowValue();
}
A(tHit1 > 0, 'snow pea hit the zombie with an ice projectile');
A(slowTypes.has('icePea') && !slowTypes.has('pea'), "snow pea fires 'icePea' projectiles only");
A(slowZ.slowUntil === tHit1 + 3000, 'slow deadline set to now + 3000ms (BALANCE.SLOW_MS)');
A(slowZ.speed === 0.25, 'zombie base speed untouched by the hit');
// Movement while slowed: exactly base * 0.65 per frame (dt = 16ms).
let x1 = slowZ.x;
step(10);
const dxSlow = (x1 - slowZ.x) / 10;
A(Math.abs(dxSlow - 0.25 * 0.65) < 0.01,
  `slowed speed = base * 0.65 (measured ${dxSlow.toFixed(4)}/frame, base 0.25)`);
// Second ice hit arrives before expiry: deadline must REFRESH, not stack.
let tHit2 = -1;
for (let f = 0; f < 3000 && tHit2 < 0; f++) {
  step(1);
  if (slowZ.slowUntil !== undefined && slowZ.slowUntil > tHit1 + 3000) tHit2 = nowValue();
}
A(tHit2 > 0 && tHit2 < tHit1 + 3000, 'second ice hit lands while the first slow is still active');
A(slowZ.slowUntil === tHit2 + 3000,
  're-hit REFRESHES to now+3000 (deadline replaced — never stacked/multiplied)');
A(slowZ.speed === 0.25, 'base speed still untouched after the re-hit');
// Remove the shooter -> no further hits -> slow expires and speed restores.
state.grid[2][4] = null;
state.projectiles = [];
for (let f = 0; f < 3000 && nowValue() < slowZ.slowUntil + 100; f++) step(1);
A(nowValue() > slowZ.slowUntil, 'slow deadline passed (expired naturally)');
let x2 = slowZ.x;
step(10);
const dxFull = (x2 - slowZ.x) / 10;
A(Math.abs(dxFull - 0.25) < 0.01,
  `speed fully restored after expiry (measured ${dxFull.toFixed(4)}/frame, base 0.25)`);

// --- 14. Repeater: two real projectiles ~200ms apart, both hit, silent when empty ---
A(PLANT_TYPES.repeater.cost === 200 && PLANT_TYPES.repeater.shotsPerAttack === 2 &&
  PLANT_TYPES.repeater.shotDelay === 200 && PLANT_TYPES.repeater.projectile === 'pea',
  'repeater config: cost 200, 2 shots, 200ms delay, normal pea');
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.zombies = [];
state.suns = [];
state.projectiles = [];
state.grid[2][4] = createPlant('repeater', 2, 4, nowValue());
// Empty lane: repeater must stay silent across two attack-cooldown windows.
step(300); // 4.8s > 1.8s shootInterval, twice over
A(state.projectiles.length === 0, 'repeater fires NO projectile when its lane is empty');
A(state.suns.length === 0, 'repeater generates no sun');
// Static zombie in lane: watch both hits land.
const repZ = { row: 2, x: 400, speed: 0, hp: 100, maxHp: 100, eating: false };
state.zombies.push(repZ);
let maxConcurrent = 0, tRepHit1 = -1, tRepHit2 = -1;
for (let f = 0; f < 600 && tRepHit2 < 0; f++) {
  step(1);
  if (state.projectiles.length > maxConcurrent) maxConcurrent = state.projectiles.length;
  if (repZ.hp === 75 && tRepHit1 < 0) tRepHit1 = nowValue();
  else if (repZ.hp === 50 && tRepHit2 < 0) tRepHit2 = nowValue();
}
A(maxConcurrent >= 2, 'two REAL projectiles in flight simultaneously (not one double-damage shot)');
A(tRepHit1 > 0 && tRepHit2 > 0, 'both repeater shots hit the zombie (hp 100 -> 75 -> 50)');
const repGap = tRepHit2 - tRepHit1;
A(repGap >= 192 && repGap <= 240, `shots ~200ms apart (hits ${repGap}ms apart, expected ~208)`);
A(repZ.hp === 50, 'each projectile dealt normal 25 damage (two 25s, not one 50)');

// --- 15. five seed cards, exact costs, new plants through the real click path ---
A(slots.length === 5, 'seed bank has exactly 5 plant slots');
const expectedCards = [
  ['sunflower', 'Sunflower', '☀ 50'],
  ['peashooter', 'Pea Shooter', '☀ 100'],
  ['wallnut', 'Wall-nut', '☀ 50'],
  ['snowpea', 'Snow Pea', '☀ 175'],
  ['repeater', 'Repeater', '☀ 200'],
];
for (let i = 0; i < expectedCards.length; i++) {
  const [key, name, cost] = expectedCards[i];
  A(slots[i].dataset.plant === key && slots[i].nameEl.textContent === name &&
    slots[i].costEl.textContent === cost,
    `card ${i + 1}: ${name}, cost ${cost} (labels synced from PLANT_TYPES)`);
}
// Plant the three new types through the actual select-and-click UI path.
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.zombies = [];
state.projectiles = [];
state.suns = [];
state.sun = 1000;
updateUI(state);
slots[2].fire('click'); // wallnut
clickCanvas(cellX(0), cellY(0));
A(state.grid[0][0] && state.grid[0][0].type === 'wallnut' && state.sun === 950,
  'wallnut plants via UI, charged 50');
slots[3].fire('click'); // snowpea
clickCanvas(cellX(4), cellY(2));
A(state.grid[2][4] && state.grid[2][4].type === 'snowpea' && state.sun === 775,
  'snowpea plants via UI, charged 175');
slots[4].fire('click'); // repeater
clickCanvas(cellX(8), cellY(4));
A(state.grid[4][8] && state.grid[4][8].type === 'repeater' && state.sun === 575,
  'repeater plants via UI, charged 200');
A(slots[4].classes.has('selected') && !slots[2].classes.has('selected'),
  'selected state toggles correctly across the new cards');
// Occupied-cell rejection is the same shared rule for the new types.
const sunBeforeReject = state.sun;
slots[3].fire('click');
clickCanvas(cellX(4), cellY(2)); // already has the snowpea
A(state.grid[2][4].type === 'snowpea' && state.sun === sunBeforeReject,
  'occupied cell rejects snowpea (same empty-tile rule for all five types)');

// --- 16. shovel tool: config constant + fresh-state fields ---
A(BALANCE.SHOVEL_REFUND_RATE === 0.5, 'config: BALANCE.SHOVEL_REFUND_RATE is 0.5');
A(state.selectedTool === null, 'fresh state: selectedTool is null');
A(Array.isArray(state.floatTexts) && state.floatTexts.length === 0,
  'fresh state: floatTexts is an empty array');
A(state.hoverCell === null, 'fresh state: hoverCell is null');

// --- 17. shovel selection vs seed selection (mutual exclusion, toggle, Escape) ---
A(tools.length === 1 && tools[0].nameEl.textContent === 'Shovel',
  'seed bank has exactly one tool slot, labeled Shovel');
A(tools[0].querySelector('.plant-cost') === null,
  'shovel slot has no sun cost element');
slots[3].fire('click'); // leave a seed selected first (snowpea from §15)
tools[0].fire('click'); // then select the shovel
A(state.selectedTool === 'shovel', 'shovel click selects the shovel');
A(state.selectedPlant === null, 'selecting the shovel clears the seed selection');
A(tools[0].classes.has('selected'), 'shovel shows the selected class');
A(slots.every(s => !s.classes.has('selected')), 'no seed card remains selected');
slots[1].fire('click'); // now pick a seed
A(state.selectedPlant === 'peashooter' && state.selectedTool === null,
  'selecting a seed cancels shovel mode');
A(!tools[0].classes.has('selected'), 'shovel selected class cleared by seed pick');
tools[0].fire('click'); // re-arming the shovel after a seed took over
tools[0].fire('click');
A(state.selectedTool === null, 'clicking the shovel again toggles it off');
A(!tools[0].classes.has('selected'), 'toggled-off shovel drops the selected class');
tools[0].fire('click');
fireDocument('keydown', { key: 'Escape' });
A(state.selectedTool === null, 'Escape key cancels shovel mode');
A(!tools[0].classes.has('selected'), 'Escape also clears the shovel selected class');
tools[0].fire('click'); // leave shovel selected for the restart-reset check
restartGame();
A(state.selectedTool === null, 'restart resets selectedTool to null');
A(!tools[0].classes.has('selected'), 'restart clears the shovel selected class');
A(state.floatTexts.length === 0, 'restart clears pending float texts');
slots[0].fire('click'); // restore a clean selection baseline for later sections
slots[0].fire('click');
A(state.selectedPlant === null, 'baseline restored: no seed selected');

// --- 18. shovel dig: generic removal, config-driven 50% refund, edge cases ---
const { removePlantWithRefund } = await import(new URL('../js/plants.js', import.meta.url).href);
A(typeof removePlantWithRefund === 'function', 'plants.js exports removePlantWithRefund');
// Controlled sandbox: waves stopped, board cleared, plenty of sun.
state.waveInterval = 1e9;
state.zombies = [];
state.suns = [];
state.projectiles = [];
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.sun = 2000;
updateUI(state);
const PLANT_KEYS = ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'repeater'];
const plantAt = (type, row, col) => {
  slots[PLANT_KEYS.indexOf(type)].fire('click');
  clickCanvas(cellX(col), cellY(row));
};
const dig = (row, col) => { tools[0].fire('click'); clickCanvas(cellX(col), cellY(row)); };

// §35 — refund is exactly floor(cost * 0.5), config-driven, for ALL five types.
const refundCases = [
  ['sunflower', 0, 25], ['peashooter', 1, 50], ['wallnut', 2, 25],
  ['snowpea', 3, 87], ['repeater', 4, 100], // 175 -> 87 proves the floor()
];
for (const [type, col, expected] of refundCases) {
  plantAt(type, 0, col);
  A(state.grid[0][col] && state.grid[0][col].type === type, `${type} planted for the dig test`);
  const sunBefore = state.sun;
  dig(0, col);
  A(state.sun === sunBefore + expected,
    `shovel refunds exactly ${expected} sun for ${type} (floor(cost * 0.5))`);
  A(state.grid[0][col] === null, `${type} removed from the grid`);
  A(state.selectedTool === null, `shovel auto-deselected after digging ${type} (one-use)`);
}

// §13/§14 — empty tile and outside-lawn clicks are no-ops; shovel stays armed.
tools[0].fire('click');
const sunEmpty = state.sun;
clickCanvas(cellX(5), cellY(2)); // empty tile
A(state.sun === sunEmpty, 'empty tile: sun unchanged');
A(state.selectedTool === 'shovel', 'empty tile: shovel remains selected');
clickCanvas(-40, -30); // outside the lawn (top-left)
A(state.selectedTool === 'shovel', 'outside lawn (top-left): shovel remains selected');
clickCanvas(650, 420); // outside the lawn (bottom-right)
A(state.selectedTool === 'shovel', 'outside lawn (bottom-right): shovel remains selected');
tools[0].fire('click'); // toggle off for the next section

// §38 — a DAMAGED wall-nut still refunds the same 25 (refund is HP-independent).
plantAt('wallnut', 1, 6);
state.grid[1][6].hp = 41;
const sunDmg = state.sun;
dig(1, 6);
A(state.grid[1][6] === null && state.sun === sunDmg + 25,
  'damaged wall-nut still refunds exactly 25 (refund independent of HP)');

// §39 — a zombie EATING a plant resumes walking after the shovel removes it.
state.grid[3][2] = createPlant('wallnut', 3, 2, nowValue());
const eatX = (2 + 0.7) * (600 / 9) - 2;
const zEat = { row: 3, x: eatX, speed: 0.3, hp: 100, maxHp: 100, eating: false };
state.zombies.push(zEat);
step(63); // ~1s of biting (wall-nut loses only ~8 hp of 400)
A(zEat.eating === true, 'zombie is eating the wall-nut before the dig');
const sunEat = state.sun;
dig(3, 2);
A(state.grid[3][2] === null && state.sun === sunEat + 25,
  'digging the eaten wall-nut removes it and refunds 25');
step(3);
A(zEat.eating === false && zEat.x < eatX,
  'zombie STOPS eating and resumes walking (no stale plant reference)');
state.zombies = [];
// Same edge case with a second plant type (shooter).
state.grid[3][2] = createPlant('peashooter', 3, 2, nowValue());
const zEat2 = { row: 3, x: eatX, speed: 0.3, hp: 100, maxHp: 100, eating: false };
state.zombies.push(zEat2);
step(63);
A(zEat2.eating === true, 'zombie is eating the peashooter before the dig');
const sunEat2 = state.sun;
dig(3, 2);
A(state.grid[3][2] === null && state.sun === sunEat2 + 50,
  'digging an eaten peashooter removes it and refunds 50');
step(3);
A(zEat2.eating === false && zEat2.x < eatX,
  'zombie resumes walking after peashooter is dug');
state.zombies = [];

// §40 — repeater: in-flight pea continues, but the PENDING second shot cancels.
state.grid[2][4] = createPlant('repeater', 2, 4, nowValue());
const repZ2 = { row: 2, x: 400, speed: 0, hp: 1000, maxHp: 1000, eating: false };
state.zombies.push(repZ2);
let sawFirstPea = false;
for (let f = 0; f < 600 && !sawFirstPea; f++) { step(1); if (state.projectiles.length >= 1) sawFirstPea = true; }
A(sawFirstPea, 'repeater fired its first pea');
const inFlight = state.projectiles.length;
const sunRep = state.sun;
dig(2, 4);
A(state.grid[2][4] === null && state.sun === sunRep + 100,
  'digging the repeater removes it and refunds 100');
A(state.projectiles.length === inFlight,
  'already-fired pea remains in flight after the dig');
// Run past the 200ms second-shot window: no NEW projectile may appear.
let maxAfterDig = 0;
for (let f = 0; f < 20; f++) { step(1); maxAfterDig = Math.max(maxAfterDig, state.projectiles.length); }
A(maxAfterDig <= inFlight,
  `pending second shot CANCELED (max ${maxAfterDig} in flight, none added after dig)`);
state.zombies = [];
state.projectiles = [];

// §41 — sunflower: existing pickup survives, but no future sun is produced.
state.grid[1][1] = createPlant('sunflower', 1, 1, nowValue());
for (let f = 0; f < 450 && state.suns.length === 0; f++) step(1); // ~7.2s
A(state.suns.length >= 1, 'sunflower produced a sun pickup');
// Ruling: sun collection keeps priority on tap (approved design), and the
// pickup spawns ON the plant's own tile — so a tap there would collect it
// rather than dig. Move it clear (a sun sitting elsewhere on the lawn) to
// exercise the dig itself, then prove the pre-existing pickup survives.
state.suns[0].x = 500; state.suns[0].y = 30;
const sunsBefore = state.suns.length;
const sunSF = state.sun;
dig(1, 1);
A(state.grid[1][1] === null && state.sun === sunSF + 25,
  'digging the sunflower removes it and refunds 25');
A(state.suns.length === sunsBefore, 'already-spawned sun pickup SURVIVES the dig');
state.suns = []; // isolate the "no future sun" check
for (let f = 0; f < 450; f++) step(1); // > one full sunInterval (7s)
A(state.suns.length === 0, 'removed sunflower produces NO future sun');

// §42 — Game Over takes priority; restart resets the shovel.
state.grid[0][0] = createPlant('peashooter', 0, 0, nowValue()); // control dig
const sunCtl = state.sun;
dig(0, 0);
A(state.grid[0][0] === null && state.sun === sunCtl + 50,
  'control dig while ALIVE works (refunds 50) — proves the dig path exists');
state.health = 1;
state.gameOver = true;
state.grid[1][1] = createPlant('sunflower', 1, 1, nowValue());
tools[0].fire('click'); // attempt to arm the shovel during game over
A(state.selectedTool === null, 'shovel CANNOT be selected after game over');
state.selectedTool = 'shovel'; // force it, to prove the canvas guard too
const sunGO = state.sun;
clickCanvas(cellX(1), cellY(1));
A(state.gameOver === false && state.sun === 200,
  'game-over canvas click RESTARTS instead of digging (no refund leaked)');
A(state.selectedTool === null && state.health === 1,
  'restart clears the forced shovel selection and restores health=1');

// --- 19. shovel visual feedback: float text, hover highlight, cursor ---
state.waveInterval = 1e9;
state.zombies = [];
state.suns = [];
state.projectiles = [];
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.floatTexts = [];
state.hoverCell = null;
state.sun = 500;
updateUI(state);
const mousemove = (x, y) => canvas.listeners.mousemove.forEach(fn => fn({ clientX: x, clientY: y }));

// A dig pushes a float text at the dug tile, carrying the exact refund.
plantAt('sunflower', 2, 3);
dig(2, 3);
A(state.floatTexts.length === 1 && state.floatTexts[0].text === '+25 SUN',
  'dig pushes a float text reading "+25 SUN"');
A(Math.abs(state.floatTexts[0].x - cellX(3)) < 0.01 && Math.abs(state.floatTexts[0].y - cellY(2)) < 0.01,
  'float text is positioned at the dug tile center');
A(state.floatTexts[0].at === nowValue(), 'float text is stamped with the current time');
// Snow Pea proves the FLOORED refund reaches the player: 175 -> 87.
state.suns = []; // no pickup to intercept the tap
plantAt('snowpea', 2, 5);
dig(2, 5);
A(state.floatTexts.length === 2 && state.floatTexts[1].text === '+87 SUN',
  'snow pea dig pushes "+87 SUN" (floored refund shown to the player)');

// Rendering: draw() emits the float text, and cleans up stale entries.
drawCalls.length = 0;
draw();
A(drawCalls.some(c => c.fn === 'fillText' && String(c.args[0]).includes('+25 SUN')),
  'draw() renders the float text on the canvas');
state.floatTexts.push({ x: 100, y: 100, text: '+999 SUN', at: nowValue() - 1300 }); // older than 1200ms
draw();
A(state.floatTexts.every(ft => ft.text !== '+999 SUN'),
  'float text older than FLOAT_TEXT_MS (1200) is cleaned up by draw()');
A(state.floatTexts.some(ft => ft.text === '+25 SUN'),
  'a fresh float text survives the cleanup');

// Hover highlight: mousemove records the targeted cell for the outline.
plantAt('wallnut', 2, 5); // a planted tile to target
tools[0].fire('click');   // arm the shovel
mousemove(cellX(5), cellY(2));
A(state.hoverCell && state.hoverCell.row === 2 && state.hoverCell.col === 5,
  'mousemove sets hoverCell to the targeted {row,col}');
drawCalls.length = 0;
draw();
const hoverX = cellX(5), hoverY = cellY(2);
A(drawCalls.some(c => c.fn === 'strokeRect' &&
    c.args[0] > hoverX - 40 && c.args[0] < hoverX &&
    c.args[1] > hoverY - 50 && c.args[1] < hoverY),
  'draw() strokes an outline anchored to the hovered PLANTED tile');
mousemove(-50, -50); // outside the lawn
A(state.hoverCell === null, 'mousemove outside the lawn clears hoverCell');

// Cursor: crosshair when armed, pointer over a collectible sun, '' when off.
mousemove(cellX(5), cellY(2));
A(canvas.style.cursor === 'crosshair', 'armed shovel over the lawn => crosshair cursor');
state.suns.push({ x: cellX(5), y: cellY(2), value: 25, ttl: 8000, falling: false, targetY: cellY(2) });
mousemove(cellX(5), cellY(2));
A(canvas.style.cursor === 'pointer', 'a collectible sun still wins => pointer cursor');
state.suns = [];
tools[0].fire('click'); // disarm
mousemove(cellX(5), cellY(2));
A(canvas.style.cursor === '', 'disarmed shovel => default cursor');
state.hoverCell = null;

// --- 20. acceptance: seed-armed tap on a planted tile never removes a plant ---
state.waveInterval = 1e9;
state.zombies = []; state.suns = []; state.projectiles = [];
for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
state.selectedPlant = null; state.selectedTool = null;
state.floatTexts = [];
state.sun = 500;
updateUI(state);
plantAt('peashooter', 0, 0);   // place a peashooter at (0,0)
tools[0].fire('click');        // arm the shovel...
slots[1].fire('click');        // ...then pick the peashooter seed instead
A(state.selectedPlant === 'peashooter' && state.selectedTool === null,
  'real click flow: picking a seed after the shovel leaves only the seed armed');
const sunSeedMode = state.sun;
clickCanvas(cellX(0), cellY(0)); // tap the PLANTED tile while only a seed is armed
A(state.grid[0][0] && state.grid[0][0].type === 'peashooter',
  'seed mode tapping a planted tile does NOT remove the plant');
A(state.sun === sunSeedMode && state.floatTexts.length === 0,
  'seed mode tapping a planted tile: no refund and no float text');
tools[0].fire('click'); // arm the shovel for contrast
const sunShovelMode = state.sun;
clickCanvas(cellX(0), cellY(0)); // now the SAME tap digs it
A(!state.grid[0][0] && state.sun === sunShovelMode + 50,
  'the same tap digs only when the shovel is armed (refunds 50)');

// --- 21. the REAL index.html carries the shovel entry point ---
// Regression guard: §17's tool-slot assertions only exercised the test stub,
// so deleting the .tool-slot div (or breaking its label/cost structure) from
// the actual markup would leave every test green while the feature becomes
// unreachable in the game. Read the shipped file and assert it directly.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
A((html.match(/class="plant-slot"/g) || []).length === 5,
  'index.html declares exactly 5 .plant-slot seed cards');
A((html.match(/class="tool-slot"/g) || []).length === 1,
  'index.html declares exactly one .tool-slot element');
A(/class="tool-slot"[^>]*data-tool="shovel"/s.test(html),
  'the tool slot declares data-tool="shovel"');
A(/id="shovel-slot"/.test(html), 'the tool slot has id="shovel-slot"');
A(/class="tool-name">Shovel</.test(html), 'the tool slot is labeled "Shovel"');
const toolBlock = html.match(/<div class="tool-slot"[\s\S]*?<\/div>/);
A(!!toolBlock && !/plant-cost/.test(toolBlock[0]),
  'the shovel slot contains NO sun cost element');
A(/class="tool-img" src="images\/shovel.png"/.test(html),
  'the shovel slot uses the local images/shovel.png (no hotlink)');
A(existsSync(new URL('../images/shovel.png', import.meta.url)),
  'images/shovel.png exists on disk');
A(/Shovel artwork: original project asset/.test(html),
  'credits include the original shovel artwork line (existing credits kept)');

// ================= §22. Zombie type config & normal-equivalence =================
const { ZOMBIE_TYPES, SPAWN_WEIGHTS, BURST_CHANCE } =
  await import(new URL('../js/config.js', import.meta.url).href);
const ZTYPE_KEYS = ['normal', 'sprinter', 'brute', 'biter'];
A(ZTYPE_KEYS.every(t => ZOMBIE_TYPES && ZOMBIE_TYPES[t]),
  'ZOMBIE_TYPES defines all four zombie types');
A(ZTYPE_KEYS.every(t => {
  const d = ZOMBIE_TYPES[t];
  return typeof d.name === 'string' && d.name.length > 0 &&
    typeof d.hp === 'number' && d.hp > 0 &&
    typeof d.speedMin === 'number' && typeof d.speedMax === 'number' &&
    d.speedMax > d.speedMin && d.speedMin > 0 &&
    typeof d.eatDps === 'number' && d.eatDps > 0 &&
    typeof d.reward === 'number' && d.reward > 0 &&
    typeof d.sprite === 'string';
}), 'every type has numeric hp/speedMin/speedMax/eatDps/reward/name/sprite');
A(ZOMBIE_TYPES.normal.hp === 100 && ZOMBIE_TYPES.normal.speedMin === 0.25 &&
  ZOMBIE_TYPES.normal.speedMax === 0.40 && ZOMBIE_TYPES.normal.eatDps === 8 &&
  ZOMBIE_TYPES.normal.reward === 10 && ZOMBIE_TYPES.normal.reward === BALANCE.KILL_SUN_REWARD,
  'normal reproduces the legacy baseline exactly (100 hp, .25-.40, 8 dps, 10 sun)');
const meanSpeed = t => (ZOMBIE_TYPES[t].speedMin + ZOMBIE_TYPES[t].speedMax) / 2;
A(ZOMBIE_TYPES.sprinter.hp < ZOMBIE_TYPES.normal.hp &&
  meanSpeed('sprinter') > 1.3 * meanSpeed('normal'),
  'sprinter: less HP and a clearly faster mean speed (> 1.3x normal)');
A(ZOMBIE_TYPES.brute.hp >= 2 * ZOMBIE_TYPES.normal.hp &&
  meanSpeed('brute') < 0.85 * meanSpeed('normal'),
  'brute: >= 2x HP and a clearly slower mean speed (< 0.85x normal)');
A(ZOMBIE_TYPES.biter.eatDps > ZOMBIE_TYPES.normal.eatDps &&
  ZOMBIE_TYPES.biter.hp > ZOMBIE_TYPES.normal.hp &&
  ZOMBIE_TYPES.biter.hp < ZOMBIE_TYPES.brute.hp,
  'biter: higher eat dps, medium HP between normal and brute');
A(SPAWN_WEIGHTS.length === 4 && SPAWN_WEIGHTS.every(w =>
  ZTYPE_KEYS.every(t => typeof w[t] === 'number') &&
  w.normal + w.sprinter + w.brute + w.biter > 0),
  'SPAWN_WEIGHTS: 4 rows, every type listed, every row spawnable');
A(SPAWN_WEIGHTS[0].normal === 85 && SPAWN_WEIGHTS[0].sprinter === 15 &&
  SPAWN_WEIGHTS[0].brute === 0 && SPAWN_WEIGHTS[0].biter === 0 &&
  SPAWN_WEIGHTS[1].biter === 0 && SPAWN_WEIGHTS[2].biter > 0,
  'staged introduction: L1 normal+sprinter only, L2 adds brute, L3 adds biter');
A(BURST_CHANCE.length === 5 && BURST_CHANCE[0] === 0 && BURST_CHANCE[1] === 0 &&
  BURST_CHANCE[2] > 0 && BURST_CHANCE[4] >= BURST_CHANCE[3],
  'BURST_CHANCE: none at L1-2, grows from L3');
A(BALANCE.WAVE_INTERVAL_STEP === 900 && BALANCE.WAVE_INTERVAL_MIN === 2500,
  'interval step steepened to 900ms/level, floor still 2500ms');

// ================= §23. Weighted zombie spawning =================
const { spawnZombie, pickZombieType, updateZombies, updateWaves } =
  await import(new URL('../js/zombies.js', import.meta.url).href);
const { updateProjectiles } =
  await import(new URL('../js/projectiles.js', import.meta.url).href);
const resetBoard = () => {
  for (let r = 0; r < state.grid.length; r++) state.grid[r].fill(null);
  state.zombies = []; state.projectiles = []; state.suns = [];
  state.health = 1; state.gameOver = false; state.level = 1;
  state.selectedPlant = null; state.selectedTool = null;
  state.waveInterval = 1e9; state.waveTimer = 0; // waves off unless a test re-enables them
};
resetBoard();
state.zombies = [];
spawnZombie(state, () => 0.0); // roll 0 -> first weighted type at L1
A(state.zombies.length === 1 && state.zombies[0].type === 'normal',
  'L1 low roll spawns a normal zombie');
state.zombies = [];
spawnZombie(state, () => 0.90); // roll 90 of 100 -> past normal (85), into sprinter
A(state.zombies[0].type === 'sprinter', 'L1 high roll spawns the rare sprinter');
// rng = 1.0 (degenerate edge) must still yield a valid type
state.zombies = [];
spawnZombie(state, () => 1.0);
A(!!ZOMBIE_TYPES[state.zombies[0].type], 'rng=1.0 falls back to a valid type (never undefined)');
// full sweeps: staged introduction holds at every roll position
const sweepTypes = lvl => {
  const found = new Set();
  state.level = lvl;
  for (let r = 0; r < 1000; r++) {
    state.zombies = [];
    spawnZombie(state, () => r / 1000);
    found.add(state.zombies[0].type);
  }
  return found;
};
const l1 = sweepTypes(1);
A(l1.size === 2 && l1.has('normal') && l1.has('sprinter'),
  'L1 1000-roll sweep yields ONLY normal + sprinter');
const l2 = sweepTypes(2);
A(l2.size === 3 && !l2.has('biter'), 'L2 sweep adds brute, still no biter');
const l3 = sweepTypes(3);
A(l3.size === 4, 'L3 sweep yields all four types');
const l9 = sweepTypes(9);
A(l9.size === 4 && [...l9].every(t => ZOMBIE_TYPES[t]),
  'levels beyond the table clamp to L4+ weights; only valid types spawn');
// spawned zombies carry the full generic shape
state.zombies = [];
state.level = 1;
spawnZombie(state, () => 0.1);
const zShape = state.zombies[0];
A(zShape.type === 'normal' && zShape.row === 0 && zShape.x === 630 &&
  typeof zShape.speed === 'number' && zShape.hp === 100 && zShape.maxHp === 100 &&
  zShape.eatDps === 8 && zShape.reward === 10 && zShape.eating === false,
  'spawned zombie: {type,row,x,speed,hp,maxHp,eatDps,reward,eating} all populated');

// ================= §24. Per-type stats & kill rewards =================
// Deterministic exact-type spawn: pick a roll inside the type's weight band
// (rows sum to 100; the same rng value feeds the row/speed rolls harmlessly).
const spawnAs = (type, lvl) => {
  state.level = lvl;
  const weights = SPAWN_WEIGHTS[Math.min(lvl, SPAWN_WEIGHTS.length) - 1];
  let lo = 0;
  for (const t of Object.keys(weights)) { if (t === type) break; lo += weights[t]; }
  state.zombies = [];
  spawnZombie(state, () => (lo + 0.5) / 100);
  return state.zombies[0];
};
resetBoard();
const zN = spawnAs('normal', 1), zS = spawnAs('sprinter', 1);
const zB = spawnAs('brute', 3), zBi = spawnAs('biter', 3);
A(zN.hp === 100 && zN.speed >= 0.25 && zN.speed <= 0.40 && zN.eatDps === 8 && zN.reward === 10,
  'L1 normal spawn: 100 hp, speed in [.25,.40], 8 dps, 10 sun reward');
A(zS.hp === 75 && zS.speed > 0.40 && zS.reward === 12,
  'L1 sprinter spawn: 75 hp, speed > 0.40, 12 sun reward');
A(zB.hp === 240 * 1.3 && zB.speed >= 0.20 * 1.3 && zB.speed <= 0.26 * 1.3 && zB.reward === 25,
  'L3 brute spawn: 240 x 1.3 hp, speed band x 1.3, 25 sun reward (reward unscaled)');
A(zBi.hp === 130 * 1.3 && zBi.eatDps === 14 && zBi.reward === 16,
  'L3 biter spawn: 130 x 1.3 hp, 14 dps, 16 sun reward (dps/reward unscaled)');
A(Math.abs(spawnAs('brute', 3).hp - 240 * 1.3) < 1e-9,
  'difficulty law still scales every type (L3 brute = 240 x 1.3)');
// kill rewards flow through the SHARED projectile path
const killRewardOf = z => {
  state.zombies = [z]; state.projectiles = [];
  z.x = 300;            // on-lawn: spawned zombies start at 630, past the
  z.hp = 10;            // projectile cull line (620), which skips hit checks
  const before = state.sun;
  state.projectiles.push({ row: z.row, x: z.x - 5, y: 0, type: 'pea' });
  updateProjectiles(state, nowValue(), 16);
  return state.sun - before;
};
A(killRewardOf(spawnAs('normal', 1)) === 10, 'kill reward: normal = 10 (legacy flat value)');
A(killRewardOf(spawnAs('sprinter', 1)) === 12, 'kill reward: sprinter = 12');
A(killRewardOf(spawnAs('brute', 3)) === 25, 'kill reward: brute = 25');
A(killRewardOf(spawnAs('biter', 3)) === 16, 'kill reward: biter = 16');
resetBoard();

// ================= §25. Snow Pea slow: each type slows AND restores ITS OWN speed =================
for (const typeName of ZTYPE_KEYS) {
  resetBoard();
  const z = spawnAs(typeName, typeName === 'brute' || typeName === 'biter' ? 3 : 1);
  z.row = 2; z.x = 500; z.hp = 1e6; z.maxHp = 1e6;
  state.zombies = [z];
  const baseSpeed = z.speed; // the type+difficulty speed actually spawned
  let x0 = z.x; step(10);
  const dxBase = (x0 - z.x) / 10;
  A(Math.abs(dxBase - baseSpeed) < 0.01,
    `${typeName}: walks at its own base speed (${baseSpeed.toFixed(3)}/frame)`);
  z.slowUntil = nowValue() + BALANCE.SLOW_MS; // exactly what an icePea hit writes
  x0 = z.x; step(10);
  const dxSlow = (x0 - z.x) / 10;
  A(Math.abs(dxSlow - baseSpeed * BALANCE.SLOW_MULT) < 0.01,
    `${typeName}: slowed = own base x ${BALANCE.SLOW_MULT} (measured ${dxSlow.toFixed(3)}/frame)`);
  A(z.speed === baseSpeed, `${typeName}: base speed never mutated by the slow`);
  z.slowUntil = nowValue() + 50; // fast-forward past expiry
  for (let f = 0; f < 200 && nowValue() < z.slowUntil; f++) step(1);
  x0 = z.x; step(10);
  const dxAfter = (x0 - z.x) / 10;
  A(Math.abs(dxAfter - baseSpeed) < 0.01,
    `${typeName}: expiry restores ITS OWN speed (${dxAfter.toFixed(3)}/frame)`);
}
resetBoard();

// ================= §26. Durability & chewing speed =================
const shotsToKill = z => {
  let n = 0;
  while (z.hp > 0 && n < 1000) { z.hp -= BALANCE.PEA_DAMAGE; n++; }
  return n;
};
A(shotsToKill(spawnAs('brute', 3)) > 2 * shotsToKill(spawnAs('normal', 1)),
  'brute needs > 2x the peas of a normal zombie (tank durability)');
A(shotsToKill(spawnAs('sprinter', 1)) < shotsToKill(spawnAs('normal', 1)),
  'sprinter dies to fewer peas than normal (glass cannon)');
const chewLoss = z => {
  resetBoard();
  state.grid[4][2] = createPlant('wallnut', 4, 2, nowValue());
  Object.assign(z, { row: 4, x: (2 + 0.7) * (600 / 9) - 2, eating: false, hp: 1e6 });
  state.zombies = [z];
  const hp0 = state.grid[4][2].hp;
  step(125); // 2 seconds of continuous biting
  return hp0 - state.grid[4][2].hp;
};
const normalLoss = chewLoss(spawnAs('normal', 1));
const biterLoss = chewLoss(spawnAs('biter', 3));
A(normalLoss >= 15 && normalLoss <= 17,
  `normal chews ~16 plant-HP over 2s at 8 dps (measured ${normalLoss})`);
A(biterLoss >= 27 && biterLoss <= 29,
  `biter chews ~28 plant-HP over 2s at 14 dps (measured ${biterLoss})`);
A(biterLoss > 1.5 * normalLoss, 'biter destroys plants meaningfully faster than normal');
resetBoard();

// ================= §27. Home breach: every type => health 1 -> 0 =================
for (const typeName of ZTYPE_KEYS) {
  resetBoard();
  const z = spawnAs(typeName, typeName === 'brute' || typeName === 'biter' ? 3 : 1);
  z.x = BALANCE.HOUSE_X - 1; z.row = 0; z.speed = 0;
  state.zombies = [z];
  step(1);
  A(state.health === 0 && state.gameOver === true,
    `${typeName}: crossing HOUSE_X drains 1 -> 0 and ends the game immediately`);
}
resetBoard();

// ================= §28. Shovel vs new types: eating target removed -> resume =================
// (L4 weights: all three new types are spawnable there; L1 lacks brute/biter.)
for (const typeName of ['brute', 'biter', 'sprinter']) {
  resetBoard();
  state.grid[2][1] = createPlant('wallnut', 2, 1, nowValue());
  const z = spawnAs(typeName, 4);
  Object.assign(z, { row: 2, x: (1 + 0.7) * (600 / 9) - 2, eating: false, hp: 1e6, maxHp: 1e6 });
  state.zombies = [z];
  step(5);
  A(z.eating === true, `${typeName}: stops and eats the wall-nut (shared eating system)`);
  removePlantWithRefund(state, 2, 1); // the shovel's actual removal path
  const xAfter = z.x;
  step(3);
  A(z.eating === false && z.x < xAfter,
    `${typeName}: resumes walking the moment the wall-nut is shoveled`);
}
resetBoard();

console.log(failures.length === 0 ? '\nALL TESTS PASSED' : `\n${failures.length} TEST(S) FAILED`);
process.exit(failures.length === 0 ? 0 : 1);
