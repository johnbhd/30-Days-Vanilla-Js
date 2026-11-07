/**
 * Hero Abilities & Skills System
 * Phase 3 implementation - Q / W / E / R skills for all 10 MLBB heroes
 */

const HERO_SKILLS = {
  miya: {
    q: { name: "Moon Arrow", cd: 3.5, type: "multishot", range: 380, indicator: "cone", desc: "Fires 3 empowered moon split arrows dealing 260 burst" },
    w: { name: "Arrow of Eclipse", cd: 6, type: "aoe", radius: 70, range: 440, indicator: "circle_aoe", desc: "Rain of moonlight arrows dealing 340 burst and slow" },
    e: { name: "Moon Stride", cd: 9, type: "buff", desc: "Cleanse and +70% movement speed" },
    r: { name: "Hidden Moonlight", cd: 22, type: "ultimate", desc: "Max attack speed surge (+120%), +40% speed, and +70 ATK" }
  },
  layla: {
    q: { name: "Malefic Bomb", cd: 3.5, type: "laser", range: 480, indicator: "line", desc: "High-speed piercing laser dealing 360 physical burst" },
    w: { name: "Void Projectile", cd: 5.5, type: "aoe", radius: 65, range: 460, indicator: "circle_aoe", desc: "Explosive energy ball dealing 310 AOE burst and slow" },
    e: { name: "Range Mastery", cd: 10, type: "buff", desc: "+140 attack range, +35% move speed, and +45 ATK" },
    r: { name: "Destruction Rush", cd: 24, type: "laser", range: 920, indicator: "line", desc: "Massive cannon laser obliterating enemies down the lane for 880 damage" }
  },
  tigreal: {
    q: { name: "Attack Wave", cd: 5, type: "shockwave", range: 380, indicator: "line", desc: "Ground wave damaging and slowing enemies" },
    w: { name: "Sacred Hammer", cd: 8, type: "dash_push", range: 160, indicator: "dash", desc: "Charges forward, knocking back enemies" },
    e: { name: "Fearless Guard", cd: 10, type: "shield", desc: "Shield absorbing 450 damage" },
    r: { name: "Implosion", cd: 28, type: "ultimate_pull", desc: "Pulls all nearby enemies into Tigreal with a stun" }
  },
  angela: {
    q: { name: "Love Waves", cd: 3.0, type: "wave_heal", range: 420, indicator: "line", desc: "Magical love wave restoring 240 HP and dealing 290 magic burst" },
    w: { name: "Puppet String", cd: 7, type: "targeted_cc", range: 380, indicator: "target", desc: "Tethers enemy, dealing 340 magic damage and immobilizing for 1.2s" },
    e: { name: "Love Motion", cd: 8, type: "buff", desc: "+60% move speed boost and self magic surge" },
    r: { name: "Heartguard", cd: 25, type: "ultimate_shield", desc: "Empowers hero with 1100 HP shield and +75 magic attack" }
  },
  alucard: {
    q: { name: "Groundsplitter", cd: 5, type: "leap", range: 160, radius: 75, indicator: "circle_aoe", desc: "Leaps to cursor with greatsword slam" },
    w: { name: "Whirling Smash", cd: 4, type: "cleave", radius: 70, desc: "360° greatsword spin slashing enemies" },
    e: { name: "Pursuit", cd: 7, type: "dash", range: 140, indicator: "dash", desc: "Instant forward dash and attack empower" },
    r: { name: "Fission Wave", cd: 24, type: "ultimate_wave", range: 500, indicator: "line", desc: "50% lifesteal aura and massive shockwave" }
  },
  balmond: {
    q: { name: "Soul Lock", cd: 6, type: "dash_knock", range: 180, indicator: "dash", desc: "Charges forward dealing 340 physical damage, knocking back and slowing enemies by 40%" },
    w: { name: "Cyclone Sweep", cd: 5, type: "spin_ticks", desc: "Spins giant axe dealing multi-tick damage" },
    e: { name: "Bloodthirst", cd: 10, type: "heal", desc: "War cry restoring 320 HP + 10% max HP instantly" },
    r: { name: "Lethal Counter", cd: 24, type: "ultimate_execute", range: 160, radius: 105, indicator: "circle_aoe", desc: "Slams axe down dealing 520 base damage + 28% of target's lost HP as true execute damage" }
  },
  gusion: {
    q: { name: "Sword Spike", cd: 3.5, type: "dagger_teleport", range: 420, indicator: "line", desc: "Throws piercing dagger dealing 440 damage; recast dashes behind target" },
    w: { name: "Shadowblade", cd: 4.5, type: "dagger_fan", range: 380, indicator: "cone", desc: "Throws fan of 5 high-damage daggers dealing 280 each (1400+ burst) and return" },
    e: { name: "Incandescence", cd: 9, type: "dash_reset", range: 140, indicator: "dash", desc: "Dashes forward and immediately resets Q and W cooldowns" },
    r: { name: "Blade Barrage", cd: 20, type: "ultimate_storm", desc: "Unleashes 12 hyper-velocity blades in all directions dealing 380 burst each" }
  },
  saber: {
    q: { name: "Orbiting Swords", cd: 6, type: "swords_orbit", desc: "Spawns 4 spinning swords circling Saber that strike enemies for 85 contact damage and fly to target on attacks" },
    w: { name: "Charge", cd: 6, type: "dash", range: 140, indicator: "dash", desc: "Dashes forward slicing through enemy lines" },
    e: { name: "Enemy's Bane", cd: 8, type: "armor_shred", range: 220, indicator: "target", desc: "Armor-piercing strike dealing true damage" },
    r: { name: "Triple Sweep", cd: 26, type: "ultimate_sweep", range: 260, indicator: "target", desc: "Locks onto target, knocks airborne with 3 slashes" }
  },
  pharsa: {
    q: { name: "Curse of Crow", cd: 4.5, type: "aoe", radius: 60, range: 460, indicator: "circle_aoe", desc: "Crow mark dealing 310 magic damage and stunning enemies" },
    w: { name: "Energy Impact", cd: 4.5, type: "laser", range: 500, indicator: "line", desc: "High-voltage magical burst laser dealing 420 damage" },
    e: { name: "Wings by Wings", cd: 10, type: "buff_fly", desc: "Transforms into flying crow with +90% movement speed" },
    r: { name: "Air Strike", cd: 25, type: "ultimate_meteor", range: 600, radius: 80, indicator: "circle_aoe", desc: "Bombards 4 massive consecutive meteor strikes dealing 460 damage each" }
  },
  nana: {
    q: { name: "Magic Boomerang", cd: 3.5, type: "boomerang", range: 460, indicator: "line", desc: "Throws giant magic boomerang dealing 320 magic damage outbound & return" },
    w: { name: "Molina Smooch", cd: 7.5, type: "trap_morph", range: 420, radius: 60, indicator: "circle_aoe", desc: "Molina trap transforming enemy into cat, dealing 310 magic damage & slow" },
    e: { name: "Molina Sprint", cd: 7, type: "buff", desc: "+60% move speed burst and 250 HP heal" },
    r: { name: "Molina Blitz", cd: 24, type: "ultimate_paws", range: 540, radius: 78, indicator: "circle_aoe", desc: "Summons 3 giant consecutive paw ground slams dealing 440 magic burst each" }
  }
};

if (typeof window !== "undefined") window.HERO_SKILLS = HERO_SKILLS;
if (typeof global !== "undefined") global.HERO_SKILLS = HERO_SKILLS;

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
      bonusDamageTimer: 0,
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

  getSkillConfig(heroId, slot) {
    const skills = this.getSkillsForHero(heroId);
    return skills ? skills[slot] : null;
  }

  isInstantSkill(heroId, slot) {
    const s = this.getSkillConfig(heroId, slot);
    if (!s) return false;
    const instantTypes = [
      "buff",
      "buff_fly",
      "shield",
      "heal",
      "ultimate_pull",
      "ultimate_shield",
      "ultimate_storm",
      "spin_ticks",
      "cleave",
      "swords_orbit"
    ];
    if (instantTypes.includes(s.type)) return true;
    if (s.type === "ultimate" && !s.indicator) return true; // e.g. Miya R
    return false;
  }

  canCast(slot, hero) {
    if (this.cooldowns[slot] > 0) return false;
    if (hero && hero.skillLevels && hero.skillLevels[slot] === 0) return false;
    return true;
  }

  upgradeSkill(slot, hero, combatTexts, sound) {
    if (!hero || hero.skillPoints <= 0) return false;
    const heroSkills = this.getSkillsForHero(hero.id);
    const skill = heroSkills[slot];
    if (!skill) return false;

    if (!hero.skillLevels) {
      hero.skillLevels = { q: 1, w: 0, e: 0, r: 0 };
    }

    const currentRank = hero.skillLevels[slot] || 0;
    const isUlt = slot === "r";
    const maxRank = isUlt ? 3 : 5;

    if (currentRank >= maxRank) return false;

    // Ultimate unlock requirements: Rank 1 at Lv 4, Rank 2 at Lv 8, Rank 3 at Lv 12
    if (isUlt) {
      const requiredHeroLevel = (currentRank + 1) * 4;
      if (hero.level < requiredHeroLevel) {
        if (combatTexts) {
          combatTexts.push({
            x: hero.x,
            y: hero.y - 30,
            text: `UNLOCKS AT LV.${requiredHeroLevel}`,
            color: "#e74c3c",
            life: 1.0,
            maxLife: 1.0
          });
        }
        return false;
      }
    }

    hero.skillLevels[slot] = currentRank + 1;
    hero.skillPoints--;

    if (sound && sound.playSkillUpgrade) {
      sound.playSkillUpgrade();
    } else if (sound && sound.playLevelUp) {
      sound.playLevelUp();
    }

    if (combatTexts) {
      combatTexts.push({
        x: hero.x,
        y: hero.y - 32,
        text: `${skill.name.toUpperCase()} RANK ${hero.skillLevels[slot]}!`,
        color: isUlt ? "#ffd700" : "#4ecca3",
        life: 1.2,
        maxLife: 1.2
      });
    }

    return true;
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
    if (!hero || hero.hp <= 0 || !this.canCast(slot, hero)) return false;

    const heroSkills = this.getSkillsForHero(hero.id);
    const skill = heroSkills[slot];
    if (!skill) return false;

    const rank = (hero.skillLevels && hero.skillLevels[slot]) ? hero.skillLevels[slot] : 1;
    const dmgMultiplier = 1 + (rank - 1) * 0.22;
    const cdReduction = (rank - 1) * 0.4;
    const actualCd = Math.max(1.5, skill.cd - cdReduction);

    this.cooldowns[slot] = actualCd;
    this.maxCooldowns[slot] = actualCd;

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
        // Miya Moon Arrow: 3 empowered split arrows dealing heavy burst (260 base)
        let fired = 0;
        const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
        const candidates = enemies.filter(e => getDistance(hero.x, hero.y, e.x, e.y) <= 380);

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
              vx: ((e.x - hero.x) / ed) * 580,
              vy: ((e.y - hero.y) / ed) * 580,
              radius: 5, damage: Math.round(260 * dmgMultiplier), team: hero.team, color: "#f1c40f", life: 0.85
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
              vx: Math.cos(a) * 580,
              vy: Math.sin(a) * 580,
              radius: 5, damage: Math.round(260 * dmgMultiplier), team: hero.team, color: "#f1c40f", life: 0.85
            });
          }
        }
        break;
      }

      case "laser": {
        // High speed piercing laser / energy beam
        let beamRange = 440;
        let beamDmg = 280;
        let beamWidth = 14;
        let beamColor = "#3498db";

        if (hero.id === "layla") {
          if (slot === "r") {
            beamRange = 920;
            beamDmg = 880;
            beamWidth = 28;
            beamColor = "#ffd700";
          } else {
            beamRange = 480;
            beamDmg = 360;
            beamWidth = 16;
            beamColor = "#e67e22";
          }
        } else if (hero.id === "pharsa") {
          beamRange = 500;
          beamDmg = 420;
          beamWidth = 18;
          beamColor = "#9b59b6";
        } else if (slot === "r") {
          beamRange = 800;
          beamDmg = 520;
          beamWidth = 22;
          beamColor = "#e74c3c";
        }

        this.activeAOEs.push({
          type: "beam",
          startX: hero.x, startY: hero.y,
          endX: hero.x + dirX * beamRange, endY: hero.y + dirY * beamRange,
          width: beamWidth,
          damage: Math.round(beamDmg * dmgMultiplier),
          team: hero.team,
          color: beamColor,
          life: 0.4, maxLife: 0.4
        });
        break;
      }

      case "aoe": {
        // AOE blast at cursor (Miya W, Layla W, Pharsa Q)
        let radius = skill.radius || 60;
        let baseDmg = 260;
        let color = "rgba(155, 89, 182, 0.55)";

        if (hero.id === "miya") {
          baseDmg = 340;
          radius = 70;
          color = "rgba(241, 196, 15, 0.55)";
        } else if (hero.id === "layla") {
          baseDmg = 310;
          radius = 65;
          color = "rgba(230, 126, 34, 0.55)";
        } else if (hero.id === "pharsa") {
          baseDmg = 320;
          radius = 65;
          color = "rgba(142, 68, 173, 0.6)";
        }

        this.activeAOEs.push({
          type: "circle",
          x: targetX, y: targetY,
          radius: radius,
          damage: Math.round(baseDmg * dmgMultiplier),
          team: hero.team,
          color: color,
          life: 0.8, maxLife: 0.8
        });
        break;
      }

      case "buff": {
        this.activeBuffs.speedBoost = 2.5;
        if (!hero.isDead && hero.hp > 0) {
          hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(100 * dmgMultiplier));
        }
        break;
      }

      case "shield": {
        this.activeBuffs.shield = Math.round(450 * dmgMultiplier);
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
          damage: Math.round(240 * dmgMultiplier),
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
          damage: Math.round(220 * dmgMultiplier),
          team: hero.team,
          color: "rgba(192, 57, 43, 0.5)",
          life: 0.4, maxLife: 0.4
        });
        break;
      }

      case "dash":
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
          damage: Math.round(180 * dmgMultiplier),
          team: hero.team,
          color: "rgba(52, 152, 219, 0.4)",
          life: 0.3, maxLife: 0.3
        });
        break;
      }

      case "dash_knock": {
        // Balmond Soul Lock: charges forward, knocking back and damaging enemies
        const origX = hero.x;
        const origY = hero.y;
        const mapMaxX = map ? map.width * map.tileSize : 1280;
        const mapMaxY = map ? map.height * map.tileSize : 720;
        let destX = clamp(hero.x + dirX * 180, 60, mapMaxX - 60);
        let destY = clamp(hero.y + dirY * 180, 60, mapMaxY - 60);

        const safePos = this.resolveTurretCollision(destX, destY, map, origX, origY);
        hero.x = safePos.x;
        hero.y = safePos.y;
        hero.targetX = hero.x;
        hero.targetY = hero.y;

        if (particles) {
          if (particles.spawnSlash) particles.spawnSlash(origX, origY, destX, destY, "#c0392b", 55);
          particles.spawnRing(hero.x, hero.y, 65, "#e74c3c", 0.4);
          particles.spawnBurst(hero.x, hero.y, "#c0392b", 16, 140);
        }
        if (sound && sound.playSlash) sound.playSlash();

        const dashDmg = Math.round(340 * dmgMultiplier);
        this.activeAOEs.push({
          type: "circle",
          x: hero.x, y: hero.y,
          radius: 65,
          damage: dashDmg,
          team: hero.team,
          color: "rgba(192, 57, 43, 0.6)",
          life: 0.35, maxLife: 0.35,
          isCC: true,
          ccDuration: 0.5
        });

        const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
        enemies.forEach(e => {
          if (getDistance(hero.x, hero.y, e.x, e.y) <= 75) {
            this.applySkillDamage(e, dashDmg, hero, combatTexts, gameStats, scoreboard, sound, particles);
            if (typeof e.applyStun === "function") {
              e.applyStun(0.5, combatTexts);
            }
            if (e.stats && e.stats.spd) {
              e.slowTimer = 2.0;
            }
          }
        });
        break;
      }

      case "swords_orbit": {
        // Saber Orbiting Swords: 4 flying swords circle Saber dealing contact damage
        this.saberSwords = {
          active: true,
          timer: 5.0,
          maxTimer: 5.0,
          count: 4,
          angle: 0,
          damageTickTimer: 0.05,
          heroRef: hero,
          team: hero.team
        };
        if (sound && sound.playSkill) sound.playSkill("q");
        if (particles) {
          particles.spawnRing(hero.x, hero.y, 55, "#00d2d3", 0.5);
          particles.spawnBurst(hero.x, hero.y, "#00ffff", 16, 130);
        }
        if (combatTexts) {
          combatTexts.push({
            x: hero.x,
            y: hero.y - 25,
            text: "ORBITING SWORDS!",
            color: "#00d2d3",
            life: 1.0,
            maxLife: 1.0
          });
        }
        break;
      }

      case "spin_ticks": {
        this.cycloneTimer = 3.0;
        break;
      }

      case "heal": {
        if (!hero.isDead && hero.hp > 0) {
          const healBonus = hero.id === "balmond" ? Math.round(hero.maxHp * 0.10) : 0;
          const healAmt = Math.round((320 + healBonus) * dmgMultiplier);
          hero.hp = Math.min(hero.maxHp, hero.hp + healAmt);
          if (combatTexts) {
            combatTexts.push({
              x: hero.x,
              y: hero.y - 20,
              text: hero.id === "balmond" ? `WAR CRY! +${healAmt} HP` : `+${healAmt} HP`,
              color: "#2ecc71",
              life: 1,
              maxLife: 1
            });
          }
          if (particles) {
            particles.spawnRing(hero.x, hero.y, 50, "#2ecc71", 0.5);
            particles.spawnBurst(hero.x, hero.y, "#2ecc71", 12, 110);
          }
          if (sound && sound.playHeal) sound.playHeal();
        }
        break;
      }

      case "shockwave": {
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 380, vy: dirY * 380,
          radius: 12, damage: Math.round(190 * dmgMultiplier), team: hero.team, color: "#3498db", life: 1.0
        });
        break;
      }

      case "wave_heal": {
        const healAmt = Math.round(240 * dmgMultiplier);
        if (!hero.isDead && hero.hp > 0) {
          hero.hp = Math.min(hero.maxHp, hero.hp + healAmt);
          if (combatTexts) {
            combatTexts.push({ x: hero.x, y: hero.y - 20, text: `+${healAmt} HP`, color: "#2ecc71", life: 1, maxLife: 1 });
          }
        }
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 460, vy: dirY * 460,
          radius: 15, damage: Math.round(290 * dmgMultiplier), team: hero.team, color: "#ff69b4", life: 0.9
        });
        break;
      }

      case "targeted_cc": {
        // Angela Puppet String: magical burst & bind
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 480, vy: dirY * 480,
          radius: 12, damage: Math.round(340 * dmgMultiplier), team: hero.team, color: "#e91e63", life: 0.9,
          isCC: true, ccDuration: 1.2
        });
        break;
      }

      case "dagger_fan": {
        // Gusion Shadowblade: 5 daggers dealing shotgun burst blade damage (increased damage)
        for (let i = -2; i <= 2; i++) {
          const angle = Math.atan2(dirY, dirX) + (i * 0.16);
          this.activeProjectiles.push({
            x: hero.x, y: hero.y,
            vx: Math.cos(angle) * 540, vy: Math.sin(angle) * 540,
            radius: 6, damage: Math.round(280 * dmgMultiplier), team: hero.team, color: "#9b59b6", life: 0.85
          });
        }
        break;
      }

      case "dagger_teleport": {
        // Gusion Sword Spike: sharp dagger dealing heavy burst blade damage (increased damage)
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 640, vy: dirY * 640,
          radius: 8, damage: Math.round(440 * dmgMultiplier), team: hero.team, color: "#9b59b6", life: 0.85
        });
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
        // Nana Magic Boomerang: hurls magical boomerang dealing high burst
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 460, vy: dirY * 460,
          radius: 12, damage: Math.round(320 * dmgMultiplier), team: hero.team, color: "#2ecc71", life: 1.1
        });
        break;
      }

      case "trap_morph": {
        // Nana Molina Smooch: summons Molina trap that bursts & morphs/stuns
        this.activeAOEs.push({
          type: "circle",
          x: targetX, y: targetY,
          radius: 65,
          damage: Math.round(310 * dmgMultiplier),
          team: hero.team,
          color: "rgba(243, 156, 18, 0.6)",
          life: 0.7, maxLife: 0.7
        });
        const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
        enemies.forEach(e => {
          if (getDistance(targetX, targetY, e.x, e.y) <= 65) {
            const isBossOrTurret = e.isTurret || e.isBoss || (objectives && (e === objectives.turtle || e === objectives.lord));
            if (!isBossOrTurret && typeof e.applyStun === "function") {
              e.applyStun(1.2, combatTexts);
            }
          }
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
        this.executeUltimate(skill.type, hero, targetX, targetY, dirX, dirY, map, minions, objectives, combatTexts, enemyBot, sound, particles, gameStats, dmgMultiplier);
        break;
      }

      default: {
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: dirX * 420, vy: dirY * 420,
          radius: 8, damage: Math.round(200 * dmgMultiplier), team: hero.team, color: "#4ecca3", life: 1.0
        });
        break;
      }
    }

    return true;
  }

  executeUltimate(type, hero, targetX, targetY, dirX, dirY, map, minions, objectives, combatTexts, enemyBot, sound, particles, gameStats, dmgMultiplier = 1) {
    if (type === "ultimate_execute") {
      // Balmond Lethal Counter: giant execute slam dealing base + 28% missing HP
      const slamDist = Math.min(140, Math.hypot(targetX - hero.x, targetY - hero.y) || 70);
      const slamX = hero.x + dirX * slamDist;
      const slamY = hero.y + dirY * slamDist;

      if (particles) {
        particles.spawnRing(slamX, slamY, 105, "#c0392b", 0.6);
        particles.spawnBurst(slamX, slamY, "#e74c3c", 24, 180);
        particles.spawnBurst(slamX, slamY, "#ffd700", 12, 130);
        if (particles.spawnSlash) {
          particles.spawnSlash(hero.x, hero.y, slamX, slamY, "#c0392b", 60);
        }
      }
      if (sound && sound.playSlash) sound.playSlash();

      this.activeAOEs.push({
        type: "circle",
        x: slamX, y: slamY,
        radius: 105,
        damage: Math.round(520 * dmgMultiplier),
        team: hero.team,
        color: "rgba(192, 57, 43, 0.65)",
        life: 0.55, maxLife: 0.55
      });

      const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
      enemies.forEach(e => {
        if (getDistance(slamX, slamY, e.x, e.y) <= 110) {
          const missingHp = Math.max(0, (e.maxHp || 1200) - e.hp);
          const executeBonus = Math.round(missingHp * 0.28);
          const totalDmg = Math.round((520 + executeBonus) * dmgMultiplier);
          this.applySkillDamage(e, totalDmg, hero, combatTexts, gameStats, (typeof scoreboard !== "undefined" ? scoreboard : null), sound, particles);
          if (combatTexts) {
            combatTexts.push({
              x: e.x,
              y: e.y - 35,
              text: `LETHAL EXECUTE! -${totalDmg}`,
              color: "#e74c3c",
              life: 1.4,
              maxLife: 1.4
            });
          }
        }
      });
    } else if (type === "ultimate_sweep") {
      // Saber Triple Sweep: locks onto enemy and delivers 3 airborne slashes
      const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
      let target = null;
      let closest = 280;
      enemies.forEach(e => {
        const d = getDistance(hero.x, hero.y, e.x, e.y);
        if (d < closest) {
          closest = d;
          target = e;
        }
      });

      const strikeX = target ? target.x : hero.x + dirX * 120;
      const strikeY = target ? target.y : hero.y + dirY * 120;

      if (particles) {
        particles.spawnRing(strikeX, strikeY, 65, "#3498db", 0.6);
        particles.spawnBurst(strikeX, strikeY, "#3498db", 20, 160);
        if (particles.spawnSlash) {
          particles.spawnSlash(hero.x, hero.y, strikeX, strikeY, "#3498db", 55);
        }
      }
      if (sound && sound.playSlash) sound.playSlash();

      if (target) {
        const sweepDmg = Math.round(780 * dmgMultiplier);
        this.applySkillDamage(target, sweepDmg, hero, combatTexts, gameStats, (typeof scoreboard !== "undefined" ? scoreboard : null), sound, particles);
        if (typeof target.applyStun === "function") {
          target.applyStun(1.2, combatTexts);
        }
        if (combatTexts) {
          combatTexts.push({
            x: target.x,
            y: target.y - 30,
            text: `TRIPLE SWEEP -${sweepDmg}!`,
            color: "#3498db",
            life: 1.3,
            maxLife: 1.3
          });
        }
      }
    } else if (type === "ultimate_wave") {
      this.activeBuffs.lifesteal = 0.5;
      this.activeProjectiles.push({
        x: hero.x, y: hero.y,
        vx: dirX * 500, vy: dirY * 500,
        radius: 20, damage: Math.round(420 * dmgMultiplier), team: hero.team, color: "#9b59b6", life: 1.2
      });
    } else if (type === "ultimate_storm") {
      // Gusion Blade Barrage: dashes forward, resets Q & W cooldowns, and fires 12 ring blades (increased damage)
      const origX = hero.x;
      const origY = hero.y;
      const mapMaxX = map ? map.width * map.tileSize : 1280;
      const mapMaxY = map ? map.height * map.tileSize : 720;
      let destX = clamp(hero.x + dirX * 120, 60, mapMaxX - 60);
      let destY = clamp(hero.y + dirY * 120, 60, mapMaxY - 60);
      const safePos = this.resolveTurretCollision(destX, destY, map, origX, origY);
      hero.x = safePos.x;
      hero.y = safePos.y;
      hero.targetX = hero.x;
      hero.targetY = hero.y;
      this.cooldowns.q = 0;
      this.cooldowns.w = 0;

      if (particles) {
        if (particles.spawnSlash) particles.spawnSlash(origX, origY, destX, destY, "#9b59b6", 48);
        particles.spawnBurst(destX, destY, "#ffd700", 16, 160);
      }
      if (sound && sound.playSlash) sound.playSlash();

      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        this.activeProjectiles.push({
          x: hero.x, y: hero.y,
          vx: Math.cos(angle) * 480, vy: Math.sin(angle) * 480,
          radius: 7, damage: Math.round(380 * dmgMultiplier), team: hero.team, color: "#9b59b6", life: 0.95
        });
      }
    } else if (type === "ultimate_meteor") {
      // Pharsa Feathered Air Strike: 4 massive consecutive magical artillery meteor bombardments
      for (let i = 0; i < 4; i++) {
        this.activeAOEs.push({
          type: "circle",
          x: targetX + (i % 2 === 0 ? -1 : 1) * (i * 18),
          y: targetY + (i > 1 ? 1 : -1) * (i * 14),
          radius: 90,
          damage: Math.round(460 * dmgMultiplier),
          team: hero.team,
          color: "rgba(142, 68, 173, 0.65)",
          delay: i * 0.3,
          life: 0.65, maxLife: 0.65
        });
      }
    } else if (type === "ultimate_paws") {
      // Nana Molina Blitz: 3 giant consecutive magical paw ground slams with mini-stun
      for (let i = 0; i < 3; i++) {
        this.activeAOEs.push({
          type: "circle",
          x: targetX + (i - 1) * 32,
          y: targetY + (i - 1) * 18,
          radius: 85,
          damage: Math.round(440 * dmgMultiplier),
          team: hero.team,
          color: "rgba(230, 126, 34, 0.65)",
          delay: i * 0.28,
          life: 0.6, maxLife: 0.6,
          isStun: true,
          stunDuration: 0.5
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
      // Angela Heartguard: massive 1100 shield + bonus magical attack boost
      const shieldAmt = Math.round(1100 * dmgMultiplier);
      this.activeBuffs.shield = shieldAmt;
      this.activeBuffs.bonusDamage = Math.round(75 * dmgMultiplier);
      this.activeBuffs.bonusDamageTimer = 6.0;
      this.activeBuffs.speedBoost = 2.5;
      if (combatTexts) {
        combatTexts.push({ x: hero.x, y: hero.y - 25, text: `+${shieldAmt} SHIELD`, color: "#3498db", life: 1.5, maxLife: 1.5 });
      }
      if (particles) {
        particles.spawnRing(hero.x, hero.y, 50, "#ff69b4", 0.8);
      }
    } else {
      // Miya Hidden Moonlight & General Ultimate surge
      this.activeBuffs.attackSpeedBoost = 2.2;
      this.activeBuffs.speedBoost = 2.5;
      this.activeBuffs.bonusDamage = 70;
      this.activeBuffs.bonusDamageTimer = 5.0;
      if (particles) {
        particles.spawnRing(hero.x, hero.y, 45, "#f1c40f", 0.6);
        particles.spawnBurst(hero.x, hero.y, "#ffffff", 14, 120);
      }
    }
  }

  getAllEnemies(hero, minions, map, objectives, enemyBot) {
    const enemies = [];
    const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
    botList.forEach(b => {
      if (!b.isDead && b.hp > 0 && b.team !== hero.team) {
        enemies.push(b);
      }
    });
    if (minions && Array.isArray(minions)) {
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
        if (hero && hero.gainExp) {
          hero.gainExp(GAME.EXP_REWARDS.minion, combatTexts, null, null);
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
    if (this.activeBuffs.bonusDamageTimer > 0) {
      this.activeBuffs.bonusDamageTimer = Math.max(0, this.activeBuffs.bonusDamageTimer - dt);
      if (this.activeBuffs.bonusDamageTimer === 0) {
        this.activeBuffs.bonusDamage = 0;
      }
    }

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

    // Saber Orbiting Swords ticks (Saber Q)
    if (this.saberSwords && this.saberSwords.active) {
      this.saberSwords.timer -= dt;
      this.saberSwords.angle += dt * 6.0;
      this.saberSwords.damageTickTimer -= dt;

      if (this.saberSwords.damageTickTimer <= 0) {
        this.saberSwords.damageTickTimer = 0.32;
        const enemies = this.getAllEnemies(hero, minions, map, objectives, enemyBot);
        enemies.forEach(e => {
          if (getDistance(hero.x, hero.y, e.x, e.y) <= 72) {
            const swordDmg = Math.round(85 * (hero.attackDamage ? (hero.attackDamage / 120) : 1));
            this.applySkillDamage(e, swordDmg, hero, combatTexts, gameStats, scoreboard, sound, particles);
            if (particles && particles.spawnSlash) {
              particles.spawnSlash(hero.x, hero.y, e.x, e.y, "#00d2d3", 30);
            }
          }
        });
      }

      if (this.saberSwords.timer <= 0 || (hero && hero.isDead)) {
        this.saberSwords.active = false;
      }
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
          if (p.isCC && typeof e.applyStun === "function") {
            const isBossOrTurret = e.isTurret || e.isBoss || (objectives && (e === objectives.turtle || e === objectives.lord));
            if (!isBossOrTurret) {
              e.applyStun(p.ccDuration || 1.0, combatTexts);
            }
          }
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
            if (aoe.isStun && typeof e.applyStun === "function") {
              const isBossOrTurret = e.isTurret || e.isBoss || (objectives && (e === objectives.turtle || e === objectives.lord));
              if (!isBossOrTurret) {
                e.applyStun(aoe.stunDuration || 0.5, combatTexts);
              }
            }
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

    // Render Saber's Orbiting Swords
    if (this.saberSwords && this.saberSwords.active && this.saberSwords.heroRef && !this.saberSwords.heroRef.isDead) {
      const h = this.saberSwords.heroRef;
      const sx = h.x - camera.x;
      const sy = h.y - camera.y;

      ctx.save();
      // Orbit guide ring
      ctx.strokeStyle = "rgba(0, 210, 211, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 52, 0, Math.PI * 2);
      ctx.stroke();

      // 4 Orbiting swords / glowing dots
      for (let k = 0; k < 4; k++) {
        const sAngle = this.saberSwords.angle + (k * Math.PI / 2);
        const px = sx + Math.cos(sAngle) * 52;
        const py = sy + Math.sin(sAngle) * 52;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(sAngle + Math.PI / 2);

        // Glowing sword dagger shape
        ctx.shadowColor = "#00d2d3";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Core dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();
    }
  }
}

if (typeof window !== "undefined") window.SkillManager = SkillManager;
if (typeof global !== "undefined") global.SkillManager = SkillManager;
