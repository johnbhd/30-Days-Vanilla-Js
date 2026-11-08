/**
 * Minion wave system - spawns and manages lane minions
 * Full Phase 2 implementation
 */

class Minion {
  constructor({ team, lane, type, x, y, waypoints }) {
    this.team = team; // "BLUE" | "RED"
    this.lane = lane; // "GOLD" | "MID" | "EXP"
    this.type = type; // "melee" | "ranged"
    this.x = x;
    this.y = y;
    this.waypoints = waypoints;
    this.currentWaypointIndex = 0;

    if (type === "melee") {
      this.hp = 300;
      this.maxHp = 300;
      this.attackDamage = 22;
      this.attackRange = 38;
      this.attackCooldown = 1.0;
      this.speed = 60;
      this.radius = 10;
      this.bounty = 45;
    } else {
      this.hp = 190;
      this.maxHp = 190;
      this.attackDamage = 24;
      this.attackRange = 140;
      this.attackCooldown = 1.2;
      this.speed = 60;
      this.radius = 8;
      this.bounty = 35;
    }

    this.attackTimer = Math.random() * 0.4;
    this.target = null;
    this.isDead = false;
    this.stunTimer = 0;
  }

  applyStun(duration, combatTexts) {
    if (this.isDead || this.hp <= 0) return;
    this.stunTimer = Math.max(this.stunTimer || 0, duration);
    if (combatTexts) {
      combatTexts.push({
        x: this.x,
        y: this.y - 18,
        text: "STUNNED!",
        color: "#ffd700",
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  update(dt, map, hero, allMinions, combatTexts, gameStats, enemyBot, sound, particles, scoreboard, objectiveManager) {
    if (this.hp <= 0) {
      if (!this.isDead) {
        this.isDead = true;
        // Grant farming wave EXP to nearby heroes & bots of the opposing team within 360px
        const opposingHeroes = [];
        if (hero && !hero.isDead && hero.team !== this.team) opposingHeroes.push(hero);
        const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
        botList.forEach(b => {
          if (!b.isDead && b.team !== this.team) opposingHeroes.push(b);
        });
        opposingHeroes.forEach(unit => {
          const distToUnit = Math.hypot(unit.x - this.x, unit.y - this.y);
          if (distToUnit <= 360 && typeof unit.gainExp === "function") {
            unit.gainExp(35, combatTexts, particles, sound);
          }
        });
      }
      return;
    }

    // Boundary check
    if (map && (this.x < -40 || this.x > map.width * map.tileSize + 40 || this.y < -40 || this.y > map.height * map.tileSize + 40)) {
      this.isDead = true;
      return;
    }

    // Stun crowd-control handling
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      return; // Cannot move or attack while stunned
    }

    this.attackTimer -= dt;

    // 1. Verify existing target
    if (this.target) {
      const isDead = this.target.hp <= 0 || this.target.isDead || this.target.destroyed || (this.target.crystalHp !== undefined && this.target.crystalHp <= 0);
      const tx = this.target.worldX !== undefined ? this.target.worldX : this.target.x;
      const ty = this.target.worldY !== undefined ? this.target.worldY : this.target.y;
      const d = getDistance(this.x, this.y, tx, ty);
      if (isDead || d > this.attackRange + 45) {
        this.target = null;
      }
    }

    // 2. Scan for enemy targets if none
    if (!this.target) {
      const targets = [];

      // Enemy Minions in range
      allMinions.forEach(m => {
        if (m.team !== this.team && !m.isDead && m.hp > 0) {
          const d = getDistance(this.x, this.y, m.x, m.y);
          if (d <= this.attackRange + 55) {
            targets.push({ unit: m, dist: d, priority: 1 });
          }
        }
      });

      // Opposing Summoned Lord in range
      if (objectiveManager && objectiveManager.summonedLord && !objectiveManager.summonedLord.isDead && objectiveManager.summonedLord.team !== this.team) {
        const lord = objectiveManager.summonedLord;
        const d = getDistance(this.x, this.y, lord.x, lord.y);
        if (d <= this.attackRange + 55) {
          targets.push({ unit: lord, dist: d, priority: 1.5 });
        }
      }

      // Enemy Heroes (Player or Bots)
      const enemyHeroes = [];
      if (hero && hero.team !== this.team && !hero.isDead && hero.hp > 0) enemyHeroes.push(hero);
      const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
      botList.forEach(b => {
        if (b.team !== this.team && !b.isDead && b.hp > 0) enemyHeroes.push(b);
      });

      enemyHeroes.forEach(eh => {
        const d = getDistance(this.x, this.y, eh.x, eh.y);
        if (d <= this.attackRange + 45) {
          targets.push({ unit: eh, dist: d, priority: 2 });
        }
      });

      // Enemy Turrets
      if (map && map.turrets) {
        map.turrets.forEach(t => {
          if (t.team !== this.team && !t.destroyed && t.hp > 0) {
            const d = getDistance(this.x, this.y, t.worldX, t.worldY);
            if (d <= this.attackRange + 25) {
              targets.push({ unit: t, dist: d, priority: 3 });
            }
          }
        });
      }

      // Enemy Base Crystal
      if (map && map.bases) {
        const enemyBase = map.bases.find(b => b.team !== this.team);
        if (enemyBase && enemyBase.crystalHp > 0) {
          const d = getDistance(this.x, this.y, enemyBase.worldX, enemyBase.worldY);
          if (d <= this.attackRange + 35) {
            targets.push({ unit: enemyBase, dist: d, priority: 4 });
          }
        }
      }

      targets.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
      if (targets.length > 0) {
        this.target = targets[0].unit;
      }
    }

    // 3. Combat or Lane Movement
    if (this.target) {
      const tx = this.target.worldX !== undefined ? this.target.worldX : this.target.x;
      const ty = this.target.worldY !== undefined ? this.target.worldY : this.target.y;
      const d = getDistance(this.x, this.y, tx, ty);

      if (d <= this.attackRange) {
        // Attack target
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;

          if (this.type === "ranged" && map && map.projectiles) {
            map.projectiles.push({
              x: this.x,
              y: this.y,
              target: this.target,
              attacker: this,
              speed: 360,
              damage: this.attackDamage,
              team: this.team,
              color: this.team === "BLUE" ? "#64b5f6" : "#e57373",
              radius: 3
            });
          } else {
            // Melee damage
            if (typeof this.target.takeDamage === "function") {
              this.target.takeDamage(this.attackDamage, this, combatTexts, particles, sound, scoreboard);
            } else if (this.target.hp !== undefined) {
              this.target.lastAttacker = this;
              this.target.hp = Math.max(0, this.target.hp - this.attackDamage);
            } else if (this.target.crystalHp !== undefined) {
              this.target.crystalHp = Math.max(0, this.target.crystalHp - this.attackDamage);
            }

            if (combatTexts) {
              combatTexts.push({
                x: tx + (Math.random() - 0.5) * 12,
                y: ty - 15,
                text: `-${this.attackDamage}`,
                color: this.team === "BLUE" ? "#64b5f6" : "#e57373",
                life: 0.6,
                maxLife: 0.6
              });
            }
          }
        }
      } else {
        // Approach target
        const dx = tx - this.x;
        const dy = ty - this.y;
        this.x += (dx / d) * this.speed * dt;
        this.y += (dy / d) * this.speed * dt;
      }
    } else {
      // Advance along lane waypoints
      if (this.waypoints && this.currentWaypointIndex < this.waypoints.length) {
        const wp = this.waypoints[this.currentWaypointIndex];
        const dx = wp.x - this.x;
        const dy = wp.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 18) {
          this.currentWaypointIndex++;
        } else {
          this.x += (dx / dist) * this.speed * dt;
          this.y += (dy / dist) * this.speed * dt;
        }
      } else {
        // Reached end of path, target enemy crystal directly
        if (map && map.bases) {
          const enemyBase = map.bases.find(b => b.team !== this.team);
          if (enemyBase) this.target = enemyBase;
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    if (sx < -30 || sx > GAME.CANVAS_WIDTH + 30 || sy < -30 || sy > GAME.CANVAS_HEIGHT + 30) return;

    ctx.save();

    // Minion Body
    ctx.fillStyle = this.team === "BLUE" ? "#1e88e5" : "#e53935";
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Class emblem
    ctx.fillStyle = this.type === "melee" ? "#ffe082" : "#80deea";
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Health Bar
    const barW = 20;
    const barH = 3;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "#111";
    ctx.fillRect(sx - barW / 2, sy - this.radius - 6, barW, barH);
    ctx.fillStyle = this.team === "BLUE" ? "#42a5f5" : "#ef5350";
    ctx.fillRect(sx - barW / 2, sy - this.radius - 6, barW * hpRatio, barH);

    // Overhead mini spinning stun stars
    if (this.stunTimer > 0) {
      const starY = sy - this.radius - 12;
      const angle = (Date.now() / 140) % (Math.PI * 2);
      ctx.fillStyle = "#ffd700";
      for (let i = 0; i < 3; i++) {
        const a = angle + (i * Math.PI * 2 / 3);
        const starX = sx + Math.cos(a) * 8;
        const sY = starY + Math.sin(a) * 3;
        ctx.beginPath();
        ctx.arc(starX, sY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

class MinionManager {
  constructor(mapType = "COMPACT") {
    this.mapType = (mapType || "COMPACT").toUpperCase();
    this.minions = [];
    this.spawnTimer = GAME.WAVE.INITIAL_DELAY || 2;
    this.waveInterval = GAME.WAVE.INTERVAL || 30; // 30s per wave as documented
    this.waveCount = 0;
  }

  getWaypoints(team, lane, map = null) {
    const isLod = (map && map.mapType === "LAND_OF_DAWN") || this.mapType === "LAND_OF_DAWN";

    if (isLod) {
      if (team === "BLUE") {
        if (lane === "MID") {
          return [
            { x: 180,  y: 640 },
            { x: 880,  y: 640 },
            { x: 1540, y: 640 },
            { x: 1620, y: 640 }
          ];
        } else if (lane === "GOLD") {
          // Curved Top Lane northern arch
          return [
            { x: 160,  y: 640 },
            { x: 240,  y: 480 },
            { x: 240,  y: 200 },
            { x: 880,  y: 200 },
            { x: 1480, y: 200 },
            { x: 1480, y: 480 },
            { x: 1580, y: 640 },
            { x: 1620, y: 640 }
          ];
        } else {
          // Curved Bottom Lane southern arch
          return [
            { x: 160,  y: 640 },
            { x: 240,  y: 800 },
            { x: 240,  y: 1080 },
            { x: 880,  y: 1080 },
            { x: 1480, y: 1080 },
            { x: 1480, y: 800 },
            { x: 1580, y: 640 },
            { x: 1620, y: 640 }
          ];
        }
      } else {
        // Red team (mirror reverse)
        if (lane === "MID") {
          return [
            { x: 1540, y: 640 },
            { x: 880,  y: 640 },
            { x: 180,  y: 640 },
            { x: 120,  y: 640 }
          ];
        } else if (lane === "GOLD") {
          return [
            { x: 1580, y: 640 },
            { x: 1480, y: 480 },
            { x: 1480, y: 200 },
            { x: 880,  y: 200 },
            { x: 240,  y: 200 },
            { x: 240,  y: 480 },
            { x: 160,  y: 640 },
            { x: 120,  y: 640 }
          ];
        } else {
          return [
            { x: 1580, y: 640 },
            { x: 1480, y: 800 },
            { x: 1480, y: 1080 },
            { x: 880,  y: 1080 },
            { x: 240,  y: 1080 },
            { x: 240,  y: 800 },
            { x: 160,  y: 640 },
            { x: 120,  y: 640 }
          ];
        }
      }
    }

    // Default Compact Map 32x24 waypoints
    const laneY = lane === "GOLD" ? 240 : lane === "EXP" ? 720 : 480;

    if (team === "BLUE") {
      if (lane === "MID") {
        return [
          { x: 140, y: 480 },
          { x: 1140, y: 480 },
          { x: 1220, y: 480 }
        ];
      }
      return [
        { x: 120, y: 480 },
        { x: 160, y: laneY },
        { x: 1120, y: laneY },
        { x: 1160, y: 480 },
        { x: 1220, y: 480 }
      ];
    } else {
      if (lane === "MID") {
        return [
          { x: 1140, y: 480 },
          { x: 140, y: 480 },
          { x: 60, y: 480 }
        ];
      }
      return [
        { x: 1160, y: 480 },
        { x: 1120, y: laneY },
        { x: 160, y: laneY },
        { x: 120, y: 480 },
        { x: 60, y: 480 }
      ];
    }
  }

  spawnWave(map = null) {
    this.waveCount++;
    const lanes = ["GOLD", "MID", "EXP"];
    const isLod = (map && map.mapType === "LAND_OF_DAWN") || this.mapType === "LAND_OF_DAWN";

    lanes.forEach(lane => {
      // 3 Melee + 2 Ranged per lane
      const blueWp = this.getWaypoints("BLUE", lane, map);
      const bX = isLod ? 140 : 105;
      const bY = isLod ? 640 : 480;
      this.minions.push(new Minion({ team: "BLUE", lane, type: "melee", x: bX,      y: bY - 10, waypoints: blueWp }));
      this.minions.push(new Minion({ team: "BLUE", lane, type: "melee", x: bX,      y: bY + 10, waypoints: blueWp }));
      this.minions.push(new Minion({ team: "BLUE", lane, type: "melee", x: bX - 15, y: bY,      waypoints: blueWp }));
      this.minions.push(new Minion({ team: "BLUE", lane, type: "ranged", x: bX - 30, y: bY - 8,  waypoints: blueWp }));
      this.minions.push(new Minion({ team: "BLUE", lane, type: "ranged", x: bX - 30, y: bY + 8,  waypoints: blueWp }));

      const redWp = this.getWaypoints("RED", lane, map);
      const rX = isLod ? 1620 : 1175;
      const rY = isLod ? 640 : 480;
      this.minions.push(new Minion({ team: "RED", lane, type: "melee", x: rX,      y: rY - 10, waypoints: redWp }));
      this.minions.push(new Minion({ team: "RED", lane, type: "melee", x: rX,      y: rY + 10, waypoints: redWp }));
      this.minions.push(new Minion({ team: "RED", lane, type: "melee", x: rX + 15, y: rY,      waypoints: redWp }));
      this.minions.push(new Minion({ team: "RED", lane, type: "ranged", x: rX + 30, y: rY - 8,  waypoints: redWp }));
      this.minions.push(new Minion({ team: "RED", lane, type: "ranged", x: rX + 30, y: rY + 8,  waypoints: redWp }));
    });
  }

  update(dt, map, hero, combatTexts, gameStats, enemyBot, sound, particles, scoreboard, objectiveManager) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWave(map);
      this.spawnTimer = this.waveInterval;

      if (combatTexts) {
        combatTexts.push({
          x: GAME.CANVAS_WIDTH / 2,
          y: 60,
          text: `WAVE ${this.waveCount} SPAWNED!`,
          color: "#4ecca3",
          life: 2.0,
          maxLife: 2.0
        });
      }
    }

    // Update each minion
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const minion = this.minions[i];
      minion.update(dt, map, hero, this.minions, combatTexts, gameStats, enemyBot, sound, particles, scoreboard, objectiveManager);
      if (minion.isDead) {
        this.minions.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    this.minions.forEach(minion => {
      minion.render(ctx, camera);
    });
  }
}

if (typeof window !== "undefined") {
  window.Minion = Minion;
  window.MinionManager = MinionManager;
}
if (typeof global !== "undefined") {
  global.Minion = Minion;
  global.MinionManager = MinionManager;
}
