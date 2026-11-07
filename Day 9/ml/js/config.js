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
  MAP_COMPACT: {
    WIDTH: 32,
    HEIGHT: 24,
    TILE_SIZE: 40,
    LANES: {
      GOLD:  { y: 6,  name: "Gold Lane", role: "Marksman" },
      MID:   { y: 12, name: "Mid Lane",  role: "Mage" },
      EXP:   { y: 18, name: "EXP Lane",  role: "Fighter" }
    },
    BASES: {
      BLUE: { x: 2,  y: 12 },
      RED:  { x: 30, y: 12 }
    }
  },
  MAP_LAND_OF_DAWN: {
    WIDTH: 44,
    HEIGHT: 32,
    TILE_SIZE: 40,
    LANES: {
      GOLD:  { y: 5,  name: "Gold Lane", role: "Marksman" },
      MID:   { y: 16, name: "Mid Lane",  role: "Mage" },
      EXP:   { y: 27, name: "EXP Lane",  role: "Fighter" }
    },
    BASES: {
      BLUE: { x: 3,  y: 16 },
      RED:  { x: 41, y: 16 }
    }
  },
  JUNGLE: {
    BLUE_BUFF: {
      name: "Blue Buff (Statue Fiend)",
      hp: 1900,
      attackDamage: 40,
      bounty: 90,
      exp: 140,
      duration: 45,
      cdr: 0.15,
      manaRegen: 12
    },
    RED_BUFF: {
      name: "Red Buff (Lava Fiend)",
      hp: 1900,
      attackDamage: 45,
      bounty: 90,
      exp: 140,
      duration: 45,
      trueDamage: 38,
      slow: 0.20
    },
    GOLD_CRAB: {
      name: "Gold Crab",
      hp: 850,
      attackDamage: 18,
      bounty: 85,
      exp: 70
    },
    SMALL_CREEP: {
      name: "Crammer",
      hp: 750,
      attackDamage: 22,
      bounty: 45,
      exp: 60,
      healRatio: 0.15
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
    title: "Moonlight Archer",
    role: "Marksman",
    lane: "Gold Lane",
    color: "#f1c40f",
    sprite: "assets/sprites/heroes/miya/",
    stats: { hp: 1650, atk: 110, spd: 3.2, range: 175 },
    description: "Miya is an agile marksman blessed by the Moon Goddess. Her attacks ramp up in attack speed and split into multi-arrows, allowing her to melt objectives and kite foes.",
    passive: { name: "Moon Blessing", desc: "Basic attacks grant +5% attack speed (up to 5 stacks). At max stacks, summons Moonlight Shadows dealing bonus damage." }
  },
  {
    id: "tigreal",
    name: "Tigreal",
    title: "Warrior of Dawn",
    role: "Tank",
    lane: "Roam",
    color: "#3498db",
    sprite: "assets/sprites/heroes/tigreal/",
    stats: { hp: 2900, atk: 95, spd: 2.4, range: 70 },
    description: "Leader of the Imperial Knights. Tigreal is a resolute frontline vanguard who charges enemies, knocks them airborne, and initiates team clashes with Implosion.",
    passive: { name: "Fearless", desc: "Gains blessings on skill/attacks. After 4 layers, completely absorbs and nullifies the next incoming basic attack." }
  },
  {
    id: "alucard",
    name: "Alucard",
    title: "Demon Hunter",
    role: "Fighter / Assassin",
    lane: "Jungle",
    color: "#9b59b6",
    sprite: "assets/sprites/heroes/alucard/",
    stats: { hp: 2100, atk: 130, spd: 2.8, range: 75 },
    description: "A demon hunter wielding a cursed greatsword. Alucard excels in aggressive duels, leaping onto targets and sustaining through heavy lifesteal.",
    passive: { name: "Pursuit", desc: "After casting any ability, the next basic attack lunges to the target, dealing 1.2x physical damage." }
  },
  {
    id: "layla",
    name: "Layla",
    title: "Shining Star",
    role: "Marksman",
    lane: "Gold Lane",
    color: "#e67e22",
    sprite: "assets/sprites/heroes/layla/",
    stats: { hp: 1620, atk: 115, spd: 3.0, range: 185 },
    description: "Wielding the Malefic Gun inherited from her father, Layla dominates from ultra-long range, out-ranging turrets and firing piercing destruction lasers.",
    passive: { name: "Malefic Gun", desc: "Basic attack and skill damage increase with distance to the target, dealing from 100% up to 140% at max range." }
  },
  {
    id: "angela",
    name: "Angela",
    title: "Bunnylove",
    role: "Support / Mage",
    lane: "Roam",
    color: "#f39c12",
    sprite: "assets/sprites/heroes/angela/",
    stats: { hp: 2000, atk: 80, spd: 2.6, range: 180 },
    description: "A kind-hearted mechanical android. Angela restores ally health with Love Waves, binds foes with puppet strings, and shields champions from across the map.",
    passive: { name: "Smart Heart", desc: "Each skill cast increases movement speed by 15% for 4s (stacks up to 30%), speeding up nearby allies." }
  },
  {
    id: "gusion",
    name: "Gusion",
    title: "Holy Blade",
    role: "Assassin",
    lane: "Jungle",
    color: "#e74c3c",
    sprite: "assets/sprites/heroes/gusion/",
    stats: { hp: 1750, atk: 150, spd: 3.4, range: 68 },
    description: "Prodigy of the Paxley family who combines sacred light magic with swift blade arts. Gusion bursts down targets with rapid dagger fans and teleport dashes.",
    passive: { name: "Dagger Specialist", desc: "Each skill cast adds a rune to his blade. At 3 runes, the next basic attack deals 15% missing HP bonus magic burst and heals Gusion." }
  },
  {
    id: "pharsa",
    name: "Pharsa",
    title: "Wings of Vengeance",
    role: "Mage",
    lane: "Mid Lane",
    color: "#9b59b6",
    sprite: "assets/sprites/heroes/pharsa/",
    stats: { hp: 1700, atk: 125, spd: 2.6, range: 185 },
    description: "A vengeful mage of the Askati race accompanied by her spiritual companion Verri. Pharsa casts high-voltage laser bursts and artillery meteor bombardments.",
    passive: { name: "Spiritual Unity", desc: "Every 10s, Verri enters hunting mode, causing Pharsa's next strike to deal bonus magic burst and slow the enemy by 60%." }
  },
  {
    id: "balmond",
    name: "Balmond",
    title: "Bloody Beast",
    role: "Fighter",
    lane: "Jungle / EXP",
    color: "#e67e22",
    sprite: "assets/sprites/heroes/balmond/",
    stats: { hp: 2300, atk: 120, spd: 2.7, range: 75 },
    description: "The fierce Orc Berserker. Balmond charges fearlessly through frontlines, spins his massive greataxe in a cyclone of death, and executes low-health foes.",
    passive: { name: "Bloodthirst", desc: "Recovers 8% of max HP on minion kills and 20% of max HP on enemy hero eliminations." }
  },
  {
    id: "nana",
    name: "Nana",
    title: "Sweet Leonin",
    role: "Mage / Support",
    lane: "Mid Lane",
    color: "#2ecc71",
    sprite: "assets/sprites/heroes/nana/",
    stats: { hp: 1680, atk: 120, spd: 2.8, range: 170 },
    description: "A mischievous Leonin endowed with potent spiritual energy. Nana morphs dangerous enemies into harmless cats and crushes teamfights with giant paw slams.",
    passive: { name: "Molina's Gift", desc: "Upon taking fatal damage, transforms and becomes immune to all damage for 2s while gaining +70% movement speed." }
  },
  {
    id: "saber",
    name: "Saber",
    title: "Spacetime Swordmaster",
    role: "Assassin",
    lane: "Jungle / Roam",
    color: "#34495e",
    sprite: "assets/sprites/heroes/saber/",
    stats: { hp: 1800, atk: 140, spd: 3.1, range: 68 },
    description: "A synthetic warrior with peerless swordsmanship. Saber summons orbiting flying swords that shred enemy armor and locks onto priority targets with Triple Sweep.",
    passive: { name: "Enemy's Bane", desc: "Each attack shreds 5 points of enemy Physical Defense for 5s (stacks up to 5 times, dealing true damage)." }
  }
];

/**
 * Standard MOBA Role Sorting Priorities:
 * 1. Tank, 2. Fighter, 3. Assassin, 4. Mage, 5. Marksman
 */
const HERO_ROLE_ORDER = {
  tank: 1,
  fighter: 2,
  assassin: 3,
  mage: 4,
  support: 4,
  marksman: 5
};

/**
 * Get hero by id
 */
function getHeroById(id) {
  return HEROES.find(h => h.id === id) || null;
}

if (typeof window !== "undefined") {
  window.GAME = GAME;
  window.HEROES = HEROES;
  window.HERO_ROLE_ORDER = HERO_ROLE_ORDER;
  window.getHeroById = getHeroById;
}
if (typeof global !== "undefined") {
  global.GAME = GAME;
  global.HEROES = HEROES;
  global.HERO_ROLE_ORDER = HERO_ROLE_ORDER;
  global.getHeroById = getHeroById;
}
