/**
 * Hero class - movement, combat stats, rendering
 */

class Hero {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.lane = data.lane;
    this.color = data.color;
    this.spritePath = data.sprite;
    this.stats = { ...data.stats };

    // State
    this.team = "BLUE";
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.x = 100;
    this.y = 480;
    this.targetX = 100;
    this.targetY = 480;
    this.speed = this.stats.spd * 45; // pixels per second
    this.radius = 18;
    this.image = null;
    this.loaded = false;

    // Combat
    this.attackRange = this.stats.range ? this.stats.range : 75;
    this.attackDamage = this.stats.atk || 100;
    this.attackCooldown = 0.8;
    this.attackTimer = 0;
    this.attackTarget = null;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnMax = 5;
    this.baseHealTimer = 0;

    // Recall ability
    this.isRecalling = false;
    this.recallTimer = 0;
    this.recallMax = 2.0;

    // Load sprite
    this.loadSprite();
  }

  async loadSprite() {
    try {
      this.image = await loadImage(`${this.spritePath}idle.png`);
      this.loaded = true;
    } catch (e) {
      this.loaded = false;
    }
  }

  startRecall(combatTexts, sound) {
    if (this.isDead || this.hp <= 0) return false;
    if (this.isRecalling) return false;

    // If already inside friendly base fountain at full HP
    const distToBase = Math.hypot(this.x - 100, this.y - 480);
    if (distToBase <= 100 && this.hp >= this.maxHp) {
      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 30,
          text: "ALREADY IN BASE",
          color: "#00d2d3",
          life: 0.8,
          maxLife: 0.8
        });
      }
      return false;
    }

    this.isRecalling = true;
    this.recallTimer = this.recallMax;
    this.targetX = this.x;
    this.targetY = this.y;
    this.attackTarget = null;

    if (sound && sound.playRecall) {
      sound.playRecall();
    }
    if (combatTexts) {
      combatTexts.push({
        x: this.x,
        y: this.y - 30,
        text: "RECALLING...",
        color: "#00d2d3",
        life: 0.8,
        maxLife: 0.8
      });
    }
    return true;
  }

  cancelRecall(combatTexts) {
    if (!this.isRecalling) return;
    this.isRecalling = false;
    this.recallTimer = 0;
    if (combatTexts) {
      combatTexts.push({
        x: this.x,
        y: this.y - 30,
        text: "RECALL CANCELLED",
        color: "#ff6b6b",
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  setTarget(tx, ty) {
    if (this.isRecalling) {
      const dist = Math.hypot(tx - this.x, ty - this.y);
      if (dist > 15) {
        this.cancelRecall();
        this.targetX = tx;
        this.targetY = ty;
      }
      return;
    }
    this.targetX = tx;
    this.targetY = ty;
  }

  takeDamage(amount, source, combatTexts, particles, sound, scoreboard) {
    if (this.isDead || this.hp <= 0) return;

    if (this.isRecalling) {
      this.cancelRecall(combatTexts);
    }

    this.hp = Math.max(0, this.hp - amount);

    if (particles) {
      particles.spawnBurst(this.x, this.y, "#ff4757", 6, 90);
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

    if (this.hp <= 0 && source && source.team === "RED") {
      if (scoreboard) {
        scoreboard.recordKill("bot");
        scoreboard.addGold("bot", 300);
      }
    }
  }

  checkWalkable(map, x, y) {
    const r = this.radius * 0.7;
    const points = [
      { x: x - r, y: y - r },
      { x: x + r, y: y - r },
      { x: x - r, y: y + r },
      { x: x + r, y: y + r }
    ];
    return points.every(p => {
      const tx = Math.floor(p.x / map.tileSize);
      const ty = Math.floor(p.y / map.tileSize);
      return map.isWalkable(tx, ty);
    });
  }

  update(map, dt, minions, combatTexts, gameStats, skillManager, itemShop, objectives, enemyBot, sound, particles, scoreboard) {
    // Respawn handling & Immortality check
    if (this.hp <= 0) {
      if (itemShop && !itemShop.hasUsedRevive && itemShop.inventory.some(i => i.stats && i.stats.revive)) {
        itemShop.hasUsedRevive = true;
        this.hp = Math.floor(this.maxHp * 0.35);
        if (combatTexts) {
          combatTexts.push({ x: this.x, y: this.y - 30, text: "IMMORTALITY REVIVE!", color: "#ffd700", life: 1.8, maxLife: 1.8 });
        }
        return;
      }

      if (!this.isDead) {
        this.isDead = true;
        this.respawnTimer = this.respawnMax;
        if (gameStats) gameStats.deaths++;
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 30,
            text: "DEFEATED",
            color: "#e74c3c",
            life: 2,
            maxLife: 2
          });
        }
      }

      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        // Respawn at Blue base
        this.isDead = false;
        this.hp = this.maxHp;
        this.x = 100;
        this.y = 480;
        this.targetX = 100;
        this.targetY = 480;
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 30,
            text: "RESPAWNED",
            color: "#3498db",
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

      // Swirling cyan rings & portal sparks
      if (particles && Math.random() < 0.35) {
        particles.spawnRing(this.x, this.y, 35, "#00d2d3", 0.4);
      }
      if (particles && Math.random() < 0.3) {
        particles.spawnBurst(this.x, this.y - 10, "#00ffff", 3, 50);
      }

      if (this.recallTimer <= 0) {
        this.isRecalling = false;
        this.recallTimer = 0;

        // Teleport to Blue Base crystal
        this.x = 100;
        this.y = 480;
        this.targetX = 100;
        this.targetY = 480;
        this.attackTarget = null;

        if (particles) {
          particles.spawnRing(this.x, this.y, 65, "#00ffff", 0.6);
          particles.spawnBurst(this.x, this.y, "#00d2d3", 25, 140);
        }
        if (sound && sound.playTeleport) {
          sound.playTeleport();
        }
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 30,
            text: "RECALLED TO BASE!",
            color: "#00ffff",
            life: 1.8,
            maxLife: 1.8
          });
        }
      }
      return; // Do not walk or auto-attack while channeling recall
    }

    // Movement with speed boosts
    let currentSpeed = this.speed;
    if (skillManager && skillManager.activeBuffs && skillManager.activeBuffs.speedBoost > 0) {
      currentSpeed *= 1.5;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 6) {
      const step = currentSpeed * dt;
      const stepX = (dx / dist) * Math.min(step, dist);
      const stepY = (dy / dist) * Math.min(step, dist);

      const nextX = this.x + stepX;
      const nextY = this.y + stepY;

      if (this.checkWalkable(map, nextX, this.y)) {
        this.x = nextX;
      }
      if (this.checkWalkable(map, this.x, nextY)) {
        this.y = nextY;
      }
    }

    // Base Fountain Continuous Healing (Friendly Blue Base)
    if (map && map.bases) {
      const friendlyBase = map.bases.find(b => b.team === this.team);
      if (friendlyBase) {
        const distToBase = getDistance(this.x, this.y, friendlyBase.worldX, friendlyBase.worldY);
        if (distToBase <= 120 && this.hp < this.maxHp) {
          // Continuously heal +20% max HP per second
          const healAmount = this.maxHp * 0.20 * dt;
          this.hp = Math.min(this.maxHp, this.hp + healAmount);

          if (particles && Math.random() < 0.35) {
            particles.spawnTrail(this.x, this.y, "#2ecc71", 3.5);
          }

          this.baseHealTimer = (this.baseHealTimer || 0) + dt;
          if (this.baseHealTimer >= 0.5) {
            this.baseHealTimer = 0;
            if (combatTexts) {
              combatTexts.push({
                x: this.x + (Math.random() - 0.5) * 14,
                y: this.y - 25,
                text: `+${Math.round(this.maxHp * 0.10)} HP`,
                color: "#2ecc71",
                life: 0.8,
                maxLife: 0.8
              });
            }
          }
        }
      }
    }

    // Combat logic
    this.attackTimer -= dt;

    // Verify current target
    if (this.attackTarget) {
      const isDead = this.attackTarget.hp <= 0 || this.attackTarget.destroyed;
      const d = getDistance(this.x, this.y, this.attackTarget.x || this.attackTarget.worldX, this.attackTarget.y || this.attackTarget.worldY);
      if (isDead || d > this.attackRange + 30) {
        this.attackTarget = null;
      }
    }

    // Find target if none
    if (!this.attackTarget) {
      const potentialTargets = [];

      // Enemy Bot Hero
      if (enemyBot && !enemyBot.isDead && enemyBot.hp > 0 && enemyBot.team !== this.team) {
        const d = getDistance(this.x, this.y, enemyBot.x, enemyBot.y);
        if (d <= this.attackRange) potentialTargets.push({ unit: enemyBot, dist: d, priority: 0.8 });
      }

      // Enemy Minions
      if (minions) {
        minions.forEach(m => {
          if (m.team !== this.team && m.hp > 0) {
            const d = getDistance(this.x, this.y, m.x, m.y);
            if (d <= this.attackRange) potentialTargets.push({ unit: m, dist: d, priority: 1 });
          }
        });
      }

      // Enemy Turrets
      if (map && map.turrets) {
        map.turrets.forEach(t => {
          if (t.team !== this.team && !t.destroyed && t.hp > 0) {
            const d = getDistance(this.x, this.y, t.worldX, t.worldY);
            if (d <= this.attackRange) potentialTargets.push({ unit: t, dist: d, priority: 2 });
          }
        });
      }

      // River Bosses (Turtle / Lord)
      if (objectives) {
        if (objectives.turtle && objectives.turtle.alive) {
          const d = getDistance(this.x, this.y, objectives.turtle.x, objectives.turtle.y);
          if (d <= this.attackRange) potentialTargets.push({ unit: objectives.turtle, dist: d, priority: 3 });
        }
        if (objectives.lord && objectives.lord.alive) {
          const d = getDistance(this.x, this.y, objectives.lord.x, objectives.lord.y);
          if (d <= this.attackRange) potentialTargets.push({ unit: objectives.lord, dist: d, priority: 3 });
        }
      }

      // Enemy Base Crystal
      if (map && map.bases) {
        const enemyBase = map.bases.find(b => b.team !== this.team);
        if (enemyBase && enemyBase.crystalHp > 0) {
          const d = getDistance(this.x, this.y, enemyBase.worldX, enemyBase.worldY);
          if (d <= this.attackRange + 20) potentialTargets.push({ unit: enemyBase, dist: d, priority: 4 });
        }
      }

      potentialTargets.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
      if (potentialTargets.length > 0) {
        this.attackTarget = potentialTargets[0].unit;
      }
    }

    // Perform Attack
    if (this.attackTarget && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      const tx = this.attackTarget.x !== undefined ? this.attackTarget.x : this.attackTarget.worldX;
      const ty = this.attackTarget.y !== undefined ? this.attackTarget.y : this.attackTarget.worldY;

      // Spawn projectile if ranged or instant strike if melee
      const isRanged = this.attackRange > 130;
      if (gameStats) gameStats.damageDealt += this.attackDamage;

      if (sound) {
        if (isRanged) sound.playShoot();
        else if (sound.playSlash) sound.playSlash();
        else sound.playAttack();
      }

      if (isRanged) {
        if (particles) {
          particles.spawnBurst(tx, ty, "#ffd700", 6, 80);
        }
        if (map && map.projectiles) {
          map.projectiles.push({
            x: this.x,
            y: this.y,
            target: this.attackTarget,
            speed: 450,
            damage: this.attackDamage,
            team: this.team,
            color: "#f1c40f",
            radius: 4
          });
        }
      } else {
        // Melee slash visual effect & hit sparks
        if (particles) {
          if (particles.spawnSlash) {
            particles.spawnSlash(this.x, this.y, tx, ty, this.color || "#ffd700", 42);
          }
          particles.spawnBurst(tx, ty, "#ffffff", 8, 110);
        }

        // Direct melee strike
        if (enemyBot && this.attackTarget === enemyBot) {
          enemyBot.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
        } else if (this.attackTarget.hp !== undefined) {
          const prevHp = this.attackTarget.hp || 0;
          this.attackTarget.hp = Math.max(0, this.attackTarget.hp - this.attackDamage);
          if (prevHp > 0 && this.attackTarget.hp <= 0 && this.attackTarget.bounty) {
            const bounty = this.attackTarget.bounty;
            if (gameStats) {
              gameStats.minionsKilled++;
              gameStats.gold += bounty;
            }
            if (scoreboard) {
              scoreboard.addCS("player");
              scoreboard.addGold("player", bounty);
            }
            if (combatTexts) {
              combatTexts.push({
                x: tx,
                y: ty - 32,
                text: `+${bounty}g`,
                color: "#ffd700",
                life: 1.5,
                maxLife: 1.5
              });
            }
          }
        } else if (this.attackTarget.crystalHp !== undefined) {
          this.attackTarget.crystalHp = Math.max(0, this.attackTarget.crystalHp - this.attackDamage);
        }

        if (combatTexts) {
          combatTexts.push({
            x: tx + (Math.random() - 0.5) * 15,
            y: ty - 18,
            text: `-${Math.round(this.attackDamage)}`,
            color: "#f1c40f",
            life: 0.7,
            maxLife: 0.7
          });
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    if (sx < -60 || sx > GAME.CANVAS_WIDTH + 60 || sy < -60 || sy > GAME.CANVAS_HEIGHT + 60) return;

    ctx.save();

    // Attack Range circle zone (tactical dashed neon indicator)
    ctx.strokeStyle = "rgba(78, 204, 163, 0.45)";
    ctx.fillStyle = "rgba(78, 204, 163, 0.04)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(sx, sy, this.attackRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Selection aura under hero
    ctx.fillStyle = "rgba(78, 204, 163, 0.25)";
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius + 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw sprite or circular portrait
    if (this.loaded && this.image) {
      // Circular clip portrait
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        this.image,
        sx - this.radius,
        sy - this.radius,
        this.radius * 2,
        this.radius * 2
      );
      ctx.restore();

      // Border ring
      ctx.strokeStyle = "#4ecca3";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Fallback: colored circle hero
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.name[0].toUpperCase(), sx, sy + 1);
    }

    // Health bar above hero
    const barWidth = 36;
    const barHeight = 5;
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sx - barWidth / 2, sy - this.radius - 14, barWidth, barHeight);
    ctx.fillStyle = hpPercent > 0.4 ? "#2ecc71" : "#e74c3c";
    ctx.fillRect(sx - barWidth / 2, sy - this.radius - 14, barWidth * hpPercent, barHeight);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - barWidth / 2, sy - this.radius - 14, barWidth, barHeight);

    // Name label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.name, sx, sy - this.radius - 18);

    // Recall Channeling Gauge & Portal Aura
    if (this.isRecalling) {
      const channelProgress = Math.max(0, Math.min(1, 1 - (this.recallTimer / this.recallMax)));
      const chBarW = 44;
      const chBarH = 6;
      const chY = sy - this.radius - 32;

      // Gauge background
      ctx.fillStyle = "rgba(10, 20, 35, 0.85)";
      ctx.fillRect(sx - chBarW / 2, chY, chBarW, chBarH);

      // Gauge fill
      ctx.fillStyle = "#00d2d3";
      ctx.fillRect(sx - chBarW / 2, chY, chBarW * channelProgress, chBarH);

      // Gauge border
      ctx.strokeStyle = "#54a0ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - chBarW / 2, chY, chBarW, chBarH);

      // Channeling text
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`RECALLING ${this.recallTimer.toFixed(1)}s`, sx, chY - 3);

      // Teleport ring on ground
      ctx.save();
      ctx.strokeStyle = "#00d2d3";
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
