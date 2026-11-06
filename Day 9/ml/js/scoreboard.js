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

    const playerItems = itemShop ? itemShop.inventory.map(i => i.icon).join(" ") : "-";
    const botItems = bot && bot.items ? bot.items.length : 0;

    const playerDeadBadge = player && player.isDead
      ? `<span style="color:#ff6b6b; font-weight:bold; margin-left:6px;"><i class="fa-solid fa-skull"></i> (${Math.ceil(player.respawnTimer)}s)</span>`
      : "";
    const botDeadBadge = bot && bot.isDead
      ? `<span style="color:#ff6b6b; font-weight:bold; margin-left:6px;"><i class="fa-solid fa-skull"></i> (${Math.ceil(bot.respawnTimer)}s)</span>`
      : "";

    tableBody.innerHTML = `
      <tr class="score-row blue-side">
        <td><strong style="color:#4ecca3">${player ? player.name : "Player"}</strong> <small>(${player ? player.role : ""})</small>${playerDeadBadge}</td>
        <td>${this.stats.player.kills} / ${this.stats.player.deaths} / ${this.stats.player.assists}</td>
        <td>${this.stats.player.cs}</td>
        <td>${Math.round(this.stats.player.gold)}g</td>
        <td class="scoreboard-items">${playerItems || "Empty"}</td>
      </tr>
      <tr class="score-row red-side">
        <td><strong style="color:#e74c3c">${bot ? "[BOT] " + bot.name : "Enemy Bot"}</strong> <small>(${bot ? bot.role : ""})</small>${botDeadBadge}</td>
        <td>${this.stats.bot.kills} / ${this.stats.bot.deaths} / ${this.stats.bot.assists}</td>
        <td>${this.stats.bot.cs}</td>
        <td>${Math.round(this.stats.bot.gold)}g</td>
        <td class="scoreboard-items">${botItems} items</td>
      </tr>
    `;
  }
}
