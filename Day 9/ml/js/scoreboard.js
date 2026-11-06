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
    const playerDeadBadge = player && player.isDead
      ? `<span style="color:#ff6b6b; font-weight:bold; margin-left:6px;"><i class="fa-solid fa-skull"></i> (${Math.ceil(player.respawnTimer)}s)</span>`
      : "";

    let rowsHtml = `
      <tr class="score-row blue-side">
        <td><strong style="color:#4ecca3">${player ? player.name : "Player"} (YOU)</strong> <small>(${player ? player.role : ""})</small>${playerDeadBadge}</td>
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
          <td><strong style="color:#4ecca3">${b.name} [ALLY]</strong> <small>(${b.role} • ${b.lane})</small>${deadBadge}</td>
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
          <td><strong style="color:#e74c3c">${b.name} [ENEMY]</strong> <small>(${b.role} • ${b.lane})</small>${deadBadge}</td>
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
