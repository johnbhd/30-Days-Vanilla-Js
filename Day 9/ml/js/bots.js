/**
 * Bot AI Engine - Multi-Team Computer-Controlled Champions (Blue & Red)
 * Phase 4 implementation + Multi-Format (1v1, 2v2, 3v3) Team Clash & Lane AI
 */

class BotHero {
  constructor(heroData, lane = "MID", team = "RED") {
    this.id = heroData.id;
    this.name = heroData.name;
    this.role = heroData.role;
    this.lane = (lane || "MID").toUpperCase();
    this.assignedLane = this.lane;

    // Map lane to Y pixel coordinate
    if (this.lane.includes("GOLD") || this.lane.includes("TOP")) {
      this.laneY = 6 * 40; // 240px (Top Lane)
    } else if (this.lane.includes("EXP") || this.lane.includes("BOT")) {
      this.laneY = 18 * 40; // 720px (Bottom Lane)
    } else {
      this.laneY = 12 * 40; // 480px (Mid Lane)
    }
    this.assignedLaneY = this.laneY;

    this.team = (team || "RED").toUpperCase();
    this.color = heroData.color || (this.team === "BLUE" ? "#4ecca3" : "#e74c3c");
    this.spritePath = heroData.sprite;
    this.stats = { ...heroData.stats };

    this.hp = this.stats.hp || 2400;
    this.maxHp = this.hp;
    this.radius = 18;

    // Base Spawns & March Target
    if (this.team === "BLUE") {
      this.spawnX = 2 * 40; // 80px (Blue Base)
      this.spawnY = 12 * 40; // 480px
      this.targetX = 29 * 40; // March towards Red Base
    } else {
      this.spawnX = 29 * 40; // 1160px (Red Base)
      this.spawnY = 12 * 40; // 480px
      this.targetX = 2 * 40; // March towards Blue Base
    }
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.targetY = this.laneY;

    this.speed = (this.stats.spd || 3.8) * 44;
    this.attackRange = this.stats.range ? this.stats.range : 75;
    this.attackDamage = this.stats.atk || 110;
    this.attackCooldown = 0.9;
    this.attackTimer = 0;

    // Hero-specific signature burst and magical skills
    this.skills = this.initHeroSkills(heroData);

    // State: "LANING", "COMBAT", "RETREAT", "CLASH", "OBJECTIVE", "DEAD"
    this.state = "LANING";
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnMax = (typeof GAME !== "undefined" && GAME.HERO_RESPAWN_TIME) ? GAME.HERO_RESPAWN_TIME : 10;

    // Roaming & Dynamic Team Clash System
    this.roamTimer = Math.random() * 20 + 25; // 25 to 45 seconds between roaming plans
    this.isClashing = false;
    this.clashDuration = 0;

    // Recall ability & retreat safety
    this.isRecalling = false;
    this.recallTimer = 0;
    this.recallMax = 2.0;
    this.recallCooldown = 0;
    this.recentDamageTimer = 0;

    // Stun crowd-control
    this.stunTimer = 0;

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

    // Progression & Leveling (Levels 1 to 15)
    this.level = 1;
    this.exp = 0;
    this.maxExp = (typeof GAME !== "undefined" && GAME.LEVEL_EXP) ? GAME.LEVEL_EXP[1] : 100;
    this.skillPoints = 1;
    this.skillLevels = { q: 1, w: 0, e: 0, r: 0 };
    this.passiveExpTimer = 0;
  }

  initHeroSkills(heroData) {
    const heroId = (heroData && heroData.id) ? heroData.id.toLowerCase() : "default";

    // Signature kit presets with custom burst and magical damages
    const signatureKits = {
      gusion: {
        q: { name: "Sword Spike", cd: 0, maxCd: 5, damage: 320, range: 350 },
        w: { name: "Shadowblade", cd: 0, maxCd: 6, damage: 600, range: 300 },
        r: { name: "Blade Barrage", cd: 0, maxCd: 20, damage: 880, range: 360 }
      },
      layla: {
        q: { name: "Malefic Bomb", cd: 0, maxCd: 4, damage: 360, range: 480 },
        w: { name: "Void Projectile", cd: 0, maxCd: 7, damage: 310, range: 420 },
        r: { name: "Destruction Rush", cd: 0, maxCd: 22, damage: 880, range: 550 }
      },
      miya: {
        q: { name: "Moon Arrow", cd: 0, maxCd: 5, damage: 480, range: 420 },
        w: { name: "Arrow of Eclipse", cd: 0, maxCd: 7, damage: 340, range: 380 },
        r: { name: "Hidden Moonlight", cd: 0, maxCd: 24, damage: 420, range: 320 }
      },
      angela: {
        q: { name: "Love Waves", cd: 0, maxCd: 5, damage: 290, range: 360 },
        w: { name: "Puppet String", cd: 0, maxCd: 8, damage: 340, range: 320 },
        r: { name: "Heartguard", cd: 0, maxCd: 25, damage: 460, range: 400 }
      },
      pharsa: {
        q: { name: "Curse of Crow", cd: 0, maxCd: 5, damage: 320, range: 440 },
        w: { name: "Energy Impact", cd: 0, maxCd: 6, damage: 420, range: 480 },
        r: { name: "Feathered Air Strike", cd: 0, maxCd: 24, damage: 1280, range: 520 }
      },
      nana: {
        q: { name: "Magic Boomerang", cd: 0, maxCd: 5, damage: 320, range: 420 },
        w: { name: "Molina Smooch", cd: 0, maxCd: 8, damage: 310, range: 340 },
        r: { name: "Molina Blitz", cd: 0, maxCd: 22, damage: 1020, range: 400 }
      },
      tigreal: {
        q: { name: "Attack Wave", cd: 0, maxCd: 5, damage: 220, range: 250 },
        w: { name: "Sacred Hammer", cd: 0, maxCd: 8, damage: 260, range: 180 },
        r: { name: "Implosion", cd: 0, maxCd: 25, damage: 420, range: 200 }
      },
      alucard: {
        q: { name: "Groundsplitter", cd: 0, maxCd: 6, damage: 280, range: 240 },
        w: { name: "Whirling Smash", cd: 0, maxCd: 5, damage: 260, range: 180 },
        r: { name: "Fission Wave", cd: 0, maxCd: 22, damage: 480, range: 320 }
      },
      balmond: {
        q: { name: "Soul Lock", cd: 0, maxCd: 6, damage: 220, range: 220 },
        w: { name: "Cyclone Sweep", cd: 0, maxCd: 5, damage: 280, range: 160 },
        r: { name: "Lethal Counter", cd: 0, maxCd: 20, damage: 580, range: 220 }
      },
      saber: {
        q: { name: "Flying Sword", cd: 0, maxCd: 5, damage: 240, range: 280 },
        w: { name: "Charge", cd: 0, maxCd: 6, damage: 220, range: 200 },
        r: { name: "Triple Sweep", cd: 0, maxCd: 22, damage: 620, range: 240 }
      }
    };

    if (signatureKits[heroId]) {
      return JSON.parse(JSON.stringify(signatureKits[heroId]));
    }

    if (typeof HERO_SKILLS !== "undefined" && HERO_SKILLS[heroId]) {
      const hs = HERO_SKILLS[heroId];
      return {
        q: { name: hs.q.name, cd: 0, maxCd: hs.q.cooldown, damage: 220, range: hs.q.range || 220 },
        w: { name: hs.w.name, cd: 0, maxCd: hs.w.cooldown, damage: 260, range: hs.w.range || 200 },
        r: { name: hs.r.name, cd: 0, maxCd: hs.r.cooldown, damage: 520, range: hs.r.range || 320 }
      };
    }

    return {
      q: { name: "Skill 1", cd: 0, maxCd: 5, damage: 160, range: 220 },
      w: { name: "Skill 2", cd: 0, maxCd: 8, damage: 220, range: 180 },
      r: { name: "Ultimate", cd: 0, maxCd: 25, damage: 450, range: 250 }
    };
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

      // Auto-allocate skill point
      this.autoAllocateSkill();
    }

    if (leveledUp) {
      if (particles) {
        const ringCol = this.team === "BLUE" ? "#4ecca3" : "#e74c3c";
        particles.spawnRing(this.x, this.y, 45, ringCol, 0.6);
        particles.spawnBurst(this.x, this.y, ringCol, 18, 140);
      }
      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 35,
          text: `[${this.team}] ${this.name} LEVEL UP! Lv.${this.level}`,
          color: this.team === "BLUE" ? "#4ecca3" : "#ff6b81",
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
    this.maxHp = this.stats.hp || 2400;
    this.attackDamage = this.stats.atk || 110;
    this.skillPoints = 1;
    this.skillLevels = { q: 1, w: 0, e: 0, r: 0 };
    this.skills = this.initHeroSkills(this.heroData);

    for (let l = 2; l <= clampedLevel; l++) {
      this.level = l;
      this.skillPoints++;
      this.maxHp += hpBoost;
      this.attackDamage += atkBoost;
      this.autoAllocateSkill();
    }
    this.level = clampedLevel;
    this.hp = this.maxHp;
    this.exp = exp;
    this.maxExp = expTable[this.level] || (this.maxExp * 1.25);
  }

  autoAllocateSkill() {
    while (this.skillPoints > 0) {
      // Priority 1: Ultimate at Lv 4, 8, 12
      if (this.level >= 4 && this.skillLevels.r === 0) {
        this.skillLevels.r = 1;
        this.skillPoints--;
        this.skills.r.damage = Math.round(this.skills.r.damage * 1.3);
        continue;
      }
      if (this.level >= 8 && this.skillLevels.r === 1) {
        this.skillLevels.r = 2;
        this.skillPoints--;
        this.skills.r.damage = Math.round(this.skills.r.damage * 1.3);
        this.skills.r.maxCd = Math.max(16, this.skills.r.maxCd - 2);
        continue;
      }
      if (this.level >= 12 && this.skillLevels.r === 2) {
        this.skillLevels.r = 3;
        this.skillPoints--;
        this.skills.r.damage = Math.round(this.skills.r.damage * 1.3);
        this.skills.r.maxCd = Math.max(14, this.skills.r.maxCd - 2);
        continue;
      }

      // Priority 2: Q -> W balanced allocation
      if (this.skillLevels.q <= this.skillLevels.w && this.skillLevels.q < 5) {
        this.skillLevels.q++;
        this.skillPoints--;
        this.skills.q.damage = Math.round(this.skills.q.damage * 1.22);
        this.skills.q.maxCd = Math.max(3, this.skills.q.maxCd - 0.4);
      } else if (this.skillLevels.w < 5) {
        this.skillLevels.w++;
        this.skillPoints--;
        this.skills.w.damage = Math.round(this.skills.w.damage * 1.22);
        this.skills.w.maxCd = Math.max(4, this.skills.w.maxCd - 0.4);
      } else if (this.skillLevels.q < 5) {
        this.skillLevels.q++;
        this.skillPoints--;
        this.skills.q.damage = Math.round(this.skills.q.damage * 1.22);
        this.skills.q.maxCd = Math.max(3, this.skills.q.maxCd - 0.4);
      } else {
        break;
      }
    }
  }

  getLaneFrontlineBoundary(map) {
    if (!map || !map.turrets) return this.team === "BLUE" ? 1160 : 120;

    const oppTeam = this.team === "BLUE" ? "RED" : "BLUE";
    let laneTurrets = map.turrets.filter(t => t.team === oppTeam && !t.destroyed && t.lane === this.assignedLane);
    if (laneTurrets.length === 0) {
      laneTurrets = map.turrets.filter(t => t.team === oppTeam && !t.destroyed);
    }

    if (laneTurrets.length === 0) {
      return this.team === "BLUE" ? 1160 : 120;
    }

    if (this.team === "RED") {
      let frontline = laneTurrets[0];
      for (let i = 1; i < laneTurrets.length; i++) {
        if (laneTurrets[i].worldX > frontline.worldX) frontline = laneTurrets[i];
      }
      return frontline.worldX - 80;
    } else {
      let frontline = laneTurrets[0];
      for (let i = 1; i < laneTurrets.length; i++) {
        if (laneTurrets[i].worldX < frontline.worldX) frontline = laneTurrets[i];
      }
      return frontline.worldX + 80;
    }
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
    this.shield = 0;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.targetX = this.team === "BLUE" ? (29 * 40) : (2 * 40);
    this.targetY = this.assignedLaneY;
    this.laneY = this.assignedLaneY;
    this.isClashing = false;
    this.state = "LANING";
  }

  takeDamage(amount, source, combatTexts, particles, sound, scoreboard) {
    if (this.isDead || this.hp <= 0) return;

    if (this.isRecalling) {
      this.isRecalling = false;
      this.recallTimer = 0;
      this.recallCooldown = 5.0;
      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 30,
          text: `[${this.team}] RECALL INTERRUPTED!`,
          color: "#ff6b6b",
          life: 1.0,
          maxLife: 1.0
        });
      }
    }

    this.recentDamageTimer = 4.0;
    this.hp -= amount;

    // If HP drops below 28%, retreat towards friendly base
    if (this.hp < this.maxHp * 0.28) {
      this.state = "RETREAT";
      this.targetX = this.spawnX;
      this.targetY = this.spawnY;
    }

    if (particles) {
      particles.spawnBurst(this.x, this.y, this.team === "BLUE" ? "#4ecca3" : "#ff4757", 8, 100);
    }
    if (sound && sound.playHit) {
      sound.playHit();
    }
    if (combatTexts) {
      combatTexts.push({
        x: this.x + (Math.random() - 0.5) * 16,
        y: this.y - 20,
        text: `-${Math.round(amount)}`,
        color: this.team === "BLUE" ? "#ff6b81" : "#4ecca3",
        life: 0.8,
        maxLife: 0.8
      });
    }

    if (this.hp <= 0) {
      // Immortality revive check
      if (this.hasRevive && !this.hasUsedRevive) {
        this.hasUsedRevive = true;
        this.hp = Math.floor(this.maxHp * 0.35);
        if (combatTexts) {
          combatTexts.push({ x: this.x, y: this.y - 30, text: `[${this.team}] IMMORTALITY REVIVE!`, color: "#ffd700", life: 1.8, maxLife: 1.8 });
        }
        return;
      }

      this.hp = 0;
      this.isDead = true;
      this.deaths++;
      this.respawnTimer = this.respawnMax;
      this.state = "DEAD";
      this.shield = 0;

      if (combatTexts) {
        combatTexts.push({
          x: this.x,
          y: this.y - 35,
          text: `[${this.team}] ${this.name.toUpperCase()} SLAIN!`,
          color: "#ffd700",
          life: 2.2,
          maxLife: 2.2
        });
      }

      if (source && source.team !== this.team) {
        if (source.team === "BLUE" && sound && sound.playAnnouncer) sound.playAnnouncer("kill");
        if (scoreboard) {
          if (source.team === "BLUE") {
            scoreboard.recordKill("player");
            scoreboard.addGold("player", 250);
          } else {
            scoreboard.recordKill("bot");
            scoreboard.addGold("bot", 250);
          }
        }
      }
    }
  }

  applyStun(duration, combatTexts) {
    if (this.isDead || this.hp <= 0) return;
    this.stunTimer = Math.max(this.stunTimer || 0, duration);
    if (this.isRecalling) {
      this.isRecalling = false;
      this.recallTimer = 0;
      this.recallCooldown = 5.0;
    }
    this.recentDamageTimer = 3.0;
    this.targetX = this.x;
    this.targetY = this.y;
    if (combatTexts) {
      combatTexts.push({
        x: this.x,
        y: this.y - 28,
        text: "STUNNED!",
        color: "#ffd700",
        life: 1.0,
        maxLife: 1.0
      });
    }
  }

  update(dt, player, minionManager, map, combatTexts, sound, particles, scoreboard, objectiveManager, allBots) {
    // 1. Respawn timer (never freeze even if external heals hit dead bot)
    if (this.isDead || this.hp <= 0) {
      if (!this.isDead) {
        if (this.hasRevive && !this.hasUsedRevive) {
          this.hasUsedRevive = true;
          this.hp = Math.floor(this.maxHp * 0.35);
          if (combatTexts) {
            combatTexts.push({ x: this.x, y: this.y - 30, text: `[${this.team}] IMMORTALITY REVIVE!`, color: "#ffd700", life: 1.8, maxLife: 1.8 });
          }
          return;
        }

        this.hp = 0;
        this.isDead = true;
        this.deaths++;
        this.respawnTimer = this.respawnMax;
        this.state = "DEAD";
        this.shield = 0;
      }

      this.hp = 0;
      this.shield = 0;
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawn();
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 25,
            text: `[${this.team}] ${this.name} RESPAWNED!`,
            color: this.color,
            life: 1.5,
            maxLife: 1.5
          });
        }
      }
      return;
    }

    // Stun crowd-control
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      this.targetX = this.x;
      this.targetY = this.y;
      return;
    }

    // Recall Channeling (2.0s duration)
    if (this.isRecalling) {
      this.recallTimer -= dt;

      if (particles && Math.random() < 0.35) {
        particles.spawnRing(this.x, this.y, 35, this.team === "BLUE" ? "#4ecca3" : "#e74c3c", 0.4);
      }

      if (this.recallTimer <= 0) {
        this.isRecalling = false;
        this.recallTimer = 0;

        // Teleport to Base
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.targetX = this.spawnX;
        this.targetY = this.spawnY;

        if (particles) {
          particles.spawnRing(this.x, this.y, 65, this.color, 0.6);
          particles.spawnBurst(this.x, this.y, this.color, 25, 140);
        }
        if (sound && sound.playTeleport) sound.playTeleport();
        if (combatTexts) {
          combatTexts.push({
            x: this.x,
            y: this.y - 30,
            text: `[${this.team}] RECALLED TO BASE!`,
            color: this.color,
            life: 1.8,
            maxLife: 1.8
          });
        }
      }
      return;
    }

    // 2. Cooldown tickers
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.recallCooldown = Math.max(0, this.recallCooldown - dt);
    this.recentDamageTimer = Math.max(0, this.recentDamageTimer - dt);
    this.skills.q.cd = Math.max(0, this.skills.q.cd - dt);
    this.skills.w.cd = Math.max(0, this.skills.w.cd - dt);
    this.skills.r.cd = Math.max(0, this.skills.r.cd - dt);

    // 3. Passive Gold & EXP Trickle
    this.gold += dt * 5;
    this.passiveExpTimer = (this.passiveExpTimer || 0) + dt;
    if (this.passiveExpTimer >= 1.0) {
      this.passiveExpTimer -= 1.0;
      this.gainExp(2, combatTexts, particles, sound);
    }
    this.itemCheckTimer -= dt;
    if (this.itemCheckTimer <= 0) {
      this.itemCheckTimer = 6;
      this.checkShopPurchase();
    }

    // 3b. Friendly Base Continuous Healing
    const distToBase = Math.hypot(this.x - this.spawnX, this.y - this.spawnY);
    if (distToBase <= 120 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.20 * dt);
      if (particles && Math.random() < 0.35) {
        particles.spawnTrail(this.x, this.y, "#2ecc71", 3);
      }
      if (this.hp >= this.maxHp * 0.95 && this.state === "RETREAT") {
        this.state = "LANING";
        this.targetX = this.team === "BLUE" ? (29 * 40) : (2 * 40);
        this.targetY = this.assignedLaneY;
      }
    }

    // Collect all opposing heroes (Player + Opposing Bots)
    const opposingHeroes = [];
    if (player && !player.isDead && player.hp > 0 && player.team !== this.team) {
      opposingHeroes.push(player);
    }
    if (allBots && Array.isArray(allBots)) {
      allBots.forEach(b => {
        if (b !== this && !b.isDead && b.hp > 0 && b.team !== this.team) {
          opposingHeroes.push(b);
        }
      });
    }

    // 4. Decision Tree: Low HP Retreat
    if (this.hp < this.maxHp * 0.28) {
      this.state = "RETREAT";
      let distToClosestOpp = Infinity;
      opposingHeroes.forEach(e => {
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < distToClosestOpp) distToClosestOpp = d;
      });

      const isSafeToRecall = !this.isRecalling &&
                            this.recallCooldown <= 0 &&
                            this.recentDamageTimer <= 0 &&
                            distToClosestOpp > 360 &&
                            distToBase > 260;

      if (isSafeToRecall) {
        this.isRecalling = true;
        this.recallTimer = this.recallMax;
        this.targetX = this.x;
        this.targetY = this.y;
        if (sound && sound.playRecall) sound.playRecall();
        return;
      }

      // Retreat on foot towards friendly base
      this.targetX = this.spawnX;
      this.targetY = this.spawnY;
    } else {
      // Roaming & Lane-Changing Team Clash Planning
      this.roamTimer -= dt;
      if (this.isClashing) {
        this.clashDuration -= dt;
        if (this.clashDuration <= 0 || this.hp < this.maxHp * 0.35) {
          this.isClashing = false;
          this.laneY = this.assignedLaneY;
          this.targetY = this.laneY;
          this.roamTimer = Math.random() * 25 + 30;
          if (combatTexts) {
            combatTexts.push({
              x: this.x,
              y: this.y - 30,
              text: `[${this.team}] ${this.name}: RETURNING TO LANE`,
              color: this.color,
              life: 1.0,
              maxLife: 1.0
            });
          }
        }
      } else if (this.roamTimer <= 0 && this.hp > this.maxHp * 0.65) {
        // Switch lane temporarily to gank / clash
        const candidateLanes = [240, 480, 720].filter(ly => ly !== this.assignedLaneY);
        if (candidateLanes.length > 0) {
          const targetClashY = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
          this.isClashing = true;
          this.clashDuration = 14.0; // 14s roam duration
          this.laneY = targetClashY;
          this.targetY = targetClashY;
          this.roamTimer = Math.random() * 30 + 35;
          if (combatTexts) {
            combatTexts.push({
              x: this.x,
              y: this.y - 30,
              text: `[${this.team}] ${this.name}: ROAMING FOR CLASH!`,
              color: "#ffd700",
              life: 1.2,
              maxLife: 1.2
            });
          }
        }
      }

      // Check opposing heroes in proximity
      let closestOpp = null;
      let distToClosestOpp = Infinity;
      opposingHeroes.forEach(e => {
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < distToClosestOpp) {
          distToClosestOpp = d;
          closestOpp = e;
        }
      });

      // Check Opposing Summoned Lord
      let lordTarget = null;
      if (objectiveManager && objectiveManager.summonedLord && !objectiveManager.summonedLord.isDead && objectiveManager.summonedLord.team !== this.team) {
        const lord = objectiveManager.summonedLord;
        const dLord = Math.hypot(lord.x - this.x, lord.y - this.y);
        if (dLord < 360) lordTarget = lord;
      }

      const chaseCutoff = this.getLaneFrontlineBoundary(map);
      const isOppWithinCutoff = closestOpp ? (this.team === "RED" ? closestOpp.x >= chaseCutoff : closestOpp.x <= chaseCutoff) : false;

      if (closestOpp && distToClosestOpp < 320 && isOppWithinCutoff) {
        this.state = "COMBAT";
        this.engageEnemyHero(closestOpp, distToClosestOpp, dt, combatTexts, sound, particles, scoreboard, map);
      } else if (lordTarget) {
        this.state = "COMBAT";
        this.engageLord(lordTarget, dt, combatTexts, sound, particles, scoreboard);
      } else if (this.shouldContestObjective(distToClosestOpp, objectiveManager)) {
        this.state = "OBJECTIVE";
        this.engageObjective(objectiveManager, dt, combatTexts, sound, particles, scoreboard);
      } else {
        this.state = "LANING";
        this.engageLaning(minionManager, map, dt, combatTexts, sound, particles, scoreboard);
      }
    }

    // 5. Movement step
    this.stepMovement(dt, map);
  }

  engageEnemyHero(targetHero, dist, dt, combatTexts, sound, particles, scoreboard, map) {
    const chaseCutoff = this.getLaneFrontlineBoundary(map);

    // Stop chasing if enemy is past dive cutoff
    const isPastCutoff = this.team === "RED" ? targetHero.x < chaseCutoff : targetHero.x > chaseCutoff;
    if (isPastCutoff) {
      this.state = "LANING";
      this.targetX = this.team === "RED" ? Math.max(this.x, chaseCutoff + 30) : Math.min(this.x, chaseCutoff - 30);
      this.targetY = this.laneY;
      return;
    }

    // Positioning
    if (dist > this.attackRange * 0.85) {
      this.targetX = this.team === "RED" ? Math.max(targetHero.x, chaseCutoff + 15) : Math.min(targetHero.x, chaseCutoff - 15);
      this.targetY = targetHero.y;
    } else if (dist < this.attackRange * 0.35) {
      // Kite backwards
      const angle = Math.atan2(this.y - targetHero.y, this.x - targetHero.x);
      this.targetX = this.x + Math.cos(angle) * 70;
      this.targetY = this.y + Math.sin(angle) * 70;
    } else {
      this.targetX = this.x;
      this.targetY = this.y;
    }

    // Cast Ultimate (R)
    if (this.skills.r.cd <= 0 && dist <= this.skills.r.range && targetHero.hp < targetHero.maxHp * 0.6) {
      this.skills.r.cd = this.skills.r.maxCd;
      if (sound) sound.playSkill("r");
      if (particles) {
        particles.spawnRing(targetHero.x, targetHero.y, 60, this.color, 0.5);
        particles.spawnBurst(targetHero.x, targetHero.y, this.color, 18, 160);
      }
      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(this.skills.r.damage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= this.skills.r.damage;
      }
      if (combatTexts) {
        combatTexts.push({
          x: targetHero.x,
          y: targetHero.y - 25,
          text: `[${this.team}] ${this.skills.r.name.toUpperCase()} -${this.skills.r.damage}!`,
          color: this.color,
          life: 1.2,
          maxLife: 1.2
        });
      }
    }
    // Cast Skill 1 (Q)
    else if (this.skills.q.cd <= 0 && dist <= this.skills.q.range) {
      this.skills.q.cd = this.skills.q.maxCd;
      if (sound) sound.playSkill("q");
      if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#f39c12", 10, 110);
      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(this.skills.q.damage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= this.skills.q.damage;
      }
      if (combatTexts) {
        combatTexts.push({
          x: targetHero.x,
          y: targetHero.y - 20,
          text: `[${this.team}] ${this.skills.q.name.toUpperCase()} -${this.skills.q.damage}!`,
          color: "#f39c12",
          life: 1.0,
          maxLife: 1.0
        });
      }
    }
    // Cast Skill 2 (W)
    else if (this.skills.w.cd <= 0 && dist <= this.skills.w.range) {
      this.skills.w.cd = this.skills.w.maxCd;
      if (sound) sound.playSkill("w");
      if (particles) particles.spawnRing(this.x, this.y, 45, "#e67e22", 0.35);
      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(this.skills.w.damage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= this.skills.w.damage;
      }
      // Angela Puppet String or Nana Molina morph stun CC
      const hid = (this.heroData && this.heroData.id) ? this.heroData.id.toLowerCase() : "";
      if ((hid === "angela" || hid === "nana" || hid === "tigreal") && typeof targetHero.applyStun === "function") {
        targetHero.applyStun(1.0, combatTexts);
      }
      if (combatTexts) {
        combatTexts.push({
          x: targetHero.x,
          y: targetHero.y - 20,
          text: `[${this.team}] ${this.skills.w.name.toUpperCase()} -${this.skills.w.damage}!`,
          color: "#e67e22",
          life: 1.0,
          maxLife: 1.0
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
          particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, this.color, 40);
        }
      }
      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= this.attackDamage;
      }
      if (this.lifesteal > 0 && this.hp < this.maxHp) {
        const healAmt = Math.round(this.attackDamage * this.lifesteal);
        this.hp = Math.min(this.maxHp, this.hp + healAmt);
      }
    }
  }

  shouldContestObjective(distToOpp, objectiveManager) {
    if (!objectiveManager) return false;
    if (this.hp < this.maxHp * 0.65) return false;
    if (distToOpp < 240) return false;

    if (objectiveManager.turtle && objectiveManager.turtle.alive) return true;
    if (objectiveManager.lord && objectiveManager.lord.alive) return true;
    return false;
  }

  engageObjective(objectiveManager, dt, combatTexts, sound, particles, scoreboard) {
    if (!objectiveManager) return;
    let targetBoss = null;
    if (objectiveManager.turtle && objectiveManager.turtle.alive) {
      targetBoss = objectiveManager.turtle;
    } else if (objectiveManager.lord && objectiveManager.lord.alive) {
      targetBoss = objectiveManager.lord;
    }

    if (!targetBoss) {
      this.state = "LANING";
      return;
    }

    const dist = Math.hypot(targetBoss.x - this.x, targetBoss.y - this.y);
    if (this.hp < this.maxHp * 0.35) {
      this.state = "RETREAT";
      this.targetX = this.spawnX;
      this.targetY = this.spawnY;
      return;
    }

    if (dist > this.attackRange * 0.85) {
      this.targetX = targetBoss.x;
      this.targetY = targetBoss.y;
    } else {
      this.targetX = this.x;
      this.targetY = this.y;
    }

    if (dist <= this.attackRange + 25 && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      if (typeof targetBoss.takeDamage === "function") {
        targetBoss.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetBoss.hp = Math.max(0, targetBoss.hp - this.attackDamage);
        targetBoss.lastAttacker = this;
      }
    }
  }

  engageLord(lord, dt, combatTexts, sound, particles, scoreboard) {
    const dist = Math.hypot(lord.x - this.x, lord.y - this.y);
    if (dist > this.attackRange * 0.85) {
      this.targetX = lord.x;
      this.targetY = lord.y;
    } else {
      this.targetX = this.x;
      this.targetY = this.y;
    }

    if (dist <= this.attackRange + 25 && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      if (typeof lord.takeDamage === "function") {
        lord.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
      }
    }
  }

  engageLaning(minionManager, map, dt, combatTexts, sound, particles, scoreboard) {
    // 1. Search for nearest Opposing Minion in current lane
    let nearestMinion = null;
    let minDist = Infinity;
    let clusterCount = 0;

    if (minionManager && minionManager.minions) {
      minionManager.minions.forEach(m => {
        if (m.team !== this.team && m.hp > 0) {
          const d = Math.hypot(m.x - this.x, m.y - this.y);
          if (d < 240) clusterCount++;
          if (d < minDist) {
            minDist = d;
            nearestMinion = m;
          }
        }
      });
    }

    // Cast Q or W to fast-clear wave when clustered
    if (clusterCount >= 2 && nearestMinion && minDist <= 240) {
      if (this.skills.q.cd <= 0) {
        this.skills.q.cd = this.skills.q.maxCd;
        if (sound) sound.playSkill("q");
        nearestMinion.hp -= this.skills.q.damage;
      } else if (this.skills.w.cd <= 0) {
        this.skills.w.cd = this.skills.w.maxCd;
        if (sound) sound.playSkill("w");
        nearestMinion.hp -= this.skills.w.damage;
      }
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
        nearestMinion.hp -= this.attackDamage;
        if (nearestMinion.hp <= 0) {
          this.cs++;
          this.gold += 45;
          if (scoreboard) {
            const teamKey = this.team === "BLUE" ? "player" : "bot";
            scoreboard.addGold(teamKey, 45);
          }
        }
      }
    } else {
      // 2. Check for Opposing Turrets in range
      let nearTurret = null;
      if (map && map.turrets) {
        nearTurret = map.turrets.find(t => t.team !== this.team && !t.destroyed && Math.hypot(t.worldX - this.x, t.worldY - this.y) <= this.attackRange + 25);
      }

      if (nearTurret) {
        this.targetX = this.x;
        this.targetY = this.y;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;
          if (sound && sound.playAttack) sound.playAttack();
          nearTurret.hp -= this.attackDamage;
          if (particles) particles.spawnBurst(nearTurret.worldX, nearTurret.worldY, "#ffd700", 6, 80);
        }
      } else {
        // 3. March down lane towards frontline boundary / opposing base
        const chaseCutoff = this.getLaneFrontlineBoundary(map);
        if (this.team === "RED") {
          this.targetX = Math.max(chaseCutoff + 25, 120);
          this.targetY = this.laneY;
        } else {
          this.targetX = Math.min(chaseCutoff - 25, 29 * 40);
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

    // Turret collision separation
    if (map && map.turrets) {
      const minTurretDist = 38;
      for (let i = 0; i < map.turrets.length; i++) {
        const t = map.turrets[i];
        if (t.destroyed) continue;
        const td = Math.hypot(this.x - t.worldX, this.y - t.worldY);
        if (td < minTurretDist) {
          const pushAngle = td > 1 ? Math.atan2(this.y - t.worldY, this.x - t.worldX) : Math.PI / 2;
          this.x = t.worldX + Math.cos(pushAngle) * minTurretDist;
          this.y = t.worldY + Math.sin(pushAngle) * minTurretDist;
        }
      }
    }
  }

  getRecommendedBuild() {
    const heroId = (this.heroData && this.heroData.id) ? this.heroData.id.toLowerCase() : "";
    const role = (this.role || "").toLowerCase();

    // 1. Mage / Magic Burst (Pharsa, Nana, Angela)
    if (heroId === "pharsa" || heroId === "nana" || heroId === "angela" || role === "mage" || role === "support") {
      return ["swift_boots", "holy_crystal", "athenas_shield", "holy_crystal", "immortality", "bloodlust_axe"];
    }

    // 2. Magic Assassin (Gusion)
    if (heroId === "gusion") {
      return ["swift_boots", "holy_crystal", "bloodlust_axe", "holy_crystal", "athenas_shield", "immortality"];
    }

    // 3. Marksman (Layla, Miya)
    if (heroId === "layla" || heroId === "miya" || role === "marksman") {
      return ["swift_boots", "blade_of_despair", "bloodlust_axe", "blade_of_despair", "athenas_shield", "immortality"];
    }

    // 4. Tank / Frontline (Tigreal)
    if (heroId === "tigreal" || role === "tank") {
      return ["swift_boots", "athenas_shield", "immortality", "athenas_shield", "blade_of_despair", "bloodlust_axe"];
    }

    // 5. Fighter / Physical Assassin (Balmond, Alucard, Saber)
    return ["swift_boots", "blade_of_despair", "bloodlust_axe", "athenas_shield", "immortality", "blade_of_despair"];
  }

  checkShopPurchase() {
    if (this.items.length >= 6) return;

    const buildPath = this.getRecommendedBuild();
    const itemCatalogMap = {
      swift_boots: { cost: 500, spd: 0.25 },
      blade_of_despair: { cost: 1200, atk: 55 },
      athenas_shield: { cost: 850, hp: 450 },
      bloodlust_axe: { cost: 950, atk: 25, lifesteal: 0.20 },
      holy_crystal: { cost: 1100, abilityPower: 60 },
      immortality: { cost: 1400, hp: 400, revive: true }
    };

    let nextItemId = null;
    const currentCounts = {};
    this.items.forEach(id => { currentCounts[id] = (currentCounts[id] || 0) + 1; });

    const neededCounts = {};
    for (const id of buildPath) {
      neededCounts[id] = (neededCounts[id] || 0) + 1;
      if ((currentCounts[id] || 0) < neededCounts[id]) {
        nextItemId = id;
        break;
      }
    }

    // Fallback: if completed build path but has free slot, buy available powerful item
    if (!nextItemId) {
      const fallbacks = ["blade_of_despair", "holy_crystal", "athenas_shield"];
      nextItemId = fallbacks.find(id => this.gold >= itemCatalogMap[id].cost) || null;
    }

    if (!nextItemId) return;
    const item = itemCatalogMap[nextItemId];
    if (!item || this.gold < item.cost) return;

    // Deduct gold & equip item
    this.gold -= item.cost;
    this.items.push(nextItemId);

    // Apply item stats
    if (item.spd) this.speed *= (1 + item.spd);
    if (item.atk) this.attackDamage += item.atk;
    if (item.hp) {
      this.maxHp += item.hp;
      if (!this.isDead) this.hp += item.hp;
    }
    if (item.abilityPower) {
      this.abilityPower = (this.abilityPower || 0) + item.abilityPower;
      // Empower bot's signature magical and burst skills!
      if (this.skills) {
        if (this.skills.q) this.skills.q.damage += Math.round(item.abilityPower * 0.7);
        if (this.skills.w) this.skills.w.damage += Math.round(item.abilityPower * 0.8);
        if (this.skills.r) this.skills.r.damage += Math.round(item.abilityPower * 1.5);
      }
    }
    if (item.lifesteal) {
      this.lifesteal = (this.lifesteal || 0) + item.lifesteal;
    }
    if (item.revive) {
      this.hasRevive = true;
      this.hasUsedRevive = false;
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    const canvasW = ctx.canvas ? ctx.canvas.width : GAME.CANVAS_WIDTH;
    const canvasH = ctx.canvas ? ctx.canvas.height : GAME.CANVAS_HEIGHT;
    if (sx < -60 || sx > canvasW + 60 || sy < -60 || sy > canvasH + 60) return;

    ctx.save();

    const isBlue = this.team === "BLUE";
    const teamColor = isBlue ? "#4ecca3" : "#e74c3c";
    const teamAura = isBlue ? "rgba(78, 204, 163, 0.25)" : "rgba(231, 76, 60, 0.25)";

    // Ground team aura
    ctx.fillStyle = teamAura;
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

      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = teamColor;
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
    ctx.fillStyle = isBlue ? "#2ecc71" : "#e74c3c";
    ctx.fillRect(sx - barWidth / 2, sy - this.radius - 14, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - barWidth / 2, sy - this.radius - 14, barWidth, barHeight);

    // Overhead Level badge
    const lvl = this.level || 1;
    ctx.fillStyle = isBlue ? "rgba(10, 25, 20, 0.9)" : "rgba(25, 10, 15, 0.9)";
    ctx.beginPath();
    ctx.arc(sx - barWidth / 2 - 7, sy - this.radius - 11.5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isBlue ? "#4ecca3" : "#ff6b81";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${lvl}`, sx - barWidth / 2 - 7, sy - this.radius - 11);

    // Bot Label
    const tag = isBlue ? "[ALLY]" : "[BOT]";
    ctx.fillStyle = isBlue ? "#4ecca3" : "#ff6b6b";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${tag} ${this.name}`, sx, sy - this.radius - 18);

    // Roaming / Clash indicator overhead
    if (this.isClashing) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("⚔️ CLASH", sx, sy - this.radius - 29);
    }

    // Recall Channeling Gauge
    if (this.isRecalling) {
      const channelProgress = Math.max(0, Math.min(1, 1 - (this.recallTimer / this.recallMax)));
      const chBarW = 44;
      const chBarH = 6;
      const chY = sy - this.radius - 34;

      ctx.fillStyle = "rgba(15, 20, 30, 0.85)";
      ctx.fillRect(sx - chBarW / 2, chY, chBarW, chBarH);
      ctx.fillStyle = isBlue ? "#4ecca3" : "#ff4757";
      ctx.fillRect(sx - chBarW / 2, chY, chBarW * channelProgress, chBarH);
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - chBarW / 2, chY, chBarW, chBarH);

      ctx.fillStyle = teamColor;
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`RECALLING ${this.recallTimer.toFixed(1)}s`, sx, chY - 3);
    }

    // Overhead Stun Stars
    if (this.stunTimer > 0) {
      const starY = sy - this.radius - 28;
      const angle = (Date.now() / 140) % (Math.PI * 2);
      ctx.save();
      ctx.fillStyle = "#ffd700";
      for (let i = 0; i < 3; i++) {
        const a = angle + (i * Math.PI * 2 / 3);
        const starX = sx + Math.cos(a) * 13;
        const sY = starY + Math.sin(a) * 5;
        ctx.beginPath();
        ctx.arc(starX, sY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

if (typeof window !== "undefined") window.BotHero = BotHero;
if (typeof global !== "undefined") global.BotHero = BotHero;