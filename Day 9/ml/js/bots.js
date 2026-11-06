/**
 * Bot AI Engine - Red Team Computer-Controlled Champion
 * Phase 4 implementation - Tactical decision tree, ability casting, laning & retreat
 */

class BotHero {
  constructor(heroData, lane = "MID") {
    this.id = heroData.id;
    this.name = heroData.name;
    this.role = heroData.role;
    this.lane = (lane || "MID").toUpperCase();

    // Map lane to Y pixel coordinate
    if (this.lane.includes("GOLD") || this.lane.includes("TOP")) {
      this.laneY = 6 * 40; // 240px (Top Lane)
    } else if (this.lane.includes("EXP") || this.lane.includes("BOT")) {
      this.laneY = 18 * 40; // 720px (Bottom Lane)
    } else {
      this.laneY = 12 * 40; // 480px (Mid Lane)
    }

    this.color = heroData.color || "#e74c3c";
    this.spritePath = heroData.sprite;
    this.stats = { ...heroData.stats };

    this.team = "RED";
    this.hp = this.stats.hp || 2400;
    this.maxHp = this.hp;
    this.radius = 18;

    // Spawn at Red Base
    this.spawnX = 29 * 40; // 1160px
    this.spawnY = 12 * 40; // 480px
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.targetX = 120; // Long-range march target to Blue Base
    this.targetY = this.laneY;

    this.speed = (this.stats.spd || 3.8) * 44;
    this.attackRange = this.stats.range ? this.stats.range : 75;
    this.attackDamage = this.stats.atk || 110;
    this.attackCooldown = 0.9;
    this.attackTimer = 0;

    // Skills cooldowns
    this.skills = {
      q: { name: "Skill 1", cd: 0, maxCd: 5, damage: 90, range: 220 },
      w: { name: "Skill 2", cd: 0, maxCd: 8, damage: 140, range: 180 },
      r: { name: "Ultimate", cd: 0, maxCd: 25, damage: 320, range: 250 }
    };

    // State
    this.state = "LANING"; // "LANING", "COMBAT", "RETREAT", "DEAD"
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnMax = 18; // 18 seconds respawn

    // Recall ability
    this.isRecalling = false;
    this.recallTimer = 0;
    this.recallMax = 2.0;

    // Stats
    this.kills = 0;
    this.deaths = 0;
    this.assists = 0;
    this.gold = 300;
    this.cs = 0;
    this.items = [];

    // Visual
    this.image = null;
    this.loaded = false;
    this.loadSprite();

    // Auto-item timer
    this.itemCheckTimer = 5;
  }

  async loadSprite() {
    try {
      this.image = await loadImage(`${this.spritePath}idle.png`);
      this.loaded = true;
    } catch (e) {
      this.loaded = false;
    }
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.targetX = 120;
    this.targetY = this.laneY;
    this.state = "LANING";
  }

  takeDamage(amount, source, combatTexts, particles, sound, scoreboard) {
    if (this.isDead) return;

    if (this.isRecalling) {
      this.isRecalling = false;
      this.recallTimer = 0;
      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 30,
          text: "[BOT] RECALL CANCELLED",
          color: "#ff6b6b",
          life: 0.8,
          maxLife: 0.8
        });
      }
    }

    this.hp -= amount;

    if (particles) {
      particles.spawnBurst(this.x, this.y, "#ff4757", 8, 100);
    }
    if (sound) {
      sound.playHit();
    }
    if (combatTexts) {
      combatTexts.push({
        x: this.x + (Math.random() - 0.5) * 16,
        y: this.y - 20,
        text: `-${Math.round(amount)}`,
        color: "#ff4757",
        life: 0.8,
        maxLife: 0.8
      });
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.deaths++;
      this.respawnTimer = this.respawnMax;
      this.state = "DEAD";

      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 35,
          text: `[BOT] ${this.name.toUpperCase()} SLAIN!`,
          color: "#ffd700",
          life: 2.2,
          maxLife: 2.2
        });
      }

      if (source && source.team === "BLUE") {
        if (sound) sound.playAnnouncer("kill");
        if (scoreboard) {
          scoreboard.recordKill("player");
          scoreboard.addGold("player", 250);
        }
      }
    }
  }

  update(dt, player, minionManager, map, combatTexts, sound, particles, scoreboard) {
    // 1. Respawn timer
    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawn();
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 25,
            text: `[BOT] ${this.name} RESPAWNED!`,
            color: "#e74c3c",
            life: 1.5,
            maxLife: 1.5
          });
        }
      }
      return;
    }

    // Recall Channeling Handling (2.0s duration)
    if (this.isRecalling) {
      this.recallTimer -= dt;

      // Swirling crimson rings & sparks
      if (particles && Math.random() < 0.35) {
        particles.spawnRing(this.x, this.y, 35, "#e74c3c", 0.4);
      }
      if (particles && Math.random() < 0.3) {
        particles.spawnBurst(this.x, this.y - 10, "#ff4757", 3, 50);
      }

      if (this.recallTimer <= 0) {
        this.isRecalling = false;
        this.recallTimer = 0;

        // Teleport to Red Base crystal spawn
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.targetX = this.spawnX;
        this.targetY = this.spawnY;

        if (particles) {
          particles.spawnRing(this.x, this.y, 65, "#e74c3c", 0.6);
          particles.spawnBurst(this.x, this.y, "#ff4757", 25, 140);
        }
        if (sound && sound.playTeleport) {
          sound.playTeleport();
        }
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 30,
            text: "[BOT] RECALLED TO BASE!",
            color: "#ff6b81",
            life: 1.8,
            maxLife: 1.8
          });
        }
      }
      return; // Do not move or combat while recalling
    }

    // 2. Cooldown tickers
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.skills.q.cd = Math.max(0, this.skills.q.cd - dt);
    this.skills.w.cd = Math.max(0, this.skills.w.cd - dt);
    this.skills.r.cd = Math.max(0, this.skills.r.cd - dt);

    // 3. Passive Gold & Auto-Items
    this.gold += dt * 5;
    this.itemCheckTimer -= dt;
    if (this.itemCheckTimer <= 0) {
      this.itemCheckTimer = 6;
      this.checkShopPurchase();
    }

    // 3b. Base Fountain Continuous Healing (Friendly Red Base: low HP, half HP, or any non-max HP)
    const distToRedBase = Math.hypot(this.x - this.spawnX, this.y - this.spawnY);
    if (distToRedBase <= 120 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.20 * dt);
      if (particles && Math.random() < 0.35) {
        particles.spawnTrail(this.x, this.y, "#2ecc71", 3);
      }
      if (this.hp >= this.maxHp * 0.95 && this.state === "RETREAT") {
        this.state = "LANING";
        this.targetX = 120;
        this.targetY = this.laneY;
      }
    }

    // 4. Decision Tree
    // If very low HP -> RETREAT to Red Base (or Recall if safe)
    if (this.hp < this.maxHp * 0.28) {
      this.state = "RETREAT";

      let distToPlayer = Infinity;
      if (player && !player.isDead && player.hp > 0) {
        distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
      }

      // If safely away from player and far from red base, channel recall!
      if (distToPlayer > 360 && distToRedBase > 260 && !this.isRecalling) {
        this.isRecalling = true;
        this.recallTimer = this.recallMax;
        this.targetX = this.x;
        this.targetY = this.y;
        if (sound && sound.playRecall) {
          sound.playRecall();
        }
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 30,
            text: "[BOT] RECALLING...",
            color: "#ff6b81",
            life: 0.9,
            maxLife: 0.9
          });
        }
        return;
      }

      this.targetX = this.spawnX;
      this.targetY = this.spawnY;
    } else {
      // Check Player proximity
      let distToPlayer = Infinity;
      if (player && !player.isDead && player.hp > 0) {
        distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
      }

      if (distToPlayer < 300) {
        // Player is nearby -> COMBAT
        this.state = "COMBAT";
        this.engagePlayer(player, distToPlayer, dt, combatTexts, sound, particles, scoreboard);
      } else {
        // LANING: push lane or attack blue minions
        this.state = "LANING";
        this.engageLaning(minionManager, map, dt, combatTexts, sound, particles, scoreboard);
      }
    }

    // 5. Movement step
    this.stepMovement(dt, map);
  }

  engagePlayer(player, dist, dt, combatTexts, sound, particles, scoreboard) {
    // Position: stay in attack range
    if (dist > this.attackRange * 0.85) {
      this.targetX = player.x;
      this.targetY = player.y;
    } else if (dist < this.attackRange * 0.35) {
      // Kite backwards slightly
      const angle = Math.atan2(this.y - player.y, this.x - player.x);
      this.targetX = this.x + Math.cos(angle) * 70;
      this.targetY = this.y + Math.sin(angle) * 70;
    } else {
      this.targetX = this.x;
      this.targetY = this.y;
    }

    // Cast Skills
    // Ultimate if available and player below 60% HP
    if (this.skills.r.cd <= 0 && dist <= this.skills.r.range && player.hp < player.maxHp * 0.6) {
      this.skills.r.cd = this.skills.r.maxCd;
      if (sound) sound.playSkill("r");
      if (particles) {
        particles.spawnRing(player.x, player.y, 60, "#e74c3c", 0.5);
        particles.spawnBurst(player.x, player.y, "#ff4757", 18, 160);
      }
      player.hp -= this.skills.r.damage;
      if (combatTexts) {
        combatTexts.push({
          x: player.x,
          y: player.y - 25,
          text: `[BOT] ${this.skills.r.name.toUpperCase()} -${this.skills.r.damage}!`,
          color: "#e74c3c",
          life: 1.2,
          maxLife: 1.2
        });
      }
    }
    // Skill 1 (Q)
    else if (this.skills.q.cd <= 0 && dist <= this.skills.q.range) {
      this.skills.q.cd = this.skills.q.maxCd;
      if (sound) sound.playSkill("q");
      if (particles) particles.spawnBurst(player.x, player.y, "#f39c12", 10, 110);
      player.hp -= this.skills.q.damage;
      if (combatTexts) {
        combatTexts.push({
          x: player.x,
          y: player.y - 20,
          text: `-${this.skills.q.damage}`,
          color: "#f39c12",
          life: 0.9,
          maxLife: 0.9
        });
      }
    }
    // Skill 2 (W)
    else if (this.skills.w.cd <= 0 && dist <= this.skills.w.range) {
      this.skills.w.cd = this.skills.w.maxCd;
      if (sound) sound.playSkill("w");
      if (particles) particles.spawnRing(this.x, this.y, 45, "#e67e22", 0.35);
      player.hp -= this.skills.w.damage;
      if (combatTexts) {
        combatTexts.push({
          x: player.x,
          y: player.y - 20,
          text: `-${this.skills.w.damage}`,
          color: "#e67e22",
          life: 0.9,
          maxLife: 0.9
        });
      }
    }

    // Basic Attack
    if (this.attackTimer <= 0 && dist <= this.attackRange) {
      this.attackTimer = this.attackCooldown;
      const isRanged = this.attackRange > 130;
      if (sound) {
        if (isRanged) sound.playShoot();
        else if (sound.playSlash) sound.playSlash();
        else sound.playAttack();
      }
      if (particles) {
        if (!isRanged && particles.spawnSlash) {
          particles.spawnSlash(this.x, this.y, player.x, player.y, this.color || "#e74c3c", 40);
        }
        particles.spawnBurst(player.x, player.y, "#fff", 6, 90);
      }
      player.hp -= this.attackDamage;
      if (combatTexts) {
        combatTexts.push({
          x: player.x,
          y: player.y - 15,
          text: `-${this.attackDamage}`,
          color: "#ffdd59",
          life: 0.7,
          maxLife: 0.7
        });
      }
    }

    // Check if player died to Bot
    if (player.hp <= 0 && !player.isDead) {
      this.kills++;
      this.gold += 300;
      if (scoreboard) {
        scoreboard.recordKill("bot");
        scoreboard.addGold("bot", 300);
      }
      if (sound) sound.playAnnouncer("death");
    }
  }

  engageLaning(minionManager, map, dt, combatTexts, sound, particles, scoreboard) {
    // 1. Search for nearest Blue Minion
    let nearestMinion = null;
    let minDist = Infinity;

    if (minionManager && minionManager.minions) {
      minionManager.minions.forEach(m => {
        if (m.team === "BLUE" && m.hp > 0) {
          const d = Math.hypot(m.x - this.x, m.y - this.y);
          if (d < minDist) {
            minDist = d;
            nearestMinion = m;
          }
        }
      });
    }

    if (nearestMinion && minDist < 350) {
      if (minDist > this.attackRange * 0.85) {
        this.targetX = nearestMinion.x;
        this.targetY = nearestMinion.y;
      } else {
        this.targetX = this.x;
        this.targetY = this.y;
      }

      // Attack minion
      if (this.attackTimer <= 0 && minDist <= this.attackRange) {
        this.attackTimer = this.attackCooldown;
        const isRanged = this.attackRange > 130;
        if (sound) {
          if (isRanged) sound.playShoot();
          else if (sound.playSlash) sound.playSlash();
          else sound.playAttack();
        }
        if (particles) {
          if (!isRanged && particles.spawnSlash) {
            particles.spawnSlash(this.x, this.y, nearestMinion.x, nearestMinion.y, this.color || "#e74c3c", 36);
          }
          particles.spawnBurst(nearestMinion.x, nearestMinion.y, "#fff", 4, 70);
        }
        nearestMinion.hp -= this.attackDamage;

        if (nearestMinion.hp <= 0) {
          this.cs++;
          this.gold += 45;
          if (scoreboard) scoreboard.addGold("bot", 45);
        }
      }
    } else {
      // 2. Check for Blue Turrets in range to attack
      let nearTurret = null;
      if (map && map.turrets) {
        nearTurret = map.turrets.find(t => t.team === "BLUE" && !t.destroyed && Math.hypot(t.worldX - this.x, t.worldY - this.y) <= this.attackRange + 20);
      }

      if (nearTurret) {
        this.targetX = this.x;
        this.targetY = this.y;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;
          if (sound) sound.playAttack();
          nearTurret.hp -= this.attackDamage;
          if (particles) particles.spawnBurst(nearTurret.worldX, nearTurret.worldY, "#ffd700", 6, 80);
          if (combatTexts) {
            combatTexts.push({ x: nearTurret.worldX, y: nearTurret.worldY - 20, text: `-${this.attackDamage}`, color: "#ffd700", life: 0.7, maxLife: 0.7 });
          }
        }
      } else {
        // 3. March down assigned lane towards Blue Base!
        if (Math.abs(this.y - this.laneY) > 20 && this.x > 1050) {
          // Navigate to lane entry inside Red Base
          this.targetX = this.x;
          this.targetY = this.laneY;
        } else {
          // March down the lane towards Blue Base (x: 120)
          this.targetX = 120;
          this.targetY = this.laneY;
        }
      }
    }
  }

  stepMovement(dt, map) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      const step = Math.min(dist, this.speed * dt);
      const nx = this.x + (dx / dist) * step;
      const ny = this.y + (dy / dist) * step;

      this.x = Math.max(40, Math.min(31 * 40, nx));
      this.y = Math.max(40, Math.min(23 * 40, ny));
    }
  }

  checkShopPurchase() {
    if (this.items.length >= 6) return;

    if (this.gold >= 1400 && !this.items.includes("immortality")) {
      this.gold -= 1400;
      this.items.push("immortality");
      this.maxHp += 400;
      this.hp += 400;
    } else if (this.gold >= 1200 && !this.items.includes("blade_of_despair")) {
      this.gold -= 1200;
      this.items.push("blade_of_despair");
      this.attackDamage += 55;
    } else if (this.gold >= 850 && !this.items.includes("athenas_shield")) {
      this.gold -= 850;
      this.items.push("athenas_shield");
      this.maxHp += 450;
      this.hp += 450;
    } else if (this.gold >= 500 && !this.items.includes("swift_boots")) {
      this.gold -= 500;
      this.items.push("swift_boots");
      this.speed *= 1.25;
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Check offscreen
    const canvasW = ctx.canvas ? ctx.canvas.width : GAME.CANVAS_WIDTH;
    const canvasH = ctx.canvas ? ctx.canvas.height : GAME.CANVAS_HEIGHT;
    if (sx < -60 || sx > canvasW + 60 || sy < -60 || sy > canvasH + 60) {
      return;
    }

    ctx.save();

    // Red aura under bot
    ctx.fillStyle = "rgba(231, 76, 60, 0.25)";
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius + 6, 0, Math.PI * 2);
    ctx.fill();

    // Sprite or fallback circle
    if (this.loaded && this.image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.image, sx - this.radius, sy - this.radius, this.radius * 2, this.radius * 2);
      ctx.restore();

      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.name[0].toUpperCase(), sx, sy + 1);
    }

    // Health Bar
    const barWidth = 36;
    const barHeight = 5;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sx - barWidth / 2, sy - this.radius - 14, barWidth, barHeight);
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(sx - barWidth / 2, sy - this.radius - 14, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - barWidth / 2, sy - this.radius - 14, barWidth, barHeight);

    // Bot Label
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`[BOT] ${this.name}`, sx, sy - this.radius - 18);

    // Recall Channeling Gauge & Portal Aura
    if (this.isRecalling) {
      const channelProgress = Math.max(0, Math.min(1, 1 - (this.recallTimer / this.recallMax)));
      const chBarW = 44;
      const chBarH = 6;
      const chY = sy - this.radius - 32;

      // Gauge background
      ctx.fillStyle = "rgba(25, 10, 15, 0.85)";
      ctx.fillRect(sx - chBarW / 2, chY, chBarW, chBarH);

      // Gauge fill (crimson/orange)
      ctx.fillStyle = "#ff4757";
      ctx.fillRect(sx - chBarW / 2, chY, chBarW * channelProgress, chBarH);

      // Gauge border
      ctx.strokeStyle = "#ff6b81";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - chBarW / 2, chY, chBarW, chBarH);

      // Channeling text
      ctx.fillStyle = "#ff6b81";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`RECALLING ${this.recallTimer.toFixed(1)}s`, sx, chY - 3);

      // Teleport ring on ground
      ctx.save();
      ctx.strokeStyle = "#ff4757";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();
  }
}
