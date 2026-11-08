const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// 1. Setup Mock DOM and Context
const mockContext = {
  canvas: { width: 1280, height: 720 },
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  fillRect: () => {},
  strokeRect: () => {},
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  save: () => {},
  restore: () => {},
  drawImage: () => {},
  fillText: () => {},
  strokeText: () => {},
  clip: () => {}
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
    appendChild: function(ch) { this.children.push(ch); },
    removeChild: function(ch) { this.children = this.children.filter(c => c !== ch); },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getContext: () => mockContext
  };
  if (id) domStore[id] = el;
  return el;
}

const mockDocument = {
  createElement: (tag) => createMockElement(tag),
  getElementById: (id) => domStore[id] || (domStore[id] = createMockElement('div', id)),
  querySelector: () => null,
  querySelectorAll: () => []
};

// Create required DOM elements
[
  "gameOverOverlay", "gameOverTitle", "gameOverDesc", "gameOverBadge",
  "endBlueKills", "endBlueGold", "endRedKills", "endRedGold", "endMatchTime", "endMatchMode",
  "mvpShowcaseContainer", "gameStatsSummary", "restartBtn", "gameOverMainMenuBtn",
  "inGameScoreBanner", "inGameBlueKills", "inGameRedKills", "inGameMatchClock",
  "scoreboardOverlay", "scoreboardRows", "sbBlueKillsCount", "sbBlueGoldCount", "sbRedKillsCount", "sbRedGoldCount"
].forEach(id => createMockElement('div', id));

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  performance: { now: () => Date.now() },
  document: mockDocument,
  window: {},
  Image: class {
    constructor() { this.onload = null; this.src = ''; }
  },
  Audio: class { play() {} pause() {} },
  loadImage: async () => ({})
};
sandbox.window = sandbox;

// Load game files into VM context
const filesToLoad = [
  'js/config.js',
  'js/map.js',
  'js/hero.js',
  'js/bots.js',
  'js/scoreboard.js'
];

for (const file of filesToLoad) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInNewContext(code, sandbox, { filename: file });
}

console.log("Game scripts loaded into sandbox successfully.");

function runTests() {
  const { Hero, BotHero, Scoreboard, GAME } = sandbox;

  console.log("\n=== TEST 1: Team Scoring for Kills & Gold Tracking ===");
  const sb = new Scoreboard();
  assert.strictEqual(sb.teamScores.blue, 0, "Initial blue team kills must be 0");
  assert.strictEqual(sb.teamScores.red, 0, "Initial red team kills must be 0");

  sb.recordTeamKill("BLUE");
  sb.recordTeamKill("BLUE");
  sb.recordTeamKill("RED");
  assert.strictEqual(sb.teamScores.blue, 2, "Blue team kills should be 2");
  assert.strictEqual(sb.teamScores.red, 1, "Red team kills should be 1");
  console.log("✓ Live recordTeamKill successfully tracks team kill scores (Blue: 2, Red: 1)");

  // Player & Bots Setup
  const player = new Hero({
    id: "miya",
    name: "Miya",
    role: "Marksman",
    stats: { hp: 2400, atk: 120, spd: 4 }
  });
  player.kills = 3;
  player.deaths = 1;
  player.assists = 4;
  player.gold = 3500;
  player.cs = 30;

  const blueBot = new BotHero({
    id: "tigreal",
    name: "Tigreal",
    role: "Tank",
    stats: { hp: 3200, atk: 85, spd: 3.5 }
  }, "TOP", "BLUE");
  blueBot.kills = 1;
  blueBot.deaths = 2;
  blueBot.assists = 6;
  blueBot.gold = 2800;
  blueBot.cs = 12;

  const redBot1 = new BotHero({
    id: "balmond",
    name: "Balmond",
    role: "Fighter",
    stats: { hp: 3000, atk: 110, spd: 3.8 }
  }, "TOP", "RED");
  redBot1.kills = 4;
  redBot1.deaths = 2;
  redBot1.assists = 1;
  redBot1.gold = 3200;
  redBot1.cs = 25;

  const redBot2 = new BotHero({
    id: "layla",
    name: "Layla",
    role: "Marksman",
    stats: { hp: 2000, atk: 130, spd: 3.8 }
  }, "BOT", "RED");
  redBot2.kills = 1;
  redBot2.deaths = 3;
  redBot2.assists = 2;
  redBot2.gold = 2600;
  redBot2.cs = 18;

  const allBots = [blueBot, redBot1, redBot2];

  const totalBlueKills = sb.getTeamKills("BLUE", player, allBots);
  const totalRedKills = sb.getTeamKills("RED", player, allBots);
  const totalBlueGold = sb.getTeamGold("BLUE", player, allBots);
  const totalRedGold = sb.getTeamGold("RED", player, allBots);

  assert.strictEqual(totalBlueKills, 4, "Total Blue Kills should be 3 (player) + 1 (ally bot) = 4");
  assert.strictEqual(totalRedKills, 5, "Total Red Kills should be 4 + 1 = 5");
  assert.strictEqual(totalBlueGold, 6300, "Total Blue Gold should be 3500 + 2800 = 6300");
  assert.strictEqual(totalRedGold, 5800, "Total Red Gold should be 3200 + 2600 = 5800");
  console.log(`✓ Team scoring aggregation verified: Blue Kills: ${totalBlueKills}, Red Kills: ${totalRedKills}, Blue Gold: ${totalBlueGold}g, Red Gold: ${totalRedGold}g`);

  console.log("\n=== TEST 2: MVP Rating Calculation & Dual MVP Selection ===");
  const playerRating = sb.calculateHeroRating(player);
  const blueBotRating = sb.calculateHeroRating(blueBot);
  const redBot1Rating = sb.calculateHeroRating(redBot1);
  const redBot2Rating = sb.calculateHeroRating(redBot2);

  assert(playerRating > blueBotRating, `Player rating (${playerRating}) should be higher than blue bot (${blueBotRating})`);
  assert(redBot1Rating > redBot2Rating, `Red Bot 1 rating (${redBot1Rating}) should be higher than Red Bot 2 (${redBot2Rating})`);
  console.log(`✓ Hero ratings calculated: Miya: ${playerRating}, Tigreal: ${blueBotRating}, Balmond: ${redBot1Rating}, Layla: ${redBot2Rating}`);

  const mvpResults = sb.determineTeamMVPs(player, allBots, { inventory: [] });
  assert(mvpResults.blueMVP, "Blue team must have an MVP");
  assert(mvpResults.redMVP, "Red team must have an MVP");
  assert.strictEqual(mvpResults.blueMVP.name, "Miya", "Blue MVP should be Miya (highest rating on Blue)");
  assert.strictEqual(mvpResults.blueMVP.isMvp, true, "Blue MVP isMvp flag should be true");
  assert.strictEqual(mvpResults.redMVP.name, "Balmond", "Red MVP should be Balmond (highest rating on Red)");
  assert.strictEqual(mvpResults.redMVP.isMvp, true, "Red MVP isMvp flag should be true");
  console.log(`✓ Dual MVPs determined successfully: Blue MVP: ${mvpResults.blueMVP.name} (${mvpResults.blueMVP.rating}), Red MVP: ${mvpResults.redMVP.name} (${mvpResults.redMVP.rating})`);

  console.log("\n=== TEST 3: Combat Assist Tracking on Death ===");
  const targetEnemy = new BotHero({
    id: "saber",
    name: "Saber",
    role: "Assassin",
    stats: { hp: 1000, atk: 120 }
  }, "MID", "RED");

  // Player and Blue ally both damage the enemy
  targetEnemy.takeDamage(400, player, [], null, null, sb);
  targetEnemy.takeDamage(300, blueBot, [], null, null, sb);

  // Player lands the killing blow
  const prevPlayerKills = player.kills;
  const prevAllyAssists = blueBot.assists;
  targetEnemy.takeDamage(400, player, [], null, null, sb);

  assert(targetEnemy.isDead, "Target enemy should be slain");
  assert.strictEqual(player.kills, prevPlayerKills + 1, "Player should be credited with the kill");
  assert.strictEqual(blueBot.assists, prevAllyAssists + 1, "Blue ally who assisted within 10s should get +1 assist");
  console.log("✓ Kill credited to Player (+1 kill) and assist correctly credited to Blue ally (+1 assist)");

  console.log("\n=== TEST 4: Live TAB Scoreboard UI Updates ===");
  sb.updateUI(player, allBots, { inventory: [] });
  const sbBlueKillsEl = domStore["sbBlueKillsCount"];
  const sbRedKillsEl = domStore["sbRedKillsCount"];
  assert(sbBlueKillsEl && sbBlueKillsEl.textContent.includes("KILLS"), "Scoreboard blue kills header updated");
  assert(sbRedKillsEl && sbRedKillsEl.textContent.includes("KILLS"), "Scoreboard red kills header updated");
  console.log(`✓ Scoreboard modal UI header: Blue: '${sbBlueKillsEl.textContent}', Red: '${sbRedKillsEl.textContent}'`);

  console.log("\nALL TEAM SCORING & MVP TESTS PASSED EXCELLENTLY!");
}

runTests();
