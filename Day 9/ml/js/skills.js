/**
 * Hero Abilities & Skills System
 * Phase 3 implementation - Q / W / E / R skills for all 10 MLBB heroes
 */

const HERO_SKILLS = {
  miya: {
    q: { name: "Moon Arrow", cd: 4, type: "multishot", desc: "Fires 3 split arrows at nearby enemies" },
    w: { name: "Arrow of Eclipse", cd: 7, type: "aoe", radius: 60, desc: "Rain of arrows slowing and damaging enemies" },
    e: { name: "Moon Stride", cd: 10, type: "buff", desc: "Cleanse and +60% movement speed" },
    r: { name: "Hidden Moonlight", cd: 24, type: "ultimate", desc: "Max attack speed surge and bonus attack damage" }
  },
  layla: {
    q: { name: "Malefic Bomb", cd: 4, type: "laser", desc: "High-speed piercing laser beam" },
    w: { name: "Void Projectile", cd: 6, type: "aoe", radius: 55, desc: "Energy ball explosive blast" },
    e: { name: "Range Mastery", cd: 11, type: "buff", desc: "+120 attack range and +25% move speed" },
    r: { name: "Destruction Rush", cd: 28, type: "ultimate", desc: "Massive cannon laser down the lane" }
  },
  tigreal: {
    q: { name: "Attack Wave", cd: 5, type: "shockwave", desc: "Ground wave damaging and slowing enemies" },
    w: { name: "Sacred Hammer", cd: 8, type: "dash_push", desc: "Charges forward, knocking back enemies" },
    e: { name: "Fearless Guard", cd: 10, type: "shield", desc: "Shield absorbing 450 damage" },
    r: { name: "Implosion", cd: 28, type: "ultimate_pull", desc: "Pulls all nearby enemies into Tigreal with a stun" }
  },
  angela: {
    q: { name: "Love Waves", cd: 3.5, type: "wave_heal", desc: "Heals hero and damages enemies in a line" },
    w: { name: "Puppet String", cd: 8, type: "targeted_cc", desc: "Tethers enemy, immobilizing them after 1s" },
    e: { name: "Love Motion", cd: 9, type: "buff", desc: "+45% movement speed burst" },
    r: { name: "Heartguard", cd: 28, type: "ultimate_shield", desc: "Massive 700 HP shield and +30 ATK" }
  },
  alucard: {
    q: { name: "Groundsplitter", cd: 5, type: "leap", desc: "Leaps to cursor with greatsword slam" },
    w: { name: "Whirling Smash", cd: 4, type: "cleave", radius: 70, desc: "360° greatsword spin slashing enemies" },
    e: { name: "Pursuit", cd: 7, type: "dash", desc: "Instant forward dash and attack empower" },
    r: { name: "Fission Wave", cd: 24, type: "ultimate_wave", desc: "50% lifesteal aura and massive shockwave" }
  },
  balmond: {
    q: { name: "Soul Lock", cd: 6, type: "dash_knock", desc: "Charges forward dealing damage and knockback" },
    w: { name: "Cyclone Sweep", cd: 5, type: "spin_ticks", desc: "Spins giant axe dealing multi-tick damage" },
    e: { name: "Bloodthirst", cd: 10, type: "heal", desc: "War cry restoring 250 HP instantly" },
    r: { name: "Lethal Counter", cd: 24, type: "ultimate_execute", desc: "Slams axe down dealing heavy execute damage" }
  },
  gusion: {
    q: { name: "Sword Spike", cd: 4, type: "dagger_teleport", desc: "Throws dagger; recast dashes behind target" },
    w: { name: "Shadowblade", cd: 5, type: "dagger_fan", desc: "Throws fan of 5 daggers that return" },
    e: { name: "Incandescence", cd: 10, type: "dash_reset", desc: "Dashes and instantly refreshes Q and W" },
    r: { name: "Blade Barrage", cd: 22, type: "ultimate_storm", desc: "Unleashes rapid dagger storm in all directions" }
  },
  saber: {
    q: { name: "Orbiting Swords", cd: 6, type: "swords_orbit", desc: "Spawns 4 spinning swords that strike enemies" },
    w: { name: "Charge", cd: 6, type: "dash", desc: "Dashes forward slicing through enemy lines" },
    e: { name: "Enemy's Bane", cd: 8, type: "armor_shred", desc: "Armor-piercing strike dealing true damage" },
    r: { name: "Triple Sweep", cd: 26, type: "ultimate_execute", desc: "Locks onto target, knocks airborne with 3 slashes" }
  },
  pharsa: {
    q: { name: "Curse of Crow", cd: 5, type: "aoe", radius: 50, desc: "Crow mark stunning enemy on next attack" },
    w: { name: "Energy Impact", cd: 5, type: "laser", desc: "Wide magical burst beam" },
    e: { name: "Wings by Wings", cd: 12, type: "buff_fly", desc: "Transforms into flying crow with +80% move speed" },
    r: { name: "Air Strike", cd: 28, type: "ultimate_meteor", desc: "Bombards 4 consecutive air strikes at cursor" }
  },
  nana: {
    q: { name: "Magic Boomerang", cd: 4, type: "boomerang", desc: "Throws boomerang forward that damages and returns" },
    w: { name: "Molina Smooch", cd: 9, type: "trap_morph", desc: "Places Molina trap that morphs enemy into a cat" },
    e: { name: "Molina Sprint", cd: 8, type: "buff", desc: "+50% move speed burst and heal" },
    r: { name: "Molina Blitz", cd: 26, type: "ultimate_paws", desc: "Summons 3 giant consecutive paw ground slams" }
  }
};

class SkillManager {
  constructor() {
    this.cooldowns = { q: 0, w: 0, e: 0, r: 0 };
    this.maxCooldowns = { q: 4, w: 6, e: 10, r: 25 };
    this.activeProjectiles = [];
    this.activeAOEs = [];
    this.activeBuffs = {
      speedBoost: 0,
      attackSpeedBoost: 0,
      bonusDamage: 0,
      shield: 0,
      lifesteal: 0,
      isFlying: false,
      isInvulnerable: false
    };
    this.cycloneTimer = 0;
    this.orbitingSwords = 0;
    this.markedTarget = null;
  }

  getSkillsForHero(heroId) {
    return HERO_SKILLS[heroId] || HERO_SKILLS.miya;
  }

  canCast(slot) {
    return this.cooldowns[slot] <= 0;
  }

  resolveTurretCollision(destX, destY, map, origX, origY) {
    if (!map || !map.turrets) return { x: destX, y: destY };
    const minSafeDist = 38; // 40px tile half-diagonal is ~28.3px + hero radius (18px)
    for (let i = 0; i < map.turrets.length; i++) {
      const t = map.turrets[i];
      if (t.destroyed) continue;
      const d = Math.hypot(destX - t.worldX, destY - t.worldY);
      if (d < minSafeDist) {
        let angle;
        if (d > 1) {
          angle = Math.atan2(destY - t.worldY, destX - t.worldX);
        } else if (origX !== undefined && origY !== undefined && Math.hypot(origX - t.worldX, origY - t.worldY) > 1) {
          angle = Math.atan2(origY - t.worldY, origX - t.worldX);
        } else {
          angle = -Math.PI / 2;
        }
        destX = t.worldX + Math.cos(angle) * minSafeDist;
        destY = t.worldY + Math.sin(angle) * minSafeDist;
      }
    }
    return { x: destX, y: destY };
  }

  castSkill(slot, hero, targetX, targetY, map, minions, objectives, combatTexts, gameStats, enemyBot, sound, particles) {
    if (!hero || hero.hp <= 0 || !this.canCast(slot)) return false;

    const heroSkills = this.getSkillsForHero(hero.id);
    const skill = heroSkills[slot];
    if (!skill) return false;

    this.cooldowns[slot] = skill.cd;
    this.maxCooldowns[slot] = skill.cd;

    const dx = targetX - hero.x;
    const dy = targetY - hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Trigger floating skill announcement
    if (combatTexts) {
      combatTexts.push({
        x: hero.x,
        y: hero.y - 35,
        text: skill.name.toUpperCase(),
        color: "#ffd700",
        life: 1.0,
        maxLife: 1.0
      });
    }

    // Execute skill mechanics
    switch (skill.type) {
      case "multishot": {
        // Fire 3 arrows oriented towards cursor / targets
        let fired = 0;
        const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
        const candidates = enemies.filter(e => getDistance(hero.x, hero.y, e.x, e.y) <= 340);

        // Prioritize enemies closest to cursor aim point
        candidates.sort((a, b) => {
          const distA = getDistance(a.x, a.y, targetX, targetY);
          const distB = getDistance(b.x, b.y, targetX, targetY);
          return distA - distB;
        });

        candidates.forEach(e => {
          if (fired < 3) {
            const ed = getDistance(hero.x, hero.y, e.x, e.y) || 1;
            this.activeProjectiles.push({
              x: hero.x, y: hero.y,
              vx: ((e.x - hero.x) / ed) * 520,
              vy: ((e.y - hero.y) / ed) * 520,
              radius: 4, damage: 180, team: hero.team, color: "#f1c40f", life: 0.8
            });
            fired++;
          }
        });

        // If fewer than 3 enemies, fire remainder fanning out in cursor aim direction
        if (fired < 3) {
          const angles = [-0.18, 0, 0.18];
          const baseAngle = Math.atan2(dirY, dirX);
          for (let i = fired; i < 3; i++) {
            const a = baseAngle + angles[i];
            this.activeProjectiles.push({
              x: hero.x, y: hero.y,
              vx: Math.cos(a) * 520,
              vy: Math.sin(a) * 520,
              radius: 4, damage: 180, team: hero.team, color: "#f1c40f", life: 0.8
            });
          }
        }
        break;
      }

      case "laser": {
        // High speed piercing laser
        const beamRange = slot === "r" ? 800 : 400;
        const beamDmg = slot === "r" ? 520 : 220;
        this.activeAOEs.push({
          type: "beam",
          startX: hero.x, startY: hero.y,
          endX: hero.x + dirX * beamRange, endY: hero.y + dirY * beamRange,
          width: slot === "r" ? 22 : 12,
          damage: beamDmg,
          team: hero.team,
          color: slot === "r" ? "#e74c3c" : "#3498db",
          life: 0.35, maxLife: 0.35
        });
        break;
      }

      case "aoe": {
        // AOE blast at cursor
        this.activeAOEs.push({
          type: "circle",
          x: targetX, y: targetY,
          radius: skill.radius || 55,
          damage: 190,
          team: hero.team,
          color: "rgba(155, 89, 182, 0.45)",
          life: 0.8, maxLife: 0.8
        });
        break;
      }

      case "buff": {
        this.activeBuffs.speedBoost = 2.5;
        hero.hp = Math.min(hero.maxHp, hero.hp + 100);
        break;
      }

      case "shield": {
        this.activeBuffs.shield = 450;
        break;
      }

      case "leap": {
        // Alucard Groundsplitter: mid dash attack capped at 160px
        const maxDash = 160;
        const clickDist = Math.hypot(targetX - hero.x, targetY - hero.y);
        const dashDist = Math.min(clickDist, maxDash);
        const angle = Math.atan2(targetY - hero.y, targetX - hero.x);

        const origX = hero.x;
        const origY = hero.y;
        const mapMaxX = map ? map.width * map.tileSize : 1280;
        const mapMaxY = map ? map.height * map.tileSize : 720;
        let destX = clamp(hero.x + Math.cos(angle) * dashDist, 60, mapMaxX - 60);
        let destY = clamp(hero.y + Math.sin(angle) * dashDist, 60, mapMaxY - 60);

        const safePos = this.resolveTurretCollision(destX, destY, map, origX, origY);
        destX = safePos.x;
        destY = safePos.y;

        hero.x = destX;
        hero.y = destY;
        hero.targetX = destX;
        hero.targetY = destY;

        // Dashing slash trail VFX & audio
        if (particles && particles.spawnSlash) {
          particles.spawnSlash(origX, origY, destX, destY, "#9b59b6", 48);
        }
        if (particles && particles.spawnBurst) {
          particles.spawnBurst(destX, destY, "#ffd700", 12, 140);
        }
        if (sound && sound.playSlash) {
          sound.playSlash();
        }

        // Groundsplitter impact slam AOE
        this.activeAOEs.push({
          type: "circle",
          x: destX, y: destY,
          radius: 75,
          damage: 240,
          team: hero.team,
          color: "rgba(230, 126, 34, 0.5)",
          life: 0.5, maxLife: 0.5
        });
        break;
      }

      case "cleave": {
        this.activeAOEs.push({
          type: "circle",
          x: hero.x, y: hero.y,
          radius: skill.radius || 70,
          damage: 220,
          team: hero.team,
          color: "rgba(192, 57, 43, 0.5)",
          life: 0.4, maxLife: 0.4
        });
        break;
      }

      case "dash":
      case "dash_knock":
      case "dash_push": {
        const origX = hero.x;
        const origY = hero.y;
        const mapMaxX = map ? map.width * map.tileSize : 1280;
        const mapMaxY = map ? map.height * map.tileSize : 720;
        let destX = clamp(hero.x + dirX * 130, 60, mapMaxX - 60);
        let destY = clamp(hero.y + dirY * 130, 60, mapMaxY - 60);

        const safePos = this.resolveTurretCollision(destX, destY, map, origX, origY);
        hero.x = safePos.x;
        hero.y = safePos.y;
        hero.targetX = hero.x;
        hero.targetY = hero.y;
        this.activeAOEs.push({
          type: "circle",
          x: hero.x, y: hero.y,
          radius: 50,
          damage: 180,
          team: hero.team,
          color: "rgba(52, 152, 219, 0.4)",
          life: 0.3, maxLife: 0.3
        });
        break;
      }

      case "spin_ticks": {
        this.cycloneTimer = 3.0;
        break;
      }

      case "heal": {
        hero.hp = Math.min(hero.maxHp, hero.hp + 280);
        if (combatTexts) {
          combatTexts.push({ x: hero.x, y: hero.y - 20, text: "+280 HP", color: "#2ecc71", life: 1, maxLife: 1 });
        }
        break;
      }

      case "shockwave": {
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 380, vy: dirY * 380,
          radius: 12, damage: 190, team: hero.team, color: "#3498db", life: 1.0
        });
        break;
      }

      case "wave_heal": {
        hero.hp = Math.min(hero.maxHp, hero.hp + 150);
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 420, vy: dirY * 420,
          radius: 14, damage: 180, team: hero.team, color: "#f39c12", life: 0.9
        });
        break;
      }

      case "dagger_fan": {
        for (let i = -2; i <= 2; i++) {
          const angle = Math.atan2(dirY, dirX) + (i * 0.18);
          this.activeProjectiles.push({
            x: hero.x, y: hero.y,
            vx: Math.cos(angle) * 440, vy: Math.sin(angle) * 440,
            radius: 5, damage: 95, team: hero.team, color: "#e74c3c", life: 0.8
          });
        }
        break;
      }

      case "dash_reset": {
        const origX = hero.x;
        const origY = hero.y;
        const mapMaxX = map ? map.width * map.tileSize : 1280;
        const mapMaxY = map ? map.height * map.tileSize : 720;
        let destX = clamp(hero.x + dirX * 100, 60, mapMaxX - 60);
        let destY = clamp(hero.y + dirY * 100, 60, mapMaxY - 60);

        const safePos = this.resolveTurretCollision(destX, destY, map, origX, origY);
        hero.x = safePos.x;
        hero.y = safePos.y;
        hero.targetX = hero.x;
        hero.targetY = hero.y;
        this.cooldowns.q = 0;
        this.cooldowns.w = 0;
        break;
      }

      case "boomerang": {
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 400, vy: dirY * 400,
          radius: 8, damage: 175, team: hero.team, color: "#2ecc71", life: 1.2
        });
        break;
      }

      case "ultimate":
      case "ultimate_execute":
      case "ultimate_wave":
      case "ultimate_storm":
      case "ultimate_paws":
      case "ultimate_meteor":
      case "ultimate_pull":
      case "ultimate_shield": {
        this.executeUltimate(skill.type, hero, targetX, targetY, dirX, dirY, map, minions, objectives, combatTexts, enemyBot, sound, particles, gameStats);
        break;
      }

      default: {
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 420, vy: dirY * 420,
          radius: 8, damage: 200, team: hero.team, color: "#4ecca3", life: 1.0
        });
        break;
      }
    }

    return true;
  }

  executeUltimate(type, hero, targetX, targetY, dirX, dirY, map, minions, objectives, combatTexts, enemyBot, sound, particles, gameStats) {
    if (type === "ultimate_execute") {
      // Execute slam
      this.activeAOEs.push({
        type: "circle",
        x: hero.x + dirX * 60, y: hero.y + dirY * 60,
        radius: 85,
        damage: 480,
        team: hero.team,
        color: "rgba(231, 76, 60, 0.6)",
        life: 0.6, maxLife: 0.6
      });
    } else if (type === "ultimate_wave") {
      this.activeBuffs.lifesteal = 0.5;
      this.activeProjectiles.push({
        x: hero.x, y: hero.y,
        vx: dirX * 500, vy: dirY * 500,
        radius: 20, damage: 420, team: hero.team, color: "#9b59b6", life: 1.2
      });
    } else if (type === "ultimate_storm") {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i;
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: Math.cos(angle) * 420, vy: Math.sin(angle) * 420,
          radius: 5, damage: 120, team: hero.team, color: "#e74c3c", life: 0.9
        });
      }
    } else if (type === "ultimate_meteor" || type === "ultimate_paws") {
      for (let i = 0; i < 3; i++) {
        this.activeAOEs.push({
          type: "circle",
          x: targetX + (i - 1) * 35, y: targetY + (i - 1) * 20,
          radius: 70,
          damage: 260,
          team: hero.team,
          color: "rgba(155, 89, 182, 0.6)",
          delay: i * 0.25,
          life: 0.6, maxLife: 0.6
        });
      }
    } else if (type === "ultimate_pull") {
      const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
      enemies.forEach(e => {
        if (getDistance(hero.x, hero.y, e.x, e.y) <= 175) {
          // Bosses (Turtle & Lord) and Turrets are CC-immune to pulls/displacement and stuns!
          const isBossOrTurret = e.isTurret || e.isBoss || (objectives && (e === objectives.turtle || e === objectives.lord));
          if (!isBossOrTurret) {
            // Pull enemy directly into Tigreal's melee perimeter
            const pullX = hero.x + (Math.random() - 0.5) * 25;
            const pullY = hero.y + (Math.random() - 0.5) * 25;
            const safePull = this.resolveTurretCollision(pullX, pullY, map, hero.x, hero.y);
            e.x = safePull.x;
            e.y = safePull.y;
            if (e.targetX !== undefined) {
              e.targetX = e.x;
              e.targetY = e.y;
            }
            // Apply 1.0s stun
            if (typeof e.applyStun === "function") {
              e.applyStun(1.0, combatTexts);
            }
          }
          this.applySkillDamage(e, 320, hero, combatTexts, gameStats, null, sound, particles);
        }
      });
      this.activeAOEs.push({
        type: "circle",
        x: hero.x, y: hero.y,
        radius: 175,
        damage: 0,
        team: hero.team,
        color: "rgba(41, 128, 185, 0.5)",
        life: 0.5, maxLife: 0.5
      });
      if (particles) {
        particles.spawnRing(hero.x, hero.y, 175, "#ffd700", 0.5);
        particles.spawnBurst(hero.x, hero.y, "#3498db", 20, 150);
      }
    } else if (type === "ultimate_shield") {
      this.activeBuffs.shield = 750;
      this.activeBuffs.bonusDamage = 35;
    } else {
      // General Ultimate buff
      this.activeBuffs.attackSpeedBoost = 1.8;
      this.activeBuffs.speedBoost = 2.0;
    }
  }

  getAllEnemies(hero, minions, map, objectives, enemyBot) {
    const enemies = [];
    if (enemyBot && !enemyBot.isDead && enemyBot.hp > 0 && enemyBot.team !== hero.team) {
      enemies.push(enemyBot);
    }
    if (minions) {
      minions.forEach(m => {
        if (m.team !== hero.team && m.hp > 0) enemies.push(m);
      });
    }
    if (map && map.turrets) {
      map.turrets.forEach(t => {
        if (t.team !== hero.team && !t.destroyed && t.hp > 0) {
          enemies.push({ x: t.worldX, y: t.worldY, hp: t.hp, isTurret: true, ref: t });
        }
      });
    }
    if (objectives) {
      if (objectives.turtle && objectives.turtle.alive) enemies.push(objectives.turtle);
      if (objectives.lord && objectives.lord.alive) enemies.push(objectives.lord);
    }
    return enemies;
  }

  applySkillDamage(e, dmg, hero, combatTexts, gameStats, scoreboard, sound, particles) {
    if (typeof e.takeDamage === "function") {
      e.takeDamage(dmg, hero, combatTexts, particles, sound, scoreboard);
      if (gameStats) gameStats.damageDealt += dmg;
      return;
    }

    const prevHp = e.ref ? e.ref.hp : e.hp;
    if (prevHp === undefined || prevHp <= 0) return;

    const newHp = Math.max(0, prevHp - dmg);
    if (e.ref) e.ref.hp = newHp;
    if (e.hp !== undefined) e.hp = newHp;
    if (gameStats) gameStats.damageDealt += dmg;

    if (combatTexts) {
      combatTexts.push({
        x: e.x + (Math.random() - 0.5) * 15,
        y: e.y - 18,
        text: `-${Math.round(dmg)}`,
        color: "#f1c40f",
        life: 0.7,
        maxLife: 0.7
      });
    }

    // Universal kill bounty attribution for skills
    if (prevHp > 0 && newHp <= 0) {
      const bounty = e.bounty || (e.ref && e.ref.bounty);
      if (bounty) {
        if (gameStats) {
          gameStats.gold += bounty;
          if (e.team) gameStats.minionsKilled++;
        }
        if (scoreboard) {
          if (e.team) scoreboard.addCS("player");
          scoreboard.addGold("player", bounty);
        }
        if (combatTexts) {
          combatTexts.push({
            x: e.x,
            y: e.y - 32,
            text: `+${bounty}g`,
            color: "#ffd700",
            life: 1.5,
            maxLife: 1.5
          });
        }
      }
    }
  }

  update(dt, hero, map, minions, objectives, combatTexts, gameStats, enemyBot, scoreboard, sound, particles) {
    // 1. Cooldown timers
    for (const slot in this.cooldowns) {
      if (this.cooldowns[slot] > 0) {
        this.cooldowns[slot] = Math.max(0, this.cooldowns[slot] - dt);
      }
    }

    // 2. Active buffs decay
    if (this.activeBuffs.speedBoost > 0) this.activeBuffs.speedBoost = Math.max(0, this.activeBuffs.speedBoost - dt);
    if (this.activeBuffs.attackSpeedBoost > 0) this.activeBuffs.attackSpeedBoost = Math.max(0, this.activeBuffs.attackSpeedBoost - dt);
    if (this.activeBuffs.lifesteal > 0) this.activeBuffs.lifesteal = Math.max(0, this.activeBuffs.lifesteal - dt);

    // Cyclone spin ticks (Balmond W)
    if (this.cycloneTimer > 0) {
      this.cycloneTimer -= dt;
      const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
      enemies.forEach(e => {
        if (getDistance(hero.x, hero.y, e.x, e.y) <= 75) {
          const dmg = 45 * dt * 6;
          this.applySkillDamage(e, dmg, hero, combatTexts, gameStats, scoreboard, sound, particles);
        }
      });
    }

    // 3. Projectiles movement & collision
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Check hits
      const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
      let hit = false;
      for (const e of enemies) {
        if (getDistance(p.x, p.y, e.x, e.y) <= (p.radius + (e.radius || 15))) {
          this.applySkillDamage(e, p.damage, hero, combatTexts, gameStats, scoreboard, sound, particles);
          hit = true;
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.activeProjectiles.splice(i, 1);
      }
    }

    // 4. AOEs decay & damage application
    for (let i = this.activeAOEs.length - 1; i >= 0; i--) {
      const aoe = this.activeAOEs[i];
      if (aoe.delay && aoe.delay > 0) {
        aoe.delay -= dt;
        continue;
      }

      if (aoe.damage > 0) {
        const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
        enemies.forEach(e => {
          let inRange = false;
          if (aoe.type === "circle") {
            inRange = getDistance(aoe.x, aoe.y, e.x, e.y) <= aoe.radius;
          } else if (aoe.type === "beam") {
            // Line collision
            const d = getDistance(aoe.startX, aoe.startY, e.x, e.y);
            const total = getDistance(aoe.startX, aoe.startY, aoe.endX, aoe.endY);
            inRange = d <= total;
          }

          if (inRange) {
            this.applySkillDamage(e, aoe.damage, hero, combatTexts, gameStats, scoreboard, sound, particles);
          }
        });
        aoe.damage = 0; // dealt once
      }

      aoe.life -= dt;
      if (aoe.life <= 0) {
        this.activeAOEs.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    // Render AOEs
    this.activeAOEs.forEach(aoe => {
      if (aoe.delay && aoe.delay > 0) return;

      const alpha = Math.max(0, aoe.life / (aoe.maxLife || 1));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (aoe.type === "circle") {
        const sx = aoe.x - camera.x;
        const sy = aoe.y - camera.y;
        ctx.fillStyle = aoe.color;
        ctx.beginPath();
        ctx.arc(sx, sy, aoe.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (aoe.type === "beam") {
        const sx1 = aoe.startX - camera.x;
        const sy1 = aoe.startY - camera.y;
        const sx2 = aoe.endX - camera.x;
        const sy2 = aoe.endY - camera.y;

        ctx.strokeStyle = aoe.color;
        ctx.lineWidth = aoe.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = aoe.width * 0.4;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Render Projectiles
    this.activeProjectiles.forEach(p => {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
