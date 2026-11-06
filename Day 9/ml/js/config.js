/**
 * Game configuration
 * Mobile Legends-inspired 2D MOBA prototype
 * 10 heroes across all 6 roles
 */

const GAME = {
  TITLE: "ML Heroes 2D MOBA",
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  TILE_SIZE: 40,
  FPS: 60,
  MAP: {
    WIDTH: 32,   // tiles
    HEIGHT: 24,  // tiles
    LANES: {
      GOLD:  { y: 6,  x: 8,  name: "Gold Lane", color: "#e94560", role: "Marksman" },
      MID:   { y: 12, x: 16, name: "Mid Lane",  color: "#4ecca3", role: "Mage" },
      EXP:   { y: 18, x: 24, name: "EXP Lane",  color: "#ff9ff3", role: "Fighter" }
    },
    BASES: {
      BLUE: { x: 2,  y: 12 },
      RED:  { x: 30, y: 12 }
    }
  },
  WAVE: {
    INTERVAL: 25, // seconds between waves
    INITIAL_DELAY: 2 // seconds before first wave
  },
  HERO_RESPAWN_TIME: 10, // seconds for both Player and Bot hero respawn
  MAX_HERO_LEVEL: 15,
  LEVEL_EXP: [0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1620, 1900, 2200, 2520, 2860, 3220],
  STAT_GROWTH: {
    hpPerLevel: 65,
    atkPerLevel: 4.5,
    defPerLevel: 2
  },
  EXP_REWARDS: {
    minion: 45,
    hero: 220,
    turret: 180,
    turtle: 300,
    lord: 450,
    passivePerSec: 2
  }
};

/**
 * The 10 selected ML heroes
 * Roles: Tank, Fighter, Assassin, Mage, Marksman, Support
 * Lanes: Gold, EXP, Mid, Jungle, Roam
 */
const HEROES = [
  {
    id: "miya",
    name: "Miya",
    role: "Marksman",
    lane: "Gold Lane",
    color: "#f1c40f",
    sprite: "assets/sprites/heroes/miya/",
    stats: { hp: 1650, atk: 110, spd: 3.2, range: 175 }
  },
  {
    id: "tigreal",
    name: "Tigreal",
    role: "Tank",
    lane: "Roam",
    color: "#3498db",
    sprite: "assets/sprites/heroes/tigreal/",
    stats: { hp: 2900, atk: 95, spd: 2.4, range: 70 }
  },
  {
    id: "alucard",
    name: "Alucard",
    role: "Fighter / Assassin",
    lane: "Jungle",
    color: "#9b59b6",
    sprite: "assets/sprites/heroes/alucard/",
    stats: { hp: 2100, atk: 130, spd: 2.8, range: 75 }
  },
  {
    id: "layla",
    name: "Layla",
    role: "Marksman",
    lane: "Gold Lane",
    color: "#e67e22",
    sprite: "assets/sprites/heroes/layla/",
    stats: { hp: 1620, atk: 115, spd: 3.0, range: 185 }
  },
  {
    id: "angela",
    name: "Angela",
    role: "Support",
    lane: "Roam",
    color: "#f39c12",
    sprite: "assets/sprites/heroes/angela/",
    stats: { hp: 2000, atk: 80, spd: 2.6, range: 180 }
  },
  {
    id: "gusion",
    name: "Gusion",
    role: "Assassin",
    lane: "Jungle",
    color: "#e74c3c",
    sprite: "assets/sprites/heroes/gusion/",
    stats: { hp: 1750, atk: 150, spd: 3.4, range: 68 }
  },
  {
    id: "pharsa",
    name: "Pharsa",
    role: "Mage",
    lane: "Mid Lane",
    color: "#9b59b6",
    sprite: "assets/sprites/heroes/pharsa/",
    stats: { hp: 1700, atk: 125, spd: 2.6, range: 185 }
  },
  {
    id: "balmond",
    name: "Balmond",
    role: "Fighter",
    lane: "Jungle / EXP",
    color: "#e67e22",
    sprite: "assets/sprites/heroes/balmond/",
    stats: { hp: 2300, atk: 120, spd: 2.7, range: 75 }
  },
  {
    id: "nana",
    name: "Nana",
    role: "Mage",
    lane: "Mid Lane",
    color: "#2ecc71",
    sprite: "assets/sprites/heroes/nana/",
    stats: { hp: 1680, atk: 120, spd: 2.8, range: 170 }
  },
  {
    id: "saber",
    name: "Saber",
    role: "Assassin",
    lane: "Jungle / Roam",
    color: "#34495e",
    sprite: "assets/sprites/heroes/saber/",
    stats: { hp: 1800, atk: 140, spd: 3.1, range: 68 }
  }
];

/**
 * Get hero by id
 */
function getHeroById(id) {
  return HEROES.find(h => h.id === id) || null;
}
