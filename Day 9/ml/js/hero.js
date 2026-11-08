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
    this.respawnMax = (typeof GAME !== "undefined" && GAME.HERO_RESPAWN_TIME) ? GAME.HERO_RESPAWN_TIME : 10;
    this.baseHealTimer = 0;

    // Recall ability
    this.isRecalling = false;
    this.recallTimer = 0;
    this.recallMax = 2.0;

    // Stun crowd-control
    this.stunTimer = 0;

    // Active Jungle Buffs { blue: seconds, red: seconds }
    this.buffs = { blue: 0, red: 0 };

    // Progression & Leveling (Levels 1 to 15)
    this.level = 1;
    this.exp = 0;
    this.maxExp = (typeof GAME !== "undefined" && GAME.LEVEL_EXP) ? GAME.LEVEL_EXP[1] : 100;
    this.skillPoints = 1; // Start with 1 skill point
    this.skillLevels = { q: 1, w: 0, e: 0, r: 0 };
    this.passiveExpTimer = 0;

    // Load sprite
    this.loadSprite();
  }

  gainExp(amount, combatTexts, particles, sound) {
    if (this.isDead || this.level >= 15) return false;
    this.exp += amount;

    const maxLvl = (typeof GAME !== "undefined" && GAME.MAX_HERO_LEVEL) ? GAME.MAX_HERO_LEVEL : 15;
    const expTable = (typeof GAME !== "undefined" && GAME.LEVEL_EXP) ? GAME.LEVEL_EXP : [0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1620, 1900, 2200, 2520, 2860, 3220];

    let leveledUp = false;
    while (this.level < maxLvl && this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.level++;
      this.skillPoints++;
      leveledUp = true;

      const hpBoost = (typeof GAME !== "undefined" && GAME.STAT_GROWTH) ? GAME.STAT_GROWTH.hpPerLevel : 65;
      const atkBoost = (typeof GAME !== "undefined" && GAME.STAT_GROWTH) ? GAME.STAT_GROWTH.atkPerLevel : 4.5;
      this.maxHp += hpBoost;
      this.hp = Math.min(this.maxHp, this.hp + hpBoost * 1.5);
      this.attackDamage += atkBoost;

      this.maxExp = expTable[this.level] || (this.maxExp * 1.25);
    }

    if (leveledUp) {
      if (particles) {
        particles.spawnRing(this.x, this.y, 50, "#ffd700", 0.6);
        particles.spawnBurst(this.x, this.y, "#ffd700", 20, 150);
      }
      if (sound && sound.playLevelUp) {
        sound.playLevelUp();
      }
      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 35,
          text: `LEVEL UP! Lv.${this.level}`,
          color: "#ffd700",
          life: 1.8,
          maxLife: 1.8
        });
      }
      return true;
    }
    return false;
  }

  setLevel(targetLevel, exp = 0) {
    const maxLvl = (typeof GAME !== "undefined" && GAME.MAX_HERO_LEVEL) ? GAME.MAX_HERO_LEVEL : 15;
    const clampedLevel = clamp(targetLevel, 1, maxLvl);
    const expTable = (typeof GAME !== "undefined" && GAME.LEVEL_EXP) ? GAME.LEVEL_EXP : [0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1620, 1900, 2200, 2520, 2860, 3220];

    const hpBoost = (typeof GAME !== "undefined" && GAME.STAT_GROWTH) ? GAME.STAT_GROWTH.hpPerLevel : 65;
    const atkBoost = (typeof GAME !== "undefined" && GAME.STAT_GROWTH) ? GAME.STAT_GROWTH.atkPerLevel : 4.5;

    // Reset base stats first
    this.maxHp = this.stats.hp;
    this.attackDamage = this.stats.atk;
    this.skillPoints = 1;

    for (let l = 2; l <= clampedLevel; l++) {
      this.skillPoints++;
      this.maxHp += hpBoost;
      this.attackDamage += atkBoost;
    }
    this.level = clampedLevel;
    this.hp = this.maxHp;
    this.exp = exp;
    this.maxExp = expTable[this.level] || (this.maxExp * 1.25);
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

  applyStun(duration, combatTexts) {
    if (this.isDead || this.hp <= 0) return;
    this.stunTimer = Math.max(this.stunTimer || 0, duration);
    if (this.isRecalling) {
      this.cancelRecall(combatTexts);
    }
    this.targetX = this.x;
    this.targetY = this.y;
    this.attackTarget = null;
    if (combatTexts) {
      combatTexts.push({
        x: this.x,
        y: this.y - 30,
        text: "STUNNED!",
        color: "#ffd700",
        life: 1.0,
        maxLife: 1.0
      });
    }
  }

  setTarget(tx, ty, map, minions, objectives, enemyBot) {
    if (this.stunTimer > 0) return; // Cannot move while stunned
    if (this.isRecalling) {
      const dist = Math.hypot(tx - this.x, ty - this.y);
      if (dist > 15) {
        this.cancelRecall();
        this.targetX = tx;
        this.targetY = ty;
      }
      return;
    }

    // Check if player clicked directly on an enemy unit (click hit radius: 38px)
    let clickedEnemy = null;
    let minClickDist = 38;

    const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
    botList.forEach(b => {
      if (!b.isDead && b.hp > 0 && b.team !== this.team) {
        const cd = Math.hypot(b.x - tx, b.y - ty);
        if (cd < minClickDist) {
          minClickDist = cd;
          clickedEnemy = b;
        }
      }
    });

    if (minions) {
      minions.forEach(m => {
        if (m.team !== this.team && !m.isDead && m.hp > 0) {
          const cd = Math.hypot(m.x - tx, m.y - ty);
          if (cd < minClickDist) {
            minClickDist = cd;
            clickedEnemy = m;
          }
        }
      });
    }

    if (map && map.turrets) {
      map.turrets.forEach(t => {
        if (t.team !== this.team && !t.destroyed && t.hp > 0) {
          const cd = Math.hypot(t.worldX - tx, t.worldY - ty);
          if (cd < minClickDist + 12) {
            minClickDist = cd;
            clickedEnemy = t;
          }
        }
      });
    }

    if (objectives) {
      if (objectives.turtle && objectives.turtle.alive) {
        const cd = Math.hypot(objectives.turtle.x - tx, objectives.turtle.y - ty);
        if (cd < minClickDist + 12) {
          minClickDist = cd;
          clickedEnemy = objectives.turtle;
        }
      }
      if (objectives.lord && objectives.lord.alive) {
        const cd = Math.hypot(objectives.lord.x - tx, objectives.lord.y - ty);
        if (cd < minClickDist + 12) {
          minClickDist = cd;
          clickedEnemy = objectives.lord;
        }
      }
      if (objectives.summonedLord && !objectives.summonedLord.isDead && objectives.summonedLord.team !== this.team) {
        const cd = Math.hypot(objectives.summonedLord.x - tx, objectives.summonedLord.y - ty);
        if (cd < minClickDist + 12) {
          minClickDist = cd;
          clickedEnemy = objectives.summonedLord;
        }
      }
      if (objectives.jungleCamps && Array.isArray(objectives.jungleCamps)) {
        objectives.jungleCamps.forEach(c => {
          if (c.alive && c.hp > 0) {
            const cd = Math.hypot(c.x - tx, c.y - ty);
            if (cd < minClickDist + 14) {
              minClickDist = cd;
              clickedEnemy = c;
            }
          }
        });
      }
    }

    if (map && map.bases) {
      const enemyBase = map.bases.find(b => b.team !== this.team && b.crystalHp > 0);
      if (enemyBase) {
        const cd = Math.hypot(enemyBase.worldX - tx, enemyBase.worldY - ty);
        if (cd < minClickDist + 18) {
          minClickDist = cd;
          clickedEnemy = enemyBase;
        }
      }
    }

    if (clickedEnemy) {
      this.attackTarget = clickedEnemy;
      const enemyX = clickedEnemy.worldX !== undefined ? clickedEnemy.worldX : clickedEnemy.x;
      const enemyY = clickedEnemy.worldY !== undefined ? clickedEnemy.worldY : clickedEnemy.y;
      const distToEnemy = Math.hypot(enemyX - this.x, enemyY - this.y);

      // If ranged and already in attack range, stop and attack immediately!
      if (this.attackRange > 130 && distToEnemy <= this.attackRange) {
        this.targetX = this.x;
        this.targetY = this.y;
        return;
      }
    }

    this.targetX = tx;
    this.targetY = ty;
  }

  takeDamage(amount, source, combatTexts, particles, sound, scoreboard) {
    if (this.isDead || this.hp <= 0) return;

    if (source) {
      this.lastAttacker = source;
    }

    if (this.isRecalling) {
      this.cancelRecall(combatTexts);
    }

    this.hp -= amount;

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

    // Lethal damage: check Immortality resurrect first before recording death!
    if (this.hp <= 0) {
      const canRevive = (this.hasRevive && !this.hasUsedRevive) ||
                        (typeof itemShop !== "undefined" && itemShop && !itemShop.hasUsedRevive && itemShop.inventory && itemShop.inventory.some(i => i.id === "immortality" || (i.stats && i.stats.revive))) ||
                        (typeof window !== "undefined" && window.itemShop && !window.itemShop.hasUsedRevive && window.itemShop.inventory && window.itemShop.inventory.some(i => i.id === "immortality" || (i.stats && i.stats.revive)));

      if (canRevive) {
        this.hasRevive = true;
        this.hasUsedRevive = true;
        if (typeof itemShop !== "undefined" && itemShop) itemShop.hasUsedRevive = true;
        if (typeof window !== "undefined" && window.itemShop) window.itemShop.hasUsedRevive = true;

        // Resurrect with small amount of health (~18% max HP) + temporary shield
        const reviveHp = Math.max(320, Math.round(this.maxHp * 0.18));
        this.hp = reviveHp;
        this.shield = (this.shield || 0) + 350;

        // Simple, clean visual resurrect effect: golden ring + sparkles + heal sound
        if (particles) {
          particles.spawnRing(this.x, this.y, 65, "#ffd700", 0.8);
          particles.spawnBurst(this.x, this.y, "#ffd700", 25, 140);
          particles.spawnBurst(this.x, this.y, "#ffffff", 12, 100);
        }
        if (sound && sound.playHeal) {
          sound.playHeal();
        }
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 35,
            text: `IMMORTALITY RESURRECT! +${reviveHp} HP`,
            color: "#ffd700",
            life: 2.0,
            maxLife: 2.0
          });
        }
        return;
      }

      this.hp = 0;
      if (source && source.team === "RED") {
        if (scoreboard) {
          scoreboard.recordKill("bot");
          scoreboard.addGold("bot", 300);
        }
      }
    }
  }

  checkWalkable(map, x, y) {
    if (map && map.turrets) {
      for (let i = 0; i < map.turrets.length; i++) {
        const t = map.turrets[i];
        if (!t.destroyed && Math.hypot(x - t.worldX, y - t.worldY) < 36) {
          return false;
        }
      }
    }
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
    if (this.isDead || this.hp <= 0) {
      if (!this.isDead) {
        const canRevive = (this.hasRevive && !this.hasUsedRevive) ||
                          (itemShop && !itemShop.hasUsedRevive && itemShop.inventory.some(i => i.id === "immortality" || (i.stats && i.stats.revive)));
        if (canRevive) {
          this.hasRevive = true;
          this.hasUsedRevive = true;
          if (itemShop) itemShop.hasUsedRevive = true;
          const reviveHp = Math.max(320, Math.round(this.maxHp * 0.18));
          this.hp = reviveHp;
          this.shield = (this.shield || 0) + 350;
          if (particles) {
            particles.spawnRing(this.x, this.y, 65, "#ffd700", 0.8);
            particles.spawnBurst(this.x, this.y, "#ffd700", 25, 140);
            particles.spawnBurst(this.x, this.y, "#ffffff", 12, 100);
          }
          if (sound && sound.playHeal) sound.playHeal();
          if (combatTexts) {
            combatTexts.push({ x: this.x, y: this.y - 35, text: `IMMORTALITY RESURRECT! +${reviveHp} HP`, color: "#ffd700", life: 2.0, maxLife: 2.0 });
          }
          return;
        }

        this.isDead = true;
        this.hp = 0;
        this.respawnTimer = this.respawnMax;
        this.attackTarget = null;
        if (this.isRecalling) {
          this.isRecalling = false;
        }
        if (gameStats) gameStats.deaths++;

        // Identify killer
        const killer = this.lastAttacker;
        let killerName = "Enemy Forces";
        let killerTeam = "RED";

        if (killer) {
          if (killer.name) {
            killerName = killer.name;
            killerTeam = killer.team || "RED";
          } else if (killer.isTurret || killer.tier) {
            killerName = `${killer.team || "Red"} Turret`;
          } else if (killer.team) {
            killerName = `${killer.team === "BLUE" ? "Blue" : "Red"} Minion`;
          }
          if (killer.kills !== undefined) {
            killer.kills++;
          }
        }

        const killText = `⚔️ ${killerName} has slain ${this.name} (YOU)!`;
        if (objectives && objectives.addAnnouncement) {
          objectives.addAnnouncement(killText, "#ff4757");
        }

        if (typeof window !== "undefined" && typeof window.triggerKillFeedEvent === "function") {
          window.triggerKillFeedEvent({
            killerName,
            killerTeam,
            victimName: `${this.name} (YOU)`,
            victimTeam: "BLUE",
            type: "kill"
          });
        }

        if (sound && sound.playAnnouncer) {
          sound.playAnnouncer("defeat");
        }

        if (scoreboard) {
          scoreboard.recordKill("bot");
          scoreboard.addGold("bot", 250);
        }

        // Clear turtle shield aura & all active skill buffs upon death!
        if (skillManager && skillManager.activeBuffs) {
          skillManager.activeBuffs.shield = 0;
          skillManager.activeBuffs.speedBoost = 0;
          skillManager.activeBuffs.attackSpeedBoost = 0;
          skillManager.activeBuffs.bonusDamage = 0;
          skillManager.activeBuffs.bonusDamageTimer = 0;
          skillManager.activeBuffs.lifesteal = 0;
        }

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

      // Lock HP to 0 while dead so no external heals/items break death state
      this.hp = 0;
      this.respawnTimer -= dt;

      if (this.respawnTimer <= 0) {
        // Respawn at Friendly Base fountain
        this.isDead = false;
        this.hp = this.maxHp;
        let respawnX = 100, respawnY = 480;
        if (map && map.bases) {
          const friendlyBase = map.bases.find(b => b.team === this.team) || map.bases[0];
          if (friendlyBase) {
            respawnX = friendlyBase.worldX;
            respawnY = friendlyBase.worldY;
          }
        }
        this.x = respawnX;
        this.y = respawnY;
        this.targetX = respawnX;
        this.targetY = respawnY;
        this.attackTarget = null;

        // Ensure shield and buffs are clean upon respawn
        this.hasUsedRevive = false;
        if (itemShop) itemShop.hasUsedRevive = false;
        if (skillManager && skillManager.activeBuffs) {
          skillManager.activeBuffs.shield = 0;
          skillManager.activeBuffs.speedBoost = 0;
          skillManager.activeBuffs.attackSpeedBoost = 0;
          skillManager.activeBuffs.bonusDamage = 0;
          skillManager.activeBuffs.bonusDamageTimer = 0;
          skillManager.activeBuffs.lifesteal = 0;
        }

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

    // Stun crowd-control handling
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      this.targetX = this.x;
      this.targetY = this.y;
      this.attackTarget = null;
      return; // Cannot move, attack, or channel recall while stunned
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

    // Passive EXP gain over time (+2 EXP/s)
    this.passiveExpTimer = (this.passiveExpTimer || 0) + dt;
    if (this.passiveExpTimer >= 1.0) {
      this.passiveExpTimer -= 1.0;
      this.gainExp(2, combatTexts, particles, sound);
    }

    // Active Jungle Buffs decay
    if (this.buffs) {
      if (this.buffs.blue > 0) this.buffs.blue = Math.max(0, this.buffs.blue - dt);
      if (this.buffs.red > 0) this.buffs.red = Math.max(0, this.buffs.red - dt);
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

    // Turret solid collision & unstuck separation
    if (map && map.turrets) {
      const minTurretDist = 38;
      for (let i = 0; i < map.turrets.length; i++) {
        const t = map.turrets[i];
        if (t.destroyed) continue;
        const td = Math.hypot(this.x - t.worldX, this.y - t.worldY);
        if (td < minTurretDist) {
          const pushAngle = td > 1 ? Math.atan2(this.y - t.worldY, this.x - t.worldX) : -Math.PI / 2;
          this.x = t.worldX + Math.cos(pushAngle) * minTurretDist;
          this.y = t.worldY + Math.sin(pushAngle) * minTurretDist;
          if (Math.hypot(this.targetX - t.worldX, this.targetY - t.worldY) < 32) {
            this.targetX = this.x;
            this.targetY = this.y;
          }
        }
      }
    }

    // Multi-ring emergency unstuck: if hero is trapped inside/against a wall, search radially for nearest safe ground
    if (map && !this.checkWalkable(map, this.x, this.y)) {
      let freed = false;
      for (let dist = 6; dist <= 72; dist += 6) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const testX = this.x + Math.cos(angle) * dist;
          const testY = this.y + Math.sin(angle) * dist;
          if (this.checkWalkable(map, testX, testY)) {
            this.x = testX;
            this.y = testY;
            freed = true;
            break;
          }
        }
        if (freed) break;
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
      const targetX = this.attackTarget.worldX !== undefined ? this.attackTarget.worldX : this.attackTarget.x;
      const targetY = this.attackTarget.worldY !== undefined ? this.attackTarget.worldY : this.attackTarget.y;
      const d = getDistance(this.x, this.y, targetX, targetY);
      if (isDead || d > this.attackRange + 30) {
        this.attackTarget = null;
      }
    }

    // Find target if none
    if (!this.attackTarget) {
      const potentialTargets = [];

      // Enemy Bot Heroes
      const activeBots = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
      activeBots.forEach(b => {
        if (!b.isDead && b.hp > 0 && b.team !== this.team) {
          const d = getDistance(this.x, this.y, b.x, b.y);
          if (d <= this.attackRange) potentialTargets.push({ unit: b, dist: d, priority: 0.8 });
        }
      });

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

      // River Bosses (Turtle / Lord / Enemy Summoned Lord)
      if (objectives) {
        // Neutral Bosses (Turtle / Lord) only targeted if player attacked or clicked them, or boss is attacking player
        if (objectives.turtle && objectives.turtle.alive && (this.attackTarget === objectives.turtle || objectives.turtle.target === this || objectives.turtle.lastAttacker === this)) {
          const d = getDistance(this.x, this.y, objectives.turtle.x, objectives.turtle.y);
          if (d <= this.attackRange) potentialTargets.push({ unit: objectives.turtle, dist: d, priority: 3 });
        }
        if (objectives.lord && objectives.lord.alive && (this.attackTarget === objectives.lord || objectives.lord.target === this || objectives.lord.lastAttacker === this)) {
          const d = getDistance(this.x, this.y, objectives.lord.x, objectives.lord.y);
          if (d <= this.attackRange) potentialTargets.push({ unit: objectives.lord, dist: d, priority: 3 });
        }
        if (objectives.summonedLord && !objectives.summonedLord.isDead && objectives.summonedLord.team !== this.team) {
          const d = getDistance(this.x, this.y, objectives.summonedLord.x, objectives.summonedLord.y);
          if (d <= this.attackRange + 15) potentialTargets.push({ unit: objectives.summonedLord, dist: d, priority: 1.2 });
        }
        // Neutral Jungle Camps: ONLY target if the camp is provoked / in combat or manually targeted! Never auto-attack when just moving past!
        if (objectives.jungleCamps && Array.isArray(objectives.jungleCamps)) {
          objectives.jungleCamps.forEach(c => {
            if (c.alive && c.hp > 0 && (this.attackTarget === c || c.target === this || c.lastAttacker === this)) {
              const d = getDistance(this.x, this.y, c.x, c.y);
              if (d <= this.attackRange + 25) {
                potentialTargets.push({ unit: c, dist: d, priority: 3.5 });
              }
            }
          });
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

      // Cursor-directed aim: bias toward targets nearest to cursor pointer
      const aimX = (typeof Input !== "undefined" && typeof camera !== "undefined") ? (Input.mouseX + camera.x) : this.x;
      const aimY = (typeof Input !== "undefined" && typeof camera !== "undefined") ? (Input.mouseY + camera.y) : this.y;

      potentialTargets.sort((a, b) => {
        const ax = a.unit.worldX !== undefined ? a.unit.worldX : a.unit.x;
        const ay = a.unit.worldY !== undefined ? a.unit.worldY : a.unit.y;
        const bx = b.unit.worldX !== undefined ? b.unit.worldX : b.unit.x;
        const by = b.unit.worldY !== undefined ? b.unit.worldY : b.unit.y;
        const aimA = Math.hypot(ax - aimX, ay - aimY);
        const aimB = Math.hypot(bx - aimX, by - aimY);
        return (a.priority * 70 + aimA) - (b.priority * 70 + aimB);
      });

      if (potentialTargets.length > 0) {
        this.attackTarget = potentialTargets[0].unit;
      }
    }

    // Perform Attack
    if (this.attackTarget && this.attackTimer <= 0) {
      let cooldown = this.attackCooldown;
      if (skillManager && skillManager.activeBuffs && skillManager.activeBuffs.attackSpeedBoost > 1) {
        cooldown /= skillManager.activeBuffs.attackSpeedBoost;
      }
      this.attackTimer = cooldown;
      const tx = this.attackTarget.worldX !== undefined ? this.attackTarget.worldX : this.attackTarget.x;
      const ty = this.attackTarget.worldY !== undefined ? this.attackTarget.worldY : this.attackTarget.y;

      let effectiveDmg = this.attackDamage;
      if (skillManager && skillManager.activeBuffs && skillManager.activeBuffs.bonusDamage > 0) {
        effectiveDmg += skillManager.activeBuffs.bonusDamage;
      }

      // Red Buff True Damage & Slow
      if (this.buffs && this.buffs.red > 0) {
        const bonusTrueDmg = 35 + Math.round(this.level * 4);
        effectiveDmg += bonusTrueDmg;
        if (particles && particles.spawnBurst) particles.spawnBurst(tx, ty, "#ff4757", 5, 80);
        if (combatTexts) {
          combatTexts.push({
            x: tx + (Math.random() - 0.5) * 14,
            y: ty - 32,
            text: `[TRUE] +${bonusTrueDmg}`,
            color: "#ff4757",
            life: 0.8,
            maxLife: 0.8
          });
        }
      }

      // Spawn projectile if ranged or instant strike if melee
      const isRanged = this.attackRange > 130;
      if (gameStats) gameStats.damageDealt += effectiveDmg;

      if (sound) {
        if (isRanged) sound.playShoot();
        else if (sound.playSlash) sound.playSlash();
        else sound.playAttack();
      }

      if (isRanged) {
        let projColor = "#f1c40f";
        if (this.id === "angela") projColor = "#ff7675";
        else if (this.id === "pharsa") projColor = "#9b59b6";
        else if (this.id === "nana") projColor = "#2ecc71";
        else if (this.id === "layla") projColor = "#3498db";

        if (particles) {
          particles.spawnBurst(tx, ty, projColor, 6, 80);
        }
        if (map && map.projectiles) {
          map.projectiles.push({
            x: this.x,
            y: this.y,
            target: this.attackTarget,
            attacker: this,
            speed: 460,
            damage: effectiveDmg,
            team: this.team,
            color: projColor,
            radius: this.id === "angela" ? 5 : 4
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
        if (typeof this.attackTarget.takeDamage === "function") {
          this.attackTarget.takeDamage(effectiveDmg, this, combatTexts, particles, sound, scoreboard);
        } else if (this.attackTarget.hp !== undefined) {
          this.attackTarget.lastAttacker = this;
          const prevHp = this.attackTarget.hp || 0;
          this.attackTarget.hp = Math.max(0, this.attackTarget.hp - effectiveDmg);
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
            this.gainExp(GAME.EXP_REWARDS.minion, combatTexts, particles, sound);
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

    // Render Blue & Red buff auras
    if (this.buffs) {
      if (this.buffs.blue > 0) {
        ctx.strokeStyle = "rgba(0, 210, 211, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this.buffs.red > 0) {
        ctx.strokeStyle = "rgba(231, 76, 60, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius + (this.buffs.blue > 0 ? 8 : 5), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

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

    // Level badge next to health bar
    const lvl = this.level || 1;
    ctx.fillStyle = "rgba(10, 15, 30, 0.9)";
    ctx.beginPath();
    ctx.arc(sx - barWidth / 2 - 7, sy - this.radius - 11.5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${lvl}`, sx - barWidth / 2 - 7, sy - this.radius - 11);

    // Name label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
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

    // Overhead Spinning Golden Stun Stars
    if (this.stunTimer > 0) {
      const starY = sy - this.radius - 28;
      const angle = (Date.now() / 140) % (Math.PI * 2);
      ctx.save();
      ctx.fillStyle = "#ffd700";
      ctx.strokeStyle = "#b8860b";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const a = angle + (i * Math.PI * 2 / 3);
        const starX = sx + Math.cos(a) * 13;
        const sY = starY + Math.sin(a) * 5;
        ctx.beginPath();
        ctx.arc(starX, sY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

if (typeof window !== "undefined") window.Hero = Hero;
if (typeof global !== "undefined") global.Hero = Hero;
