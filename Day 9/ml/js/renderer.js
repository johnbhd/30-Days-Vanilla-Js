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

    // Render Shield Aura if active (hidden when hero is dead)
    if (skillManager && skillManager.activeBuffs && skillManager.activeBuffs.shield > 0 && !hero.isDead) {
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

    // Render Saber's Orbiting Swords (Skill 1 - Q)
    if (skillManager && skillManager.saberSwords && skillManager.saberSwords.active && !hero.isDead) {
      this.renderOrbitingSwords(hero, camera, skillManager.saberSwords);
    }

    // Render Balmond's Cyclone Sweep (Skill 2 - W)
    if (skillManager && skillManager.balmondCyclone && skillManager.balmondCyclone.active && !hero.isDead) {
      this.renderBalmondCyclone(hero, camera, skillManager.balmondCyclone);
    }
  }

  renderBot(bot, camera) {
    if (bot) {
      bot.render(this.ctx, camera);
      if (bot.saberSwords && bot.saberSwords.active && !bot.isDead) {
        this.renderOrbitingSwords(bot, camera, bot.saberSwords);
      }
      if (bot.balmondCyclone && bot.balmondCyclone.active && !bot.isDead) {
        this.renderBalmondCyclone(bot, camera, bot.balmondCyclone);
      }
    }
  }

  renderOrbitingSwords(unit, camera, swordsData) {
    const sx = unit.x - camera.x;
    const sy = unit.y - camera.y;

    this.ctx.save();
    // Orbit guide ring with extended 80px radius
    this.ctx.strokeStyle = "rgba(0, 210, 211, 0.35)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, 80, 0, Math.PI * 2);
    this.ctx.stroke();

    // 4 Orbiting swords with glowing blade shapes and center dots
    for (let k = 0; k < 4; k++) {
      const sAngle = swordsData.angle + (k * Math.PI / 2);
      const px = sx + Math.cos(sAngle) * 80;
      const py = sy + Math.sin(sAngle) * 80;

      this.ctx.save();
      this.ctx.translate(px, py);
      this.ctx.rotate(sAngle + Math.PI / 2);

      // Glowing sword dagger shape
      this.ctx.shadowColor = "#00d2d3";
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = "#00ffff";
      this.ctx.beginPath();
      this.ctx.moveTo(0, -11);
      this.ctx.lineTo(4, 0);
      this.ctx.lineTo(0, 11);
      this.ctx.lineTo(-4, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();

      // Core dot
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
    this.ctx.restore();
  }

  renderBalmondCyclone(unit, camera, cycloneData) {
    const sx = unit.x - camera.x;
    const sy = unit.y - camera.y;

    this.ctx.save();
    // Fiery crimson whirlwind vortex aura at short range (46px)
    this.ctx.strokeStyle = "rgba(231, 76, 60, 0.45)";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, 46, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = "rgba(243, 156, 18, 0.35)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, 42, 0, Math.PI * 2);
    this.ctx.stroke();

    // 3 Fast-spinning heavy double-edged orc battleaxe heads
    for (let k = 0; k < 3; k++) {
      const aAngle = cycloneData.angle + (k * (Math.PI * 2 / 3));
      const px = sx + Math.cos(aAngle) * 46;
      const py = sy + Math.sin(aAngle) * 46;

      this.ctx.save();
      this.ctx.translate(px, py);
      this.ctx.rotate(aAngle + Math.PI / 2);

      // Crimson axe glow
      this.ctx.shadowColor = "#e74c3c";
      this.ctx.shadowBlur = 10;

      // Curved battleaxe head shape
      this.ctx.fillStyle = "#c0392b";
      this.ctx.beginPath();
      this.ctx.moveTo(-7, -8);
      this.ctx.quadraticCurveTo(0, -12, 7, -8);
      this.ctx.lineTo(8, 6);
      this.ctx.quadraticCurveTo(0, 10, -8, 6);
      this.ctx.closePath();
      this.ctx.fill();

      // Sharpened axe cutting edge
      this.ctx.strokeStyle = "#ffd700";
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Central axe core
      this.ctx.fillStyle = "#f39c12";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
    this.ctx.restore();
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

  renderSkillAimIndicator(hero, camera, skillManager, slot, input) {
    if (!hero || !skillManager || !slot) return;
    const skill = skillManager.getSkillConfig(hero.id, slot);
    if (!skill) return;

    const hx = hero.x - camera.x;
    const hy = hero.y - camera.y;
    const range = skill.range || 240;

    this.ctx.save();

    // 1. Draw glowing range perimeter around hero
    this.ctx.fillStyle = "rgba(78, 204, 163, 0.08)";
    this.ctx.beginPath();
    this.ctx.arc(hx, hy, range, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "rgba(78, 204, 163, 0.75)";
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([7, 5]);
    this.ctx.beginPath();
    this.ctx.arc(hx, hy, range, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 2. Calculate aim vector to mouse/touch position
    const mx = (input && input.mouseX !== undefined && input.mouseX !== null) ? input.mouseX : hx;
    const my = (input && input.mouseY !== undefined && input.mouseY !== null) ? input.mouseY : hy;
    const dx = mx - hx;
    const dy = my - hy;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, range);
    const targetX = hx + Math.cos(angle) * clampedDist;
    const targetY = hy + Math.sin(angle) * clampedDist;

    // 3. Render indicator by skill type
    if (skill.indicator === "circle_aoe" || skill.type === "aoe" || skill.type === "leap") {
      // Dotted guide line to target center
      this.ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(hx, hy);
      this.ctx.lineTo(targetX, targetY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // AOE impact circle
      const aoeRadius = skill.radius || 60;
      this.ctx.fillStyle = "rgba(241, 196, 15, 0.22)";
      this.ctx.beginPath();
      this.ctx.arc(targetX, targetY, aoeRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = "#ffd700";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(targetX, targetY, aoeRadius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Crosshair center
      this.ctx.beginPath();
      this.ctx.moveTo(targetX - 7, targetY);
      this.ctx.lineTo(targetX + 7, targetY);
      this.ctx.moveTo(targetX, targetY - 7);
      this.ctx.lineTo(targetX, targetY + 7);
      this.ctx.stroke();
    } else if (skill.indicator === "dash" || skill.type === "dash" || skill.type === "dash_knock" || skill.type === "dash_push") {
      // Dash trajectory line
      this.ctx.strokeStyle = "rgba(52, 152, 219, 0.85)";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(hx, hy);
      this.ctx.lineTo(targetX, targetY);
      this.ctx.stroke();

      // Chevron arrow at tip
      const arrowSize = 11;
      this.ctx.fillStyle = "#3498db";
      this.ctx.beginPath();
      this.ctx.moveTo(targetX, targetY);
      this.ctx.lineTo(targetX - Math.cos(angle - 0.45) * arrowSize, targetY - Math.sin(angle - 0.45) * arrowSize);
      this.ctx.lineTo(targetX - Math.cos(angle + 0.45) * arrowSize, targetY - Math.sin(angle + 0.45) * arrowSize);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (skill.indicator === "cone" || skill.type === "multishot" || skill.type === "dagger_fan") {
      // Fan spread lines
      const fanAngles = [-0.22, 0, 0.22];
      fanAngles.forEach(offset => {
        const a = angle + offset;
        const fx = hx + Math.cos(a) * range;
        const fy = hy + Math.sin(a) * range;
        this.ctx.strokeStyle = "rgba(241, 196, 15, 0.6)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(hx, hy);
        this.ctx.lineTo(fx, fy);
        this.ctx.stroke();
      });
    } else {
      // Directional line / beam (laser, shockwave, boomerang, execute)
      const endX = hx + Math.cos(angle) * range;
      const endY = hy + Math.sin(angle) * range;
      this.ctx.strokeStyle = "rgba(78, 204, 163, 0.7)";
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(hx, hy);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      // Arrowhead at tip
      const arrowSize = 14;
      this.ctx.fillStyle = "#4ecca3";
      this.ctx.beginPath();
      this.ctx.moveTo(endX, endY);
      this.ctx.lineTo(endX - Math.cos(angle - 0.45) * arrowSize, endY - Math.sin(angle - 0.45) * arrowSize);
      this.ctx.lineTo(endX - Math.cos(angle + 0.45) * arrowSize, endY - Math.sin(angle + 0.45) * arrowSize);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  renderUI(hero, matchTime, waveCount, blueCrystal, redCrystal, gameStats, enemyBot) {
    this.ctx.save();

    // Determine visible horizontal & vertical window if canvas is using object-fit: cover in mobile portrait or landscape
    let visibleLeft = 0;
    let visibleRight = GAME.CANVAS_WIDTH;
    let visibleTop = 0;
    let visibleBottom = GAME.CANVAS_HEIGHT;

    if (this.canvas && typeof window !== "undefined") {
      const rect = this.canvas.getBoundingClientRect();
      const style = window.getComputedStyle(this.canvas);
      if (style && style.objectFit === "cover" && rect.width > 0 && rect.height > 0) {
        const canvasAspect = GAME.CANVAS_WIDTH / GAME.CANVAS_HEIGHT;
        const rectAspect = rect.width / rect.height;
        if (rectAspect < canvasAspect) {
          // Cropped horizontally (mobile portrait)
          const scale = rect.height / GAME.CANVAS_HEIGHT;
          const cropX = (GAME.CANVAS_WIDTH * scale - rect.width) / 2 / scale;
          visibleLeft = cropX;
          visibleRight = GAME.CANVAS_WIDTH - cropX;
        } else if (rectAspect > canvasAspect) {
          // Cropped vertically (mobile landscape)
          const scale = rect.width / GAME.CANVAS_WIDTH;
          const cropY = (GAME.CANVAS_HEIGHT * scale - rect.height) / 2 / scale;
          visibleTop = cropY;
          visibleBottom = GAME.CANVAS_HEIGHT - cropY;
        }
      }
    }

    // Top-left Match Status HUD (Clock & Wave Card on Canvas)
    const hudX = visibleLeft + 14;
    const hudY = visibleTop + 14;
    const hudWidth = 205;
    const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
    const deadBots = botList.filter(b => b.isDead);
    const hasBotDead = deadBots.length > 0;
    const hudHeight = hasBotDead ? 68 : 52;

    this.ctx.fillStyle = "rgba(16, 25, 47, 0.88)";
    if (this.ctx.roundRect) {
      this.ctx.beginPath();
      this.ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 6);
      this.ctx.fill();
    } else {
      this.ctx.fillRect(hudX, hudY, hudWidth, hudHeight);
    }
    this.ctx.strokeStyle = "rgba(78, 204, 163, 0.35)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(hudX, hudY, hudWidth, hudHeight);

    const minutes = Math.floor(matchTime / 60);
    const seconds = Math.floor(matchTime % 60).toString().padStart(2, "0");
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 12px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`⏱️ ${minutes}:${seconds}  •  Wave ${waveCount}`, hudX + 10, hudY + 20);

    const bHp = blueCrystal ? Math.max(0, blueCrystal.crystalHp) : 5000;
    const rHp = redCrystal ? Math.max(0, redCrystal.crystalHp) : 5000;
    this.ctx.font = "11px sans-serif";
    this.ctx.fillStyle = "#4ecca3";
    this.ctx.fillText(`Blue: ${bHp}`, hudX + 10, hudY + 38);

    this.ctx.fillStyle = "#e74c3c";
    this.ctx.textAlign = "right";
    this.ctx.fillText(`Red: ${rHp}`, hudX + hudWidth - 10, hudY + 38);

    // Bot Respawn Status in HUD
    if (hasBotDead) {
      this.ctx.fillStyle = "#ff6b6b";
      this.ctx.font = "bold 11px sans-serif";
      this.ctx.textAlign = "left";
      const minTimer = Math.min(...deadBots.map(b => b.respawnTimer));
      const label = deadBots.length === 1 ? `💀 [${deadBots[0].team}] ${deadBots[0].name} in ${Math.ceil(deadBots[0].respawnTimer)}s` : `💀 ${deadBots.length} Respawning (${Math.ceil(minTimer)}s)`;
      this.ctx.fillText(label, hudX + 10, hudY + 56);
    }

    // Player Hero Respawn Countdown Banner (Top-Center)
    if (hero && hero.isDead) {
      const bannerW = 280;
      const bannerH = 50;
      const bx = (visibleLeft + visibleRight - bannerW) / 2;
      const by = visibleTop + 18;

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
      const maxT = hero.respawnMax || 10;
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

if (typeof window !== "undefined") window.Renderer = Renderer;
if (typeof global !== "undefined") global.Renderer = Renderer;
