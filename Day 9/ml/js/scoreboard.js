/**
 * Scoreboard & Match Stats Engine
 * Phase 4 implementation - Live TAB overlay & post-game analytics
 */

class Scoreboard {
  constructor() {
    this.visible = false;

    this.stats = {
      player: {
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        gold: 0,
        damageDealt: 0
      },
      bot: {
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        gold: 0,
        damageDealt: 0
      },
      blueTurretsDestroyed: 0,
      redTurretsDestroyed: 0,
      turtlesTaken: 0,
      lordsTaken: 0
    };
    this.teamScores = { blue: 0, red: 0 };
  }

  recordTeamKill(team) {
    if (!this.teamScores) this.teamScores = { blue: 0, red: 0 };
    const tKey = (team || "").toUpperCase() === "BLUE" ? "blue" : "red";
    this.teamScores[tKey] = (this.teamScores[tKey] || 0) + 1;
  }

  getTeamKills(team, player = null, allBots = []) {
    if (!this.teamScores) this.teamScores = { blue: 0, red: 0 };
    const isBlue = (team || "").toUpperCase() === "BLUE";
    let individualKills = 0;
    if (isBlue) {
      if (player && typeof player.kills === "number") individualKills += player.kills;
      else if (this.stats && this.stats.player && this.stats.player.kills) individualKills += this.stats.player.kills;
      if (Array.isArray(allBots)) {
        allBots.forEach(b => {
          if (b.team === "BLUE" && b.kills) individualKills += b.kills;
        });
      }
    } else {
      if (Array.isArray(allBots)) {
        allBots.forEach(b => {
          if (b.team === "RED" && b.kills) individualKills += b.kills;
        });
      }
    }
    const tracked = isBlue ? (this.teamScores.blue || 0) : (this.teamScores.red || 0);
    return Math.max(tracked, individualKills);
  }

  getTeamGold(team, player = null, allBots = []) {
    const isBlue = (team || "").toUpperCase() === "BLUE";
    let totalGold = 0;
    if (isBlue) {
      if (player && typeof player.gold === "number") totalGold += player.gold;
      else if (this.stats && this.stats.player && this.stats.player.gold) totalGold += this.stats.player.gold;
      if (Array.isArray(allBots)) {
        allBots.forEach(b => {
          if (b.team === "BLUE" && b.gold) totalGold += b.gold;
        });
      }
    } else {
      if (Array.isArray(allBots)) {
        allBots.forEach(b => {
          if (b.team === "RED" && b.gold) totalGold += b.gold;
        });
      }
    }
    return Math.round(totalGold);
  }

  calculateHeroRating(unit) {
    if (!unit) return 3.0;
    const kills = unit.kills || 0;
    const deaths = unit.deaths || 0;
    const assists = unit.assists || 0;
    const cs = unit.cs || 0;
    const gold = unit.gold || 0;
    const damage = unit.damageDealt || 0;

    const kdaWeight = (kills * 3.2 + assists * 1.6) / Math.max(1, deaths);
    const econWeight = (gold / 1000) * 0.45 + (cs * 0.08);
    const dmgWeight = Math.min(3.0, (damage / 6000) * 1.0);
    const score = 3.0 + kdaWeight + econWeight + dmgWeight;
    return Number(Math.max(3.0, Math.min(16.0, score)).toFixed(1));
  }

  determineTeamMVPs(player, allBots = [], itemShop = null) {
    const blueMembers = [];
    if (player) {
      blueMembers.push({
        unit: player,
        id: player.id || "player",
        name: player.name || "Hero",
        role: player.role || "Fighter",
        lane: player.lane || "MID",
        team: "BLUE",
        isPlayer: true,
        kills: player.kills || (this.stats && this.stats.player ? this.stats.player.kills : 0),
        deaths: player.deaths || (this.stats && this.stats.player ? this.stats.player.deaths : 0),
        assists: player.assists || (this.stats && this.stats.player ? this.stats.player.assists : 0),
        cs: player.cs || (this.stats && this.stats.player ? this.stats.player.cs : 0),
        gold: player.gold || (this.stats && this.stats.player ? this.stats.player.gold : 0),
        damageDealt: player.damageDealt || (this.stats && this.stats.player ? this.stats.player.damageDealt : 0),
        sprite: player.spritePath || (player.id ? `assets/sprites/heroes/${player.id}/` : ""),
        items: (itemShop && itemShop.inventory && itemShop.inventory.length > 0) ? itemShop.inventory : []
      });
    }

    const botList = Array.isArray(allBots) ? allBots : [];
    botList.filter(b => b.team === "BLUE").forEach(b => {
      blueMembers.push({
        unit: b,
        id: b.id || (b.heroData && b.heroData.id) || "blue_bot",
        name: b.name || "Ally",
        role: b.role || "Fighter",
        lane: b.lane || "TOP",
        team: "BLUE",
        isPlayer: false,
        kills: b.kills || 0,
        deaths: b.deaths || 0,
        assists: b.assists || 0,
        cs: b.cs || 0,
        gold: b.gold || 0,
        damageDealt: b.damageDealt || 0,
        sprite: (b.heroData && b.heroData.sprite) || b.spritePath || (b.id ? `assets/sprites/heroes/${b.id}/` : ""),
        items: b.items || []
      });
    });

    const redMembers = [];
    botList.filter(b => b.team === "RED").forEach(b => {
      redMembers.push({
        unit: b,
        id: b.id || (b.heroData && b.heroData.id) || "red_bot",
        name: b.name || "Enemy",
        role: b.role || "Fighter",
        lane: b.lane || "BOT",
        team: "RED",
        isPlayer: false,
        kills: b.kills || 0,
        deaths: b.deaths || 0,
        assists: b.assists || 0,
        cs: b.cs || 0,
        gold: b.gold || 0,
        damageDealt: b.damageDealt || 0,
        sprite: (b.heroData && b.heroData.sprite) || b.spritePath || (b.id ? `assets/sprites/heroes/${b.id}/` : ""),
        items: b.items || []
      });
    });

    blueMembers.forEach(m => { m.rating = this.calculateHeroRating(m); });
    redMembers.forEach(m => { m.rating = this.calculateHeroRating(m); });

    blueMembers.sort((a, b) => b.rating - a.rating || b.kills - a.kills || b.gold - a.gold);
    redMembers.sort((a, b) => b.rating - a.rating || b.kills - a.kills || b.gold - a.gold);

    const blueMVP = blueMembers.length > 0 ? blueMembers[0] : null;
    const redMVP = redMembers.length > 0 ? redMembers[0] : null;
    if (blueMVP) blueMVP.isMvp = true;
    if (redMVP) redMVP.isMvp = true;

    return {
      blueMembers,
      redMembers,
      blueMVP,
      redMVP
    };
  }

  recordKill(killer) {
    if (killer === "player") {
      this.stats.player.kills++;
      this.stats.bot.deaths++;
    } else if (killer === "bot") {
      this.stats.bot.kills++;
      this.stats.player.deaths++;
    }
  }

  addCS(who) {
    if (this.stats[who]) {
      this.stats[who].cs++;
    }
  }

  addGold(who, amount) {
    if (this.stats[who]) {
      this.stats[who].gold += amount;
    }
  }

  addDamage(who, amount) {
    if (this.stats[who]) {
      this.stats[who].damageDealt += amount;
    }
  }

  toggle() {
    this.visible = !this.visible;
    const overlay = document.getElementById("scoreboardOverlay");
    if (overlay) {
      if (this.visible) {
        overlay.classList.remove("hidden");
      } else {
        overlay.classList.add("hidden");
      }
    }
    return this.visible;
  }

  hide() {
    this.visible = false;
    const overlay = document.getElementById("scoreboardOverlay");
    if (overlay) overlay.classList.add("hidden");
  }

  updateUI(player, bot, itemShop) {
    const tableBody = document.getElementById("scoreboardRows");
    if (!tableBody) return;

    const botList = Array.isArray(bot) ? bot : (bot ? [bot] : []);
    const blueBots = botList.filter(b => b.team === "BLUE");
    const redBots = botList.filter(b => b.team === "RED");

    // Update scoreboard live team score headers
    const sbBlueKills = document.getElementById("sbBlueKillsCount");
    const sbBlueGold = document.getElementById("sbBlueGoldCount");
    const sbRedKills = document.getElementById("sbRedKillsCount");
    const sbRedGold = document.getElementById("sbRedGoldCount");
    if (sbBlueKills) sbBlueKills.textContent = `${this.getTeamKills("BLUE", player, botList)} KILLS`;
    if (sbBlueGold) sbBlueGold.innerHTML = `<i class="fa-solid fa-coins"></i> ${this.getTeamGold("BLUE", player, botList)}g`;
    if (sbRedKills) sbRedKills.textContent = `${this.getTeamKills("RED", player, botList)} KILLS`;
    if (sbRedGold) sbRedGold.innerHTML = `<i class="fa-solid fa-coins"></i> ${this.getTeamGold("RED", player, botList)}g`;

    const playerItems = itemShop && itemShop.inventory.length > 0 ? itemShop.inventory.map(i => i.icon).join(" ") : "Empty";
    const renderBotItems = (b) => {
      if (!b.items || b.items.length === 0) return "-";
      return b.items.map(itemId => {
        if (typeof ITEM_CATALOG !== "undefined") {
          const item = ITEM_CATALOG.find(it => it.id === itemId);
          if (item) return item.icon;
        }
        return `<span style="font-size:10px; color:#aaa;">[${itemId}]</span>`;
      }).join(" ");
    };
    const getHeroAvatarHtml = (unit, teamColor) => {
      const sprite = (unit && unit.heroData && unit.heroData.sprite) || (unit && unit.spritePath) || (unit && unit.id ? `assets/sprites/heroes/${unit.id}/` : "");
      const name = (unit && unit.name) || "Hero";
      const initial = name ? name[0] : "H";
      const color = (unit && unit.heroData && unit.heroData.color) || teamColor || "#4ecca3";
      if (!sprite) {
        return `<div class="scoreboard-hero-thumb" style="width:32px; height:32px; border-radius:50%; border:2px solid ${color}; background:#16213e; display:flex; align-items:center; justify-content:center; font-weight:bold; color:${color}; font-size:13px; flex-shrink:0;">${initial}</div>`;
      }
      return `
        <div class="scoreboard-hero-thumb" style="width:32px; height:32px; border-radius:50%; border:2px solid ${color}; overflow:hidden; background:#16213e; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 6px rgba(0,0,0,0.5);">
          <img src="${sprite}idle.png" alt="${name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'font-weight:bold;color:${color};font-size:13px;\\'>${initial}</span>';" />
        </div>
      `;
    };

    const playerDeadBadge = player && player.isDead
      ? `<span style="color:#ff6b6b; font-weight:bold; margin-left:6px;"><i class="fa-solid fa-skull"></i> (${Math.ceil(player.respawnTimer)}s)</span>`
      : "";

    let rowsHtml = `
      <tr class="score-row blue-side">
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            ${getHeroAvatarHtml(player, "#4ecca3")}
            <div>
              <div style="line-height:1.2;"><strong style="color:#4ecca3">${player ? player.name : "Player"} (YOU)</strong>${playerDeadBadge}</div>
              <small style="color:#94a3b8; font-size:11px;">${player ? player.role : ""} • ${player && player.lane ? player.lane : "MID"}</small>
            </div>
          </div>
        </td>
        <td>${this.stats.player.kills} / ${this.stats.player.deaths} / ${this.stats.player.assists}</td>
        <td>${this.stats.player.cs}</td>
        <td>${Math.round(this.stats.player.gold)}g</td>
        <td class="scoreboard-items">${playerItems}</td>
      </tr>
    `;

    // Blue Ally Bots
    blueBots.forEach(b => {
      const deadBadge = b.isDead ? `<span style="color:#ff6b6b; font-weight:bold; margin-left:6px;"><i class="fa-solid fa-skull"></i> (${Math.ceil(b.respawnTimer)}s)</span>` : "";
      rowsHtml += `
        <tr class="score-row blue-side">
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              ${getHeroAvatarHtml(b, "#4ecca3")}
              <div>
                <div style="line-height:1.2;"><strong style="color:#4ecca3">${b.name} [ALLY]</strong>${deadBadge}</div>
                <small style="color:#94a3b8; font-size:11px;">${b.role} • ${b.lane}</small>
              </div>
            </div>
          </td>
          <td>${b.kills} / ${b.deaths} / ${b.assists}</td>
          <td>${b.cs}</td>
          <td>${Math.round(b.gold)}g</td>
          <td class="scoreboard-items">${renderBotItems(b)}</td>
        </tr>
      `;
    });

    // Red Enemy Bots
    redBots.forEach(b => {
      const deadBadge = b.isDead ? `<span style="color:#ff6b6b; font-weight:bold; margin-left:6px;"><i class="fa-solid fa-skull"></i> (${Math.ceil(b.respawnTimer)}s)</span>` : "";
      rowsHtml += `
        <tr class="score-row red-side">
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              ${getHeroAvatarHtml(b, "#e74c3c")}
              <div>
                <div style="line-height:1.2;"><strong style="color:#e74c3c">${b.name} [ENEMY]</strong>${deadBadge}</div>
                <small style="color:#94a3b8; font-size:11px;">${b.role} • ${b.lane}</small>
              </div>
            </div>
          </td>
          <td>${b.kills} / ${b.deaths} / ${b.assists}</td>
          <td>${b.cs}</td>
          <td>${Math.round(b.gold)}g</td>
          <td class="scoreboard-items">${renderBotItems(b)}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml;
  }
}

if (typeof window !== "undefined") window.Scoreboard = Scoreboard;
if (typeof global !== "undefined") global.Scoreboard = Scoreboard;
