/**
 * Bot AI Engine - Multi-Team Computer-Controlled Champions (Blue & Red)
 * Phase 4 implementation + Multi-Format (1v1, 2v2, 3v3) Team Clash & Lane AI
 */

class BotHero {
  constructor(heroData, lane = "MID", team = "RED") {
    this.heroData = heroData;
    this.id = heroData.id;
    this.name = heroData.name;
    this.role = heroData.role;
    this.lane = (lane || "MID").toUpperCase();
    this.assignedLane = this.lane;

    // Check if Land of Dawn map is active
    const isLod = (typeof window !== "undefined" && window.map && window.map.mapType === "LAND_OF_DAWN");

    // Map lane to Y pixel coordinate
    if (this.lane.includes("GOLD") || this.lane.includes("TOP")) {
      this.laneY = isLod ? (5 * 40) : (6 * 40); // 200px or 240px
      this.assignedLane = "GOLD";
    } else if (this.lane.includes("EXP") || this.lane.includes("BOT")) {
      this.laneY = isLod ? (27 * 40) : (18 * 40); // 1080px or 720px
      this.assignedLane = "EXP";
    } else if (this.lane.includes("JUNGLE")) {
      this.laneY = isLod ? (10 * 40) : (12 * 40);
      this.assignedLane = "JUNGLE";
    } else if (this.lane.includes("ROAM")) {
      this.laneY = isLod ? (16 * 40) : (12 * 40);
      this.assignedLane = "ROAM";
    } else {
      this.laneY = isLod ? (16 * 40) : (12 * 40);
      this.assignedLane = "MID";
    }
    this.assignedLaneY = this.laneY;

    this.team = (team || "RED").toUpperCase();
    this.color = heroData.color || (this.team === "BLUE" ? "#4ecca3" : "#e74c3c");
    this.spritePath = heroData.sprite;
    this.stats = { ...heroData.stats };

    this.hp = this.stats.hp || 2400;
    this.maxHp = this.hp;
    this.radius = 18;

    // Active Jungle Buffs { blue: seconds, red: seconds }
    this.buffs = { blue: 0, red: 0 };

    // Base Spawns & March Target
    if (this.team === "BLUE") {
      this.spawnX = isLod ? 140 : (2 * 40);
      this.spawnY = isLod ? 640 : (12 * 40);
      this.targetX = isLod ? 1620 : (29 * 40);
    } else {
      this.spawnX = isLod ? 1620 : (29 * 40);
      this.spawnY = isLod ? 640 : (12 * 40);
      this.targetX = isLod ? 140 : (2 * 40);
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
    this.skillActionTimer = 0;

    // State: "LANING", "COMBAT", "RETREAT", "CLASH", "OBJECTIVE", "DEAD"
    this.state = "LANING";
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnMax = (typeof GAME !== "undefined" && GAME.HERO_RESPAWN_TIME) ? GAME.HERO_RESPAWN_TIME : 10;

    // Roaming & Dynamic Team Clash System
    this.roamTimer = Math.random() * 20 + 25; // 25 to 45 seconds between roaming plans
    this.isClashing = false;
    this.clashDuration = 0;

    // Deployment waypoints for Land of Dawn curved map
    this.initDeploymentWaypoints(isLod);

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
        q: { name: "Sword Spike", cd: 0, maxCd: 4, damage: 440, range: 380 },
        w: { name: "Shadowblade", cd: 0, maxCd: 5, damage: 780, range: 340 },
        r: { name: "Blade Barrage", cd: 0, maxCd: 18, damage: 1150, range: 380 }
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
        r: { name: "Implosion", cd: 0, maxCd: 25, damage: 420, range: 240 }
      },
      alucard: {
        q: { name: "Groundsplitter", cd: 0, maxCd: 6, damage: 280, range: 240 },
        w: { name: "Whirling Smash", cd: 0, maxCd: 5, damage: 260, range: 180 },
        r: { name: "Fission Wave", cd: 0, maxCd: 22, damage: 480, range: 320 }
      },
      balmond: {
        q: { name: "Soul Lock", cd: 0, maxCd: 6, damage: 340, range: 240 },
        w: { name: "Cyclone Sweep", cd: 0, maxCd: 5, damage: 680, range: 180 },
        r: { name: "Lethal Counter", cd: 0, maxCd: 20, damage: 620, range: 220 }
      },
      saber: {
        q: { name: "Orbiting Swords", cd: 0, maxCd: 6, damage: 85, range: 260 },
        w: { name: "Charge", cd: 0, maxCd: 6, damage: 240, range: 200 },
        r: { name: "Triple Sweep", cd: 0, maxCd: 22, damage: 780, range: 260 }
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

  initDeploymentWaypoints(isLod) {
    this.deploymentWaypoints = [];
    this.deploymentWaypointIndex = 0;
    this.laneDeployed = !isLod; // On compact map, no curved waypoints needed

    if (!isLod) return;

    if (this.assignedLane === "GOLD") {
      // Top lane curved ascent
      this.deploymentWaypoints = this.team === "BLUE"
        ? [{ x: 240, y: 480 }, { x: 240, y: 200 }]
        : [{ x: 1480, y: 480 }, { x: 1480, y: 200 }];
      this.laneDeployed = false;
    } else if (this.assignedLane === "EXP") {
      // Bot lane curved descent
      this.deploymentWaypoints = this.team === "BLUE"
        ? [{ x: 240, y: 800 }, { x: 240, y: 1080 }]
        : [{ x: 1480, y: 800 }, { x: 1480, y: 1080 }];
      this.laneDeployed = false;
    } else {
      // Mid, Jungle, Roam deploy directly
      this.laneDeployed = true;
    }
  }

  checkWalkable(map, x, y) {
    if (!map) return true;
    if (map.turrets) {
      for (let i = 0; i < map.turrets.length; i++) {
        const t = map.turrets[i];
        if (!t.destroyed && Math.hypot(x - t.worldX, y - t.worldY) < 36) {
          return false;
        }
      }
    }
    const r = Math.min(10, this.radius * 0.55);
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

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.shield = 0;
    this.hasUsedRevive = false;

    // Respawn precisely at team base fountain
    let respawnX = this.spawnX, respawnY = this.spawnY;
    if (typeof window !== "undefined" && window.map && window.map.bases) {
      const friendlyBase = window.map.bases.find(b => b.team === this.team);
      if (friendlyBase) {
        respawnX = friendlyBase.worldX;
        respawnY = friendlyBase.worldY;
      }
    }
    this.x = respawnX;
    this.y = respawnY;
    const isLod = (typeof window !== "undefined" && window.map && window.map.mapType === "LAND_OF_DAWN");
    this.targetX = this.team === "BLUE" ? (isLod ? 1620 : (29 * 40)) : (isLod ? 140 : (2 * 40));
    this.targetY = this.assignedLaneY;
    this.laneY = this.assignedLaneY;
    this.isClashing = false;
    this.state = "LANING";
    this.initDeploymentWaypoints(isLod);
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
      const isLod = (typeof window !== "undefined" && window.map && window.map.mapType === "LAND_OF_DAWN");
      if (isLod && this.y < 360) {
        // In Top lane: retreat towards lane corner before descending to base
        this.targetX = this.team === "BLUE" ? 240 : 1480;
        this.targetY = 200;
      } else if (isLod && this.y > 900) {
        // In Bot lane: retreat towards lane corner before ascending to base
        this.targetX = this.team === "BLUE" ? 240 : 1480;
        this.targetY = 1080;
      } else {
        this.targetX = this.spawnX;
        this.targetY = this.spawnY;
      }
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
        const reviveHp = Math.max(320, Math.round(this.maxHp * 0.18));
        this.hp = reviveHp;
        this.shield = 350;
        if (particles) {
          particles.spawnRing(this.x, this.y, 65, "#ffd700", 0.8);
          particles.spawnBurst(this.x, this.y, "#ffd700", 25, 140);
          particles.spawnBurst(this.x, this.y, "#ffffff", 12, 100);
        }
        if (sound && sound.playHeal) sound.playHeal();
        if (combatTexts) {
          combatTexts.push({ x: this.x, y: this.y - 30, text: `[${this.team}] IMMORTALITY RESURRECT! +${reviveHp} HP`, color: "#ffd700", life: 1.8, maxLife: 1.8 });
        }
        return;
      }

      this.hp = 0;
      this.isDead = true;
      this.deaths++;
      this.respawnTimer = this.respawnMax;
      this.state = "DEAD";
      this.shield = 0;

      // Identify killer
      let killerName = this.team === "BLUE" ? "Enemy Forces" : "Allied Forces";
      let killerTeam = this.team === "BLUE" ? "RED" : "BLUE";

      if (source) {
        if (source.isPlayer || (typeof player !== "undefined" && source === player) || (typeof window !== "undefined" && window.player && source === window.player)) {
          killerName = `${source.name || "Hero"} (YOU)`;
          killerTeam = "BLUE";
          if (typeof gameStats !== "undefined" && gameStats) gameStats.kills++;
          else if (typeof window !== "undefined" && window.gameStats) window.gameStats.kills++;
        } else if (source.name) {
          killerName = source.name;
          killerTeam = source.team || killerTeam;
        } else if (source.isTurret || source.tier) {
          killerName = `${source.team || killerTeam} Turret`;
          killerTeam = source.team || killerTeam;
        } else if (source.team) {
          killerTeam = source.team;
          killerName = `${source.team === "BLUE" ? "Blue" : "Red"} Minion`;
        }
        if (source.kills !== undefined) {
          source.kills++;
        }
      }

      const victimName = this.name;
      const killAnnouncement = `⚔️ ${killerName} has slain ${victimName}!`;
      const killColor = killerTeam === "BLUE" ? "#4ecca3" : "#ff4757";

      const objMgr = (typeof objectiveManager !== "undefined" ? objectiveManager : (typeof window !== "undefined" ? window.objectiveManager : null));
      if (objMgr && objMgr.addAnnouncement) {
        objMgr.addAnnouncement(killAnnouncement, killColor);
      }

      if (typeof window !== "undefined" && typeof window.triggerKillFeedEvent === "function") {
        window.triggerKillFeedEvent({
          killerName,
          killerTeam,
          victimName,
          victimTeam: this.team,
          type: "kill"
        });
      }

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
        if (killerTeam === "BLUE" && sound && sound.playAnnouncer) sound.playAnnouncer("kill");
        if (scoreboard) {
          if (killerTeam === "BLUE") {
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

  update(dt, player, minionManager, map, combatTexts, sound, particles, scoreboard, objectiveManager, allBots, skillManager) {
    // 1. Respawn timer (never freeze even if external heals hit dead bot)
    if (this.isDead || this.hp <= 0) {
      if (!this.isDead) {
        if (this.hasRevive && !this.hasUsedRevive) {
          this.hasUsedRevive = true;
          const reviveHp = Math.max(320, Math.round(this.maxHp * 0.18));
          this.hp = reviveHp;
          this.shield = 350;
          if (particles) {
            particles.spawnRing(this.x, this.y, 65, "#ffd700", 0.8);
            particles.spawnBurst(this.x, this.y, "#ffd700", 25, 140);
            particles.spawnBurst(this.x, this.y, "#ffffff", 12, 100);
          }
          if (sound && sound.playHeal) sound.playHeal();
          if (combatTexts) {
            combatTexts.push({ x: this.x, y: this.y - 30, text: `[${this.team}] IMMORTALITY RESURRECT! +${reviveHp} HP`, color: "#ffd700", life: 1.8, maxLife: 1.8 });
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
        const isLod = (typeof window !== "undefined" && window.map && window.map.mapType === "LAND_OF_DAWN");
        this.initDeploymentWaypoints(isLod);

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

    // 2. Cooldown tickers (Blue Buff reduces cooldowns 15% faster)
    const cdDt = (this.buffs && this.buffs.blue > 0) ? (dt * 1.15) : dt;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.skillActionTimer = Math.max(0, (this.skillActionTimer || 0) - dt);
    this.recallCooldown = Math.max(0, this.recallCooldown - dt);
    this.recentDamageTimer = Math.max(0, this.recentDamageTimer - dt);
    this.skills.q.cd = Math.max(0, this.skills.q.cd - cdDt);
    this.skills.w.cd = Math.max(0, this.skills.w.cd - cdDt);
    this.skills.r.cd = Math.max(0, this.skills.r.cd - cdDt);

    // Active Buffs decay
    if (this.buffs) {
      if (this.buffs.blue > 0) this.buffs.blue = Math.max(0, this.buffs.blue - dt);
      if (this.buffs.red > 0) this.buffs.red = Math.max(0, this.buffs.red - dt);
    }

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

    // Saber Orbiting Swords ticks (Skill 1 - Q) - extended radius (100px), smooth spin (3.2)
    if (this.saberSwords && this.saberSwords.active) {
      this.saberSwords.timer -= dt;
      this.saberSwords.angle += dt * 3.2; // Smooth glide, not too fast
      this.saberSwords.damageTickTimer -= dt;

      if (this.saberSwords.damageTickTimer <= 0) {
        this.saberSwords.damageTickTimer = 0.30;
        const swordDmg = Math.round(85 * (this.attackDamage ? (this.attackDamage / 120) : 1));
        if (player && !player.isDead && player.team !== this.team && Math.hypot(player.x - this.x, player.y - this.y) <= 100) {
          player.takeDamage(swordDmg, this, combatTexts, particles, sound, scoreboard);
          if (particles && particles.spawnSlash) {
            particles.spawnSlash(this.x, this.y, player.x, player.y, "#00d2d3", 34);
          }
        }
        if (allBots && Array.isArray(allBots)) {
          allBots.forEach(b => {
            if (b !== this && !b.isDead && b.team !== this.team && Math.hypot(b.x - this.x, b.y - this.y) <= 100) {
              b.takeDamage(swordDmg, this, combatTexts, particles, sound, scoreboard);
              if (particles && particles.spawnSlash) {
                particles.spawnSlash(this.x, this.y, b.x, b.y, "#00d2d3", 34);
              }
            }
          });
        }
        if (minionManager && minionManager.minions) {
          minionManager.minions.forEach(m => {
            if (m.team !== this.team && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) <= 100) {
              m.hp -= swordDmg;
            }
          });
        }
      }

      if (this.saberSwords.timer <= 0 || this.isDead) {
        this.saberSwords.active = false;
      }
    }

    // Balmond Cyclone Sweep ticks (Skill 2 - W) - short melee range (60px), fast furious spin (11.5), heavy damage (130)
    if (this.balmondCyclone && this.balmondCyclone.active) {
      this.balmondCyclone.timer -= dt;
      this.balmondCyclone.angle += dt * 11.5; // Fast furious spin!
      this.balmondCyclone.damageTickTimer -= dt;

      if (this.balmondCyclone.damageTickTimer <= 0) {
        this.balmondCyclone.damageTickTimer = 0.22;
        const spinDmg = Math.round(130 * (this.attackDamage ? (this.attackDamage / 120) : 1));
        if (player && !player.isDead && player.team !== this.team && Math.hypot(player.x - this.x, player.y - this.y) <= 60) {
          player.takeDamage(spinDmg, this, combatTexts, particles, sound, scoreboard);
          if (particles && particles.spawnSlash) {
            particles.spawnSlash(this.x, this.y, player.x, player.y, "#c0392b", 34);
          }
        }
        if (allBots && Array.isArray(allBots)) {
          allBots.forEach(b => {
            if (b !== this && !b.isDead && b.team !== this.team && Math.hypot(b.x - this.x, b.y - this.y) <= 60) {
              b.takeDamage(spinDmg, this, combatTexts, particles, sound, scoreboard);
              if (particles && particles.spawnSlash) {
                particles.spawnSlash(this.x, this.y, b.x, b.y, "#c0392b", 34);
              }
            }
          });
        }
        if (minionManager && minionManager.minions) {
          minionManager.minions.forEach(m => {
            if (m.team !== this.team && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) <= 60) {
              m.hp -= spinDmg;
            }
          });
        }
      }

      if (this.balmondCyclone.timer <= 0 || this.isDead) {
        this.balmondCyclone.active = false;
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
      } else if (this.roamTimer <= 0 && this.hp > this.maxHp * 0.65 && this.level >= 4) {
        // Switch lane temporarily to gank / clash (Only after unlocking Ultimate at Level 4+)
        const isLod = (map && map.mapType === "LAND_OF_DAWN") || (typeof window !== "undefined" && window.map && window.map.mapType === "LAND_OF_DAWN");
        const validLanes = isLod ? [200, 640, 1080] : [240, 480, 720];
        const candidateLanes = validLanes.filter(ly => Math.abs(ly - this.assignedLaneY) > 80);
        if (candidateLanes.length > 0) {
          const targetClashY = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
          this.isClashing = true;
          this.clashDuration = 16.0; // 16s roam duration
          this.laneY = targetClashY;
          this.targetY = targetClashY;
          this.roamTimer = Math.random() * 35 + 40;
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

      // If moving between lanes on Land of Dawn, route through nearest corridor
      const isLodMap = (map && map.mapType === "LAND_OF_DAWN") || (typeof window !== "undefined" && window.map && window.map.mapType === "LAND_OF_DAWN");
      if (isLodMap && map && Math.abs(this.laneY - this.y) > 180 && !this.isDead) {
        const mapW = map.width * map.tileSize;
        const isBlueSide = this.x < mapW / 2;
        const corridorXs = isBlueSide ? [240, 600, 880] : [880, 1160, 1480];
        let bestCorridorX = corridorXs[0];
        let bestDist = Math.abs(this.x - bestCorridorX);
        for (let i = 1; i < corridorXs.length; i++) {
          const d = Math.abs(this.x - corridorXs[i]);
          if (d < bestDist) {
            bestDist = d;
            bestCorridorX = corridorXs[i];
          }
        }
        if (Math.abs(this.x - bestCorridorX) > 36) {
          this.targetX = bestCorridorX;
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
      const isPastCutoff = closestOpp ? (this.team === "RED" ? closestOpp.x < chaseCutoff : closestOpp.x > chaseCutoff) : false;

      // Smart combat engagement range: consider bot's maximum ability reach
      const maxSkillReach = Math.max(
        360,
        (this.skills && this.skills.q) ? (this.skills.q.range || 260) : 260,
        (this.skills && this.skills.w) ? (this.skills.w.range || 260) : 260,
        (this.skills && this.skills.r) ? (this.skills.r.range || 320) : 320
      );

      const combatThreatRange = Math.max(380, maxSkillReach + 50);

      // Bot engages if opposing hero is within reach, defending if enemy approaches
      const shouldEngageHero = closestOpp && distToClosestOpp < combatThreatRange && (!isPastCutoff || distToClosestOpp < 240);

      if (shouldEngageHero) {
        this.state = "COMBAT";
        this.engageEnemyHero(closestOpp, distToClosestOpp, dt, combatTexts, sound, particles, scoreboard, map, skillManager);
      } else if (lordTarget) {
        this.state = "COMBAT";
        this.engageLord(lordTarget, dt, combatTexts, sound, particles, scoreboard, skillManager);
      } else if (this.shouldContestObjective(distToClosestOpp, objectiveManager)) {
        this.state = "OBJECTIVE";
        this.engageObjective(objectiveManager, dt, combatTexts, sound, particles, scoreboard, skillManager);
      } else {
        this.state = "LANING";
        this.engageLaning(minionManager, map, dt, combatTexts, sound, particles, scoreboard, closestOpp, distToClosestOpp, skillManager);
      }
    }

    // 5. Movement step
    this.stepMovement(dt, map);
  }

  castBotSkills(targetHero, dist, combatTexts, sound, particles, scoreboard, skillManager) {
    if (!this.skills || this.skillActionTimer > 0) return false;
    const hid = (this.id || (this.heroData && this.heroData.id) || "").toLowerCase();
    const sm = skillManager || (typeof window !== "undefined" ? window.skillManager : null);

    // 1. Ultimate Decision (Smart execution / initiation / buff) - Available at Level 4+
    let shouldCastR = false;
    const hasUlt = this.skills.r && this.skills.r.cd <= 0 && (this.level >= 4 || (this.skillLevels && this.skillLevels.r > 0));
    if (hasUlt && dist <= this.skills.r.range) {
      if (hid === "tigreal" && dist <= 240) shouldCastR = true; // Initiator pull & stun
      else if (hid === "nana" && dist <= 380) shouldCastR = true; // AOE morph & stun
      else if (hid === "pharsa" && dist <= 520) shouldCastR = true; // Artillery bombardment
      else if (hid === "angela" && (this.hp < this.maxHp * 0.65 || targetHero.hp < targetHero.maxHp * 0.6)) shouldCastR = true; // Shield & boost
      else if (hid === "miya" && dist <= 380) shouldCastR = true; // Conceal & attack speed steroid
      else if (hid === "alucard" && dist <= 320) shouldCastR = true; // Lifesteal aura
      else if (hid === "balmond" && targetHero.hp < targetHero.maxHp * 0.5) shouldCastR = true; // Execute finisher
      else if (hid === "saber" && dist <= 260) shouldCastR = true; // Knockup finisher
      else if (hid === "layla" && (dist <= 550 || targetHero.hp < targetHero.maxHp * 0.65)) shouldCastR = true; // Destruction rush
      else if (hid === "gusion" && dist <= 360) shouldCastR = true; // Blade storm
      else if (targetHero.hp < targetHero.maxHp * 0.6) shouldCastR = true; // Generic kill threat
    }

    if (shouldCastR) {
      this.skills.r.cd = this.skills.r.maxCd;
      this.skillActionTimer = 0.35;
      if (sound) sound.playSkill("r");

      // Vivid Visual Effects for Ultimate (R)
      if (hid === "layla") {
        const angle = Math.atan2(targetHero.y - this.y, targetHero.x - this.x);
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: this.x + Math.cos(angle) * 850,
            endY: this.y + Math.sin(angle) * 850,
            width: 24,
            color: this.team === "BLUE" ? "#3498db" : "#ff4757",
            life: 0.45,
            maxLife: 0.45,
            damage: 0
          });
        }
        if (particles) {
          particles.spawnBurst(this.x, this.y, "#3498db", 16, 160);
          particles.spawnRing(targetHero.x, targetHero.y, 65, "#3498db", 0.5);
        }
      } else if (hid === "tigreal") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: this.x,
            y: this.y,
            radius: 95,
            color: "rgba(243, 156, 18, 0.45)",
            life: 0.6,
            maxLife: 0.6,
            damage: 0
          });
        }
        if (particles) {
          particles.spawnRing(this.x, this.y, 95, "#ffd700", 0.6);
          particles.spawnBurst(this.x, this.y, "#ffd700", 22, 160);
        }
      } else if (hid === "nana") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetHero.x,
            y: targetHero.y,
            radius: 80,
            color: "rgba(241, 196, 15, 0.5)",
            life: 0.6,
            maxLife: 0.6,
            damage: 0
          });
        }
        if (particles) {
          particles.spawnRing(targetHero.x, targetHero.y, 80, "#f1c40f", 0.5);
          particles.spawnBurst(targetHero.x, targetHero.y, "#ff7675", 16, 130);
        }
      } else if (hid === "pharsa") {
        if (sm && sm.activeAOEs) {
          for (let k = 0; k < 3; k++) {
            const ox = (Math.random() - 0.5) * 50;
            const oy = (Math.random() - 0.5) * 50;
            sm.activeAOEs.push({
              type: "circle",
              x: targetHero.x + ox,
              y: targetHero.y + oy,
              radius: 75,
              color: "rgba(155, 89, 182, 0.5)",
              life: 0.55 + k * 0.1,
              maxLife: 0.55 + k * 0.1,
              delay: k * 0.12,
              damage: 0
            });
          }
        }
        if (particles) {
          particles.spawnRing(targetHero.x, targetHero.y, 75, "#9b59b6", 0.6);
          particles.spawnBurst(targetHero.x, targetHero.y, "#9b59b6", 20, 150);
        }
      } else if (hid === "balmond") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetHero.x,
            y: targetHero.y,
            radius: 85,
            color: "rgba(192, 57, 43, 0.55)",
            life: 0.5,
            maxLife: 0.5,
            damage: 0
          });
        }
        if (particles) {
          particles.spawnRing(targetHero.x, targetHero.y, 85, "#c0392b", 0.6);
          particles.spawnBurst(targetHero.x, targetHero.y, "#ffd700", 20, 150);
        }
      } else if (hid === "alucard") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetHero.x,
            endY: targetHero.y,
            width: 26,
            color: "#e74c3c",
            life: 0.45,
            maxLife: 0.45,
            damage: 0
          });
        }
        if (particles) {
          particles.spawnRing(this.x, this.y, 65, "#e74c3c", 0.5);
          particles.spawnBurst(targetHero.x, targetHero.y, "#e74c3c", 16, 130);
        }
      } else if (hid === "saber") {
        if (particles) {
          if (particles.spawnSlash) particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#3498db", 52);
          particles.spawnRing(targetHero.x, targetHero.y, 65, "#3498db", 0.6);
          particles.spawnBurst(targetHero.x, targetHero.y, "#ffffff", 18, 140);
        }
      } else if (hid === "gusion") {
        if (particles) {
          particles.spawnBurst(this.x, this.y, "#9b59b6", 24, 200);
          particles.spawnRing(this.x, this.y, 80, "#9b59b6", 0.5);
          particles.spawnBurst(targetHero.x, targetHero.y, "#9b59b6", 16, 140);
        }
      } else if (hid === "angela") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetHero.x,
            endY: targetHero.y,
            width: 8,
            color: "#ff7675",
            life: 0.5,
            maxLife: 0.5,
            damage: 0
          });
        }
        if (particles) {
          particles.spawnRing(this.x, this.y, 55, "#ff7675", 0.6);
          particles.spawnBurst(this.x, this.y, "#2ecc71", 16, 120);
        }
      } else if (hid === "miya") {
        if (particles) {
          particles.spawnRing(this.x, this.y, 65, "#2ecc71", 0.65);
          particles.spawnBurst(this.x, this.y, "#2ecc71", 16, 130);
        }
      } else {
        if (particles) {
          particles.spawnRing(targetHero.x, targetHero.y, 65, this.color, 0.5);
          particles.spawnBurst(targetHero.x, targetHero.y, this.color, 20, 160);
        }
      }

      let rDmg = this.skills.r.damage;
      if (hid === "balmond") {
        const missingHp = Math.max(0, (targetHero.maxHp || 1200) - targetHero.hp);
        rDmg = Math.round(rDmg + missingHp * 0.28);
      }

      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(rDmg, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= rDmg;
      }
      if ((hid === "tigreal" || hid === "nana" || hid === "saber") && typeof targetHero.applyStun === "function") {
        targetHero.applyStun(1.4, combatTexts);
      }
      if (hid === "angela") {
        this.shield = (this.shield || 0) + 1100;
        this.hp = Math.min(this.maxHp, this.hp + 300);
      }
      if (combatTexts) {
        combatTexts.push({
          x: targetHero.x,
          y: targetHero.y - 25,
          text: hid === "balmond" ? `[${this.team}] LETHAL EXECUTE -${rDmg}!` : `[${this.team}] ${this.skills.r.name.toUpperCase()} -${rDmg}!`,
          color: this.color,
          life: 1.2,
          maxLife: 1.2
        });
      }
      return true;
    }

    // 2. Skill 2 (W) Decision (Crowd-control / Dash / AOE burst)
    if (this.skills.w && this.skills.w.cd <= 0 && dist <= this.skills.w.range) {
      this.skills.w.cd = this.skills.w.maxCd;
      this.skillActionTimer = 0.32;
      if (sound) sound.playSkill("w");

      // Vivid Visual Effects for Skill 2 (W)
      if (hid === "pharsa") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetHero.x,
            endY: targetHero.y,
            width: 14,
            color: "#9b59b6",
            life: 0.35,
            maxLife: 0.35,
            damage: 0
          });
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#9b59b6", 14, 120);
      } else if (hid === "miya") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetHero.x,
            y: targetHero.y,
            radius: 68,
            color: "rgba(46, 204, 113, 0.4)",
            life: 0.48,
            maxLife: 0.48,
            damage: 0
          });
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#2ecc71", 14, 120);
      } else if (hid === "nana") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetHero.x,
            y: targetHero.y,
            radius: 55,
            color: "rgba(230, 126, 34, 0.45)",
            life: 0.45,
            maxLife: 0.45,
            damage: 0
          });
        }
        if (particles) particles.spawnRing(targetHero.x, targetHero.y, 55, "#e67e22", 0.45);
      } else if (hid === "layla") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetHero.x,
            y: targetHero.y,
            radius: 60,
            color: "rgba(52, 152, 219, 0.45)",
            life: 0.4,
            maxLife: 0.4,
            damage: 0
          });
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#3498db", 14, 120);
      } else if (hid === "angela") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetHero.x,
            endY: targetHero.y,
            width: 6,
            color: "#ff7675",
            life: 0.5,
            maxLife: 0.5,
            damage: 0
          });
        }
        if (particles) particles.spawnRing(targetHero.x, targetHero.y, 45, "#ff7675", 0.4);
      } else if (hid === "tigreal") {
        if (particles && particles.spawnSlash) {
          particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#f39c12", 48);
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#f39c12", 14, 120);
      } else if (hid === "balmond") {
        this.balmondCyclone = { active: true, timer: 3.2, angle: 0, damageTickTimer: 0.05 };
        if (particles) {
          particles.spawnRing(this.x, this.y, 48, "#e74c3c", 0.4);
          particles.spawnBurst(this.x, this.y, "#c0392b", 16, 130);
        }
      } else if (hid === "alucard") {
        if (particles) {
          particles.spawnRing(this.x, this.y, 58, "#e74c3c", 0.4);
          if (particles.spawnSlash) particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#e74c3c", 45);
        }
      } else if (hid === "gusion") {
        if (particles) {
          particles.spawnBurst(targetHero.x, targetHero.y, "#9b59b6", 15, 140);
          if (particles.spawnSlash) particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#9b59b6", 42);
        }
      } else if (hid === "saber") {
        if (particles && particles.spawnSlash) {
          particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#3498db", 46);
        }
      } else {
        if (particles) {
          particles.spawnRing(this.x, this.y, 45, "#e67e22", 0.35);
          particles.spawnBurst(targetHero.x, targetHero.y, "#e67e22", 12, 120);
        }
      }

      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(this.skills.w.damage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= this.skills.w.damage;
      }
      // CC checks
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
      return true;
    }

    // 3. Skill 1 (Q) Decision (Poke / Burst / Wave Damage)
    if (this.skills.q && this.skills.q.cd <= 0 && dist <= this.skills.q.range) {
      this.skills.q.cd = this.skills.q.maxCd;
      this.skillActionTimer = 0.3;
      if (sound) sound.playSkill("q");

      // Vivid Visual Effects for Skill 1 (Q)
      if (hid === "layla") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetHero.x,
            endY: targetHero.y,
            width: 12,
            color: "#3498db",
            life: 0.28,
            maxLife: 0.28,
            damage: 0
          });
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#3498db", 12, 110);
      } else if (hid === "tigreal") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetHero.x,
            endY: targetHero.y,
            width: 16,
            color: "#e67e22",
            life: 0.32,
            maxLife: 0.32,
            damage: 0
          });
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#f39c12", 12, 110);
      } else if (hid === "alucard") {
        if (sm && sm.activeAOEs) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetHero.x,
            y: targetHero.y,
            radius: 60,
            color: "rgba(231, 76, 60, 0.45)",
            life: 0.35,
            maxLife: 0.35,
            damage: 0
          });
        }
        if (particles) particles.spawnBurst(targetHero.x, targetHero.y, "#e74c3c", 12, 110);
      } else if (hid === "angela") {
        if (particles) {
          particles.spawnBurst(targetHero.x, targetHero.y, "#2ecc71", 12, 110);
          particles.spawnRing(this.x, this.y, 45, "#ff7675", 0.4);
        }
      } else if (hid === "pharsa") {
        if (particles) {
          particles.spawnRing(targetHero.x, targetHero.y, 50, "#8e44ad", 0.4);
          particles.spawnBurst(targetHero.x, targetHero.y, "#9b59b6", 12, 110);
        }
      } else if (hid === "nana") {
        if (particles) {
          particles.spawnRing(targetHero.x, targetHero.y, 45, "#f1c40f", 0.4);
          particles.spawnBurst(targetHero.x, targetHero.y, "#f1c40f", 12, 110);
        }
      } else if (hid === "miya") {
        if (particles) {
          if (particles.spawnSlash) particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#2ecc71", 40);
          particles.spawnBurst(targetHero.x, targetHero.y, "#2ecc71", 10, 110);
        }
      } else if (hid === "balmond") {
        const angle = Math.atan2(targetHero.y - this.y, targetHero.x - this.x);
        const sm = skillManager || (typeof window !== "undefined" ? window.skillManager : null);
        const origX = this.x;
        const origY = this.y;
        const rawDestX = this.x + Math.cos(angle) * 70;
        const rawDestY = this.y + Math.sin(angle) * 70;
        if (sm && typeof sm.resolveSafeDashPosition === "function") {
          const safePos = sm.resolveSafeDashPosition(rawDestX, rawDestY, map, origX, origY);
          this.x = safePos.x;
          this.y = safePos.y;
        } else if (this.checkWalkable(map, rawDestX, rawDestY)) {
          this.x = rawDestX;
          this.y = rawDestY;
        }
        if (particles) {
          if (particles.spawnSlash) particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#c0392b", 50);
          particles.spawnRing(this.x, this.y, 65, "#c0392b", 0.4);
          particles.spawnBurst(targetHero.x, targetHero.y, "#c0392b", 14, 120);
        }
        if (typeof targetHero.applyStun === "function") {
          targetHero.applyStun(0.5, combatTexts);
        }
      } else if (hid === "gusion") {
        if (particles && particles.spawnSlash) {
          particles.spawnSlash(this.x, this.y, targetHero.x, targetHero.y, "#9b59b6", 45);
        }
      } else if (hid === "saber") {
        this.saberSwords = { active: true, timer: 5.0, angle: 0, damageTickTimer: 0.05 };
        if (particles) {
          particles.spawnRing(this.x, this.y, 80, "#00d2d3", 0.6);
          particles.spawnBurst(this.x, this.y, "#00ffff", 16, 130);
        }
      } else {
        if (particles) {
          particles.spawnBurst(targetHero.x, targetHero.y, "#f39c12", 12, 110);
        }
      }

      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(this.skills.q.damage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= this.skills.q.damage;
      }
      if (hid === "angela" && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + 240);
        if (combatTexts) {
          combatTexts.push({ x: this.x, y: this.y - 25, text: "+240 HP", color: "#2ecc71", life: 1.0, maxLife: 1.0 });
        }
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
      return true;
    }

    return false;
  }

  engageEnemyHero(targetHero, dist, dt, combatTexts, sound, particles, scoreboard, map, skillManager) {
    const chaseCutoff = this.getLaneFrontlineBoundary(map);

    // Stop deep tower-diving past cutoff unless enemy is low and within striking range
    const isPastCutoff = this.team === "RED" ? targetHero.x < chaseCutoff : targetHero.x > chaseCutoff;
    if (isPastCutoff && targetHero.hp > targetHero.maxHp * 0.25 && dist > 180) {
      this.state = "LANING";
      this.targetX = this.team === "RED" ? Math.max(this.x, chaseCutoff + 30) : Math.min(this.x, chaseCutoff - 30);
      this.targetY = this.laneY;
      return;
    }

    // Inter-lane navigation on Land of Dawn: if target is in another lane behind a wall, route through the nearest corridor
    if (map && map.mapType === "LAND_OF_DAWN" && Math.abs(targetHero.y - this.y) > 260) {
      const mapW = map.width * map.tileSize;
      const isBlueSide = this.x < mapW / 2;
      const corridorXs = isBlueSide ? [240, 600, 880] : [880, 1160, 1480];
      let bestCorridorX = corridorXs[0];
      let bestDist = Math.abs(this.x - bestCorridorX);
      for (let i = 1; i < corridorXs.length; i++) {
        const d = Math.abs(this.x - corridorXs[i]);
        if (d < bestDist) {
          bestDist = d;
          bestCorridorX = corridorXs[i];
        }
      }
      if (Math.abs(this.x - bestCorridorX) > 40) {
        this.targetX = bestCorridorX;
        this.targetY = this.y;
        return;
      }
    }

    // Positioning: Ranged heroes kite and keep distance; Melee heroes close in
    const isRanged = this.attackRange > 130;
    if (isRanged) {
      if (dist > this.attackRange * 0.9) {
        this.targetX = targetHero.x;
        this.targetY = targetHero.y;
      } else if (dist < this.attackRange * 0.45) {
        // Kite backwards smoothly
        const angle = Math.atan2(this.y - targetHero.y, this.x - targetHero.x);
        this.targetX = this.x + Math.cos(angle) * 80;
        this.targetY = this.y + Math.sin(angle) * 80;
      } else {
        this.targetX = this.x;
        this.targetY = this.y;
      }
    } else {
      // Melee gap closing
      if (dist > this.attackRange * 0.85) {
        this.targetX = targetHero.x;
        this.targetY = targetHero.y;
      } else {
        this.targetX = this.x;
        this.targetY = this.y;
      }
    }

    // High-IQ Bot Skill Combo Rotation with vivid visual effects
    this.castBotSkills(targetHero, dist, combatTexts, sound, particles, scoreboard, skillManager);

    // Basic Attack
    if (this.attackTimer <= 0 && dist <= this.attackRange) {
      this.attackTimer = this.attackCooldown;
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
      let effectiveDmg = this.attackDamage;
      if (this.buffs && this.buffs.red > 0) {
        const bonusTrueDmg = 35 + Math.round((this.level || 1) * 4);
        effectiveDmg += bonusTrueDmg;
        if (particles && particles.spawnBurst) particles.spawnBurst(targetHero.x, targetHero.y, "#ff4757", 5, 80);
        if (combatTexts) {
          combatTexts.push({
            x: targetHero.x + (Math.random() - 0.5) * 14,
            y: targetHero.y - 32,
            text: `[TRUE] +${bonusTrueDmg}`,
            color: "#ff4757",
            life: 0.8,
            maxLife: 0.8
          });
        }
      }
      if (typeof targetHero.takeDamage === "function") {
        targetHero.takeDamage(effectiveDmg, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetHero.hp -= effectiveDmg;
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

  engageObjective(objectiveManager, dt, combatTexts, sound, particles, scoreboard, skillManager = null) {
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

    // Cast Q or W to DPS objective boss faster
    if (this.skills && this.skillActionTimer <= 0 && dist <= Math.max(this.attackRange + 40, (this.skills.q ? this.skills.q.range : 260))) {
      const hid = (this.id || (this.heroData && this.heroData.id) || "").toLowerCase();
      const sm = skillManager || (typeof window !== "undefined" ? window.skillManager : null);
      if (this.skills.q && this.skills.q.cd <= 0) {
        this.skills.q.cd = this.skills.q.maxCd;
        this.skillActionTimer = 0.3;
        if (sound) sound.playSkill("q");
        if (particles) {
          particles.spawnBurst(targetBoss.x, targetBoss.y, "#f39c12", 12, 110);
          particles.spawnRing(targetBoss.x, targetBoss.y, 45, "#f39c12", 0.4);
        }
        if (sm && sm.activeAOEs && (hid === "layla" || hid === "pharsa" || hid === "tigreal")) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: targetBoss.x,
            endY: targetBoss.y,
            width: 10,
            color: this.color || "#f39c12",
            life: 0.25,
            maxLife: 0.25,
            damage: 0
          });
        }
        if (typeof targetBoss.takeDamage === "function") {
          targetBoss.takeDamage(this.skills.q.damage, this, combatTexts, particles, sound, scoreboard);
        } else {
          targetBoss.hp = Math.max(0, targetBoss.hp - this.skills.q.damage);
          targetBoss.lastAttacker = this;
        }
      } else if (this.skills.w && this.skills.w.cd <= 0 && dist <= (this.skills.w.range || 260)) {
        this.skills.w.cd = this.skills.w.maxCd;
        this.skillActionTimer = 0.3;
        if (sound) sound.playSkill("w");
        if (particles) {
          particles.spawnBurst(targetBoss.x, targetBoss.y, "#e67e22", 12, 110);
          particles.spawnRing(targetBoss.x, targetBoss.y, 45, "#e67e22", 0.4);
        }
        if (sm && sm.activeAOEs && (hid === "nana" || hid === "miya" || hid === "layla")) {
          sm.activeAOEs.push({
            type: "circle",
            x: targetBoss.x,
            y: targetBoss.y,
            radius: 55,
            color: "rgba(230, 126, 34, 0.4)",
            life: 0.4,
            maxLife: 0.4,
            damage: 0
          });
        }
        if (typeof targetBoss.takeDamage === "function") {
          targetBoss.takeDamage(this.skills.w.damage, this, combatTexts, particles, sound, scoreboard);
        } else {
          targetBoss.hp = Math.max(0, targetBoss.hp - this.skills.w.damage);
          targetBoss.lastAttacker = this;
        }
      }
    }

    if (dist <= this.attackRange + 25 && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      const isRanged = this.attackRange > 130;
      if (sound) {
        if (isRanged) sound.playShoot();
        else if (sound.playSlash) sound.playSlash();
        else sound.playAttack();
      }
      if (particles && !isRanged && particles.spawnSlash) {
        particles.spawnSlash(this.x, this.y, targetBoss.x, targetBoss.y, this.color, 40);
      }
      if (typeof targetBoss.takeDamage === "function") {
        targetBoss.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
      } else {
        targetBoss.hp = Math.max(0, targetBoss.hp - this.attackDamage);
        targetBoss.lastAttacker = this;
      }
    }
  }

  engageLord(lord, dt, combatTexts, sound, particles, scoreboard, skillManager = null) {
    const dist = Math.hypot(lord.x - this.x, lord.y - this.y);
    if (dist > this.attackRange * 0.85) {
      this.targetX = lord.x;
      this.targetY = lord.y;
    } else {
      this.targetX = this.x;
      this.targetY = this.y;
    }

    // Cast Q or W to burn summoned Lord faster
    if (this.skills && this.skillActionTimer <= 0 && dist <= Math.max(this.attackRange + 40, (this.skills.q ? this.skills.q.range : 260))) {
      const hid = (this.id || (this.heroData && this.heroData.id) || "").toLowerCase();
      const sm = skillManager || (typeof window !== "undefined" ? window.skillManager : null);
      if (this.skills.q && this.skills.q.cd <= 0) {
        this.skills.q.cd = this.skills.q.maxCd;
        this.skillActionTimer = 0.3;
        if (sound) sound.playSkill("q");
        if (particles) {
          particles.spawnBurst(lord.x, lord.y, "#f39c12", 12, 110);
          particles.spawnRing(lord.x, lord.y, 45, "#f39c12", 0.4);
        }
        if (sm && sm.activeAOEs && (hid === "layla" || hid === "pharsa" || hid === "tigreal")) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: lord.x,
            endY: lord.y,
            width: 10,
            color: this.color || "#f39c12",
            life: 0.25,
            maxLife: 0.25,
            damage: 0
          });
        }
        if (typeof lord.takeDamage === "function") {
          lord.takeDamage(this.skills.q.damage, this, combatTexts, particles, sound, scoreboard);
        }
      } else if (this.skills.w && this.skills.w.cd <= 0 && dist <= (this.skills.w.range || 260)) {
        this.skills.w.cd = this.skills.w.maxCd;
        this.skillActionTimer = 0.3;
        if (sound) sound.playSkill("w");
        if (particles) {
          particles.spawnBurst(lord.x, lord.y, "#e67e22", 12, 110);
          particles.spawnRing(lord.x, lord.y, 45, "#e67e22", 0.4);
        }
        if (sm && sm.activeAOEs && (hid === "nana" || hid === "miya" || hid === "layla")) {
          sm.activeAOEs.push({
            type: "circle",
            x: lord.x,
            y: lord.y,
            radius: 55,
            color: "rgba(230, 126, 34, 0.4)",
            life: 0.4,
            maxLife: 0.4,
            damage: 0
          });
        }
        if (typeof lord.takeDamage === "function") {
          lord.takeDamage(this.skills.w.damage, this, combatTexts, particles, sound, scoreboard);
        }
      }
    }

    if (dist <= this.attackRange + 25 && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      const isRanged = this.attackRange > 130;
      if (sound) {
        if (isRanged) sound.playShoot();
        else if (sound.playSlash) sound.playSlash();
        else sound.playAttack();
      }
      if (particles && !isRanged && particles.spawnSlash) {
        particles.spawnSlash(this.x, this.y, lord.x, lord.y, this.color, 40);
      }
      if (typeof lord.takeDamage === "function") {
        lord.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
      }
    }
  }

  engageLaning(minionManager, map, dt, combatTexts, sound, particles, scoreboard, closestOpp = null, distToClosestOpp = Infinity, skillManager = null) {
    // 0. Jungle Bot Farming: if assigned to JUNGLE, clear nearby allied jungle camps first
    const objMgr = (typeof window !== "undefined" && window.objectiveManager) ? window.objectiveManager : null;
    if (this.assignedLane === "JUNGLE" && objMgr && Array.isArray(objMgr.jungleCamps)) {
      const isBlue = this.team === "BLUE";
      const mapHalfX = map ? (map.width * map.tileSize) / 2 : 880;
      const myCamps = objMgr.jungleCamps.filter(c => c.alive && c.hp > 0 && (isBlue ? c.x < mapHalfX : c.x >= mapHalfX));
      if (myCamps.length > 0) {
        let closestCamp = null;
        let minCampDist = Infinity;
        myCamps.forEach(c => {
          const d = Math.hypot(c.x - this.x, c.y - this.y);
          if (d < minCampDist) {
            minCampDist = d;
            closestCamp = c;
          }
        });
        if (closestCamp) {
          if (minCampDist > this.attackRange * 0.8) {
            this.targetX = closestCamp.x;
            this.targetY = closestCamp.y;
          } else {
            this.targetX = this.x;
            this.targetY = this.y;
          }
          if (this.attackTimer <= 0 && minCampDist <= this.attackRange + 30) {
            this.attackTimer = this.attackCooldown;
            if (sound) sound.playAttack();
            if (particles && particles.spawnSlash) {
              particles.spawnSlash(this.x, this.y, closestCamp.x, closestCamp.y, this.color, 36);
            }
            if (typeof closestCamp.takeDamage === "function") {
              closestCamp.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
            }
          }
          return;
        }
      }
    }

    // 0. Poke opposing hero during laning if in skill range
    const maxSkillReach = Math.max(
      260,
      (this.skills && this.skills.q) ? (this.skills.q.range || 260) : 260,
      (this.skills && this.skills.w) ? (this.skills.w.range || 260) : 260
    );
    if (closestOpp && distToClosestOpp <= maxSkillReach && this.skillActionTimer <= 0) {
      this.castBotSkills(closestOpp, distToClosestOpp, combatTexts, sound, particles, scoreboard, skillManager);
    }

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
    if (clusterCount >= 2 && nearestMinion && minDist <= 240 && this.skillActionTimer <= 0) {
      const hid = (this.id || (this.heroData && this.heroData.id) || "").toLowerCase();
      const sm = skillManager || (typeof window !== "undefined" ? window.skillManager : null);
      if (this.skills.q && this.skills.q.cd <= 0) {
        this.skills.q.cd = this.skills.q.maxCd;
        this.skillActionTimer = 0.3;
        if (sound) sound.playSkill("q");
        if (particles) {
          particles.spawnBurst(nearestMinion.x, nearestMinion.y, "#f39c12", 10, 100);
          particles.spawnRing(nearestMinion.x, nearestMinion.y, 40, "#f39c12", 0.35);
        }
        if (sm && sm.activeAOEs && (hid === "layla" || hid === "pharsa" || hid === "tigreal")) {
          sm.activeAOEs.push({
            type: "beam",
            startX: this.x,
            startY: this.y,
            endX: nearestMinion.x,
            endY: nearestMinion.y,
            width: 10,
            color: this.color || "#f39c12",
            life: 0.25,
            maxLife: 0.25,
            damage: 0
          });
        }
        nearestMinion.hp -= this.skills.q.damage;
      } else if (this.skills.w && this.skills.w.cd <= 0) {
        this.skills.w.cd = this.skills.w.maxCd;
        this.skillActionTimer = 0.3;
        if (sound) sound.playSkill("w");
        if (particles) {
          particles.spawnBurst(nearestMinion.x, nearestMinion.y, "#e67e22", 10, 100);
          particles.spawnRing(nearestMinion.x, nearestMinion.y, 40, "#e67e22", 0.35);
        }
        if (sm && sm.activeAOEs && (hid === "nana" || hid === "miya" || hid === "layla")) {
          sm.activeAOEs.push({
            type: "circle",
            x: nearestMinion.x,
            y: nearestMinion.y,
            radius: 50,
            color: "rgba(230, 126, 34, 0.4)",
            life: 0.35,
            maxLife: 0.35,
            damage: 0
          });
        }
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
        if (particles && !isRanged && particles.spawnSlash) {
          particles.spawnSlash(this.x, this.y, nearestMinion.x, nearestMinion.y, this.color, 36);
        }
        nearestMinion.hp -= this.attackDamage;
        if (nearestMinion.hp <= 0) {
          this.cs++;
          this.gold += 50;
          if (scoreboard) {
            const teamKey = this.team === "BLUE" ? "player" : "bot";
            scoreboard.addGold(teamKey, 50);
          }
          this.gainExp(60, combatTexts, particles, sound);
          if (combatTexts) {
            combatTexts.push({
              x: this.x + (Math.random() - 0.5) * 12,
              y: this.y - 25,
              text: `+50g +60EXP`,
              color: "#ffd700",
              life: 1.0,
              maxLife: 1.0
            });
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

        // Turrets are immune to skills - bots only use basic attacks against towers
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;
          const isRanged = this.attackRange > 130;
          if (sound) {
            if (isRanged) sound.playShoot();
            else if (sound.playSlash) sound.playSlash();
            else sound.playAttack();
          }
          if (particles) {
            if (!isRanged && particles.spawnSlash) {
              particles.spawnSlash(this.x, this.y, nearTurret.worldX, nearTurret.worldY, this.color, 40);
            }
            particles.spawnBurst(nearTurret.worldX, nearTurret.worldY, "#ffd700", 6, 80);
          }
          if (typeof nearTurret.takeDamage === "function") {
            nearTurret.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
          } else {
            nearTurret.lastAttacker = this;
            nearTurret.hp -= this.attackDamage;
          }
        }
      } else {
        // Deployment waypoints check (Land of Dawn corner ascent/descent)
        if (!this.laneDeployed && this.deploymentWaypoints && this.deploymentWaypoints.length > 0) {
          const wp = this.deploymentWaypoints[this.deploymentWaypointIndex];
          if (wp) {
            this.targetX = wp.x;
            this.targetY = wp.y;
            if (Math.hypot(this.x - wp.x, this.y - wp.y) < 36) {
              this.deploymentWaypointIndex++;
              if (this.deploymentWaypointIndex >= this.deploymentWaypoints.length) {
                this.laneDeployed = true;
              }
            }
            return;
          }
        }

        // 3. March down lane towards frontline boundary / opposing base
        const chaseCutoff = this.getLaneFrontlineBoundary(map);
        const mapMaxX = map ? (map.width * map.tileSize) : (32 * 40);
        if (this.team === "RED") {
          this.targetX = Math.max(chaseCutoff + 25, 120);
          this.targetY = this.laneY;
        } else {
          this.targetX = Math.min(chaseCutoff - 25, mapMaxX - 120);
          this.targetY = this.laneY;
        }
      }
    }
  }

  stepMovement(dt, map) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    const mapMaxX = map ? (map.width * map.tileSize - 20) : (31 * 40);
    const mapMaxY = map ? (map.height * map.tileSize - 20) : (23 * 40);

    if (dist > 3) {
      const step = Math.min(dist, this.speed * dt);
      const stepX = (dx / dist) * step;
      const stepY = (dy / dist) * step;

      const nx = Math.max(20, Math.min(mapMaxX, this.x + stepX));
      const ny = Math.max(20, Math.min(mapMaxY, this.y + stepY));

      // Separate axis-aligned collision checks for smooth sliding along walls
      const canMoveX = this.checkWalkable(map, nx, this.y);
      const canMoveY = this.checkWalkable(map, this.x, ny);

      if (canMoveX) this.x = nx;
      if (canMoveY) this.y = ny;

      // Smart tangent sliding if blocked straight into a wall or corner
      if (!canMoveX && !canMoveY) {
        const moveAngle = Math.atan2(dy, dx);
        const testAngles = [
          moveAngle + Math.PI / 3,
          moveAngle - Math.PI / 3,
          moveAngle + Math.PI / 2,
          moveAngle - Math.PI / 2
        ];
        for (let i = 0; i < testAngles.length; i++) {
          const ta = testAngles[i];
          const tx = Math.max(20, Math.min(mapMaxX, this.x + Math.cos(ta) * step));
          const ty = Math.max(20, Math.min(mapMaxY, this.y + Math.sin(ta) * step));
          if (this.checkWalkable(map, tx, ty)) {
            this.x = tx;
            this.y = ty;
            break;
          }
        }
      }
    }

    // Multi-ring emergency unstuck: if bot ever ends up trapped inside/against a wall, immediately push out to safe ground
    if (map && !this.checkWalkable(map, this.x, this.y)) {
      let freed = false;
      for (let d = 6; d <= 72; d += 6) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const testX = this.x + Math.cos(angle) * d;
          const testY = this.y + Math.sin(angle) * d;
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