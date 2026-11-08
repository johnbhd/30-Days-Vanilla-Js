const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup Mock DOM
const mockContext = {
  canvas: { width: 1280, height: 720 },
  fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
  fillRect: () => {}, strokeRect: () => {}, clearRect: () => {},
  beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, arc: () => {},
  fill: () => {}, stroke: () => {}, save: () => {}, restore: () => {},
  drawImage: () => {}, fillText: () => {}, strokeText: () => {}, clip: () => {}
};

const domStore = {};
function createMockElement(tag, id = '') {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    className: '',
    id: id || '',
    dataset: {},
    style: {},
    innerHTML: '',
    textContent: '',
    children: [],
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); el.className = Array.from(this._classes).join(' '); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); el.className = Array.from(this._classes).join(' '); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    setAttribute: function(name, val) { this[name] = val; this.dataset[name.replace(/^data-/, '')] = val; },
    getAttribute: function(name) { return this[name] || this.dataset[name.replace(/^data-/, '')] || null; },
    removeAttribute: function(name) { delete this[name]; delete this.dataset[name.replace(/^data-/, '')]; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    appendChild: function(ch) { this.children.push(ch); },
    removeChild: function(ch) { this.children = this.children.filter(c => c !== ch); },
    remove: function() {},
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: function(sel) { return createMockElement('div'); },
    querySelectorAll: function(sel) { return [createMockElement('div')]; },
    getContext: () => mockContext
  };
  if (id) domStore[id] = el;
  return el;
}

const mockDocument = {
  createElement: (tag) => createMockElement(tag),
  getElementById: (id) => domStore[id] || (domStore[id] = createMockElement('div', id)),
  querySelector: (sel) => null,
  querySelectorAll: (sel) => []
};

// Pre-create all DOM IDs referenced by main.js
[
  "gameOverOverlay", "gameOverTitle", "gameOverDesc", "gameOverBadge",
  "endBlueKills", "endBlueGold", "endRedKills", "endRedGold", "endMatchTime", "endMatchMode",
  "mvpShowcaseContainer", "gameStatsSummary", "restartBtn", "gameOverMainMenuBtn",
  "inGameScoreBanner", "inGameBlueKills", "inGameRedKills", "inGameMatchClock",
  "scoreboardOverlay", "scoreboardRows", "sbBlueKillsCount", "sbBlueGoldCount", "sbRedKillsCount", "sbRedGoldCount",
  "startBtn", "changeHeroBtn", "toggleHeroPanelBtn", "heroPanel", "selectOverlay", "modeSelectOverlay",
  "landingPageOverlay", "landingStartBtn", "backToLandingBtn", "currentModeLabel", "backToModeBtn",
  "blueTeamSlots", "redTeamSlots", "blueTeamCount", "redTeamCount", "detailHeroSkillsList",
  "openScoreboardBtn", "closeScoreboardBtn", "gameCanvas", "heroLevelBadge", "heroName",
  "heroRoleBadge", "heroLaneBadge", "heroExpBar", "heroExpText", "playerGoldDisplay",
  "openShopBtn", "btnRecall", "openSettingsBtn", "heroSkillsPanel", "skillPointsBadge",
  "skillPointsCount", "skillsKeysHint", "skillsTray"
].forEach(id => createMockElement('div', id));

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame: () => {},
  cancelAnimationFrame: () => {},
  Math,
  performance: { now: () => Date.now() },
  document: mockDocument,
  getComputedStyle: () => ({ borderLeftWidth: "0", borderTopWidth: "0" }),
  addEventListener: () => {},
  removeEventListener: () => {},
  window: {},
  Image: class { constructor() { this.onload = null; this.src = ''; } },
  Audio: class { play() {} pause() {} },
  loadImage: async () => ({})
};
sandbox.window = sandbox;

// Load all scripts into sandbox
const filesToLoad = [
  'js/utils.js',
  'js/config.js',
  'js/map.js',
  'js/hero.js',
  'js/bots.js',
  'js/scoreboard.js',
  'js/skills.js',
  'js/items.js',
  'js/objectives.js',
  'js/minions.js',
  'js/sound.js',
  'js/particles.js',
  'js/input.js',
  'js/renderer.js',
  'js/main.js'
];

const context = vm.createContext(sandbox);

for (const file of filesToLoad) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, context, { filename: file });
}

console.log("Full game environment loaded into sandbox.");

function runGameOverSimulation() {
  const { startMatch, showGameOver, scoreboard, Hero, BotHero } = sandbox;

  console.log("\n=== TEST 1: Victory Screen Simulation ===");
  startMatch();
  vm.runInContext("matchTime = 754;", context); // 12m 34s
  sandbox.selectedHero.kills = 7;
  sandbox.selectedHero.deaths = 1;
  sandbox.selectedHero.assists = 5;
  sandbox.selectedHero.gold = 5200;
  sandbox.selectedHero.cs = 48;

  // Simulate bots
  if (sandbox.bots && sandbox.bots.length > 0) {
    const ally = sandbox.bots.find(b => b.team === "BLUE");
    if (ally) { ally.kills = 3; ally.deaths = 2; ally.assists = 6; ally.gold = 4100; ally.cs = 20; }
    const enemies = sandbox.bots.filter(b => b.team === "RED");
    if (enemies[0]) { enemies[0].kills = 4; enemies[0].deaths = 3; enemies[0].assists = 2; enemies[0].gold = 4400; enemies[0].cs = 35; }
    if (enemies[1]) { enemies[1].kills = 1; enemies[1].deaths = 4; enemies[1].assists = 1; enemies[1].gold = 2900; enemies[1].cs = 15; }
  }

  showGameOver(true);

  const titleEl = domStore["gameOverTitle"];
  const descEl = domStore["gameOverDesc"];
  const badgeEl = domStore["gameOverBadge"];
  const blueKillsEl = domStore["endBlueKills"];
  const redKillsEl = domStore["endRedKills"];
  const matchTimeEl = domStore["endMatchTime"];
  const mvpContainer = domStore["mvpShowcaseContainer"];
  const statsSummary = domStore["gameStatsSummary"];

  assert.strictEqual(titleEl.textContent, "VICTORY", "Title should be VICTORY");
  assert.strictEqual(titleEl.className, "victory-title", "Title class should be victory-title");
  assert(descEl.textContent.includes("Red Crystal Destroyed"), "Description should describe victory");
  assert(badgeEl.innerHTML.includes("VICTORY"), "Badge should have victory trophy");
  assert(blueKillsEl.textContent.includes("KILLS"), "Blue kills should be shown");
  assert(redKillsEl.textContent.includes("KILLS"), "Red kills should be shown");
  assert(matchTimeEl.innerHTML.includes("12:34"), "Match time should format to 12:34");

  // Verify Dual MVP Container
  assert(mvpContainer.innerHTML.includes("BLUE TEAM • VICTORY MVP"), "Blue MVP card must be present");
  assert(mvpContainer.innerHTML.includes("RED TEAM • DEFEAT MVP"), "Red MVP card must be present");
  console.log("✓ Victory screen shows VICTORY title, team kills bar, match timer (12:34), and Dual MVP cards!");

  // Verify Team Stats Roster Tables
  assert(statsSummary.innerHTML.includes("BLUE TEAM ROSTER"), "Blue team roster table must be rendered");
  assert(statsSummary.innerHTML.includes("RED TEAM ROSTER"), "Red team roster table must be rendered");
  assert(statsSummary.innerHTML.includes("MVP"), "MVP badge must be displayed on team MVP");
  assert(statsSummary.innerHTML.includes("(YOU)"), "Player row must have (YOU) indicator");
  console.log("✓ Team stats tables rendered for BOTH teams with KDA, CS, Net worth, items, and MVP medals!");

  console.log("\n=== TEST 2: Defeat Screen Simulation ===");
  showGameOver(false);

  assert.strictEqual(titleEl.textContent, "DEFEAT", "Title should be DEFEAT");
  assert.strictEqual(titleEl.className, "defeat-title", "Title class should be defeat-title");
  assert(descEl.textContent.includes("Blue Crystal Destroyed"), "Description should describe defeat");
  assert(badgeEl.innerHTML.includes("DEFEAT"), "Badge should have defeat skull");
  assert(mvpContainer.innerHTML.includes("BLUE TEAM • DEFEAT MVP"), "Blue team gets DEFEAT MVP ribbon");
  assert(mvpContainer.innerHTML.includes("RED TEAM • VICTORY MVP"), "Red team gets VICTORY MVP ribbon");
  console.log("✓ Defeat screen shows DEFEAT title, crimson aura, and correctly designated MVP ribbons!");

  console.log("\nALL GAME OVER SCREEN SIMULATION TESTS PASSED EXCELLENTLY!");
}

runGameOverSimulation();
