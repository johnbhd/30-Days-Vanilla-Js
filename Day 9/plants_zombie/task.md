# Task: UI/Visual Polish — Plants vs Zombies (existing game)

**Status:** Approved design — implemented and verified (all automated tests pass; visual checks done via rendered mock, since the desktop browser is not connected for live screenshots).
**Type:** UI/UX only. No gameplay changes. Health stays strictly `1 = alive`, `0 = game over`.

---

## 1. Current-state inspection findings

Working tree clean at commit `91d9725`. Game served at `http://localhost:8765`.

### File responsibilities

| File | Responsibility |
|---|---|
| `index.html` | HUD (sun/health/level), seed selection, canvas, credits footer |
| `style.css` | All styling: container, HUD, seed slots, responsive |
| `game.js` | Canvas rendering + all game logic (grid/lawn, plants, zombies, peas, suns, game over) |
| `images/` | Sprites: `sunflower.png`, `peashooter_cut.png`, `zombie.png` (OpenGameArt, credited) |

### Sprite padding measurements (cause of "tiny zombie")

| Sprite | Asset size | Visible content | Notes |
|---|---|---|---|
| Zombie (row 0, walk frames 4–11) | 128×128 tile | 47w × 56h px (44% of tile) | feet at tile-y 102, content center x = 61 |
| Zombie (bite frames 16–19) | 128×128 | 45w × 52h | feet at tile-y ~101 (same foot line) |
| Sunflower | 244×525 | 174×481 (bbox 31–204 × 27–507) | minor padding |
| Peashooter | 575×584 | full-bleed | none |

**Why zombies look tiny today:** tile drawn at `CELL_H × 1.25 = 100px` → visible body = 56/128 × 100 ≈ **44px in an 80px lane (~55%)**.

**Brown rectangle on the right:** `.game-area` has background `#8b6914`; canvas renders at fixed 600px, so on wider screens ~100px of bare brown shows beside the lawn.

**Collision safety:** pure-canvas game. Hits, eating, and home boundary all use game-space coordinates (`z.x`, grid math), independent of draw size → enlarging sprites changes **zero** gameplay.

---

## 2. Design / implementation plan (by priority)

### P1 — Make zombies much larger
- Anchor by sprite **content**, not tile: draw tile at `CELL_H × 1.46` (≈117px).
- Position: feet (tile-y `102/128`) at lane bottom − 4px; visible body center (`61/128` horizontally) centered on `z.x`.
- Result: body ≈ **64px ≈ 80% of lane height** (target 70–85%), inside lane, no clipping, aspect ratio preserved.
- Hardcode measured constants in `game.js` (no runtime image analysis, no asset edits).

### P2 — Lawn redesign (canvas `drawGrid()`)
- 5 lanes alternating `#69B83D` / `#589F30` (lane readability preserved).
- Very subtle column shading for placement readability; remove hard grid boxes.
- Left edge: hedge/soil home boundary strip.
- Right edge: ~28px dirt gradient strip (`#986A17 → #795414`) as zombie entrance (zombies spawn at x=630, walk out of it). No new gameplay there.

### P3 — Container / remove white space
- Canvas → `width: 100%; aspect-ratio: 3/2` (no more brown gap).
- Whole game = one wood-framed panel (`#60421F` border + shadow) on dark garden backdrop; HUD, seed bank, lawn stacked flush.
- Credits footer kept, small, inside frame.

### P4 — Seed cards (seed packets)
- Restructure markup: sprite thumbnail (existing PNGs) + name + "☀ cost".
- States: hover lift, golden **selected** state, desaturated + `not-allowed` cursor when sun < cost.
- One tiny supporting JS line in `updateUI()` to toggle the unaffordable class. **No purchasing/mechanics change.**

### P5 — HUD
- Dark garden-green bar with wood trim, cream (`#F5E8C8`) text: `☀ SUN n  ♥ HEALTH n  LEVEL n`.
- **Single heart, single digit — never hearts row / HP bar.** Health display reads `1` or `0` only.

### P6 — Zombie entrance (covered in P2 right strip)

### P7 — Small details
- Peas: ~13px, radial gradient + dark outline + soft shadow (no damage/speed change).
- Suns: subtle glow + pointer cursor on hover (generation/value unchanged).
- Zombie HP bar: above head, follows zombie, 40×5px, dark rounded bg, red fill, thin border, doesn't cover sprite.
- Game Over: restyle canvas overlay as wood panel — "GAME OVER / The lawn was lost / Click to try Again". Uses existing click-to-restart; logic untouched.
- DPR-aware canvas for crisp tablet sprites (backing store × devicePixelRatio; matching 1-line click-mapping update).

### Responsive
- `max-width` panel, `clamp()` sizing, seed bank horizontal scroll on narrow screens, CSS-only (no JS viewport math). Landscape tablet is the priority viewport.

### Visual depth / animation
- Subtle gradients, inset shadows, `filter: drop-shadow(...)` on sprites, card hover `translateY(-2px)`.
- Lightweight CSS only; respect `prefers-reduced-motion`.

---

## 3. Files to modify

1. **`style.css`** — container frame, HUD, seed packets, colors, responsive, reduced-motion.
2. **`index.html`** — HUD markup, seed-card markup (with images), credits preserved.
3. **`game.js`** — rendering only: zombie/plant draw anchoring constants, `drawGrid()` redesign, pea/sun visuals, DPR setup + click-map line, affordability class toggle in `updateUI()`.

## 4. Strictly NOT changed

- Health system: starts at **1**, reaching 0 = **immediate Game Over** (logic untouched).
- Sun generation, plant costs (50 / 100), zombie HP, damage, attack interval, projectile speed, zombie speed, spawn rules, level progression, placement rules, win/loss logic.
- No frameworks, engines, UI libraries, or dependencies. No official PvZ assets. Existing sprites and credits kept.

---

## 5. Acceptance criteria

- [x] Health starts at exactly 1; UI shows `HEALTH 1`; no multi-point health implied.
- [x] Health 0 still immediately triggers Game Over (existing logic).
- [x] Zombies much larger: ~70–85% of lane height; not stretched/clipped; stay in lane.
- [x] Zombie HP bars aligned above head, follow movement.
- [x] Plants consistent (~65–80% lane height), centered, bottom-anchored, padding compensated.
- [x] Lawn reads as continuous lawn with 5 clear lanes (not a spreadsheet).
- [x] Seed cards look like game seed packets; cost visible; selected obvious; unaffordable state shown.
- [x] HUD feels game-like; sun/health/level readable.
- [x] No excessive white space; no brown gap beside canvas.
- [x] Right side looks like an intentional dirt zombie entrance.
- [x] Peas and suns clearly visible.
- [ ] Desktop + landscape tablet layouts look good; no page overflow. (CSS reviewed; live-browser check pending — desktop browser not connected)
- [x] All existing mechanics still work (placement, shooting, collision, death, sun economy, levels, restart).
- [x] No new dependencies; no official PvZ artwork copied.

## 6. Required testing (after implementation)

1. **HUD** — sun/health/level update correctly; health shows 1.
2. **Plant selection** — selected state visible for both cards.
3. **Placement** — plant centered, correct size.
4. **Sun spend** — counter updates; unaffordable state appears when broke.
5. **Zombie spawn** — significantly larger, inside its lane.
6. **Shooting** — pea aligned, hits register.
7. **Zombie HP bar** — shrinks with damage.
8. **Zombie death** — removal + sun reward still work.
9. **Player failure** — zombie reaches home → Health 1 → 0 → **GAME OVER** immediately.
10. **Restart** — returns to initial state with Health 1.

Verification tooling available: headless Node test suite (22 assertions, procedural + sprite modes), sprite-scale render previews via pngjs, HTTP smoke checks.
