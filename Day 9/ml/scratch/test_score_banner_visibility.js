const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// 1. Verify index.html markup
const html = fs.readFileSync('index.html', 'utf8');
assert(
  html.includes('id="inGameScoreBanner"') && html.includes('class="in-game-score-banner hidden"'),
  "index.html must have #inGameScoreBanner with 'hidden' class by default"
);
console.log("✓ index.html: inGameScoreBanner starts with 'hidden' class");

// 2. Verify css/style.css
const css = fs.readFileSync('css/style.css', 'utf8');
assert(
  css.includes('.in-game-score-banner {') && css.includes('position: absolute;'),
  "style.css: .in-game-score-banner must use position: absolute (contained in game-wrapper, not fixed to viewport)"
);
assert(
  css.includes('.in-game-score-banner.hidden {') && css.includes('display: none !important;'),
  "style.css: .in-game-score-banner.hidden must have display: none !important"
);
console.log("✓ css/style.css: in-game-score-banner is position: absolute and has display: none !important when hidden");

// 3. Setup sandbox DOM environment for full lifecycle navigation testing
const domStore = {};

function createMockElement(id, tagName = 'div') {
  const classList = new Set();
  const listeners = {};
  const attrs = {};

  const el = {
    id,
    tagName: tagName.toUpperCase(),
    textContent: '',
    innerHTML: '',
    style: {},
    scrollTop: 0,
    disabled: false,
    classList: {
      add: (cls) => classList.add(cls),
      remove: (cls) => classList.delete(cls),
      toggle: (cls, force) => {
        if (force === undefined) {
          if (classList.has(cls)) classList.delete(cls);
          else classList.add(cls);
        } else if (force) {
          classList.add(cls);
        } else {
          classList.delete(cls);
        }
      },
      contains: (cls) => classList.has(cls)
    },
    addEventListener: (evt, cb) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(cb);
    },
    removeEventListener: (evt, cb) => {
      if (!listeners[evt]) return;
      listeners[evt] = listeners[evt].filter(f => f !== cb);
    },
    click: () => {
      if (listeners['click']) listeners['click'].forEach(cb => cb({ target: el }));
    },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => attrs[k] || null,
    removeAttribute: (k) => { delete attrs[k]; },
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: (selector) => {
      if (selector === '.mode-card') return modeCards;
      return [];
    },
    querySelector: (sel) => createMockElement(`dyn_${sel}`),
    getContext: () => ({
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      measureText: () => ({ width: 10 }),
      drawImage: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {}
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 })
  };

  domStore[id] = el;
  return el;
}

const modeCards = [
  createMockElement('mode_1v1'),
  createMockElement('mode_2v2'),
  createMockElement('mode_3v3'),
  createMockElement('mode_4v4'),
  createMockElement('mode_5v5')
];
modeCards[0].setAttribute('data-mode', '1v1');
modeCards[1].setAttribute('data-mode', '2v2');
modeCards[2].setAttribute('data-mode', '3v3');
modeCards[3].setAttribute('data-mode', '4v4');
modeCards[4].setAttribute('data-mode', '5v5');

// Pre-populate element IDs
const elementIds = [
  'gameCanvas', 'landingPageOverlay', 'landingStartBtn', 'backToLandingBtn',
  'modeSelectOverlay', 'currentModeLabel', 'backToModeBtn', 'blueTeamSlots', 'redTeamSlots',
  'blueTeamCount', 'redTeamCount', 'heroSelectOverlay', 'heroGrid', 'startBtn',
  'gameOverOverlay', 'gameOverTitle', 'gameOverDesc', 'gameOverBadge', 'restartBtn',
  'changeHeroBtn', 'gameOverMainMenuBtn', 'controlsHint', 'shopOverlay', 'shopCatalog',
  'openShopBtn', 'closeShopBtn', 'shopGoldText', 'scoreboardOverlay', 'openScoreboardBtn',
  'closeScoreboardBtn', 'settingsOverlay', 'openSettingsBtn', 'closeSettingsBtn',
  'soundVolumeSlider', 'muteToggleBtn', 'heroDetailOverlay', 'closeHeroDetailBtn',
  'footerCloseHeroDetailBtn', 'detailHeroAvatar', 'detailHeroAvatarWrap', 'detailHeroName',
  'detailHeroTitle', 'detailHeroRole', 'detailHeroLane', 'detailHeroDesc', 'detailHeroStatsChips',
  'detailHeroSkillList', 'detailHeroPassiveName', 'detailHeroPassiveDesc',
  'inGameScoreBanner', 'inGameBlueKills', 'inGameRedKills', 'inGameMatchClock',
  'endBlueKills', 'endBlueGold', 'endRedKills', 'endRedGold', 'endMatchTime', 'endMatchMode',
  'mvpShowcaseContainer', 'gameStatsSummary', 'scoreboardRows', 'sbBlueKillsCount',
  'sbBlueGoldCount', 'sbRedKillsCount', 'sbRedGoldCount'
];

elementIds.forEach(id => createMockElement(id));

// Set inGameScoreBanner initial class to 'hidden'
domStore['inGameScoreBanner'].classList.add('hidden');

const sandbox = {
  document: {
    getElementById: (id) => domStore[id] || createMockElement(id),
    querySelectorAll: (sel) => {
      if (sel === '.mode-card') return modeCards;
      if (sel === '.hero-role-tab') return [];
      return [];
    },
    querySelector: () => null,
    createElement: (tag) => createMockElement(`dyn_${Math.random()}`, tag)
  },
  window: {
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener: () => {},
    removeEventListener: () => {},
    getComputedStyle: () => ({ display: 'block' })
  },
  console,
  setTimeout: () => 1,
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  performance: { now: () => 1000 },
  Audio: class {
    play() { return Promise.resolve(); }
    pause() {}
    cloneNode() { return new sandbox.Audio(); }
  },
  Image: class {
    constructor() {
      this.src = '';
      this.complete = true;
      this.naturalWidth = 100;
      this.naturalHeight = 100;
    }
  }
};

const context = vm.createContext(sandbox);

const filesToLoad = [
  'js/config.js',
  'js/utils.js',
  'js/input.js',
  'js/map.js',
  'js/sound.js',
  'js/particles.js',
  'js/scoreboard.js',
  'js/skills.js',
  'js/objectives.js',
  'js/items.js',
  'js/hero.js',
  'js/bots.js',
  'js/minions.js',
  'js/renderer.js',
  'js/main.js'
];

for (const file of filesToLoad) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, context, { filename: file });
}

console.log("Full game environment loaded into sandbox.");

// ==================== LIFECYCLE TESTS ====================

const bannerEl = domStore['inGameScoreBanner'];
const landingStartBtn = domStore['landingStartBtn'];
const backToLandingBtn = domStore['backToLandingBtn'];
const backToModeBtn = domStore['backToModeBtn'];
const changeHeroBtn = domStore['changeHeroBtn'];
const gameOverMainMenuBtn = domStore['gameOverMainMenuBtn'];

console.log("\n--- TEST 1: Initial State (First Page / Landing Page) ---");
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN on first page (landing page)");
console.log("✓ PASS: Team score banner is HIDDEN on first page.");

console.log("\n--- TEST 2: Navigating to Select Match Format Screen ---");
landingStartBtn.click();
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN on match format selection screen");
console.log("✓ PASS: Team score banner is HIDDEN on match format selection screen.");

console.log("\n--- TEST 3: Navigating Back to Landing Page ---");
backToLandingBtn.click();
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN when returning to landing page");
console.log("✓ PASS: Team score banner is HIDDEN on landing page.");

console.log("\n--- TEST 4: Navigating to Choose Hero Screen ---");
landingStartBtn.click(); // go to format select
modeCards[2].click(); // click 3v3 format -> goes to hero select
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN on choose hero screen");
console.log("✓ PASS: Team score banner is HIDDEN on choose hero screen.");

console.log("\n--- TEST 5: Navigating Back to Match Format from Choose Hero ---");
backToModeBtn.click();
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN on match format screen");
console.log("✓ PASS: Team score banner is HIDDEN when backing to match format.");

console.log("\n--- TEST 6: Starting Match -> In Game Screen ---");
modeCards[2].click(); // back to hero select
sandbox.startMatch(); // player starts match
assert(!bannerEl.classList.contains('hidden'), "Team scoring banner must be VISIBLE ONLY in-game (gameState === 'PLAYING')");
console.log("✓ PASS: Team score banner is VISIBLE in active game!");

console.log("\n--- TEST 7: Changing Hero From In-Game -> Choose Hero Screen ---");
changeHeroBtn.click(); // switches from in-game to choose hero
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN when switching to choose hero screen");
console.log("✓ PASS: Team score banner is HIDDEN when returning to choose hero.");

console.log("\n--- TEST 8: Resuming / Starting Match Again ---");
sandbox.startMatch();
assert(!bannerEl.classList.contains('hidden'), "Team scoring banner must be VISIBLE again when resuming match");
console.log("✓ PASS: Team score banner is VISIBLE in active match.");

console.log("\n--- TEST 9: Match Ends -> Game Over Screen ---");
sandbox.showGameOver(true);
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN during Game Over summary screen");
console.log("✓ PASS: Team score banner is HIDDEN on game over modal.");

console.log("\n--- TEST 10: Clicking Main Menu from Game Over ---");
gameOverMainMenuBtn.click();
assert(bannerEl.classList.contains('hidden'), "Team scoring banner must be HIDDEN on landing page from game over");
console.log("✓ PASS: Team score banner is HIDDEN after clicking main menu.");

console.log("\nALL TEAM SCORING VISIBILITY TESTS PASSED EXCELLENTLY!");
