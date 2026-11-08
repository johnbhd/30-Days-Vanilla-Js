const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// 1. Setup Browser / Canvas Environment Mocks
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

const mockCanvas = {
  width: 1280,
  height: 720,
  getContext: () => mockContext
};

const domStore = {};
const mockDocument = {
  createElement: (tag) => {
    return {
      tagName: tag.toUpperCase(),
      className: '',
      id: '',
      dataset: {},
      style: {},
      innerHTML: '',
      textContent: '',
      children: [],
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      appendChild: function(ch) { this.children.push(ch); },
      removeChild: function(ch) { this.children = this.children.filter(c => c !== ch); },
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      getContext: () => mockContext
    };
  },
  getElementById: (id) => domStore[id] || (domStore[id] = mockDocument.createElement('div')),
  querySelector: () => null,
  querySelectorAll: () => []
};

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
    constructor() {
      this.onload = null;
      this.src = '';
    }
  },
  Audio: class {
    play() {}
    pause() {}
  },
  loadImage: async () => ({})
};
sandbox.window = sandbox;

// Load game files into VM context
const filesToLoad = [
  'js/config.js',
  'js/map.js',
  'js/hero.js',
  'js/bots.js'
];

for (const file of filesToLoad) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInNewContext(code, sandbox, { filename: file });
}

console.log("Game scripts loaded into sandbox successfully.");

// 2. Test Cases
function runTests() {
  const { GameMap, Hero, BotHero, GAME, MAP_TILES } = sandbox;

  // TEST 1: Land of Dawn Base Centers
  console.log("\n--- TEST 1: Base Centers on Land of Dawn Map ---");
  const lodMap = new GameMap("LAND_OF_DAWN");
  const blueBaseLod = lodMap.bases.find(b => b.team === "BLUE");
  const redBaseLod = lodMap.bases.find(b => b.team === "RED");

  assert(blueBaseLod, "Blue base must exist on Land of Dawn");
  assert(redBaseLod, "Red base must exist on Land of Dawn");
  assert.strictEqual(blueBaseLod.worldX, 140, "Blue base worldX on Land of Dawn should be 140");
  assert.strictEqual(blueBaseLod.worldY, 660, "Blue base worldY on Land of Dawn should be 660");
  assert.strictEqual(redBaseLod.worldX, 1620, "Red base worldX on Land of Dawn should be 1620");
  assert.strictEqual(redBaseLod.worldY, 660, "Red base worldY on Land of Dawn should be 660");
  console.log("✓ Land of Dawn bases are correctly located at (140, 660) and (1620, 660)");

  // TEST 2: Compact Map Base Centers
  console.log("\n--- TEST 2: Base Centers on Compact Map ---");
  const compactMap = new GameMap("COMPACT");
  const blueBaseCompact = compactMap.bases.find(b => b.team === "BLUE");
  const redBaseCompact = compactMap.bases.find(b => b.team === "RED");

  assert(blueBaseCompact, "Blue base must exist on Compact map");
  assert(redBaseCompact, "Red base must exist on Compact map");
  assert.strictEqual(blueBaseCompact.worldX, 100, "Blue base worldX on Compact map should be 100");
  assert.strictEqual(blueBaseCompact.worldY, 500, "Blue base worldY on Compact map should be 500");
  assert.strictEqual(redBaseCompact.worldX, 1220, "Red base worldX on Compact map should be 1220");
  assert.strictEqual(redBaseCompact.worldY, 500, "Red base worldY on Compact map should be 500");
  console.log("✓ Compact map bases are correctly located at (100, 500) and (1220, 500)");

  const mockParticles = {
    spawnRing: () => {},
    spawnBurst: () => {},
    spawnTrail: () => {},
    spawnSlash: () => {}
  };
  const mockSound = {
    playRecall: () => {},
    playTeleport: () => {},
    playHit: () => {},
    playShoot: () => {},
    playSlash: () => {},
    playAttack: () => {},
    playSkill: () => {},
    playHeal: () => {}
  };

  // TEST 3: Player Hero Recall Teleport to Base Center
  console.log("\n--- TEST 3: Player Hero Recall Teleports to Base Center ---");
  const playerHeroData = {
    id: "miya",
    name: "Miya",
    role: "Marksman",
    stats: { hp: 2000, spd: 4, atk: 120, range: 200 }
  };
  const player = new Hero(playerHeroData);
  player.x = 880;
  player.y = 660;
  player.isRecalling = true;
  player.recallTimer = 0.05; // Almost finished recall
  sandbox.window.map = lodMap;

  // Advance time to complete recall
  player.update(lodMap, 0.1, [], [], {}, {}, {}, {}, null, mockSound, mockParticles, {});
  assert.strictEqual(player.isRecalling, false, "Recall should finish");
  assert.strictEqual(player.x, blueBaseLod.worldX, "Player should teleport to Blue base center worldX (140)");
  assert.strictEqual(player.y, blueBaseLod.worldY, "Player should teleport to Blue base center worldY (660)");
  console.log(`✓ Player recalled to Land of Dawn base center: (${player.x}, ${player.y})`);

  // Test player recall on Compact map
  player.x = 600;
  player.y = 500;
  player.isRecalling = true;
  player.recallTimer = 0.05;
  sandbox.window.map = compactMap;
  player.update(compactMap, 0.1, [], [], {}, {}, {}, {}, null, mockSound, mockParticles, {});
  assert.strictEqual(player.x, blueBaseCompact.worldX, "Player should teleport to Blue base center worldX on Compact (100)");
  assert.strictEqual(player.y, blueBaseCompact.worldY, "Player should teleport to Blue base center worldY on Compact (500)");
  console.log(`✓ Player recalled to Compact base center: (${player.x}, ${player.y})`);

  // TEST 4: Bot Recall Teleport to Base Center
  console.log("\n--- TEST 4: Bot Hero Recall Teleports to Base Center ---");
  const redBotData = {
    id: "layla",
    name: "Layla",
    role: "Marksman",
    stats: { hp: 2200, spd: 3.8, atk: 110, range: 220 }
  };
  const redBot = new BotHero(redBotData, "MID", "RED", "LAND_OF_DAWN");
  redBot.x = 880;
  redBot.y = 640;
  redBot.isRecalling = true;
  redBot.recallTimer = 0.05;

  redBot.update(0.1, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);
  assert.strictEqual(redBot.isRecalling, false, "Bot recall should finish");
  assert.strictEqual(redBot.x, redBaseLod.worldX, "Red Bot should teleport to Red base center worldX (1620)");
  assert.strictEqual(redBot.y, redBaseLod.worldY, "Red Bot should teleport to Red base center worldY (660)");
  console.log(`✓ Red bot recalled to Land of Dawn base center: (${redBot.x}, ${redBot.y})`);

  // TEST 5: Bot Low-Health Recall When Far from Base
  console.log("\n--- TEST 5: Bot Channels Recall When Low Health and Far from Base ---");
  redBot.x = 880;
  redBot.y = 640;
  redBot.hp = Math.round(redBot.maxHp * 0.25); // 25% HP (< 35%)
  redBot.recallCooldown = 0;
  redBot.recentDamageTimer = 0;
  redBot.isRecalling = false;

  // Position player far away (> 500px) so bot is safe
  player.x = 140;
  player.y = 660;

  redBot.update(0.1, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);
  assert.strictEqual(redBot.isRecalling, true, "Bot must channel recall when low HP, far from base, and safe");
  assert(redBot.recallTimer > 1.8, "Recall timer should be active (~2.0s)");
  assert.strictEqual(redBot.targetX, redBot.x, "Bot must stand still while channeling recall");
  assert.strictEqual(redBot.targetY, redBot.y, "Bot must stand still while channeling recall");
  console.log("✓ Bot correctly began channeling recall while safe and stationary");

  // TEST 6: Bot Interrupted by Attack -> "Go Away A Little"
  console.log("\n--- TEST 6: Bot Hit While Recalling -> Disengages / Goes Away A Little ---");
  const combatTexts = [];
  redBot.takeDamage(100, player, combatTexts, mockParticles, mockSound, null);

  assert.strictEqual(redBot.isRecalling, false, "Taking damage must interrupt recall");
  assert.strictEqual(redBot.recallCooldown, 1.0, "Recall cooldown on interrupt should be short (1.0s)");
  assert.strictEqual(redBot.recentDamageTimer, 1.2, "Recent damage timer should be 1.2s");
  assert.strictEqual(redBot.state, "RETREAT", "Bot state must switch to RETREAT");
  console.log(`✓ Recall interrupted! Recall cooldown is ${redBot.recallCooldown}s, damage timer is ${redBot.recentDamageTimer}s`);

  // Next frame: Bot is under threat / damage, so it retreats towards friendly base (away from threat)
  // Player is at x=800, y=640 (close to bot at 880)
  player.x = 800;
  player.y = 640;
  const prevX = redBot.x;
  redBot.update(0.1, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);

  // Red bot should move East towards friendly base (x > prevX)
  assert.strictEqual(redBot.isRecalling, false, "Bot should not recall while under threat/recent damage");
  assert(redBot.x >= prevX, "Red bot should move towards safety (East) away from enemy");
  console.log(`✓ Bot is running away towards friendly base: x moved from ${prevX} to ${redBot.x}`);

  // TEST 7: Pursued ("If still attack then just run")
  console.log("\n--- TEST 7: If Pursued / Still Attacked, Bot Keeps Running ---");
  for (let step = 0; step < 5; step++) {
    // Player keeps chasing and hitting bot
    player.x = redBot.x - 100;
    player.y = redBot.y;
    redBot.takeDamage(20, player, [], mockParticles, mockSound, null);
    const startX = redBot.x;
    redBot.update(0.1, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);
    assert.strictEqual(redBot.isRecalling, false, `Step ${step}: Bot must not stop to recall while actively attacked`);
    assert(redBot.x >= startX, `Step ${step}: Bot must keep running towards safety`);
  }
  console.log("✓ Bot successfully kept running without stopping while under active pursuit");

  // TEST 8: Safe -> "When Safe Recall"
  console.log("\n--- TEST 8: When Safe -> Bot Stops and Channels Recall ---");
  // Player stops chasing and walks away far
  player.x = 200;
  player.y = 200;

  // Let 1.3 seconds elapse with no attacks so recentDamageTimer and recallCooldown clear
  redBot.update(0.5, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);
  redBot.update(0.5, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);
  redBot.update(0.3, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);

  assert.strictEqual(redBot.isRecalling, true, "Once safe, bot must stop and channel recall!");
  console.log("✓ Bot successfully stopped running and began channeling recall as soon as it was safe!");

  // Complete the recall
  redBot.update(redBot.recallTimer + 0.1, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [redBot], null);
  assert.strictEqual(redBot.x, redBaseLod.worldX, "Bot should be at red base center after recall completes");
  assert.strictEqual(redBot.y, redBaseLod.worldY, "Bot should be at red base center after recall completes");
  console.log(`✓ Recalled bot teleported into base fountain center (${redBot.x}, ${redBot.y})`);

  // TEST 9: Bot Low Health Close to Base Walks In
  console.log("\n--- TEST 9: Bot Low Health Close to Base Walks Directly In ---");
  const nearBot = new BotHero(redBotData, "MID", "RED", "LAND_OF_DAWN");
  nearBot.x = redBaseLod.worldX - 150; // 150px away from base (< 260px)
  nearBot.y = redBaseLod.worldY;
  nearBot.hp = Math.round(nearBot.maxHp * 0.2);
  nearBot.isRecalling = false;

  nearBot.update(0.1, player, { minions: [] }, lodMap, [], mockSound, mockParticles, null, null, [nearBot], null);
  assert.strictEqual(nearBot.isRecalling, false, "Bot close to base should not channel recall; it walks into base");
  assert.strictEqual(nearBot.targetX, redBaseLod.worldX, "Target should be base center");
  assert.strictEqual(nearBot.targetY, redBaseLod.worldY, "Target should be base center");
  console.log("✓ Bot close to base heads directly to base fountain instead of channeling recall");

  console.log("\nALL 9 TESTS PASSED EXCELLENTLY!");
}

runTests();
