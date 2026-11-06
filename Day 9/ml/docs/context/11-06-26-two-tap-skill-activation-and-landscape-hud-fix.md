# Context: Two-Tap Skill Activation System & Landscape Mobile HUD Fix

## 1. Overview & Requirements
- **Feature:** Implement the "Two-Tap / Aim & Confirm" Casting System universally across all responsive viewports (Desktop & Mobile):
  1. **Tap First:** Clicking/tapping a skill button (Q/W/E/R) or pressing the hotkey arms the skill, displays an armed pulsing glow on the UI button, and displays an on-canvas range circle and directional/AOE reticle around the hero.
  2. **Tap Second:** Clicking/tapping the screen (canvas) directs and fires the skill at that exact target location, without causing the hero to walk to that spot.
  3. **Tap Again to Cancel:** Tapping the armed skill button again (or pressing the hotkey again, or pressing Escape) disarms/cancels the skill cleanly with 0 cooldown and no skill cast.
  4. **Rule 4 (Self-Buffs & Instant Skills):** Non-directional self-buffs, heals, self-shields, and point-blank AOEs (Miya E/R, Balmond E, Angela E/R, Tigreal E, Saber Q, Alucard W) activate instantly on the first tap without requiring an armed state or second tap.
- **Bug Fix:** Fix the match status Time / Wave HUD card disappearing on landscape mobile:
  - In landscape mobile with `object-fit: cover`, wide screen aspect ratios cause vertical cropping (`cropY = (GAME.CANVAS_HEIGHT * scale - rect.height) / 2 / scale`).
  - Previously, `visibleTop` was not computed in `renderer.js` when `rectAspect > canvasAspect`, leaving `hudY = 14;` placed in the cropped zone (~64px off the top of the mobile screen).
  - Computing `visibleTop = cropY;` and setting `hudY = visibleTop + 14;` restores full visibility on landscape mobile.

## 2. Architectural Design & Changes
- `Day 9/ml/js/skills.js`:
  - Added `range` and `indicator` (`line`, `circle_aoe`, `dash`, `target`, `cone`) metadata to `HERO_SKILLS`.
  - Added `isInstantSkill(heroId, slot)` to detect self-buffs and instant PBAOEs.
  - Added `getSkillConfig(heroId, slot)` for fast retrieval.
- `Day 9/ml/js/input.js`:
  - Added `Input.onTap(worldX, worldY)` intercept callback to allow armed skill firing while suppressing default movement commands.
- `Day 9/ml/js/renderer.js`:
  - Added landscape vertical crop calculation in `renderUI()` (`visibleTop = cropY; hudY = visibleTop + 14;`).
  - Added `renderSkillAimIndicator(hero, camera, skillManager, slot, input)` for rendering range circles, dash guides, trajectory lines, and AOE ground reticles.
- `Day 9/ml/js/main.js`:
  - Managed `armedSkillSlot` state.
  - Added `handleSkillActivation(slot)` and `disarmSkill(feedback)`.
  - Connected `Input.onTap` to fire armed skills and disarm.
  - Updated keyboard listeners (Q/W/E/R toggle arming, Escape cancels).
- `Day 9/ml/css/style.css`:
  - Added `.skill-circle-btn.armed` with animated gold pulsing border and scale transform.
