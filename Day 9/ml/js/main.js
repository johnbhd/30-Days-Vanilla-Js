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
let matchMode = "3v3"; // "1v1" | "2v2" | "3v3"
let bots = []; // Array of BotHero instances (Blue Allies + Red Enemies)
let teamRoster = { blue: [], red: [] };
let activeSlot = { team: "blue", index: 0 }; // Currently active slot for hero assignment ({ team: 'blue'|'red', index: number })
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
let gameState = "MODE_SELECT"; // "MODE_SELECT" | "SELECT" | "PLAYING" | "GAMEOVER"
const combatTexts = [];

// Match statistics
const gameStats = {
  minionsKilled: 0,
  turretsDestroyed: 0,
  damageDealt: 0,
  gold: 0,
  deaths: 0
};

// Mode & Hero Select UI references
const modeSelectOverlay = document.getElementById("modeSelectOverlay");
const currentModeLabel = document.getElementById("currentModeLabel");
const backToModeBtn = document.getElementById("backToModeBtn");
const blueTeamSlots = document.getElementById("blueTeamSlots");
const redTeamSlots = document.getElementById("redTeamSlots");
const blueTeamCount = document.getElementById("blueTeamCount");
const redTeamCount = document.getElementById("redTeamCount");

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

// Cached Ability & Recall DOM elements for 60 FPS performance
const recallBtnEl = document.getElementById("btnRecall");
const cdOverlayEls = {
  q: document.getElementById("cdOverlayQ"),
  w: document.getElementById("cdOverlayW"),
  e: document.getElementById("cdOverlayE"),
  r: document.getElementById("cdOverlayR")
};
const skillBtnEls = {
  q: document.getElementById("btnSkillQ"),
  w: document.getElementById("btnSkillW"),
  e: document.getElementById("btnSkillE"),
  r: document.getElementById("btnSkillR")
};
const muteToggleBtn = document.getElementById("muteToggleBtn");
const particleQualitySelect = document.getElementById("particleQualitySelect");

// Initialize input
Input.init(canvas, camera);
Input.onTap = (worldX, worldY) => {
  if (armedSkillSlot) {
    const slotToCast = armedSkillSlot;
    disarmSkill(false);
    triggerSkill(slotToCast, worldX, worldY);
    return true; // Intercepted: do not walk to point
  }
  return false;
};

// Slot Selection & Hero Assignment Helpers
function getActiveSlotMember() {
  const list = activeSlot.team === "blue" ? teamRoster.blue : teamRoster.red;
  if (!list || !list[activeSlot.index]) {
    activeSlot = { team: "blue", index: 0 };
  }
  return (activeSlot.team === "blue" ? teamRoster.blue : teamRoster.red)[activeSlot.index];
}

function updateActiveSlotPrompt() {
  const targetNameEl = document.getElementById("activeSlotTargetName");
  if (!targetNameEl) return;

  const member = getActiveSlotMember();
  if (!member) return;

  if (activeSlot.team === "blue") {
    if (member.isPlayer) {
      targetNameEl.innerHTML = `<span style="color:#ffd700"><i class="fa-solid fa-user"></i> YOU (Player) - ${member.lane} Lane</span>`;
    } else {
      targetNameEl.innerHTML = `<span style="color:#4ecca3"><i class="fa-solid fa-shield"></i> Blue Ally ${activeSlot.index} (${member.hero.name}) - ${member.lane} Lane</span>`;
    }
  } else {
    targetNameEl.innerHTML = `<span style="color:#ff6b6b"><i class="fa-solid fa-skull"></i> Red Enemy ${activeSlot.index + 1} (${member.hero.name}) - ${member.lane} Lane</span>`;
  }
}

function getHeroAssignment(heroId) {
  if (!teamRoster) return null;
  const blueList = teamRoster.blue || [];
  for (let i = 0; i < blueList.length; i++) {
    if (blueList[i].hero && blueList[i].hero.id === heroId) {
      return { team: "blue", index: i, member: blueList[i] };
    }
  }
  const redList = teamRoster.red || [];
  for (let i = 0; i < redList.length; i++) {
    if (redList[i].hero && redList[i].hero.id === heroId) {
      return { team: "red", index: i, member: redList[i] };
    }
  }
  return null;
}

function updateHeroGridSelection() {
  if (!heroGrid) return;
  const cards = heroGrid.querySelectorAll(".hero-card");
  const activeMember = getActiveSlotMember();
  const activeHeroId = activeMember && activeMember.hero ? activeMember.hero.id : null;

  cards.forEach(card => {
    const heroId = card.getAttribute("data-hero-id");
    const isSelected = heroId === activeHeroId;
    card.classList.toggle("selected", isSelected);

    // Update or create pick badge
    let badge = card.querySelector(".hero-card-pick-badge");
    const assignment = getHeroAssignment(heroId);

    if (assignment) {
      if (!badge) {
        badge = document.createElement("span");
        card.appendChild(badge);
      }
      badge.className = "hero-card-pick-badge";
      if (assignment.team === "blue" && assignment.index === 0) {
        badge.classList.add("player-pick");
        badge.innerHTML = `<i class="fa-solid fa-user"></i> YOU`;
      } else if (assignment.team === "blue") {
        badge.classList.add("blue-pick");
        badge.innerHTML = `<i class="fa-solid fa-shield"></i> ALLY ${assignment.index}`;
      } else {
        badge.classList.add("red-pick");
        badge.innerHTML = `<i class="fa-solid fa-skull"></i> ENEMY ${assignment.index + 1}`;
      }
    } else if (badge) {
      badge.remove();
    }
  });
}

function assignHeroToActiveSlot(hero) {
  const activeMember = getActiveSlotMember();
  if (!activeMember) return;

  if (activeMember.hero && activeMember.hero.id === hero.id) {
    return; // Already selected for this slot
  }

  // Check if another slot in the match already has this hero
  const existingOwner = getHeroAssignment(hero.id);
  if (existingOwner) {
    // Swap heroes between active slot and existing owner slot
    const previousHero = activeMember.hero;
    activeMember.hero = hero;
    existingOwner.member.hero = previousHero;
  } else {
    // Assign directly
    activeMember.hero = hero;
  }

  // Sync player hero and UI if player slot was changed or affected
  const playerMember = teamRoster.blue && teamRoster.blue[0];
  if (playerMember && playerMember.hero) {
    chosenHeroData = playerMember.hero;
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = `Start Match as ${chosenHeroData.name}`;
    }
    updateHeroUI(chosenHeroData);
    updateAbilitiesDock(chosenHeroData.id);
  }

  renderTeamLineupsUI();
  updateHeroGridSelection();
  updateActiveSlotPrompt();

  if (sound && sound.playClick) sound.playClick();
}

// Build hero selection cards
function buildHeroGrid() {
  if (!heroGrid) return;
  heroGrid.innerHTML = "";
  HEROES.forEach((hero) => {
    const card = document.createElement("div");
    card.className = "hero-card";
    card.setAttribute("data-hero-id", hero.id);
    card.innerHTML = `
      <div class="hero-portrait" style="border-color: ${hero.color};">
        <img src="${hero.sprite}idle.png" alt="${hero.name}" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'font-weight:bold;color:${hero.color}\\'>${hero.name[0]}</span>';" />
      </div>
      <h3>${hero.name}</h3>
      <span class="role">${hero.role}</span>
      <span class="lane">${hero.lane}</span>
    `;

    card.addEventListener("click", () => {
      assignHeroToActiveSlot(hero);

      // On mobile or smaller viewports, smoothly ensure start button is visible
      if (window.innerWidth <= 768 || window.innerHeight <= 600) {
        startBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    card.addEventListener("dblclick", () => {
      assignHeroToActiveSlot(hero);
      if (activeSlot.team === "blue" && activeSlot.index === 0) {
        startMatch();
      }
    });

    heroGrid.appendChild(card);
  });

  updateHeroGridSelection();
  updateActiveSlotPrompt();
}

// 2-Column Team Matchup Generator & UI Preview
function generateTeamRosters(playerHero = null) {
  const chosen = playerHero || chosenHeroData || HEROES[0];
  const allOtherHeroes = HEROES.filter(h => h.id !== chosen.id);

  // Determine Player preferred lane
  let playerLane = "MID";
  if (chosen.lane) {
    if (chosen.lane.includes("Gold")) playerLane = "TOP";
    else if (chosen.lane.includes("EXP")) playerLane = "BOT";
    else playerLane = "MID";
  }

  // Pool of available bot heroes
  const available = [...allOtherHeroes];

  function pickHero(preferredLanes = [], preferredRoles = []) {
    let bestIdx = available.findIndex(h => {
      const laneMatch = preferredLanes.length === 0 || preferredLanes.some(l => h.lane && h.lane.toLowerCase().includes(l.toLowerCase()));
      const roleMatch = preferredRoles.length === 0 || preferredRoles.some(r => h.role && h.role.toLowerCase().includes(r.toLowerCase()));
      return laneMatch && roleMatch;
    });
    if (bestIdx === -1) {
      bestIdx = available.findIndex(h => {
        return preferredLanes.length === 0 || preferredLanes.some(l => h.lane && h.lane.toLowerCase().includes(l.toLowerCase()));
      });
    }
    if (bestIdx === -1 && available.length > 0) {
      bestIdx = 0;
    }
    if (bestIdx !== -1) {
      return available.splice(bestIdx, 1)[0];
    }
    return HEROES[1];
  }

  teamRoster = { blue: [], red: [] };

  if (matchMode === "1v1") {
    // 1v1 Format: 1 Blue (Player) vs 1 Red Enemy Bot in MID
    teamRoster.blue.push({
      hero: chosen,
      lane: "MID",
      isPlayer: true
    });

    const enemyHero = pickHero(["Mid"], ["Mage", "Assassin", "Fighter"]);
    teamRoster.red.push({
      hero: enemyHero,
      lane: "MID",
      isPlayer: false
    });
  } else if (matchMode === "2v2") {
    // 2v2 Format: 2 Blue (Player + Ally Bot) vs 2 Red Enemy Bots
    let allyLane = "TOP";
    if (playerLane === "TOP") {
      allyLane = "BOT";
    } else if (playerLane === "BOT") {
      allyLane = "TOP";
    } else {
      playerLane = "MID";
      allyLane = "TOP";
    }

    teamRoster.blue.push({
      hero: chosen,
      lane: playerLane,
      isPlayer: true
    });

    const allyHero = pickHero(allyLane === "TOP" ? ["Gold", "Jungle"] : ["EXP", "Roam"], ["Marksman", "Tank", "Fighter"]);
    teamRoster.blue.push({
      hero: allyHero,
      lane: allyLane,
      isPlayer: false
    });

    const redHero1 = pickHero(playerLane === "TOP" ? ["Gold"] : (playerLane === "BOT" ? ["EXP"] : ["Mid"]));
    teamRoster.red.push({
      hero: redHero1,
      lane: playerLane,
      isPlayer: false
    });

    const redHero2 = pickHero(allyLane === "TOP" ? ["Gold", "Jungle"] : ["EXP", "Roam"]);
    teamRoster.red.push({
      hero: redHero2,
      lane: allyLane,
      isPlayer: false
    });
  } else {
    // 3v3 Format: Full 3-Lane Classic MOBA (TOP, MID, BOT)
    const lanes = ["TOP", "MID", "BOT"];
    const remainingBlueLanes = lanes.filter(l => l !== playerLane);

    teamRoster.blue.push({
      hero: chosen,
      lane: playerLane,
      isPlayer: true
    });

    remainingBlueLanes.forEach(lane => {
      const prefLane = lane === "TOP" ? ["Gold"] : (lane === "BOT" ? ["EXP"] : ["Mid", "Roam"]);
      const prefRole = lane === "TOP" ? ["Marksman", "Assassin"] : (lane === "BOT" ? ["Fighter", "Tank"] : ["Mage", "Support"]);
      const ally = pickHero(prefLane, prefRole);
      teamRoster.blue.push({
        hero: ally,
        lane: lane,
        isPlayer: false
      });
    });

    // Red Team: 3 heroes matching TOP, MID, BOT
    lanes.forEach(lane => {
      const prefLane = lane === "TOP" ? ["Gold"] : (lane === "BOT" ? ["EXP"] : ["Mid", "Roam"]);
      const prefRole = lane === "TOP" ? ["Marksman", "Assassin"] : (lane === "BOT" ? ["Fighter", "Tank"] : ["Mage", "Support"]);
      const enemy = pickHero(prefLane, prefRole);
      teamRoster.red.push({
        hero: enemy,
        lane: lane,
        isPlayer: false
      });
    });
  }

  // Ensure chosenHeroData matches player
  chosenHeroData = teamRoster.blue[0].hero;
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = `Start Match as ${chosenHeroData.name}`;
  }
  updateHeroUI(chosenHeroData);
}

function renderTeamSlotHtml(member, team, index) {
  const isPlayer = member.isPlayer;
  const hero = member.hero;
  const lane = member.lane;
  const teamLower = team.toLowerCase();
  const isActive = activeSlot.team === teamLower && activeSlot.index === index;

  let slotClass = "team-slot";
  if (isPlayer) slotClass += " player-slot";
  if (isActive) slotClass += " active-slot";

  const badgeClass = isPlayer ? "player-badge" : "bot-badge";
  const badgeText = isPlayer ? '<i class="fa-solid fa-user"></i> YOU' : (team === "BLUE" ? '<i class="fa-solid fa-shield"></i> ALLY' : '<i class="fa-solid fa-robot"></i> BOT');
  const avatarBorder = team === "BLUE" ? (isPlayer ? "#ffd700" : "#4ecca3") : "#e74c3c";

  const statusIndicator = isActive
    ? `<div class="slot-active-tag"><i class="fa-solid fa-pen-nib"></i> EDITING</div>`
    : `<div class="slot-edit-hint"><i class="fa-solid fa-arrow-pointer"></i> Change</div>`;

  return `
    <div class="${slotClass}" data-team="${teamLower}" data-index="${index}" title="Click to select hero for this slot">
      <div class="team-slot-avatar" style="border-color: ${avatarBorder};">
        <img src="${hero.sprite}idle.png" alt="${hero.name}" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'font-weight:bold;color:${hero.color || '#fff'}\\'>${hero.name[0]}</span>';" />
      </div>
      <div class="team-slot-meta">
        <div class="team-slot-name-row">
          <span class="team-slot-name">${hero.name}</span>
          <span class="${badgeClass}">${badgeText}</span>
        </div>
        <div class="team-slot-sub">
          <span class="team-slot-role">${hero.role}</span>
          <span class="slot-lane"><i class="fa-solid fa-route"></i> ${lane}</span>
        </div>
      </div>
      ${statusIndicator}
    </div>
  `;
}

function renderTeamLineupsUI() {
  if (blueTeamCount) blueTeamCount.textContent = `${teamRoster.blue.length} Hero${teamRoster.blue.length > 1 ? 'es' : ''}`;
  if (redTeamCount) redTeamCount.textContent = `${teamRoster.red.length} Hero${teamRoster.red.length > 1 ? 'es' : ''}`;
  if (currentModeLabel) {
    const modeName = matchMode === "1v1" ? "1v1 Solo Duel" : (matchMode === "2v2" ? "2v2 Skirmish" : "3v3 Classic MOBA");
    currentModeLabel.textContent = modeName;
  }

  if (blueTeamSlots) {
    blueTeamSlots.innerHTML = teamRoster.blue.map((m, idx) => renderTeamSlotHtml(m, "BLUE", idx)).join("");
  }
  if (redTeamSlots) {
    redTeamSlots.innerHTML = teamRoster.red.map((m, idx) => renderTeamSlotHtml(m, "RED", idx)).join("");
  }

  // Attach slot click events
  const allSlots = document.querySelectorAll(".team-slot");
  allSlots.forEach(slotEl => {
    slotEl.addEventListener("click", () => {
      const t = slotEl.getAttribute("data-team");
      const idx = parseInt(slotEl.getAttribute("data-index"), 10);
      if (t && !isNaN(idx)) {
        activeSlot = { team: t, index: idx };
        renderTeamLineupsUI();
        updateHeroGridSelection();
        updateActiveSlotPrompt();
      }
    });
  });
}

function selectMatchMode(mode) {
  matchMode = mode;
  activeSlot = { team: "blue", index: 0 };
  document.querySelectorAll(".mode-card").forEach(c => {
    c.classList.toggle("selected", c.getAttribute("data-mode") === mode);
  });
  generateTeamRosters(chosenHeroData || HEROES[0]);
  renderTeamLineupsUI();
  updateHeroGridSelection();
  updateActiveSlotPrompt();

  if (modeSelectOverlay) modeSelectOverlay.classList.add("hidden");
  if (selectOverlay) {
    selectOverlay.classList.remove("hidden");
    selectOverlay.scrollTop = 0;
  }
}

// Mode Selection Event Listeners
const modeCards = document.querySelectorAll(".mode-card");
modeCards.forEach(card => {
  card.addEventListener("click", () => {
    const mode = card.getAttribute("data-mode");
    selectMatchMode(mode);
  });
});

if (backToModeBtn) {
  backToModeBtn.addEventListener("click", () => {
    if (selectOverlay) selectOverlay.classList.add("hidden");
    if (modeSelectOverlay) {
      modeSelectOverlay.classList.remove("hidden");
      modeSelectOverlay.scrollTop = 0;
    }
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
        const success = itemShop.buyItem(item.id, selectedHero, gameStats, combatTexts);
        if (success) {
          if (sound && sound.playBuyItem) sound.playBuyItem();
          else if (sound && sound.playCoin) sound.playCoin();
          showToast(`Purchased <strong>${item.name}</strong> <span class="game-toast-gold">(-${item.cost}g)</span>`, item.icon, "#4ecca3");
        }
        updateShopState();
      }
    });

    shopCatalog.appendChild(card);
  });
}

function showToast(message, iconHtml = null, borderColor = "#4ecca3") {
  const container = document.getElementById("gameToastContainer");
  if (!container || typeof document.createElement !== "function") return;

  const toast = document.createElement("div");
  toast.className = "game-toast";
  if (borderColor) {
    toast.style.borderColor = borderColor;
  }

  const iconPart = iconHtml ? `<span class="game-toast-icon">${iconHtml}</span>` : `<span class="game-toast-icon" style="color:${borderColor}"><i class="fa-solid fa-circle-check"></i></span>`;
  toast.innerHTML = `${iconPart}<span class="game-toast-text">${message}</span>`;

  container.appendChild(toast);

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  } else {
    toast.classList.add("show");
  }

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("fade-out");
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 320);
  }, 2400);
}

function sellInventoryItem(slotIndex) {
  if (!selectedHero) return;
  const itemToSell = itemShop.inventory[slotIndex];
  if (!itemToSell) return;

  const refund = Math.floor(itemToSell.cost * 0.50);
  const success = itemShop.sellItem(slotIndex, selectedHero, gameStats, combatTexts);
  if (success) {
    if (sound && sound.playSellItem) sound.playSellItem();
    else if (sound && sound.playCoin) sound.playCoin();
    showToast(`Sold <strong>${itemToSell.name}</strong> <span class="game-toast-gold">(+${refund}g)</span> <span style="font-size:0.75rem;color:#e74c3c">(-50%)</span>`, itemToSell.icon, "#ffd700");
    updateShopState();
  }
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
  // Ensure team rosters exist
  if (!teamRoster || !teamRoster.blue || teamRoster.blue.length === 0) {
    generateTeamRosters(chosenHeroData || HEROES[0]);
  }

  // Ensure chosenHeroData matches the player's slot (teamRoster.blue[0])
  if (teamRoster.blue[0] && teamRoster.blue[0].hero) {
    chosenHeroData = teamRoster.blue[0].hero;
  } else if (!chosenHeroData) {
    chosenHeroData = HEROES[0];
  }

  // Preserve progression when changing hero mid-match (player, ally bots, enemy bots)
  const prevHeroLevel = (selectedHero && selectedHero.level > 1) ? selectedHero.level : 1;
  const prevHeroExp = (selectedHero && selectedHero.exp) ? selectedHero.exp : 0;
  const prevHeroSkillLevels = (selectedHero && selectedHero.skillLevels) ? JSON.parse(JSON.stringify(selectedHero.skillLevels)) : null;
  const prevHeroSkillPoints = selectedHero ? selectedHero.skillPoints : 1;
  const prevHeroHpRatio = (selectedHero && selectedHero.maxHp > 0) ? (selectedHero.hp / selectedHero.maxHp) : 1;

  // Bot states mapped by team and index
  const prevBlueBotStates = [];
  const prevRedBotStates = [];
  if (Array.isArray(bots) && bots.length > 0) {
    bots.filter(b => b.team === "BLUE").forEach(b => {
      prevBlueBotStates.push({
        level: b.level,
        exp: b.exp,
        gold: b.gold,
        items: [...(b.items || [])],
        kills: b.kills,
        deaths: b.deaths,
        assists: b.assists,
        cs: b.cs
      });
    });
    bots.filter(b => b.team === "RED").forEach(b => {
      prevRedBotStates.push({
        level: b.level,
        exp: b.exp,
        gold: b.gold,
        items: [...(b.items || [])],
        kills: b.kills,
        deaths: b.deaths,
        assists: b.assists,
        cs: b.cs
      });
    });
  }

  selectedHero = new Hero(chosenHeroData);
  if (prevHeroLevel > 1) {
    selectedHero.setLevel(prevHeroLevel, prevHeroExp);
    if (prevHeroSkillLevels) {
      selectedHero.skillLevels = prevHeroSkillLevels;
      selectedHero.skillPoints = prevHeroSkillPoints;
    }
    selectedHero.hp = Math.round(selectedHero.maxHp * Math.max(0.25, prevHeroHpRatio));
  }

  // Position hero at their designated lane from team roster
  const playerSlot = teamRoster.blue.find(m => m.isPlayer) || { lane: chosenHeroData.lane || "MID" };
  let spawnY = 480;
  if (playerSlot.lane === "TOP" || (playerSlot.lane && playerSlot.lane.includes("Gold"))) spawnY = 240;
  else if (playerSlot.lane === "BOT" || (playerSlot.lane && playerSlot.lane.includes("EXP"))) spawnY = 720;

  selectedHero.x = 100;
  selectedHero.y = spawnY;
  selectedHero.targetX = 100;
  selectedHero.targetY = spawnY;
  selectedHero.team = "BLUE";

  // Spawn Bots for both Blue (Allies) and Red (Enemies)
  bots = [];

  // Blue Ally Bots
  teamRoster.blue.filter(m => !m.isPlayer).forEach((member, idx) => {
    const allyBot = new BotHero(member.hero, member.lane, "BLUE");
    if (prevBlueBotStates[idx] && prevBlueBotStates[idx].level > 1) {
      allyBot.setLevel(prevBlueBotStates[idx].level, prevBlueBotStates[idx].exp);
      allyBot.gold = prevBlueBotStates[idx].gold !== undefined ? prevBlueBotStates[idx].gold : allyBot.gold;
      if (prevBlueBotStates[idx].items) allyBot.items = [...prevBlueBotStates[idx].items];
      allyBot.kills = prevBlueBotStates[idx].kills || 0;
      allyBot.deaths = prevBlueBotStates[idx].deaths || 0;
      allyBot.assists = prevBlueBotStates[idx].assists || 0;
      allyBot.cs = prevBlueBotStates[idx].cs || 0;
    }
    bots.push(allyBot);
  });

  // Red Enemy Bots
  teamRoster.red.forEach((member, idx) => {
    const enemyBotInstance = new BotHero(member.hero, member.lane, "RED");
    if (prevRedBotStates[idx] && prevRedBotStates[idx].level > 1) {
      enemyBotInstance.setLevel(prevRedBotStates[idx].level, prevRedBotStates[idx].exp);
      enemyBotInstance.gold = prevRedBotStates[idx].gold !== undefined ? prevRedBotStates[idx].gold : enemyBotInstance.gold;
      if (prevRedBotStates[idx].items) enemyBotInstance.items = [...prevRedBotStates[idx].items];
      enemyBotInstance.kills = prevRedBotStates[idx].kills || 0;
      enemyBotInstance.deaths = prevRedBotStates[idx].deaths || 0;
      enemyBotInstance.assists = prevRedBotStates[idx].assists || 0;
      enemyBotInstance.cs = prevRedBotStates[idx].cs || 0;
    }
    bots.push(enemyBotInstance);
  });

  enemyBot = bots.find(b => b.team === "RED") || null;

  if (modeSelectOverlay) modeSelectOverlay.classList.add("hidden");
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

  // Snap camera directly to hero
  updateCamera(true);
}

/**
 * Smoothly centers camera on selectedHero with dynamic aspect-ratio support.
 * Ensures the hero is always visible and followed across the map in full-screen portrait and landscape.
 */
function updateCamera(snap = false) {
  if (!selectedHero) return;

  const mapWidth = map.width * map.tileSize;
  const mapHeight = map.height * map.tileSize;

  let viewW = GAME.CANVAS_WIDTH;
  let viewH = GAME.CANVAS_HEIGHT;

  if (typeof window !== "undefined" && canvas) {
    const rect = canvas.getBoundingClientRect();
    const style = window.getComputedStyle(canvas);
    if (style && style.objectFit === "cover" && rect.width > 0 && rect.height > 0) {
      const canvasAspect = GAME.CANVAS_WIDTH / GAME.CANVAS_HEIGHT;
      const rectAspect = rect.width / rect.height;
      if (rectAspect < canvasAspect) {
        // Mobile portrait or narrow screen: height matches, width is cropped
        const scale = rect.height / GAME.CANVAS_HEIGHT;
        viewW = rect.width / scale;
        viewH = GAME.CANVAS_HEIGHT;
      } else {
        // Wide landscape: width matches, height is cropped
        const scale = rect.width / GAME.CANVAS_WIDTH;
        viewW = GAME.CANVAS_WIDTH;
        viewH = rect.height / scale;
      }
    }
  }

  const targetX = selectedHero.x - GAME.CANVAS_WIDTH / 2;
  const targetY = selectedHero.y - GAME.CANVAS_HEIGHT / 2;

  let minCamX = -(GAME.CANVAS_WIDTH - viewW) / 2;
  let maxCamX = mapWidth - (GAME.CANVAS_WIDTH + viewW) / 2;
  let minCamY = -(GAME.CANVAS_HEIGHT - viewH) / 2;
  let maxCamY = mapHeight - (GAME.CANVAS_HEIGHT + viewH) / 2;

  if (minCamX > maxCamX) { const m = (minCamX + maxCamX) / 2; minCamX = m; maxCamX = m; }
  if (minCamY > maxCamY) { const m = (minCamY + maxCamY) / 2; minCamY = m; maxCamY = m; }

  const clampedX = clamp(targetX, minCamX, maxCamX);
  const clampedY = clamp(targetY, minCamY, maxCamY);

  if (snap) {
    camera.x = clampedX;
    camera.y = clampedY;
  } else {
    camera.x += (clampedX - camera.x) * cameraLerp;
    camera.y += (clampedY - camera.y) * cameraLerp;
    camera.x = clamp(camera.x, minCamX, maxCamX);
    camera.y = clamp(camera.y, minCamY, maxCamY);
  }
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

let armedSkillSlot = null;

function disarmSkill(showFeedback = false) {
  if (!armedSkillSlot) return;
  armedSkillSlot = null;
  ["q", "w", "e", "r"].forEach(s => {
    const btn = document.getElementById(`btnSkill${s.toUpperCase()}`);
    if (btn) btn.classList.remove("armed");
  });
  if (showFeedback && selectedHero && combatTexts) {
    combatTexts.push({
      x: selectedHero.x,
      y: selectedHero.y - 35,
      text: "AIM CANCELLED",
      color: "#e74c3c",
      life: 0.7,
      maxLife: 0.7
    });
  }
}

function handleSkillActivation(slot) {
  if (gameState !== "PLAYING" || !selectedHero) return;
  if (selectedHero.hp <= 0 || selectedHero.stunTimer > 0) return;

  // Check cooldown and skill points
  if (!skillManager.canCast(slot, selectedHero)) return;

  // Rule 4: Instant cast skills (self-buffs, heals, self PBAOEs) activate immediately!
  if (skillManager.isInstantSkill(selectedHero.id, slot)) {
    disarmSkill(false);
    triggerSkill(slot, selectedHero.x, selectedHero.y);
    return;
  }

  // Tap again to cancel: if this skill is already armed, disarm it without consuming cooldown
  if (armedSkillSlot === slot) {
    disarmSkill(true);
    if (sound && sound.playClick) sound.playClick();
    return;
  }

  // Otherwise, arm this skill for the 2nd tap on screen
  disarmSkill(false);
  armedSkillSlot = slot;
  const btn = document.getElementById(`btnSkill${slot.toUpperCase()}`);
  if (btn) btn.classList.add("armed");

  const skillInfo = skillManager.getSkillConfig(selectedHero.id, slot);
  if (combatTexts && skillInfo) {
    combatTexts.push({
      x: selectedHero.x,
      y: selectedHero.y - 35,
      text: `${skillInfo.name.toUpperCase()}: TAP TARGET`,
      color: "#ffd700",
      life: 0.85,
      maxLife: 0.85
    });
  }
  if (sound && sound.playClick) sound.playClick();
}

function triggerSkill(slot, customTargetX, customTargetY) {
  if (gameState !== "PLAYING" || !selectedHero) return;
  if (selectedHero.stunTimer > 0) return;

  if (selectedHero.isRecalling) {
    selectedHero.cancelRecall(combatTexts);
  }

  const targetX = (customTargetX !== undefined && customTargetX !== null) ? customTargetX : (Input.mouseX + camera.x);
  const targetY = (customTargetY !== undefined && customTargetY !== null) ? customTargetY : (Input.mouseY + camera.y);

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
    bots,
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
  disarmSkill(false);
  map = new GameMap(GAME.MAP.WIDTH, GAME.MAP.HEIGHT, GAME.TILE_SIZE);
  minionManager = new MinionManager();
  skillManager = new SkillManager();
  objectiveManager = new ObjectiveManager();
  itemShop = new ItemShop();
  selectedHero = null;
  bots = [];
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
    if (modeSelectOverlay) modeSelectOverlay.classList.remove("hidden");
    selectOverlay.classList.add("hidden");
    gameState = "MODE_SELECT";
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
    disarmSkill(false);
    gameState = "SELECT";
    gameOverOverlay.classList.add("hidden");
    if (modeSelectOverlay) modeSelectOverlay.classList.add("hidden");
    selectOverlay.classList.remove("hidden");
    if (selectOverlay) selectOverlay.scrollTop = 0;
    activeSlot = { team: "blue", index: 0 };
    renderTeamLineupsUI();
    updateHeroGridSelection();
    updateActiveSlotPrompt();
  });
}

// Collapsible Hero Panel on Mobile
const toggleHeroPanelBtn = document.getElementById("toggleHeroPanelBtn");
const heroPanelEl = document.getElementById("heroPanel");
if (toggleHeroPanelBtn && heroPanelEl) {
  toggleHeroPanelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    heroPanelEl.classList.toggle("collapsed");
    const isCollapsed = heroPanelEl.classList.contains("collapsed");
    toggleHeroPanelBtn.innerHTML = isCollapsed ? '<i class="fa-solid fa-chevron-down"></i>' : '<i class="fa-solid fa-chevron-up"></i>';
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

// Click inventory slot to sell item (minus 50% gold value)
for (let i = 0; i < 6; i++) {
  const slotEl = document.getElementById(`invSlot${i}`);
  if (slotEl) {
    slotEl.addEventListener("click", () => {
      sellInventoryItem(i);
    });
  }

  const shopSlotEl = document.getElementById(`shopInvSlot${i}`);
  if (shopSlotEl) {
    shopSlotEl.addEventListener("click", () => {
      sellInventoryItem(i);
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
    btn.addEventListener("click", () => handleSkillActivation(slot));
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

  if (e.code === "KeyQ") handleSkillActivation("q");
  else if (e.code === "KeyW") handleSkillActivation("w");
  else if (e.code === "KeyE") handleSkillActivation("e");
  else if (e.code === "KeyR") handleSkillActivation("r");
  else if (e.code === "KeyB") {
    disarmSkill(false);
    if (selectedHero && selectedHero.stunTimer <= 0) selectedHero.startRecall(combatTexts, sound);
  } else if (e.code === "KeyP") {
    disarmSkill(false);
    if (shopOverlay.classList.contains("hidden")) {
      shopOverlay.classList.remove("hidden");
      updateShopState();
    } else {
      shopOverlay.classList.add("hidden");
    }
  } else if (e.code === "Escape") {
    if (armedSkillSlot) {
      disarmSkill(true);
      return;
    }
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

    // 0b. Passive Gold Income: +10 gold every 3.0s for Player & all Bots
    passiveGoldTimer += dt;
    if (passiveGoldTimer >= 3.0) {
      passiveGoldTimer -= 3.0;
      gameStats.gold += 10;
      if (scoreboard) scoreboard.addGold("player", 10);
      bots.forEach((b, idx) => {
        b.gold = (b.gold || 0) + 10;
        if (scoreboard) scoreboard.addGold(b.team === "RED" ? `bot_${idx}` : `ally_${idx}`, 10);
      });
    }

    // 1. Hero Input & Update
    if (selectedHero) {
      if (Input.targetX !== null && Input.targetY !== null) {
        if (selectedHero.stunTimer <= 0) {
          selectedHero.setTarget(Input.targetX, Input.targetY, map, minionManager.minions, objectiveManager, bots);
        }
        if (!Input.isDragging) {
          Input.targetX = null;
          Input.targetY = null;
        }
      }
      selectedHero.update(map, dt, minionManager.minions, combatTexts, gameStats, skillManager, itemShop, objectiveManager, bots, sound, particles, scoreboard);

      // Camera follow hero
      updateCamera(false);
    }

    // 1b. Ally & Enemy Bots update (Multi-Lane & Team Clash)
    for (let i = 0; i < bots.length; i++) {
      bots[i].update(dt, selectedHero, minionManager, map, combatTexts, sound, particles, scoreboard, objectiveManager, bots);
    }

    // 2. Minions update (targeting Player, Ally Bots, Enemy Bots, Minions, and Turrets)
    minionManager.update(dt, map, selectedHero, combatTexts, gameStats, bots, sound, particles, scoreboard, objectiveManager);

    // 3. Skills update
    skillManager.update(dt, selectedHero, map, minionManager.minions, objectiveManager, combatTexts, gameStats, bots, scoreboard, sound, particles);

    // 4. Boss Objectives update (Turtle & Lord)
    objectiveManager.update(dt, selectedHero, map, minionManager.minions, combatTexts, gameStats, skillManager, scoreboard, bots, sound, particles);

    // 5. Turrets, Base Crystal & projectiles update
    map.updateCombat(dt, selectedHero, minionManager.minions, combatTexts, gameStats, bots, sound, particles, scoreboard, objectiveManager);

    // 6. Update Ability Cooldown & Recall UI Overlays
    if (recallBtnEl && selectedHero) {
      if (selectedHero.isRecalling) {
        recallBtnEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${selectedHero.recallTimer.toFixed(1)}s`;
        recallBtnEl.classList.add("channeling");
      } else if (recallBtnEl.classList.contains("channeling")) {
        recallBtnEl.innerHTML = `<i class="fa-solid fa-house"></i> Recall`;
        recallBtnEl.classList.remove("channeling");
      }
    }

    ["q", "w", "e", "r"].forEach(slot => {
      const overlayEl = cdOverlayEls[slot];
      const btnEl = skillBtnEls[slot];
      if (overlayEl && btnEl) {
        const cd = skillManager.cooldowns[slot];
        if (cd > 0) {
          overlayEl.classList.remove("hidden");
          const text = cd.toFixed(1);
          if (overlayEl.textContent !== text) overlayEl.textContent = text;
          btnEl.classList.add("cooling-down");
        } else if (btnEl.classList.contains("cooling-down")) {
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
      scoreboard.updateUI(selectedHero, bots, itemShop);
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

  // Render all bots (Blue Allies and Red Enemies)
  for (let i = 0; i < bots.length; i++) {
    renderer.renderBot(bots[i], camera);
  }

  if (selectedHero) {
    renderer.renderHero(selectedHero, camera, skillManager);
    if (armedSkillSlot) {
      renderer.renderSkillAimIndicator(selectedHero, camera, skillManager, armedSkillSlot, Input);
    }
    const blueBase = map.bases.find(b => b.team === "BLUE");
    const redBase = map.bases.find(b => b.team === "RED");
    renderer.renderUI(selectedHero, matchTime, minionManager.waveCount, blueBase, redBase, gameStats, bots);
  }

  renderer.renderParticles(particles, camera);
  renderer.renderCombatTexts(combatTexts, camera);

  requestAnimationFrame(loop);
}

// Initialization
generateTeamRosters(HEROES[0]);
buildHeroGrid();
buildShopCatalog();
renderTeamLineupsUI();
updateHeroGridSelection();
updateActiveSlotPrompt();
requestAnimationFrame(loop);
