/**
 * Particle Engine - Lightweight 60 FPS Visual Effects
 * Phase 4 implementation - object pool, zero GC lag
 */

class ParticleEngine {
  constructor(maxParticles = 250) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.quality = "high"; // "high", "medium", "low"

    // Pre-allocate pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        type: "spark", // "spark", "ring", "trail", "slash"
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        angle: 0,
        vx: 0,
        vy: 0,
        size: 2,
        currentSize: 2,
        radius: 35,
        maxRadius: 20,
        color: "#ffffff",
        life: 0,
        maxLife: 1,
        drag: 0.95
      });
    }
  }

  setQuality(q) {
    if (["high", "medium", "low"].includes(q)) {
      this.quality = q;
    }
  }

  getMultiplier() {
    if (this.quality === "low") return 0.25;
    if (this.quality === "medium") return 0.6;
    return 1.0;
  }

  spawnBurst(x, y, color = "#ffd700", count = 12, speed = 120) {
    const finalCount = Math.max(2, Math.floor(count * this.getMultiplier()));

    for (let c = 0; c < finalCount; c++) {
      const p = this.particles.find(part => !part.active);
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;

      p.active = true;
      p.type = "spark";
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.size = 2 + Math.random() * 2.5;
      p.currentSize = p.size;
      p.color = color;
      p.maxLife = 0.25 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.drag = 0.92;
    }
  }

  spawnRing(x, y, maxRadius = 45, color = "#4ecca3", duration = 0.35) {
    const p = this.particles.find(part => !part.active);
    if (!p) return;

    p.active = true;
    p.type = "ring";
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.maxRadius = maxRadius;
    p.color = color;
    p.maxLife = duration;
    p.life = duration;
  }

  spawnSlash(x, y, targetX, targetY, color = "#ffd700", radius = 42) {
    const p = this.particles.find(part => !part.active);
    if (!p) return;

    const angle = Math.atan2(targetY - y, targetX - x);

    p.active = true;
    p.type = "slash";
    p.x = x;
    p.y = y;
    p.targetX = targetX;
    p.targetY = targetY;
    p.angle = angle;
    p.radius = radius;
    p.color = color;
    p.maxLife = 0.18;
    p.life = 0.18;
  }

  spawnTrail(x, y, color = "rgba(78, 204, 163, 0.7)", size = 3) {
    if (this.quality === "low") return; // Skip trails in low quality

    const p = this.particles.find(part => !part.active);
    if (!p) return;

    p.active = true;
    p.type = "trail";
    p.x = x + (Math.random() - 0.5) * 4;
    p.y = y + (Math.random() - 0.5) * 4;
    p.vx = (Math.random() - 0.5) * 15;
    p.vy = (Math.random() - 0.5) * 15;
    p.size = size;
    p.currentSize = size;
    p.color = color;
    p.maxLife = 0.2;
    p.life = p.maxLife;
    p.drag = 0.95;
  }

  update(dt) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      if (p.type === "spark" || p.type === "trail") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy *= Math.pow(p.drag, dt * 60);
        p.currentSize = p.size * (p.life / p.maxLife);
      }
    }
  }

  render(ctx, camera) {
    ctx.save();

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      // Skip offscreen
      const canvasW = ctx.canvas ? ctx.canvas.width : GAME.CANVAS_WIDTH;
      const canvasH = ctx.canvas ? ctx.canvas.height : GAME.CANVAS_HEIGHT;
      if (sx < -60 || sx > canvasW + 60 || sy < -60 || sy > canvasH + 60) {
        continue;
      }

      const progress = p.life / p.maxLife; // 1 -> 0
      ctx.globalAlpha = Math.max(0, Math.min(1, progress));

      if (p.type === "spark" || p.type === "trail") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, p.currentSize), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "ring") {
        const radius = p.maxRadius * (1 - progress);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 3 * progress);
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === "slash") {
        const sweepProgress = 1 - progress; // 0 -> 1
        const startAngle = p.angle - 0.85 + sweepProgress * 0.25;
        const endAngle = p.angle + 0.85;
        const currentR = p.radius * (0.85 + 0.25 * sweepProgress);

        // Outer glow arc
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.5, 5 * progress);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(sx, sy, currentR, startAngle, endAngle);
        ctx.stroke();

        // Inner bright white blade core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, 2.2 * progress);
        ctx.beginPath();
        ctx.arc(sx, sy, currentR, startAngle + 0.1, endAngle - 0.1);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
    }

    ctx.restore();
  }
}
