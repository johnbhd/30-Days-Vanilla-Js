// Headless functional test for the modular plants_zombie game (native ES modules).
// Run:  node tests/pvz-test.mjs            (procedural fallback drawing)
//       SPRITE_STUB=1 node tests/pvz-test.mjs   (sprite drawing path)
//
// Strategy: install DOM/canvas/performance stubs on globalThis, then import the
// real modules. main.js does NOT auto-start (guarded by `typeof window`), so the
// test steps update()/draw() explicitly — deterministic and loop-free.

let now = 0;

// --- Stub 2D context: every method no-ops and returns a self-stub so chained
//     calls like createLinearGradient().addColorStop() work; props settable ---
const ctx2d = new Proxy(function () {}, {
  get: () => ctx2d,
  set: () => true,
  apply: () => ctx2d,
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

// --- globalThis stubs (installed BEFORE importing the modules) ---
Object.defineProperty(globalThis, 'performance', {
  value: { now: () => now },
  configurable: true, writable: true,
});
globalThis.requestAnimationFrame = () => 1; // captured, never loops in tests
globalThis.document = {
  getElementById: id => elements[id],
  querySelectorAll: sel => (sel === '.plant-slot' ? slots : []),
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

export function step(n) {
  for (let i = 0; i < n; i++) { now += 16; update(now); draw(); }
}
export { canvas, cellX, cellY, clickCanvas, game };
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
const { PLANT_TYPES } = await import(new URL('../js/config.js', import.meta.url).href);
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

console.log(failures.length === 0 ? '\nALL TESTS PASSED' : `\n${failures.length} TEST(S) FAILED`);
process.exit(failures.length === 0 ? 0 : 1);
