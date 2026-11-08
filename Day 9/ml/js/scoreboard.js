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
