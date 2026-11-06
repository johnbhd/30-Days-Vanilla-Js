# Custom Hero Selection for Teammates and Enemies

**Date:** 11-06-2026  
**Type:** Feature  
**Status:** Complete  

---

## 1. Summary & Motivation
The user requested the ability to select the champion not only for their own player character, but also for each teammate (Blue Ally Bot) and enemy (Red Enemy Bot) directly from the Hero Selection screen.

This allows players to customize full match lineups, test specific hero matchups, synergize team compositions (e.g. Tank + Marksman bot lane, Mage mid), or face particular enemy compositions across 1v1, 2v2, and 3v3 match formats.

## 2. Files Modified / Created
* `Day 9/ml/index.html` — Add slot editing status banner/instructions and active slot state.
* `Day 9/ml/css/style.css` — Add styles for clickable team slots, hover states, active slot indicators, and hero pick badges.
* `Day 9/ml/js/main.js` — Implement active slot tracking (`activeSlot = { team: 'blue'|'red', index: number }`), slot click listeners, hero assignment/swapping, and updated roster sync.

## 3. Technical Implementation Details
* `activeSlot`: Pointer object `{ team: "blue", index: 0 }` defaults to player slot (`team: "blue", index: 0`).
* Team slot elements are given `data-team` and `data-index` attributes with pointer cursors, hover feedback, and an `.active-slot` glow border.
* Clicking any slot on either Blue or Red team sets `activeSlot` and re-renders the hero grid/slots to highlight the currently selected slot and its assigned hero.
* Clicking any hero in `#heroGrid`:
  - Assigns that hero to the currently active slot.
  - If that hero is already assigned to another slot in the match, swaps the previous hero with the newly selected hero so that no slots are left without a hero and no hero is duplicated in the match.
  - If the active slot is the Player slot (`team: "blue", index: 0`), updates `chosenHeroData`, ability dock previews, and hero UI badges.
  - Automatically advances to the next slot (optional or smooth feedback) or keeps the active slot highlighted.
* Match Start: Spawns the player with their chosen hero and spawns ally bots and enemy bots with the exact custom heroes selected for their respective slots.

## 4. Verification & Testing
* Automated unit tests executed via `scratch/test_custom_slot_selection.js`:
  - Verified clicking player slot activates it and changes player hero.
  - Verified clicking ally bot slot activates it and allows selecting ally hero.
  - Verified clicking enemy bot slot activates it and allows selecting enemy hero.
  - Verified duplicate swapping works without error across 1v1, 2v2, and 3v3 modes.
  - Verified starting the match spawns the exact selected heroes for allies and enemies.
* Verified syntax check with `node -c` on all 15 JavaScript files passed with 0 errors.

## 5. Next Steps / Dependencies
* Ensure full responsiveness on mobile portrait and landscape.
