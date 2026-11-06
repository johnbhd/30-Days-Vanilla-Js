# Hero Skills and Burst Damage Buffs (Gusion, Layla, Miya, Angela, Pharsa, Nana)

**Date:** 11-06-2026  
**Type:** Feature / Balance  
**Status:** Complete  

---

## 1. Summary & Motivation
The user requested substantial damage buffs and impactful burst mechanics for specific champions:
* **Gusion:** Significant blade damage boost on dagger throw (Q), dagger fan shotgun burst (W), and ultimate storm (R).
* **Layla:** High-range sniper burst with enhanced Malefic Bomb (Q), Void Projectile (W), and high-caliber Destruction Rush (R) piercing beam.
* **Miya:** Rapid-fire split arrows (Q), Moon Eclipse burst rain (W), and maximum attack speed surge & damage buff (R).
* **Angela:** Punchier magical poke and heal on Love Waves (Q), Puppet String magical burst root (W), and massive Heartguard shield & magic ATK buff (R).
* **Pharsa:** Devastating magical artillery burst on Curse of Crow (Q), Energy Impact laser (W), and massive 4-strike Air Strike (R) barrage.
* **Nana:** Heavy magical burst on Magic Boomerang (Q), Molina Smooch morph burst (W), and 3-stage giant paw slam Molina Blitz (R).

Both Player skill casting (`SkillManager`) and Bot AI skill combat (`BotHero`) are upgraded with hero-specific kits, enhanced visual/audio feedback, and balanced level scaling.

## 2. Files Modified / Created
* `Day 9/ml/js/skills.js` — Buffed damage values, scaling multipliers, projectile speeds, CC triggers, and AOE radii for Gusion, Layla, Miya, Angela, Pharsa, and Nana; exported `HERO_SKILLS` and `SkillManager`.
* `Day 9/ml/js/hero.js` — Connected `skillManager.activeBuffs.attackSpeedBoost` and `bonusDamage` directly into hero basic attack speed and projectile/melee damage calculations.
* `Day 9/ml/js/bots.js` — Implemented hero-specific `initHeroSkills(heroData)` so bot champions cast their true abilities with enhanced magical and burst damage, floating skill combat texts, and CC application; exported `BotHero`.
* `Day 9/ml/docs/context/11-06-26-hero-skills-and-burst-damage-buffs.md` — Context documentation.

## 3. Technical Implementation Details
* **Gusion:**
  - `Shadowblade` (W): 5 daggers buffed from 95 to 210 base damage each (up to 1050+ point-blank shotgun burst).
  - `Blade Barrage` (R): 12 blades buffed from 120 to 280 base damage each (up to 3360 storm burst), dashes 120px and resets Q/W cooldowns.
  - `Sword Spike` (Q): high-speed dagger teleport slash dealing 320 damage.
* **Layla:**
  - `Malefic Bomb` (Q): laser damage buffed from 220 to 360, range 480px.
  - `Void Projectile` (W): AOE blast buffed from 190 to 310, radius 65px.
  - `Destruction Rush` (R): ultimate cannon laser buffed from 520 to 880, range 920px.
* **Miya:**
  - `Moon Arrow` (Q): 3 split arrows buffed from 180 to 260 base damage each.
  - `Arrow of Eclipse` (W): moonlight rain buffed from 190 to 340, radius 70px.
  - `Hidden Moonlight` (R): surge buffed to +120% attack speed surge and +70 bonus attack burst damage.
* **Angela:**
  - `Love Waves` (Q): magic damage buffed from 180 to 290, heal buffed from 150 to 240 with green floating text.
  - `Puppet String` (W): magic burst buffed to 340 with 1.2s immobilization/stun CC.
  - `Heartguard` (R): shield buffed to 1100 HP, bonus magic damage +75.
* **Pharsa:**
  - `Curse of Crow` (Q): magic burst buffed from 190 to 320 with mark.
  - `Energy Impact` (W): laser beam buffed from 220 to 420 magic damage.
  - `Air Strike` (R): 4 consecutive meteor bombardments buffed from 260 to 460 damage each (total 1840 magic burst).
* **Nana:**
  - `Magic Boomerang` (Q): outbound and return damage buffed from 175 to 320 each.
  - `Molina Smooch` (W): morph trap magic damage buffed to 310 with 1.2s morph stun.
  - `Molina Blitz` (R): 3 consecutive paw ground slams buffed from 260 to 440 damage each (total 1320 magic burst) with stun.

## 4. Verification & Testing
* Syntax check on all JavaScript files via `node -c "Day 9/ml/js"/*.js` passed without errors.
* Unit testing of player and bot skill executions verified 100% of damage values, cooldown resets, projectile counts, AOE sizes, and status buffs in `test_hero_skills_burst.js`.
* Regression testing of custom slot selection passed.

## 5. Next Steps / Dependencies
* Deployed and ready for user testing.
