/**
 * Map system - 3-lane MOBA map (Land of Dawn inspired)
 * Tiles: grass, lane (gold/mid/exp), jungle, river, base, turret, bush
 */

const MAP_TILES = {
  GRASS:     { id: 0, color: "#2d5a27", walkable: true },
  LANE:      { id: 1, color: "#4a4a4a", walkable: true },
  JUNGLE:    { id: 2, color: "#1b4332", walkable: true },
  RIVER:     { id: 3, color: "#2a6f97", walkable: true },
  BASE_BLUE: { id: 4, color: "#162a45", walkable: true },
  TURRET:    { id: 5, color: "#ffd700", walkable: false },
  BUSH:      { id: 6, color: "#3d5a3d", walkable: true },
  BASE_RED:  { id: 7, color: "#3d1418", walkable: true },
  BASE:      { id: 4, color: "#162a45", walkable: true }
};

class GameMap {
  constructor(width = 32, height = 24, tileSize = 40) {
    this.width = width || (typeof GAME !== "undefined" && GAME.MAP ? GAME.MAP.WIDTH : 32);
    this.height = height || (typeof GAME !== "undefined" && GAME.MAP ? GAME.MAP.HEIGHT : 24);
    this.tileSize = tileSize || (typeof GAME !== "undefined" ? GAME.TILE_SIZE : 40);
    this.grid = [];
    this.turrets = [];
    this.bases = [];
    this.projectiles = [];
    this.init();
  }

  init() {
    // 1. Fill ground with grass
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = MAP_TILES.GRASS.id;
      }
    }

    // 2. Vertical River through middle (x = 15..17)
    for (let y = 0; y < this.height; y++) {
      for (let x = 15; x <= 17; x++) {
        this.grid[y][x] = MAP_TILES.RIVER.id;
      }
    }

    // 3. Draw 3 horizontal lanes (Gold: y=6, Mid: y=12, EXP: y=18)
    const laneRows = [
      GAME.MAP.LANES.GOLD.y,
      GAME.MAP.LANES.MID.y,
      GAME.MAP.LANES.EXP.y
    ];

    laneRows.forEach(laneY => {
      for (let y = laneY - 1; y <= laneY + 1; y++) {
        for (let x = 0; x < this.width; x++) {
          if (y >= 0 && y < this.height) {
            this.grid[y][x] = MAP_TILES.LANE.id;
          }
        }
      }
    });

    // 4. Connect bases to all 3 lanes vertically at both ends
    // Blue Base Connector (x = 2..4, y = 5..19)
    for (let y = 5; y <= 19; y++) {
      for (let x = 2; x <= 4; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width && this.grid[y]) {
          this.grid[y][x] = MAP_TILES.LANE.id;
        }
      }
    }
    // Red Base Connector (x = 27..29, y = 5..19)
    for (let y = 5; y <= 19; y++) {
      for (let x = 27; x <= 29; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width && this.grid[y]) {
          this.grid[y][x] = MAP_TILES.LANE.id;
        }
      }
    }

    // 5. Jungle quadrants between lanes
    this.addJunglePatch(6, 8, 8, 3);   // Top-Left
    this.addJunglePatch(18, 8, 8, 3);  // Top-Right
    this.addJunglePatch(6, 14, 8, 3);  // Bottom-Left
    this.addJunglePatch(18, 14, 8, 3); // Bottom-Right

    // 6. Bushes along lanes and river
    this.addBush(10, 4, 2, 1);
    this.addBush(20, 4, 2, 1);
    this.addBush(10, 14, 2, 1);
    this.addBush(20, 14, 2, 1);
    this.addBush(14, 9, 1, 2);
    this.addBush(18, 15, 1, 2);

    // 7. Bases at left and right
    this.addBase(GAME.MAP.BASES.BLUE.x, GAME.MAP.BASES.BLUE.y, 4, 6, "BLUE");
    this.addBase(GAME.MAP.BASES.RED.x, GAME.MAP.BASES.RED.y, 4, 6, "RED");

    // 8. Turrets along each lane
    this.addTurrets();
  }

  addJunglePatch(cx, cy, w, h) {
    for (let y = cy; y < cy + h; y++) {
      for (let x = cx; x < cx + w; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          if (this.grid[y][x] === MAP_TILES.GRASS.id) {
            this.grid[y][x] = MAP_TILES.JUNGLE.id;
          }
        }
      }
    }
  }

  addBush(cx, cy, w, h) {
    for (let y = cy; y < cy + h; y++) {
      for (let x = cx; x < cx + w; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          this.grid[y][x] = MAP_TILES.BUSH.id;
        }
      }
    }
  }

  addBase(cx, cy, w, h, team) {
    const baseTile = team === "BLUE" ? MAP_TILES.BASE_BLUE : MAP_TILES.BASE_RED;
    for (let y = cy - Math.floor(h / 2); y < cy + Math.floor(h / 2); y++) {
      for (let x = cx - Math.floor(w / 2); x < cx + Math.floor(w / 2); x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          this.grid[y][x] = baseTile.id;
        }
      }
    }
    this.bases.push({
      x: cx,
      y: cy,
      worldX: cx * this.tileSize + this.tileSize / 2,
      worldY: cy * this.tileSize + this.tileSize / 2,
      w,
      h,
      team,
      crystalHp: 5000,
      maxCrystalHp: 5000,
      radius: 36,
      destroyed: false,
      defenseRange: 210,
      defenseDamage: 95,
      attackCooldown: 1.0,
      attackTimer: 0,
      target: null
    });
  }

  addTurrets() {
    this.turrets = [];
    const lanes = [
      { name: "GOLD", y: GAME.MAP.LANES.GOLD.y },
      { name: "MID",  y: GAME.MAP.LANES.MID.y },
      { name: "EXP",  y: GAME.MAP.LANES.EXP.y }
    ];

    lanes.forEach(lane => {
      // Blue side: Base (x=6), Inner (x=10), Outer (x=13)
      [
        { x: 6, tier: "Base" },
        { x: 10, tier: "Inner" },
        { x: 13, tier: "Outer" }
      ].forEach(pos => {
        this.createTurret(pos.x, lane.y, "BLUE", lane.name, pos.tier);
      });

      // Red side: Outer (x=19), Inner (x=22), Base (x=26)
      [
        { x: 19, tier: "Outer" },
        { x: 22, tier: "Inner" },
        { x: 26, tier: "Base" }
      ].forEach(pos => {
        this.createTurret(pos.x, lane.y, "RED", lane.name, pos.tier);
      });
    });

    // 7. Pre-render static ground tiles to an offscreen canvas for 60 FPS mobile performance
    this.initOffscreen();
  }

  /**
   * Pre-renders the 1280x960 tile grid to an offscreen buffer.
   * Reduces 1,500+ canvas draw calls per frame to a single fast GPU drawImage blit.
   */
  initOffscreen() {
    if (typeof document === "undefined" || typeof document.createElement !== "function") return;
    if (!this.offscreenCanvas) {
      try {
        this.offscreenCanvas = document.createElement("canvas");
      } catch (e) {
        this.offscreenCanvas = null;
        return;
      }
    }
    if (!this.offscreenCanvas || typeof this.offscreenCanvas.getContext !== "function") {
      this.offscreenCanvas = null;
      return;
    }
    this.offscreenCanvas.width = this.width * this.tileSize;
    this.offscreenCanvas.height = this.height * this.tileSize;
    const offCtx = this.offscreenCanvas.getContext("2d");
    if (!offCtx) return;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tileId = this.grid[y][x];
        const color = this.getTileColor(x, y);
        const sx = x * this.tileSize;
        const sy = y * this.tileSize;

        if (tileId === MAP_TILES.BASE_BLUE.id) {
          offCtx.fillStyle = "#162a45";
          offCtx.fillRect(sx, sy, this.tileSize, this.tileSize);
          offCtx.strokeStyle = "rgba(0, 210, 211, 0.22)";
          offCtx.lineWidth = 1;
          offCtx.strokeRect(sx, sy, this.tileSize, this.tileSize);
        } else if (tileId === MAP_TILES.BASE_RED.id) {
          offCtx.fillStyle = "#3d1418";
          offCtx.fillRect(sx, sy, this.tileSize, this.tileSize);
          offCtx.strokeStyle = "rgba(231, 76, 60, 0.18)";
          offCtx.lineWidth = 1;
          offCtx.strokeRect(sx, sy, this.tileSize, this.tileSize);
        } else {
          offCtx.fillStyle = color;
          offCtx.fillRect(sx, sy, this.tileSize, this.tileSize);
          offCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
          offCtx.strokeRect(sx, sy, this.tileSize, this.tileSize);
        }
      }
    }
  }

  createTurret(tx, ty, team, lane, tier) {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.grid[ty][tx] = MAP_TILES.TURRET.id;
    }
    this.turrets.push({
      id: `${team}_${lane}_${tier}`,
      x: tx,
      y: ty,
      worldX: tx * this.tileSize + this.tileSize / 2,
      worldY: ty * this.tileSize + this.tileSize / 2,
      hp: 1500,
      maxHp: 1500,
      team,
      lane,
      tier,
      range: 160,
      damage: 65,
      attackCooldown: 1.2,
      attackTimer: Math.random() * 0.5,
      target: null,
      destroyed: false
    });
  }

  isWalkable(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
    const tileId = this.grid[ty][tx];
    const tile = Object.values(MAP_TILES).find(t => t.id === tileId);
    return tile ? tile.walkable : false;
  }

  getTileColor(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return "#000000";
    const tileId = this.grid[ty][tx];
    const tile = Object.values(MAP_TILES).find(t => t.id === tileId);
    return tile ? tile.color : "#2d5a27";
  }

  updateCombat(dt, hero, minions, combatTexts, gameStats, enemyBot, sound, particles, scoreboard, objectiveManager) {
    const candidateHeroes = [];
    if (hero && !hero.isDead && hero.hp > 0) candidateHeroes.push(hero);
    const botList = Array.isArray(enemyBot) ? enemyBot : (enemyBot ? [enemyBot] : []);
    botList.forEach(b => {
      if (!b.isDead && b.hp > 0) candidateHeroes.push(b);
    });

    // 1. Update Turret shooting & destruction
    this.turrets.forEach(turret => {
      if (turret.destroyed) return;

      if (turret.hp <= 0) {
        turret.destroyed = true;
        this.grid[turret.y][turret.x] = MAP_TILES.LANE.id;
        this.initOffscreen();
        if (combatTexts) {
          combatTexts.push({
            x: turret.worldX,
            y: turret.worldY - 25,
            text: `${turret.team} TURRET DESTROYED!`,
            color: "#ffd700",
            life: 2.0,
            maxLife: 2.0
          });
        }
        if (turret.team === "RED") {
          if (gameStats) {
            gameStats.turretsDestroyed++;
            gameStats.gold += 250;
          }
          if (hero && hero.gainExp) {
            hero.gainExp(GAME.EXP_REWARDS.turret, combatTexts, particles, sound);
          }
        } else if (turret.team === "BLUE") {
          if (enemyBot && enemyBot.gainExp) {
            enemyBot.gainExp(GAME.EXP_REWARDS.turret, combatTexts, particles, sound);
          }
        }
        return;
      }

      turret.attackTimer -= dt;

      // Check current target validity
      if (turret.target) {
        const isDead = turret.target.hp <= 0 || turret.target.isDead;
        const tx = turret.target.x !== undefined ? turret.target.x : turret.target.worldX;
        const ty = turret.target.y !== undefined ? turret.target.y : turret.target.worldY;
        const dist = getDistance(turret.worldX, turret.worldY, tx, ty);
        if (isDead || dist > turret.range) {
          turret.target = null;
        }
      }

      // Pick target if none
      if (!turret.target) {
        // Collect potential enemies (opposite team)
        const enemies = [];
        if (minions) {
          minions.forEach(m => {
            if (m.team !== turret.team && !m.isDead && m.hp > 0) {
              const d = getDistance(turret.worldX, turret.worldY, m.x, m.y);
              if (d <= turret.range) enemies.push({ unit: m, dist: d, priority: 1 });
            }
          });
        }
        // Enemy heroes (Player or Bot)
        candidateHeroes.forEach(h => {
          if (h.team !== turret.team && !h.isDead && h.hp > 0) {
            const d = getDistance(turret.worldX, turret.worldY, h.x, h.y);
            if (d <= turret.range) {
              enemies.push({ unit: h, dist: d, priority: 2 });
            }
          }
        });

        // Opposing Summoned Lord in range (high priority siege target!)
        if (objectiveManager && objectiveManager.summonedLord && !objectiveManager.summonedLord.isDead && objectiveManager.summonedLord.team !== turret.team) {
          const lord = objectiveManager.summonedLord;
          const d = getDistance(turret.worldX, turret.worldY, lord.x, lord.y);
          if (d <= turret.range) {
            enemies.push({ unit: lord, dist: d, priority: 1.2 });
          }
        }

        // Prioritize minions over heroes, closest distance first
        enemies.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.dist - b.dist;
        });

        if (enemies.length > 0) {
          turret.target = enemies[0].unit;
        }
      }

      // Fire projectile
      if (turret.target && turret.attackTimer <= 0) {
        turret.attackTimer = turret.attackCooldown;
        this.projectiles.push({
          x: turret.worldX,
          y: turret.worldY,
          target: turret.target,
          speed: 380,
          damage: turret.damage,
          team: turret.team,
          color: turret.team === "BLUE" ? "#38ef7d" : "#ff4b2b",
          radius: 5,
          isTurret: true
        });
      }
    });

    // 1b. Update Base Crystal Defense System
    this.bases.forEach(base => {
      if (base.crystalHp <= 0) return;
      base.attackTimer = Math.max(0, (base.attackTimer || 0) - dt);

      // Check existing target
      if (base.target) {
        const isDead = base.target.hp <= 0 || base.target.isDead;
        const tx = base.target.x !== undefined ? base.target.x : base.target.worldX;
        const ty = base.target.y !== undefined ? base.target.y : base.target.worldY;
        const dist = getDistance(base.worldX, base.worldY, tx, ty);
        if (isDead || dist > base.defenseRange) {
          base.target = null;
        }
      }

      // Pick target if none
      if (!base.target) {
        const baseEnemies = [];
        // Enemy minions invading base territory
        if (minions) {
          minions.forEach(m => {
            if (m.team !== base.team && !m.isDead && m.hp > 0) {
              const d = getDistance(base.worldX, base.worldY, m.x, m.y);
              if (d <= base.defenseRange) baseEnemies.push({ unit: m, dist: d, priority: 2 });
            }
          });
        }
        // Enemy heroes invading base sanctuary (highest priority defense!)
        candidateHeroes.forEach(h => {
          if (h.team !== base.team && !h.isDead && h.hp > 0) {
            const d = getDistance(base.worldX, base.worldY, h.x, h.y);
            if (d <= base.defenseRange) baseEnemies.push({ unit: h, dist: d, priority: 1 });
          }
        });

        // Opposing Summoned Lord invading base territory
        if (objectiveManager && objectiveManager.summonedLord && !objectiveManager.summonedLord.isDead && objectiveManager.summonedLord.team !== base.team) {
          const lord = objectiveManager.summonedLord;
          const d = getDistance(base.worldX, base.worldY, lord.x, lord.y);
          if (d <= base.defenseRange) {
            baseEnemies.push({ unit: lord, dist: d, priority: 1.5 });
          }
        }

        baseEnemies.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.dist - b.dist;
        });

        if (baseEnemies.length > 0) {
          base.target = baseEnemies[0].unit;
        }
      }

      // Fire base crystal blast
      if (base.target && base.attackTimer <= 0) {
        base.attackTimer = base.attackCooldown;
        if (sound && sound.playCrystalBlast) sound.playCrystalBlast();
        if (particles) particles.spawnRing(base.worldX, base.worldY, 40, base.team === "BLUE" ? "#3498db" : "#e74c3c", 0.3);

        this.projectiles.push({
          x: base.worldX,
          y: base.worldY,
          target: base.target,
          speed: 420,
          damage: base.defenseDamage,
          team: base.team,
          color: base.team === "BLUE" ? "#00d2d3" : "#ff4757",
          radius: 6,
          isCrystal: true,
          isTurret: true
        });
      }
    });

    // 2. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const targetDead = !p.target || p.target.hp <= 0 || p.target.isDead;
      if (targetDead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const tx = p.target.x !== undefined ? p.target.x : p.target.worldX;
      const ty = p.target.y !== undefined ? p.target.y : p.target.worldY;
      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * dt;

      if (dist <= step || dist < 12) {
        // Hit target
        if (typeof p.target.takeDamage === "function") {
          p.target.takeDamage(p.damage, { team: p.team, isTurret: !!p.isTurret, isCrystal: !!p.isCrystal }, combatTexts, particles, sound, scoreboard);
        } else {
          const prevHp = p.target.hp || 0;
          p.target.hp = Math.max(0, p.target.hp - p.damage);
          if (combatTexts) {
            combatTexts.push({
              x: tx + (Math.random() - 0.5) * 20,
              y: ty - 20,
              text: `-${Math.round(p.damage)}`,
              color: p.color || (p.team === "BLUE" ? "#38ef7d" : "#ff4b2b"),
              life: 0.8,
              maxLife: 0.8
            });
          }
          if (particles) {
            particles.spawnBurst(tx, ty, p.color || "#ffffff", 6, 90);
          }
          if (sound) {
            sound.playHit();
          }

          // Kill bounty check for player projectile
          if (prevHp > 0 && p.target.hp <= 0 && p.team === "BLUE" && p.target.bounty) {
            const bounty = p.target.bounty;
            if (gameStats) {
              gameStats.gold += bounty;
              if (p.target.team) gameStats.minionsKilled++;
            }
            if (scoreboard) {
              if (p.target.team) scoreboard.addCS("player");
              scoreboard.addGold("player", bounty);
            }
            if (hero && hero.gainExp) {
              hero.gainExp(GAME.EXP_REWARDS.minion, combatTexts, particles, sound);
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
        }
        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }
  }

  render(ctx, camera) {
    // Fill background with dark void color for areas outside map boundaries
    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, ctx.canvas ? ctx.canvas.width : GAME.CANVAS_WIDTH, ctx.canvas ? ctx.canvas.height : GAME.CANVAS_HEIGHT);

    // Fast GPU blit of pre-rendered tile grid (reduces 1,500 draw calls to 1)
    if (this.offscreenCanvas) {
      ctx.drawImage(this.offscreenCanvas, -camera.x, -camera.y);
    } else {
      const cW = ctx.canvas ? ctx.canvas.width : GAME.CANVAS_WIDTH;
      const cH = ctx.canvas ? ctx.canvas.height : GAME.CANVAS_HEIGHT;
      const startX = Math.max(0, Math.floor(camera.x / this.tileSize));
      const endX = Math.min(this.width, Math.ceil((camera.x + cW) / this.tileSize) + 1);
      const startY = Math.max(0, Math.floor(camera.y / this.tileSize));
      const endY = Math.min(this.height, Math.ceil((camera.y + cH) / this.tileSize) + 1);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (!this.grid[y]) continue;
          const tileId = this.grid[y][x];
          const color = this.getTileColor(x, y);
          const sx = x * this.tileSize - camera.x;
          const sy = y * this.tileSize - camera.y;

          if (tileId === MAP_TILES.BASE_BLUE.id) {
            ctx.fillStyle = "#162a45";
            ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.strokeStyle = "rgba(0, 210, 211, 0.22)";
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, this.tileSize, this.tileSize);
          } else if (tileId === MAP_TILES.BASE_RED.id) {
            ctx.fillStyle = "#3d1418";
            ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.strokeStyle = "rgba(231, 76, 60, 0.18)";
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, this.tileSize, this.tileSize);
          } else {
            ctx.fillStyle = color;
            ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
            ctx.strokeRect(sx, sy, this.tileSize, this.tileSize);
          }
        }
      }
    }

    // River Water Waves Visual (Horizontally centered in river: x = 660)
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    for (let y = 0; y < this.height; y += 2) {
      const sx = 660 - camera.x;
      const sy = y * this.tileSize - camera.y;
      ctx.fillRect(sx - 25, sy + 15, 50, 2);
    }

    // River Boss Sanctuaries (Horizontally centered at x = 660, vertically centered between lanes)
    const bossPits = [
      { x: 660, y: 380, label: "TURTLE PIT" },
      { x: 660, y: 620, label: "LORD PIT" }
    ];
    bossPits.forEach(pit => {
      const sx = pit.x - camera.x;
      const sy = pit.y - camera.y;
      ctx.save();
      // Outer stone crater ring
      ctx.fillStyle = "rgba(10, 18, 28, 0.55)";
      ctx.strokeStyle = "rgba(78, 204, 163, 0.45)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner rune ring
      ctx.strokeStyle = "rgba(78, 204, 163, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(sx, sy, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Bases (Crystals)
    this.bases.forEach(base => {
      const sx = base.worldX - camera.x;
      const sy = base.worldY - camera.y;
      const isAlive = base.crystalHp > 0;

      // Fountain Sanctuary Perimeter (Heals friendly champions inside 120px)
      if (isAlive) {
        ctx.strokeStyle = base.team === "BLUE" ? "rgba(0, 210, 211, 0.28)" : "rgba(231, 76, 60, 0.28)";
        ctx.fillStyle = base.team === "BLUE" ? "rgba(0, 210, 211, 0.03)" : "rgba(231, 76, 60, 0.03)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(sx, sy, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Defense range indicator if actively targeting
      if (base.target && isAlive) {
        ctx.strokeStyle = base.team === "BLUE" ? "rgba(0, 210, 211, 0.35)" : "rgba(255, 71, 87, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(sx, sy, base.defenseRange, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Glow circle
      ctx.fillStyle = base.team === "BLUE"
        ? (isAlive ? "rgba(52, 152, 219, 0.25)" : "rgba(100, 100, 100, 0.1)")
        : (isAlive ? "rgba(231, 76, 60, 0.25)" : "rgba(100, 100, 100, 0.1)");
      ctx.beginPath();
      ctx.arc(sx, sy, base.radius + 12, 0, Math.PI * 2);
      ctx.fill();

      // Crystal body
      ctx.fillStyle = base.team === "BLUE"
        ? (isAlive ? "#3498db" : "#555")
        : (isAlive ? "#e74c3c" : "#555");
      ctx.beginPath();
      ctx.arc(sx, sy, base.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isAlive ? "#fff" : "#444";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Crystal label & HP
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(base.team === "BLUE" ? "BLUE CRYSTAL" : "RED CRYSTAL", sx, sy - base.radius - 16);

      // HP bar
      const barW = 70;
      const barH = 7;
      const hpRatio = Math.max(0, base.crystalHp / base.maxCrystalHp);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx - barW / 2, sy - base.radius - 12, barW, barH);
      ctx.fillStyle = base.team === "BLUE" ? "#3498db" : "#e74c3c";
      ctx.fillRect(sx - barW / 2, sy - base.radius - 12, barW * hpRatio, barH);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - barW / 2, sy - base.radius - 12, barW, barH);
    });

    // Turrets
    this.turrets.forEach(turret => {
      const sx = turret.worldX - camera.x;
      const sy = turret.worldY - camera.y;

      if (turret.destroyed) {
        // Destroyed rubble
        ctx.fillStyle = "#333";
        ctx.fillRect(sx - 14, sy - 14, 28, 28);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(sx - 14, sy - 14, 28, 28);
        return;
      }

      // Attack range indicator if targeting
      if (turret.target) {
        ctx.strokeStyle = turret.team === "BLUE" ? "rgba(52, 152, 219, 0.15)" : "rgba(231, 76, 60, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, turret.range, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Turret body
      ctx.fillStyle = turret.team === "BLUE" ? "#2980b9" : "#c0392b";
      ctx.beginPath();
      ctx.rect(sx - 14, sy - 14, 28, 28);
      ctx.fill();
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gem center
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const barW = 32;
      const barH = 4;
      const hpRatio = Math.max(0, turret.hp / turret.maxHp);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx - barW / 2, sy - 20, barW, barH);
      ctx.fillStyle = hpRatio > 0.4 ? (turret.team === "BLUE" ? "#3498db" : "#e74c3c") : "#f39c12";
      ctx.fillRect(sx - barW / 2, sy - 20, barW * hpRatio, barH);
    });

    // Projectiles
    this.projectiles.forEach(p => {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

if (typeof window !== "undefined") window.GameMap = GameMap;
if (typeof global !== "undefined") global.GameMap = GameMap;
