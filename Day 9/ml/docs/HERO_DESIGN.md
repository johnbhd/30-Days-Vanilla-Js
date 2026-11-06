# Hero Design Documentation

## Detailed Specs for All 10 Heroes

Each hero is defined in `js/config.js` with: id, name, role, lane, color, spritePath, and stats (hp, atk, spd, range).

---

## 1. Miya (Marksman — Gold Lane)

| Attribute | Value |
|-----------|-------|
| **Role** | Marksman |
| **Lane** | Gold Lane |
| **Color** | #f1c40f (yellow) |
| **HP** | 750 |
| **Attack** | 110 |
| **Attack Speed** | 3.2 (seconds between attacks) |
| **Range** | 550 |
| **Playstyle** | Ranged carry, late-game scaling. Vulnerable early, dominates late game with items. Basic attacks are the primary damage source. |
| **Sprite** | `assets/sprites/heroes/miya/idle.png` (15,364 bytes) |
| **Lore note** | The #1 hero in MLBB, archer archetype. Known for long-range basic attacks and split-push potential. |

---

## 2. Layla (Marksman — Gold Lane)

| Attribute | Value |
|-----------|-------|
| **Role** | Marksman |
| **Lane** | Gold Lane |
| **Color** | #e67e22 (orange) |
| **HP** | 720 |
| **Attack** | 115 |
| **Attack Speed** | 3.0 |
| **Range** | 650 |
| **Playstyle** | Sniper-style marksman. Longest range of the two Gold Lane heroes. Requires positioning and prediction. |
| **Sprite** | `assets/sprites/heroes/layla/idle.png` (16,584 bytes) |

---

## 3. Tigreal (Tank — Roam)

| Attribute | Value |
|-----------|-------|
| **Role** | Tank |
| **Lane** | Roam |
| **Color** | #3498db (blue) |
| **HP** | 2900 |
| **Attack** | 95 |
| **Attack Speed** | 2.4 |
| **Range** | 120 (very short — melee engage) |
| **Playstyle** | Frontline initiator. Crowd control, protects carries, starts team fights. Low damage but high durability. |
| **Sprite** | `assets/sprites/heroes/tigreal/idle.png` (17,158 bytes) |

---

## 4. Angela (Support — Roam)

| Attribute | Value |
|-----------|-------|
| **Role** | Support |
| **Lane** | Roam |
| **Color** | #f39c12 (orange-yellow) |
| **HP** | 2000 |
| **Attack** | 80 |
| **Attack Speed** | 2.6 |
| **Range** | 200 (very short — support range) |
| **Playstyle** | Healing/buffer support. Keeps carries alive, provides shields/buffs. Low damage, high utility. |
| **Sprite** | `assets/sprites/heroes/angela/idle.png` (14,114 bytes) |

---

## 5. Alucard (Fighter/Assassin — Jungle)

| Attribute | Value |
|-----------|-------|
| **Role** | Fighter / Assassin |
| **Lane** | Jungle |
| **Color** | #9b59b6 (purple) |
| **HP** | 2100 |
| **Attack** | 130 |
| **Attack Speed** | 2.8 |
| **Range** | 140 |
| **Playstyle** | Lifesteal jungler. Clears camps fast, sustains in fights with lifesteal. High skill ceiling, risky if behind. |
| **Sprite** | `assets/sprites/heroes/alucard/idle.png` (15,350 bytes) |

---

## 6. Balmond (Fighter — Jungle/EXP)

| Attribute | Value |
|-----------|-------|
| **Role** | Fighter |
| **Lane** | Jungle / EXP |
| **Color** | #e67e22 (orange) |
| **HP** | 2300 |
| **Attack** | 120 |
| **Attack Speed** | 2.7 |
| **Range** | 130 |
| **Playstyle** | Durable fighter with regen mechanics. Excels at sustained 1v1s, jungle clearing, and lane dominance. |
| **Sprite** | `assets/sprites/heroes/balmond/idle.png` (13,264 bytes) |

---

## 7. Gusion (Assassin — Jungle)

| Attribute | Value |
|-----------|-------|
| **Role** | Assassin |
| **Lane** | Jungle |
| **Color** | #e74c3c (red) |
| **HP** | 1750 |
| **Attack** | 150 |
| **Attack Speed** | 3.4 |
| **Range** | 110 |
| **Playstyle** | High-mobility burst assassin. High skill ceiling. Multiple forms/transformations. Snowball potential: early lead = unstoppable late game. |
| **Sprite** | `assets/sprites/heroes/gusion/idle.png` (12,546 bytes) |

---

## 8. Saber (Assassin — Jungle/Roam)

| Attribute | Value |
|-----------|-------|
| **Role** | Assassin |
| **Lane** | Jungle / Roam |
| **Color** | #34495e (dark gray) |
| **HP** | 1800 |
| **Attack** | 140 |
| **Attack Speed** | 3.1 |
| **Range** | 100 |
| **Playstyle** | Mobile assassin. Can roam between lanes, hunt priority targets. Good dueling kit. |
| **Sprite** | `assets/sprites/heroes/saber/idle.png` (17,316 bytes) |

---

## 9. Pharsa (Mage — Mid Lane)

| Attribute | Value |
|-----------|-------|
| **Role** | Mage |
| **Lane** | Mid Lane |
| **Color** | #9b59b6 (purple) |
| **HP** | 1700 |
| **Attack** | 125 |
| **Attack Speed** | 2.6 |
| **Range** | 700 |
| **Playstyle** | Long-range mage. Global presence via ultimate. Skill-shot dependent. Provides magic damage and crowd control. |
| **Sprite** | `assets/sprites/heroes/pharsa/idle.png` (15,456 bytes) |

---

## 10. Nana (Mage — Mid Lane)

| Attribute | Value |
|-----------|-------|
| **Role** | Mage |
| **Lane** | Mid Lane |
| **Color** | #2ecc71 (green) |
| **HP** | 1680 |
| **Attack** | 120 |
| **Attack Speed** | 2.8 |
| **Range** | 600 |
| **Playstyle** | Control mage. Crowd control (sheep/stun), wave clear, roams. Lower damage than Pharsa but more utility. |
| **Sprite** | `assets/sprites/heroes/nana/idle.png` (17,444 bytes) |

---

## Role & Lane Mapping Table

| Role | Typical Lane | Primary Function | Example Heroes |
|------|-------------|------------------|----------------|
| **Marksman** | Gold Lane | Ranged carry, late-game damage | Miya, Layla |
| **Tank** | Roam | Initiate, CC, protect carries | Tigreal, Khufra |
| **Support** | Roam | Heal/buff, vision, utility | Angela, Rafaela |
| **Fighter** | Jungle / EXP Lane | Durable melee, 1v1, jungle clear | Balmond, Alucard,攻城兵 |
| **Assassin** | Jungle | Burst damage, mobility, eliminate carries | Gusion, Saber, attack |
| **Mage** | Mid Lane | Magic damage, wave clear, rotate | Pharsa, Nana, Gandalf |

---

## Sprite Format Notes

- **Current:** All 10 heroes have `idle.png` in their folder
- **Format expected by `hero.js`:** `loadImage(`${spritePath}idle.png`)` — the game loop tries to load this file
- **Fallback:** If file doesn't exist or fails to load, hero renders as colored circle with initial letter
- **Recommended dimensions:** Square, ~64×64px or similar (aspect ratio flexible due to canvas draw scaling)
- **Future:** Can add `walk.png`, `attack.png`, `skillQ.png`, etc. by extending the loader in `hero.js`

---

## Hero Balance Observations

| Observation | Detail |
|-------------|--------|
| **Marksman fragility** | Miya (750 HP) and Layla (720 HP) have lowest HP. Must be protected by tanks/supports. |
| **Tank durability** | Tigreal (2900 HP) has ~4× the HP of marksmen. Designed to absorb damage. |
| **Mage range** | Pharsa (700) > Nana (600). Longer range = safer poke and repositioning. |
| **Jungle clear speed** | Alucard (130 atk, 2.8 atkspd) and Balmond (120 atk, 2.7 atkspd) have highest attack stats for jungle clearing. |
| **Assassin mobility** | Gusion (3.4 atkspd) and Saber (3.1 atkspd) have fastest attack speeds but lowest HP — glass cannon pattern. |

---

## Future Hero Expansion

To add a new hero:

1. Place PNG in `assets/sprites/heroes/newhero/idle.png`
2. Add object to `HEROES` array in `js/config.js`
3. The hero button appears automatically on next page load
4. Spawn position defaults to (100, 360) near Blue Base

Example entry:
```js
{
  id: "atlas",
  name: "Atlas",
  role: "Tank",
  lane: "Roam",
  color: "#e91e63",
  sprite: "assets/sprites/heroes/atlas/",
  stats: { hp: 2800, atk: 90, spd: 2.5, range: 110 }
}
```

---

## Design Notes

- **Colors are intentional:** Each role has a distinct color for UI consistency (Marksman=yellow/orange, Tank=blue, Support=orange, Fighter=orange/purple, Assassin=red/dark, Mage=purple/green)
- **Stats are simplified:** Real MLBB has much deeper stats (physical/magic defense, cooldown, etc.). These are gameplay-feel values for a prototype.
- **No duplicate roles in same lane:** The 10 heroes cover all 6 roles with 2 marksmen and 2 mages sharing lanes — works because player skill > hero mirror.
- **Color-blind consideration:** Colors have sufficient contrast, but future improvement could add text labels or patterns alongside colors.