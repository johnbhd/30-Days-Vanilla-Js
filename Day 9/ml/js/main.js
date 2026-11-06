/**
 * Main game loop & orchestration
 * ML Heroes 2D MOBA - Phase 1, 2, 3 & 4
 * Features: 10 Heroes, Minion Waves, Turrets, Skills, Bosses, Item Shop, Bot AI, SFX, Particles, Scoreboard
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const camera = { x: 0, y: 0 };
let map = new GameMap(GAME.MAP.WIDTH, GAME.MAP.HEIGHT, GAME.TILE_SIZE);
const renderer = new Renderer(canvas);
let minionManager = new MinionManager();
let skillManager = new SkillManager();
let objectiveManager = new ObjectiveManager();
let itemShop = new ItemShop();

// Phase 4 Engine Additions
const sound = new SoundEngine();
const particles = new ParticleEngine();
const scoreboard = new Scoreboard();
let enemyBot = null;

// Audio unlock on user interaction
function unlockAudio() {
  sound.ensureContext();
}
window.addEventListener("click", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

let selectedHero = null;
let chosenHeroData = null;
const cameraLerp = 0.1;
let matchTime = 0;
let passiveGoldTimer = 0;
let gameState = "SELECT"; // "SELECT" | "PLAYING" | "GAMEOVER"
const combatTexts = [];

// Match statistics
const gameStats = {
  minionsKilled: 0,
  turretsDestroyed: 0,
  damageDealt: 0,
  gold: 0,
  deaths: 0
};

// UI references
const selectOverlay = document.getElementById("heroSelectOverlay");
const heroGrid = document.getElementById("heroGrid");
const startBtn = document.getElementById("startBtn");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const gameOverTitle = document.getElementById("gameOverTitle");
const gameOverDesc = document.getElementById("gameOverDesc");
const restartBtn = document.getElementById("restartBtn");
const changeHeroBtn = document.getElementById("changeHeroBtn");
const controlsHint = document.getElementById("controlsHint");

// Shop UI references
const shopOverlay = document.getElementById("shopOverlay");
const shopCatalog = document.getElementById("shopCatalog");
const openShopBtn = document.getElementById("openShopBtn");
const closeShopBtn = document.getElementById("closeShopBtn");
const shopGoldText = document.getElementById("shopGoldText");

// Scoreboard UI references
const scoreboardOverlay = document.getElementById("scoreboardOverlay");
const openScoreboardBtn = document.getElementById("openScoreboardBtn");
const closeScoreboardBtn = document.getElementById("closeScoreboardBtn");

// Settings UI references
const settingsOverlay = document.getElementById("settingsOverlay");
const openSettingsBtn = document.getElementById("openSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const soundVolumeSlider = document.getElementById("soundVolumeSlider");
const muteToggleBtn = document.getElementById("muteToggleBtn");
const particleQualitySelect = document.getElementById("particleQualitySelect");

// Initialize input
Input.init(canvas, camera);

// Build hero selection cards
function buildHeroGrid() {
  heroGrid.innerHTML = "";
  HEROES.forEach((hero) => {
    const card = document.createElement("div");
    card.className = "hero-card";
    card.innerHTML = `
      <div class="hero-portrait" style="border-color: ${hero.color};">
        <img src="${hero.sprite}idle.png" alt="${hero.name}" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'font-weight:bold;color:${hero.color}\\'>${hero.name[0]}</span>';" />
      </div>
      <h3>${hero.name}</h3>
      <span class="role">${hero.role}</span>
      <span class="lane">${hero.lane}</span>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".hero-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      chosenHeroData = hero;
      startBtn.disabled = false;
      startBtn.textContent = `Start Match as ${hero.name}`;
      updateHeroUI(hero);
    });

    card.addEventListener("dblclick", () => {
      chosenHeroData = hero;
      startMatch();
    });

    heroGrid.appendChild(card);
  });
}

// Build Item Shop catalog
function buildShopCatalog() {
  if (!shopCatalog) return;
  shopCatalog.innerHTML = "";

  ITEM_CATALOG.forEach(item => {
    const card = document.createElement("div");
    card.className = "shop-card";
    card.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <button class="shop-buy-btn" data-id="${item.id}">${item.cost}g Buy</button>
      </div>
    `;

    const buyBtn = card.querySelector(".shop-buy-btn");
    buyBtn.addEventListener("click", () => {
      if (selectedHero) {
        itemShop.buyItem(item.id, selectedHero, gameStats, combatTexts);
        updateShopState();
      }
    });

    shopCatalog.appendChild(card);
  });
}

function updateShopState() {
  if (shopGoldText) shopGoldText.textContent = `${gameStats.gold}g`;
  itemShop.updateShopUI(gameStats);

  // Update buy buttons enabled/disabled
  if (shopCatalog && typeof shopCatalog.querySelectorAll === "function") {
    const buttons = shopCatalog.querySelectorAll(".shop-buy-btn");
    buttons.forEach(btn => {
      const id = btn.getAttribute("data-id");
      const item = ITEM_CATALOG.find(i => i.id === id);
      if (item) {
        btn.disabled = gameStats.gold < item.cost || itemShop.inventory.length >= itemShop.maxSlots;
      }
    });
  }
}

/**
 * Start the match with the selected hero
 */
function startMatch() {
  if (!chosenHeroData) return;

  selectedHero = new Hero(chosenHeroData);

  // Position hero at their designated lane
  let spawnY = 480;
  if (chosenHeroData.lane && chosenHeroData.lane.includes("Gold")) spawnY = 240;
  else if (chosenHeroData.lane && chosenHeroData.lane.includes("EXP")) spawnY = 720;

  selectedHero.x = 100;
  selectedHero.y = spawnY;
  selectedHero.targetX = 100;
  selectedHero.targetY = spawnY;

  // Spawn Enemy Bot from non-chosen hero pool matching the lane
  const availableBotHeroes = HEROES.filter(h => h.id !== chosenHeroData.id);
  const botData = availableBotHeroes[Math.floor(Math.random() * availableBotHeroes.length)] || HEROES[1];
  enemyBot = new BotHero(botData, chosenHeroData.lane || "MID");

  selectOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  gameState = "PLAYING";

  // Update abilities dock with hero's kit
  updateAbilitiesDock(chosenHeroData.id);
  updateHeroUI(chosenHeroData);
  updateHeroProgressionUI(selectedHero, skillManager);
  updateShopState();

  scoreboard.stats.player.gold = gameStats.gold;

  controlsHint.innerHTML = `
    <p><strong>Click</strong> move/attack | <strong>Q, W, E, R</strong> skills</p>
    <p><strong>B</strong> recall | <strong>P</strong> shop | <strong>TAB</strong> scoreboard</p>
  `;

  // Snap camera
  camera.x = clamp(selectedHero.x - GAME.CANVAS_WIDTH / 2, 0, map.width * map.tileSize - GAME.CANVAS_WIDTH);
  camera.y = clamp(selectedHero.y - GAME.CANVAS_HEIGHT / 2, 0, map.height * map.tileSize - GAME.CANVAS_HEIGHT);
}

function updateAbilitiesDock(heroId) {
  const skills = skillManager.getSkillsForHero(heroId);
  ["q", "w", "e", "r"].forEach(slot => {
    const nameEl = document.getElementById(`nameSkill${slot.toUpperCase()}`);
    const btnEl = document.getElementById(`btnSkill${slot.toUpperCase()}`);
    if (skills[slot]) {
      if (nameEl) {
        nameEl.textContent = skills[slot].name;
      }
      if (btnEl) {
        btnEl.title = `${skills[slot].name} (${slot.toUpperCase()}) - ${skills[slot].desc || ''}`;
      }
    }
  });
}

function triggerSkill(slot) {
  if (gameState !== "PLAYING" || !selectedHero) return;
  if (selectedHero.stunTimer > 0) return;

  if (selectedHero.isRecalling) {
    selectedHero.cancelRecall(combatTexts);
  }

  const targetX = Input.mouseX + camera.x;
  const targetY = Input.mouseY + camera.y;

  const castSuccess = skillManager.castSkill(
    slot,
    selectedHero,
    targetX,
    targetY,
    map,
    minionManager.minions,
    objectiveManager,
    combatTexts,
    gameStats,
    enemyBot,
    sound,
    particles
  );

  if (castSuccess) {
    sound.playSkill(slot);
    particles.spawnRing(selectedHero.x, selectedHero.y, slot === "r" ? 75 : 45, "#4ecca3", 0.4);
    particles.spawnBurst(selectedHero.x, selectedHero.y, "#ffd700", 8, 100);
  }
}

function resetGame() {
  map = new GameMap(GAME.MAP.WIDTH, GAME.MAP.HEIGHT, GAME.TILE_SIZE);
  minionManager = new MinionManager();
  skillManager = new SkillManager();
  objectiveManager = new ObjectiveManager();
  itemShop = new ItemShop();
  enemyBot = null;
  scoreboard.stats = {
    player: { kills: 0, deaths: 0, assists: 0, cs: 0, gold: 0, damageDealt: 0 },
    bot: { kills: 0, deaths: 0, assists: 0, cs: 0, gold: 0, damageDealt: 0 },
    blueTurretsDestroyed: 0,
    redTurretsDestroyed: 0,
    turtlesTaken: 0,
    lordsTaken: 0
  };

  combatTexts.length = 0;
  matchTime = 0;
  passiveGoldTimer = 0;
  gameStats.minionsKilled = 0;
  gameStats.turretsDestroyed = 0;
  gameStats.damageDealt = 0;
  gameStats.gold = 0;
  gameStats.deaths = 0;
  gameState = "PLAYING";

  gameOverOverlay.classList.add("hidden");
  if (chosenHeroData) {
    startMatch();
  } else {
    selectOverlay.classList.remove("hidden");
    gameState = "SELECT";
  }
}

function showGameOver(isVictory) {
  gameState = "GAMEOVER";
  gameOverTitle.textContent = isVictory ? "VICTORY" : "DEFEAT";
  gameOverTitle.className = isVictory ? "victory-title" : "defeat-title";
  gameOverDesc.textContent = isVictory
    ? "Red Crystal Destroyed! You have conquered the Land of Dawn!"
    : "Blue Crystal Destroyed! Your base has fallen.";

  sound.playAnnouncer(isVictory ? "victory" : "defeat");

  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60).toString().padStart(2, "0");

  const statsEl = document.getElementById("gameStatsSummary");
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-item"><span class="stat-label">Match Time</span><span class="stat-val">${minutes}:${seconds}</span></div>
      <div class="stat-item"><span class="stat-label">K / D / A</span><span class="stat-val">${scoreboard.stats.player.kills} / ${scoreboard.stats.player.deaths} / ${scoreboard.stats.player.assists}</span></div>
      <div class="stat-item"><span class="stat-label">Minions Slayed (CS)</span><span class="stat-val">${scoreboard.stats.player.cs || gameStats.minionsKilled}</span></div>
      <div class="stat-item"><span class="stat-label">Turrets Destroyed</span><span class="stat-val">${gameStats.turretsDestroyed}</span></div>
      <div class="stat-item"><span class="stat-label">Damage Dealt</span><span class="stat-val">${Math.round(gameStats.damageDealt)}</span></div>
      <div class="stat-item"><span class="stat-label">Gold Earned</span><span class="stat-val">${gameStats.gold}g</span></div>
    `;
  }
  gameOverOverlay.classList.remove("hidden");
}

// UI Event Listeners
startBtn.addEventListener("click", startMatch);

if (restartBtn) {
  restartBtn.addEventListener("click", () => resetGame());
}

if (changeHeroBtn) {
  changeHeroBtn.addEventListener("click", () => {
    gameState = "SELECT";
    selectOverlay.classList.remove("hidden");
  });
}

// Shop toggle buttons
if (openShopBtn) {
  openShopBtn.addEventListener("click", () => {
    shopOverlay.classList.remove("hidden");
    updateShopState();
  });
}

if (closeShopBtn) {
  closeShopBtn.addEventListener("click", () => {
    shopOverlay.classList.add("hidden");
  });
}

// Scoreboard toggle buttons
if (openScoreboardBtn) {
  openScoreboardBtn.addEventListener("click", () => scoreboard.toggle());
}
if (closeScoreboardBtn) {
  closeScoreboardBtn.addEventListener("click", () => scoreboard.hide());
}

// Settings modal buttons & controls
if (openSettingsBtn) {
  openSettingsBtn.addEventListener("click", () => {
    if (settingsOverlay) settingsOverlay.classList.remove("hidden");
  });
}
if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener("click", () => {
    if (settingsOverlay) settingsOverlay.classList.add("hidden");
  });
}
if (soundVolumeSlider) {
  soundVolumeSlider.addEventListener("input", (e) => {
    sound.setVolume(Number(e.target.value) / 100);
  });
}
if (muteToggleBtn) {
  muteToggleBtn.addEventListener("click", () => {
    const isMuted = sound.toggleMute();
    muteToggleBtn.innerHTML = isMuted
      ? '<i class="fa-solid fa-volume-xmark"></i> Unmute'
      : '<i class="fa-solid fa-volume-high"></i> Mute';
    muteToggleBtn.classList.toggle("muted", isMuted);
  });
}
if (particleQualitySelect) {
  particleQualitySelect.addEventListener("change", (e) => {
    particles.setQuality(e.target.value);
  });
}

// Click inventory slot to sell item
for (let i = 0; i < 6; i++) {
  const slotEl = document.getElementById(`invSlot${i}`);
  if (slotEl) {
    slotEl.addEventListener("click", () => {
      if (selectedHero) {
        itemShop.sellItem(i, selectedHero, gameStats);
        updateShopState();
      }
    });
  }
}

// Ability dock button click events
const recallBtn = document.getElementById("btnRecall");
if (recallBtn) {
  recallBtn.addEventListener("click", () => {
    if (selectedHero && selectedHero.stunTimer <= 0) selectedHero.startRecall(combatTexts, sound);
  });
}

["q", "w", "e", "r"].forEach(slot => {
  const btn = document.getElementById(`btnSkill${slot.toUpperCase()}`);
  if (btn) {
    btn.addEventListener("click", () => triggerSkill(slot));
  }
  const upBtn = document.getElementById(`upBtn${slot.toUpperCase()}`);
  if (upBtn) {
    upBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedHero) {
        skillManager.upgradeSkill(slot, selectedHero, combatTexts, sound);
      }
    });
  }
});

// Keyboard controls
window.addEventListener("keydown", (e) => {
  if (gameState !== "PLAYING") return;

  if (e.code === "Tab") {
    e.preventDefault();
    scoreboard.toggle();
    return;
  }

  // Prevent skill casts and recall while hero is stunned
  if (selectedHero && selectedHero.stunTimer > 0) {
    if (["KeyQ", "KeyW", "KeyE", "KeyR", "KeyB"].includes(e.code)) return;
  }

  if (e.code === "KeyQ") triggerSkill("q");
  else if (e.code === "KeyW") triggerSkill("w");
  else if (e.code === "KeyE") triggerSkill("e");
  else if (e.code === "KeyR") triggerSkill("r");
  else if (e.code === "KeyB") {
    if (selectedHero && selectedHero.stunTimer <= 0) selectedHero.startRecall(combatTexts, sound);
  } else if (e.code === "KeyP") {
    if (shopOverlay.classList.contains("hidden")) {
      shopOverlay.classList.remove("hidden");
      updateShopState();
    } else {
      shopOverlay.classList.add("hidden");
    }
  } else if (e.code === "Escape") {
    shopOverlay.classList.add("hidden");
    if (scoreboardOverlay) scoreboardOverlay.classList.add("hidden");
    if (settingsOverlay) settingsOverlay.classList.add("hidden");
  }
});

function getRoleIcon(role) {
  if (role.includes("Marksman")) return '<i class="fa-solid fa-crosshairs" style="color:#f1c40f"></i>';
  if (role.includes("Tank")) return '<i class="fa-solid fa-shield" style="color:#3498db"></i>';
  if (role.includes("Support")) return '<i class="fa-solid fa-heart" style="color:#f39c12"></i>';
  if (role.includes("Fighter")) return '<i class="fa-solid fa-fist-raised" style="color:#e67e22"></i>';
  if (role.includes("Assassin")) return '<i class="fa-solid fa-bolt" style="color:#e74c3c"></i>';
  if (role.includes("Mage")) return '<i class="fa-solid fa-wand-magic-sparkles" style="color:#9b59b6"></i>';
  return '<i class="fa-solid fa-user"></i>';
}

function updateHeroUI(hero) {
  const nameEl = document.getElementById("heroName");
  const roleEl = document.getElementById("heroRoleBadge");
  const laneEl = document.getElementById("heroLaneBadge");

  if (nameEl) nameEl.textContent = hero.name;
  if (roleEl) roleEl.innerHTML = `${getRoleIcon(hero.role)} ${hero.role}`;
  if (laneEl) laneEl.innerHTML = `<i class="fa-solid fa-route" style="color:#4ecca3"></i> ${hero.lane}`;
}

function updateHeroProgressionUI(hero, skillMgr) {
  if (!hero) return;

  // Level Badge & EXP Bar in Hero Card
  const lvlBadge = document.getElementById("heroLevelBadge");
  const expBar = document.getElementById("heroExpBar");
  const expText = document.getElementById("heroExpText");

  if (lvlBadge) lvlBadge.textContent = hero.level || 1;

  if (expBar && expText) {
    const maxLvl = (typeof GAME !== "undefined" && GAME.MAX_HERO_LEVEL) ? GAME.MAX_HERO_LEVEL : 15;
    if (hero.level >= maxLvl) {
      expBar.style.width = "100%";
      expText.textContent = "MAX LEVEL";
    } else {
      const pct = Math.max(0, Math.min(100, (hero.exp / hero.maxExp) * 100));
      expBar.style.width = `${pct}%`;
      expText.textContent = `EXP ${hero.exp} / ${hero.maxExp}`;
    }
  }

  // Skill Points Badge in Abilities Header
  const ptsBadge = document.getElementById("skillPointsBadge");
  const ptsCount = document.getElementById("skillPointsCount");
  const keysHint = document.getElementById("skillsKeysHint");

  if (ptsBadge && ptsCount) {
    if (hero.skillPoints > 0) {
      ptsBadge.classList.remove("hidden");
      ptsCount.textContent = hero.skillPoints;
      if (keysHint) keysHint.classList.add("hidden");
    } else {
      ptsBadge.classList.add("hidden");
      if (keysHint) keysHint.classList.remove("hidden");
    }
  }

  // Upgrade Buttons (+), Rank Pips & Locked states for Q, W, E, R
  ["q", "w", "e", "r"].forEach(slot => {
    const upBtn = document.getElementById(`upBtn${slot.toUpperCase()}`);
    const btnEl = document.getElementById(`btnSkill${slot.toUpperCase()}`);
    const pipsContainer = document.getElementById(`pipsSkill${slot.toUpperCase()}`);
    const rank = hero.skillLevels ? (hero.skillLevels[slot] || 0) : 1;

    // Rank pips update
    if (pipsContainer) {
      const pips = pipsContainer.querySelectorAll(".rank-pip");
      pips.forEach((pip, idx) => {
        if (idx < rank) {
          pip.classList.add("active");
        } else {
          pip.classList.remove("active");
        }
      });
    }

    // Locked state: if rank is 0, skill cannot be cast yet
    if (btnEl) {
      if (rank === 0) {
        btnEl.classList.add("skill-locked");
      } else {
        btnEl.classList.remove("skill-locked");
      }
    }

    // Eligibility to upgrade
    if (upBtn) {
      let canUpgrade = false;
      if (hero.skillPoints > 0) {
        if (slot === "r") {
          const reqLevel = rank === 0 ? 4 : (rank === 1 ? 8 : 12);
          canUpgrade = rank < 3 && hero.level >= reqLevel;
        } else {
          canUpgrade = rank < 5;
        }
      }

      if (canUpgrade) {
        upBtn.classList.remove("hidden");
      } else {
        upBtn.classList.add("hidden");
      }
    }
  });
}

// Main game loop
let lastTime = performance.now();

function loop(currentTime) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (gameState === "PLAYING") {
    matchTime += dt;

    // 0. Update Particles
    particles.update(dt);

    // 0b. Passive Gold Income: +10 gold every 3.0s for Player & Bot
    passiveGoldTimer += dt;
    if (passiveGoldTimer >= 3.0) {
      passiveGoldTimer -= 3.0;
      gameStats.gold += 10;
      if (scoreboard) scoreboard.addGold("player", 10);
      if (enemyBot) {
        enemyBot.gold += 10;
        if (scoreboard) scoreboard.addGold("bot", 10);
      }
    }

    // 1. Hero Input & Update
    if (selectedHero) {
      if (Input.targetX !== null && Input.targetY !== null) {
        if (selectedHero.stunTimer <= 0) {
          selectedHero.setTarget(Input.targetX, Input.targetY, map, minionManager.minions, objectiveManager, enemyBot);
        }
        if (!Input.isDragging) {
          Input.targetX = null;
          Input.targetY = null;
        }
      }
      selectedHero.update(map, dt, minionManager.minions, combatTexts, gameStats, skillManager, itemShop, objectiveManager, enemyBot, sound, particles, scoreboard);

      // Camera follow hero
      camera.x += (selectedHero.x - GAME.CANVAS_WIDTH / 2 - camera.x) * cameraLerp;
      camera.y += (selectedHero.y - GAME.CANVAS_HEIGHT / 2 - camera.y) * cameraLerp;

      camera.x = clamp(camera.x, 0, map.width * map.tileSize - GAME.CANVAS_WIDTH);
      camera.y = clamp(camera.y, 0, map.height * map.tileSize - GAME.CANVAS_HEIGHT);
    }

    // 1b. Enemy Bot Hero update
    if (enemyBot) {
      enemyBot.update(dt, selectedHero, minionManager, map, combatTexts, sound, particles, scoreboard, objectiveManager);
    }

    // 2. Minions update (targeting both Player & Enemy Bot)
    minionManager.update(dt, map, selectedHero, combatTexts, gameStats, enemyBot, sound, particles, scoreboard, objectiveManager);

    // 3. Skills update
    skillManager.update(dt, selectedHero, map, minionManager.minions, objectiveManager, combatTexts, gameStats, enemyBot, scoreboard, sound, particles);

    // 4. Boss Objectives update (Turtle & Lord)
    objectiveManager.update(dt, selectedHero, map, minionManager.minions, combatTexts, gameStats, skillManager, scoreboard, enemyBot, sound, particles);

    // 5. Turrets, Base Crystal & projectiles update (targeting both Player & Enemy Bot)
    map.updateCombat(dt, selectedHero, minionManager.minions, combatTexts, gameStats, enemyBot, sound, particles, scoreboard, objectiveManager);

    // 6. Update Ability Cooldown & Recall UI Overlays
    const recallBtnEl = document.getElementById("btnRecall");
    if (recallBtnEl && selectedHero) {
      if (selectedHero.isRecalling) {
        recallBtnEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${selectedHero.recallTimer.toFixed(1)}s`;
        recallBtnEl.classList.add("channeling");
      } else {
        recallBtnEl.innerHTML = `<i class="fa-solid fa-house"></i> Recall`;
        recallBtnEl.classList.remove("channeling");
      }
    }

    ["q", "w", "e", "r"].forEach(slot => {
      const overlayEl = document.getElementById(`cdOverlay${slot.toUpperCase()}`);
      const btnEl = document.getElementById(`btnSkill${slot.toUpperCase()}`);
      if (overlayEl && btnEl) {
        const cd = skillManager.cooldowns[slot];
        if (cd > 0) {
          overlayEl.classList.remove("hidden");
          overlayEl.textContent = cd.toFixed(1);
          btnEl.classList.add("cooling-down");
        } else {
          overlayEl.classList.add("hidden");
          btnEl.classList.remove("cooling-down");
        }
      }
    });

    // 6b. Update Hero Progression & Skill Upgrades UI
    updateHeroProgressionUI(selectedHero, skillManager);

    // 7. Update Gold and Shop HUD
    itemShop.updateShopUI(gameStats);

    // 7b. Update Scoreboard if visible
    if (scoreboard.visible) {
      scoreboard.updateUI(selectedHero, enemyBot, itemShop);
    }

    // 8. Combat floating texts update
    for (let i = combatTexts.length - 1; i >= 0; i--) {
      const ct = combatTexts[i];
      ct.y -= 25 * dt; // float upwards
      ct.life -= dt;
      if (ct.life <= 0) combatTexts.splice(i, 1);
    }

    // 9. Win / Loss Condition
    const blueBase = map.bases.find(b => b.team === "BLUE");
    const redBase = map.bases.find(b => b.team === "RED");

    if (redBase && redBase.crystalHp <= 0) {
      showGameOver(true);
    } else if (blueBase && blueBase.crystalHp <= 0) {
      showGameOver(false);
    }
  }

  // Render
  renderer.clear();
  renderer.renderMap(map, camera);
  renderer.renderObjectives(objectiveManager, camera);
  renderer.renderMinions(minionManager, camera);
  renderer.renderSkills(skillManager, camera);

  if (enemyBot) {
    renderer.renderBot(enemyBot, camera);
  }

  if (selectedHero) {
    renderer.renderHero(selectedHero, camera, skillManager);
    const blueBase = map.bases.find(b => b.team === "BLUE");
    const redBase = map.bases.find(b => b.team === "RED");
    renderer.renderUI(selectedHero, matchTime, minionManager.waveCount, blueBase, redBase, gameStats, enemyBot);
  }

  renderer.renderParticles(particles, camera);
  renderer.renderCombatTexts(combatTexts, camera);

  requestAnimationFrame(loop);
}

// Start
buildHeroGrid();
buildShopCatalog();
requestAnimationFrame(loop);
