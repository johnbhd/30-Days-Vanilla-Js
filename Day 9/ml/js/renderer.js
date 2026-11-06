/**
 * Renderer - handles canvas rendering
 * Phase 3 implementation - renders map, minions, hero, boss objectives, skills & combat VFX
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderMap(map, camera) {
    map.render(this.ctx, camera);
  }

  renderObjectives(objectiveManager, camera) {
    if (objectiveManager) {
      objectiveManager.render(this.ctx, camera);
    }
  }

  renderMinions(minionManager, camera) {
    if (minionManager) {
      minionManager.render(this.ctx, camera);
    }
  }

  renderSkills(skillManager, camera) {
    if (skillManager) {
      skillManager.render(this.ctx, camera);
    }
  }

  renderHero(hero, camera, skillManager) {
    hero.render(this.ctx, camera);

    // Render Shield Aura if active
    if (skillManager && skillManager.activeBuffs && skillManager.activeBuffs.shield > 0) {
      const sx = hero.x - camera.x;
      const sy = hero.y - camera.y;

      this.ctx.save();
      this.ctx.strokeStyle = "#00d2d3";
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, hero.radius + 8, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = "rgba(0, 210, 211, 0.15)";
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, hero.radius + 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  renderBot(bot, camera) {
    if (bot) {
      bot.render(this.ctx, camera);
    }
  }

  renderParticles(particleEngine, camera) {
    if (particleEngine) {
      particleEngine.render(this.ctx, camera);
    }
  }

  renderCombatTexts(combatTexts, camera) {
    if (!combatTexts) return;

    for (let i = combatTexts.length - 1; i >= 0; i--) {
      const ct = combatTexts[i];
      const sx = ct.x - camera.x;
      const sy = ct.y - camera.y;

      const alpha = Math.max(0, ct.life / ct.maxLife);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = ct.color;
      this.ctx.font = "bold 13px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.shadowColor = "rgba(0,0,0,0.85)";
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(ct.text, sx, sy);
      this.ctx.restore();
    }
  }

  renderUI(hero, matchTime, waveCount, blueCrystal, redCrystal, gameStats, enemyBot) {
    this.ctx.save();

    // Player Hero Respawn Countdown Banner (Top-Center)
    if (hero && hero.isDead) {
      const bannerW = 280;
      const bannerH = 50;
      const bx = (GAME.CANVAS_WIDTH - bannerW) / 2;
      const by = 18;

      this.ctx.save();
      this.ctx.fillStyle = "rgba(15, 20, 35, 0.94)";
      if (this.ctx.roundRect) {
        this.ctx.beginPath();
        this.ctx.roundRect(bx, by, bannerW, bannerH, 8);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(bx, by, bannerW, bannerH);
      }
      this.ctx.strokeStyle = "#e74c3c";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(bx, by, bannerW, bannerH);

      // Progress bar at bottom of banner
      const maxT = hero.respawnMax || 5;
      const pct = Math.max(0, Math.min(1, 1 - (hero.respawnTimer / maxT)));
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      this.ctx.fillRect(bx + 12, by + bannerH - 8, bannerW - 24, 4);
      this.ctx.fillStyle = "#e74c3c";
      this.ctx.fillRect(bx + 12, by + bannerH - 8, (bannerW - 24) * pct, 4);

      // Banner text
      this.ctx.fillStyle = "#ff6b6b";
      this.ctx.font = "bold 13px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText("💀 DEFEATED", bx + bannerW / 2, by + 18);

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 12px sans-serif";
      this.ctx.fillText(`Respawning in ${Math.ceil(hero.respawnTimer)}s`, bx + bannerW / 2, by + 34);
      this.ctx.restore();
    }

    this.ctx.restore();
  }
}
