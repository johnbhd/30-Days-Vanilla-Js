/**
 * River Boss Objectives (Turtle & Lord)
 * Phase 3 implementation - Neutral bosses with team buffs and allied Lord siege pusher
 */

class ObjectiveManager {
  constructor() {
    // River Pit Locations
    // Exactly horizontally centered in blue river (x = 660)
    // Upper Pit: vertically centered between Top Lane & Mid Lane (y = 380)
    // Lower Pit: vertically centered between Mid Lane & Bottom Lane (y = 620)
    this.pits = {
      upper: { x: 660, y: 380, name: "UPPER RIVER PIT" },
      lower: { x: 660, y: 620, name: "LOWER RIVER PIT" }
    };
    this.turtlePit = "upper"; // Spawns between Top Lane & Mid Lane

    this.turtle = {
      name: "Turtle",
      x: this.pits.upper.x,
      y: this.pits.upper.y,
      homeX: this.pits.upper.x,
      homeY: this.pits.upper.y,
      isBoss: true,
      radius: 24,
      hp: 2500,
      maxHp: 2500,
      attackDamage: 38,
      attackRange: 80,
      attackCooldown: 1.4,
      attackTimer: 0,
      target: null,
      alive: false,
      bounty: 300,
      spawnTimer: 25, // spawns at 25s for prompt combat
      respawnInterval: 75
    };

    // Lord spawns in Lower Pit
    this.lord = {
      name: "Lord",
      x: this.pits.lower.x,
      y: this.pits.lower.y,
      homeX: this.pits.lower.x,
      homeY: this.pits.lower.y,
      isBoss: true,
      radius: 30,
      hp: 5000,
      maxHp: 5000,
      attackDamage: 80,
      attackRange: 90,
      attackCooldown: 1.6,
      attackTimer: 0,
      target: null,
      alive: false,
      bounty: 500,
      spawnTimer: 90, // spawns at 90s
      respawnInterval: 160
    };

    this.summonedLord = null;
    this.announcements = [];

    const makeBossTakeDamage = (boss) => {
      boss.takeDamage = function(amount, attacker, combatTexts, particles, sound) {
        if (!this.alive || this.hp <= 0) return;
        this.hp = Math.max(0, this.hp - amount);
        this.lastAttacker = attacker;
        if (particles && particles.spawnBurst) particles.spawnBurst(this.x, this.y, "#ffffff", 6, 90);
        if (sound && sound.playHit) sound.playHit();
        if (combatTexts) {
          combatTexts.push({
            x: this.x + (Math.random() - 0.5) * 16,
            y: this.y - 20,
            text: `-${Math.round(amount)}`,
            color: (attacker && attacker.team === "BLUE") ? "#38ef7d" : "#ff4b2b",
            life: 0.7,
            maxLife: 0.7
          });
        }
      };
    };
    makeBossTakeDamage(this.turtle);
    makeBossTakeDamage(this.lord);
  }

  createSummonedLord(team = "BLUE") {
    const isBlue = team === "BLUE";
    const startX = isBlue ? 140 : 1220;
    const waypoints = isBlue
      ? [
          { x: 140, y: 480 },
          { x: 640, y: 480 },
          { x: 1140, y: 480 },
          { x: 1220, y: 480 }
        ]
      : [
          { x: 1220, y: 480 },
          { x: 640, y: 480 },
          { x: 220, y: 480 },
          { x: 140, y: 480 }
        ];

    return {
      name: isBlue ? "Allied Lord" : "Enemy Lord",
      team: team,
      x: startX,
      y: 480,
      radius: 26,
      hp: 3600,
      maxHp: 3600,
      speed: 55,
      damage: 140,
      range: 80,
      cooldown: 1.2,
      timer: 0,
      target: null,
      isDead: false,
      waypoints: waypoints,
      waypointIdx: 0,
      takeDamage: function(amount, attacker, combatTexts, particles, sound, scoreboard) {
        if (this.isDead || this.hp <= 0) return;
        this.hp = Math.max(0, this.hp - amount);
        if (combatTexts) {
          combatTexts.push({
            x: this.x + (Math.random() - 0.5) * 20,
            y: this.y - 25,
            text: `-${Math.round(amount)}`,
            color: isBlue ? "#ff4757" : "#38ef7d",
            life: 0.7,
            maxLife: 0.7
          });
        }
        if (particles && particles.spawnBurst) {
          particles.spawnBurst(this.x, this.y, "#9b59b6", 6, 80);
        }
        if (sound && sound.playHit) {
          sound.playHit();
        }
        if (this.hp <= 0) {
          this.isDead = true;
          if (combatTexts) {
            combatTexts.push({
              x: this.x,
              y: this.y - 30,
              text: isBlue ? "ALLIED LORD FALLEN!" : "ENEMY LORD SLAIN!",
              color: "#e74c3c",
              life: 2.0,
              maxLife: 2.0
            });
          }
        }
      }
    };
  }

  addAnnouncement(text, color = "#ffd700") {
    this.announcements.push({ text, color, life: 3.5, maxLife: 3.5 });
  }

  update(dt, hero, map, minions, combatTexts, gameStats, skillManager, scoreboard, enemyBot, sound, particles) {
    // 1. Turtle update
    if (!this.turtle.alive) {
      this.turtle.spawnTimer -= dt;
      if (this.turtle.spawnTimer <= 0) {
        this.turtle.alive = true;
        this.turtle.hp = this.turtle.maxHp;
        this.turtle.target = null;
        this.turtle.x = this.pits[this.turtlePit].x;
        this.turtle.y = this.pits[this.turtlePit].y;
        this.turtle.homeX = this.pits[this.turtlePit].x;
        this.turtle.homeY = this.pits[this.turtlePit].y;
        const pitName = this.pits[this.turtlePit].name;
        this.addAnnouncement(`THE TURTLE HAS SPAWNED IN RIVER (${pitName})!`, "#2ecc71");
      }
    } else {
      this.updateBossCombat(dt, this.turtle, hero, minions, combatTexts, () => {
        // Turtle slain callback
        this.turtle.alive = false;
        this.turtle.spawnTimer = this.turtle.respawnInterval;
        const slayer = this.turtle.lastAttacker;
        const isBotSlay = slayer && (slayer === enemyBot || slayer.team === "RED");

        if (isBotSlay) {
          this.addAnnouncement("RED TEAM HAS SLAIN THE TURTLE!", "#e74c3c");
          if (scoreboard) scoreboard.addGold("bot", 300);
          if (enemyBot) {
            enemyBot.gold += 300;
            enemyBot.shield = Math.max(enemyBot.shield || 0, 350);
            if (enemyBot.gainExp) {
              enemyBot.gainExp((typeof GAME !== "undefined" && GAME.EXP_REWARDS) ? GAME.EXP_REWARDS.turtle : 300, combatTexts, particles, sound);
            }
          }
          if (combatTexts) {
            combatTexts.push({ x: this.turtle.x, y: this.turtle.y - 30, text: "[BOT] +300g & SHIELD!", color: "#ff6b81", life: 2.0, maxLife: 2.0 });
          }
        } else {
          this.addAnnouncement("BLUE TEAM HAS SLAIN THE TURTLE!", "#ffd700");
          if (gameStats) gameStats.gold += 300;
          if (scoreboard) {
            scoreboard.addGold("player", 300);
            if (scoreboard.stats) scoreboard.stats.turtlesTaken++;
          }
          if (hero && hero.gainExp) {
            hero.gainExp((typeof GAME !== "undefined" && GAME.EXP_REWARDS) ? GAME.EXP_REWARDS.turtle : 300, combatTexts, particles, sound);
          }
          if (skillManager) {
            skillManager.activeBuffs.shield = Math.max(skillManager.activeBuffs.shield, 350);
          }
          if (combatTexts) {
            combatTexts.push({ x: this.turtle.x, y: this.turtle.y - 30, text: "+300g & SHIELD!", color: "#ffd700", life: 2.0, maxLife: 2.0 });
          }
        }

        // Alternate pit for next spawn (Upper <-> Lower)
        this.turtlePit = this.turtlePit === "upper" ? "lower" : "upper";
        this.turtle.x = this.pits[this.turtlePit].x;
        this.turtle.y = this.pits[this.turtlePit].y;
        this.turtle.homeX = this.pits[this.turtlePit].x;
        this.turtle.homeY = this.pits[this.turtlePit].y;
        this.turtle.lastAttacker = null;
      }, enemyBot);
    }

    // 2. Lord update
    if (!this.lord.alive) {
      this.lord.spawnTimer -= dt;
      if (this.lord.spawnTimer <= 0) {
        this.lord.alive = true;
        this.lord.hp = this.lord.maxHp;
        this.lord.target = null;
        this.lord.x = this.pits.lower.x;
        this.lord.y = this.pits.lower.y;
        this.lord.homeX = this.pits.lower.x;
        this.lord.homeY = this.pits.lower.y;
        this.addAnnouncement("THE LORD HAS AWAKENED IN THE RIVER!", "#e74c3c");
      }
    } else {
      this.updateBossCombat(dt, this.lord, hero, minions, combatTexts, () => {
        // Lord slain callback
        this.lord.alive = false;
        this.lord.spawnTimer = this.lord.respawnInterval;
        const slayer = this.lord.lastAttacker;
        const isBotSlay = slayer && (slayer === enemyBot || slayer.team === "RED");

        if (isBotSlay) {
          this.addAnnouncement("RED TEAM HAS AWAKENED THE LORD!", "#e74c3c");
          if (scoreboard) scoreboard.addGold("bot", 500);
          if (enemyBot) {
            enemyBot.gold += 500;
            if (enemyBot.gainExp) {
              enemyBot.gainExp((typeof GAME !== "undefined" && GAME.EXP_REWARDS) ? GAME.EXP_REWARDS.lord : 450, combatTexts, particles, sound);
            }
          }
          if (combatTexts) {
            combatTexts.push({ x: this.lord.x, y: this.lord.y - 30, text: "[BOT] +500g & ENEMY LORD SUMMONED!", color: "#e74c3c", life: 2.5, maxLife: 2.5 });
          }
          this.summonedLord = this.createSummonedLord("RED");
        } else {
          this.addAnnouncement("THE LORD HAS BEEN SUMMONED TO AID YOUR TEAM!", "#9b59b6");
          if (gameStats) gameStats.gold += 500;
          if (scoreboard) {
            scoreboard.addGold("player", 500);
            if (scoreboard.stats) scoreboard.stats.lordsTaken++;
          }
          if (hero && hero.gainExp) {
            hero.gainExp((typeof GAME !== "undefined" && GAME.EXP_REWARDS) ? GAME.EXP_REWARDS.lord : 450, combatTexts, particles, sound);
          }
          if (combatTexts) {
            combatTexts.push({ x: this.lord.x, y: this.lord.y - 30, text: "+500g & ALLIED LORD SUMMONED!", color: "#ffd700", life: 2.5, maxLife: 2.5 });
          }
          this.summonedLord = this.createSummonedLord("BLUE");
        }
        this.lord.lastAttacker = null;
      }, enemyBot);
    }

    // 3. Summoned Lord update
    if (this.summonedLord && !this.summonedLord.isDead) {
      this.updateSummonedLord(dt, this.summonedLord, map, minions, combatTexts, enemyBot, sound, particles, scoreboard, hero);
      if (this.summonedLord.hp <= 0) {
        this.summonedLord.isDead = true;
        this.summonedLord = null;
      }
    }

    // 4. Announcements decay
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      this.announcements[i].life -= dt;
      if (this.announcements[i].life <= 0) this.announcements.splice(i, 1);
    }
  }

  updateBossCombat(dt, boss, hero, minions, combatTexts, onDeath, enemyBot) {
    if (boss.hp <= 0) {
      onDeath();
      return;
    }

    boss.attackTimer -= dt;

    const homeX = boss.homeX !== undefined ? boss.homeX : boss.x;
    const homeY = boss.homeY !== undefined ? boss.homeY : boss.y;

    // Check target validity and leash boundaries
    if (boss.target) {
      const isDead = boss.target.hp <= 0 || boss.target.isDead;
      const d = getDistance(boss.x, boss.y, boss.target.x, boss.target.y);
      const dFromPit = getDistance(boss.target.x, boss.target.y, homeX, homeY);
      if (isDead || d > 220 || dFromPit > 190) {
        boss.target = null; // Drop aggro and return to pit
      }
    }

    // Leash back to pit home position if idle or out of position
    if (!boss.target) {
      const distToHome = getDistance(boss.x, boss.y, homeX, homeY);
      if (distToHome > 3) {
        const dx = homeX - boss.x;
        const dy = homeY - boss.y;
        boss.x += (dx / distToHome) * 85 * dt;
        boss.y += (dy / distToHome) * 85 * dt;
      } else {
        boss.x = homeX;
        boss.y = homeY;
      }
    }

    // Scan for aggressors in proximity of the pit (Player Hero or Bots, then Minions)
    if (!boss.target) {
      if (hero && hero.hp > 0 && !hero.isDead && getDistance(homeX, homeY, hero.x, hero.y) <= 130) {
        boss.target = hero;
      } else {
        const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
        const nearBot = botList.find(b => b.hp > 0 && !b.isDead && getDistance(homeX, homeY, b.x, b.y) <= 130);
        if (nearBot) {
          boss.target = nearBot;
        } else if (minions) {
          const nearMinion = minions.find(m => m.hp > 0 && getDistance(homeX, homeY, m.x, m.y) <= 110);
          if (nearMinion) boss.target = nearMinion;
        }
      }
    }

    // Attack target
    if (boss.target && boss.attackTimer <= 0) {
      boss.attackTimer = boss.attackCooldown;
      const d = getDistance(boss.x, boss.y, boss.target.x, boss.target.y);

      if (d <= boss.attackRange + 30) {
        const dmg = boss.attackDamage;
        if (typeof boss.target.takeDamage === "function") {
          boss.target.takeDamage(dmg, boss, combatTexts, null, null, null);
        } else if (boss.target.hp !== undefined) {
          boss.target.hp = Math.max(0, boss.target.hp - dmg);
        }

        if (combatTexts) {
          combatTexts.push({
            x: (boss.target.x !== undefined ? boss.target.x : boss.target.worldX),
            y: (boss.target.y !== undefined ? boss.target.y : boss.target.worldY) - 18,
            text: `-${dmg}`,
            color: "#e74c3c",
            life: 0.7,
            maxLife: 0.7
          });
        }

        if (boss.target && (boss.target.hp <= 0 || boss.target.isDead)) {
          boss.target = null;
        }
      }
    }
  }

  updateSummonedLord(dt, lord, map, minions, combatTexts, enemyBot, sound, particles, scoreboard, hero) {
    lord.timer -= dt;
    const enemyTeam = lord.team === "BLUE" ? "RED" : "BLUE";

    // 1. Verify current target validity
    if (lord.target) {
      let isDead = false;
      if (lord.target.destroyed) isDead = true;
      else if (lord.target.isDead) isDead = true;
      else if (lord.target.hp !== undefined && lord.target.hp <= 0) isDead = true;
      else if (lord.target.crystalHp !== undefined && lord.target.crystalHp <= 0) isDead = true;

      const tx = lord.target.worldX !== undefined ? lord.target.worldX : lord.target.x;
      const ty = lord.target.worldY !== undefined ? lord.target.worldY : lord.target.y;
      if (isDead || getDistance(lord.x, lord.y, tx, ty) > 280) {
        lord.target = null;
      }
    }

    // 2. Scan for enemy targets within 250px aggro radius (Turrets, Bot Hero, Minions, Base)
    if (!lord.target) {
      const candidates = [];

      // Enemy Turrets in range
      if (map && map.turrets) {
        map.turrets.forEach(t => {
          if (t.team === enemyTeam && !t.destroyed) {
            const d = getDistance(lord.x, lord.y, t.worldX, t.worldY);
            if (d <= 250) {
              candidates.push({ target: t, dist: d, priority: 1, type: "turret" });
            }
          }
        });
      }

      // Enemy Base Crystal in range
      if (map && map.bases) {
        const opposingBase = map.bases.find(b => b.team === enemyTeam && b.crystalHp > 0);
        if (opposingBase) {
          const d = getDistance(lord.x, lord.y, opposingBase.worldX, opposingBase.worldY);
          if (d <= 250) {
            candidates.push({ target: opposingBase, dist: d, priority: 1, type: "base" });
          }
        }
      }

      // Opposing Heroes in range
      const oppHero = lord.team === "BLUE" ? enemyBot : hero;
      if (oppHero && oppHero.team === enemyTeam && !oppHero.isDead && oppHero.hp > 0) {
        const d = getDistance(lord.x, lord.y, oppHero.x, oppHero.y);
        if (d <= 250) {
          candidates.push({ target: oppHero, dist: d, priority: 2, type: "hero" });
        }
      }

      // Enemy Minions in range
      if (minions) {
        minions.forEach(m => {
          if (m.team === enemyTeam && m.hp > 0) {
            const d = getDistance(lord.x, lord.y, m.x, m.y);
            if (d <= 250) {
              candidates.push({ target: m, dist: d, priority: 3, type: "minion" });
            }
          }
        });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const scoreA = a.dist - (a.priority === 1 ? 50 : (a.priority === 2 ? 30 : 0));
          const scoreB = b.dist - (b.priority === 1 ? 50 : (b.priority === 2 ? 30 : 0));
          return scoreA - scoreB;
        });
        lord.target = candidates[0].target;
      }
    }

    // 3. Attack or march down Mid lane
    if (lord.target) {
      const tx = lord.target.worldX !== undefined ? lord.target.worldX : lord.target.x;
      const ty = lord.target.worldY !== undefined ? lord.target.worldY : lord.target.y;
      const d = getDistance(lord.x, lord.y, tx, ty);

      if (d <= lord.range) {
        if (lord.timer <= 0) {
          lord.timer = lord.cooldown;

          // Short-range melee slashing attack visuals
          const slashColor = lord.team === "BLUE" ? "#4ecca3" : "#e74c3c";
          if (particles && particles.spawnSlash) {
            particles.spawnSlash(lord.x, lord.y, tx, ty, slashColor, 52);
          }
          if (particles && particles.spawnBurst) {
            particles.spawnBurst(tx, ty, "#ffffff", 10, 130);
          }
          if (sound && sound.playSlash) {
            sound.playSlash();
          }

          // Deal damage according to target type
          if (typeof lord.target.takeDamage === "function") {
            lord.target.takeDamage(lord.damage, lord, combatTexts, particles, sound, scoreboard);
          } else if (lord.target.crystalHp !== undefined) {
            lord.target.crystalHp = Math.max(0, lord.target.crystalHp - lord.damage);
            if (combatTexts) {
              combatTexts.push({ x: tx, y: ty - 22, text: `-${lord.damage}`, color: slashColor, life: 0.8, maxLife: 0.8 });
            }
          } else if (lord.target.hp !== undefined) {
            lord.target.hp = Math.max(0, lord.target.hp - lord.damage);
            if (combatTexts) {
              combatTexts.push({ x: tx, y: ty - 22, text: `-${lord.damage}`, color: slashColor, life: 0.8, maxLife: 0.8 });
            }
          }
        }
      } else {
        const dx = tx - lord.x;
        const dy = ty - lord.y;
        lord.x += (dx / d) * lord.speed * dt;
        lord.y += (dy / d) * lord.speed * dt;
      }
    } else {
      // Follow Mid waypoints
      if (lord.waypoints && lord.waypointIdx < lord.waypoints.length) {
        const wp = lord.waypoints[lord.waypointIdx];
        const dx = wp.x - lord.x;
        const dy = wp.y - lord.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 25) {
          lord.waypointIdx++;
        } else {
          lord.x += (dx / dist) * lord.speed * dt;
          lord.y += (dy / dist) * lord.speed * dt;
        }
      } else {
        // Continuous lane march toward destination Base crystal (1220 for Blue, 140 for Red)
        const destX = lord.team === "BLUE" ? 1220 : 140;
        const dx = destX - lord.x;
        const dy = 480 - lord.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 15) {
          lord.x += (dx / dist) * lord.speed * dt;
          lord.y += (dy / dist) * lord.speed * dt;
        }
      }
    }
  }

  render(ctx, camera) {
    // 1. Render Turtle
    if (this.turtle.alive) {
      const sx = this.turtle.x - camera.x;
      const sy = this.turtle.y - camera.y;

      ctx.save();
      // Shell
      ctx.fillStyle = "#27ae60";
      ctx.beginPath();
      ctx.arc(sx, sy, this.turtle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Turtle emblem
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TURTLE", sx, sy - this.turtle.radius - 12);

      // HP Bar
      const barW = 44;
      const barH = 5;
      const hpRatio = Math.max(0, this.turtle.hp / this.turtle.maxHp);
      ctx.fillStyle = "#111";
      ctx.fillRect(sx - barW / 2, sy - this.turtle.radius - 8, barW, barH);
      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(sx - barW / 2, sy - this.turtle.radius - 8, barW * hpRatio, barH);

      ctx.restore();
    } else {
      // Spawn indicator in river pit
      const sx = this.turtle.x - camera.x;
      const sy = this.turtle.y - camera.y;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.arc(sx, sy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a0a0a0";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Turtle: ${Math.ceil(this.turtle.spawnTimer)}s`, sx, sy + 4);
      ctx.restore();
    }

    // 2. Render Lord
    if (this.lord.alive) {
      const sx = this.lord.x - camera.x;
      const sy = this.lord.y - camera.y;

      ctx.save();
      // Lord Body
      ctx.fillStyle = "#8e44ad";
      ctx.beginPath();
      ctx.arc(sx, sy, this.lord.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Horns / Crown
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(sx, sy - this.lord.radius + 6, 8, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("THE LORD", sx, sy - this.lord.radius - 14);

      // HP Bar
      const barW = 60;
      const barH = 6;
      const hpRatio = Math.max(0, this.lord.hp / this.lord.maxHp);
      ctx.fillStyle = "#111";
      ctx.fillRect(sx - barW / 2, sy - this.lord.radius - 8, barW, barH);
      ctx.fillStyle = "#9b59b6";
      ctx.fillRect(sx - barW / 2, sy - this.lord.radius - 8, barW * hpRatio, barH);

      ctx.restore();
    } else {
      const sx = this.lord.x - camera.x;
      const sy = this.lord.y - camera.y;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.arc(sx, sy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a0a0a0";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Lord: ${Math.ceil(this.lord.spawnTimer)}s`, sx, sy + 4);
      ctx.restore();
    }

    // 3. Render Summoned Lord Ally / Enemy
    if (this.summonedLord && !this.summonedLord.isDead) {
      const sx = this.summonedLord.x - camera.x;
      const sy = this.summonedLord.y - camera.y;
      const isBlue = this.summonedLord.team === "BLUE";
      const teamColor = isBlue ? "#4ecca3" : "#ff4757";

      ctx.save();
      ctx.fillStyle = isBlue ? "#2980b9" : "#c0392b";
      ctx.beginPath();
      ctx.arc(sx, sy, this.summonedLord.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = teamColor;
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isBlue ? "ALLIED LORD" : "ENEMY LORD", sx, sy - this.summonedLord.radius - 10);

      const barW = 45;
      const barH = 4;
      const hpRatio = Math.max(0, this.summonedLord.hp / this.summonedLord.maxHp);
      ctx.fillStyle = "#111";
      ctx.fillRect(sx - barW / 2, sy - this.summonedLord.radius - 6, barW, barH);
      ctx.fillStyle = teamColor;
      ctx.fillRect(sx - barW / 2, sy - this.summonedLord.radius - 6, barW * hpRatio, barH);

      ctx.restore();
    }

    // 4. Render Global Banner Announcements
    if (this.announcements.length > 0) {
      const ann = this.announcements[0];
      const alpha = Math.min(1, ann.life);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(16, 25, 47, 0.85)";
      ctx.fillRect(GAME.CANVAS_WIDTH / 2 - 220, 100, 440, 36);
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(GAME.CANVAS_WIDTH / 2 - 220, 100, 440, 36);

      ctx.fillStyle = ann.color;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ann.text, GAME.CANVAS_WIDTH / 2, 123);
      ctx.restore();
    }
  }
}
