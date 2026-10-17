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
  return {
    dataset: { plant },
    classes,
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
export const slots = [makeSlot('sunflower'), makeSlot('peashooter')];

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
for (let f = 0; f < 3000; f++) {
  step(1);
  const z = state.zombies;
  if (z.length > maxZombies) maxZombies = z.length;
  if (state.peas.length > 0) sawPea = true;
  if (z.length > 0) minZombieHp = Math.min(minZombieHp, z[0].hp);
  if (maxZombies >= 1 && z.length === 0 && state.grid[2][2]) { killObserved = true; break; }
}
A(maxZombies >= 1, 'zombie spawned in wave');
A(sawPea, 'peashooter fired peas');
A(minZombieHp < 100, 'peas damaged the zombie (hp dropped from 100)');
A(killObserved, 'zombie was killed by peashooter');
A(state.sun === sunPrePea - 100 + 10, 'kill reward +10 sun credited (25 + 10 = 35)');

// --- 6. game over: strip defenses, let a zombie reach the house ---
state.grid[2][2] = null;
state.grid[0][0] = null;
state.health = 1;
for (let f = 0; f < 60000 && !state.gameOver; f++) step(1);
A(state.gameOver === true, 'zombie reaching house with health=1 triggers game over');

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

console.log(failures.length === 0 ? '\nALL TESTS PASSED' : `\n${failures.length} TEST(S) FAILED`);
process.exit(failures.length === 0 ? 0 : 1);
