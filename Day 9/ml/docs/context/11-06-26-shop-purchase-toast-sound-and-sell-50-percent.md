# Context: Shop Purchase Toast, Audio Synthesis, and 50% Sell Value Refund

## 1. Overview & Requirements
- **Toast Notification on Item Purchase:** Display a floating toast banner when an item is successfully purchased, showing the item's icon, name, and gold cost.
- **Sound Effect on Item Purchase:** Play an audio chime (`sound.playBuyItem()`) on successful purchase using the Web Audio API procedural synthesizer.
- **Item Removal / Sell Value 50% Gold:**
  - When an equipped item is removed/sold, refund **50% of its original gold cost** (`Math.floor(item.cost * 0.50)`).
  - Previously refunded 70% (`item.cost * 0.70`).
  - Added sell sound (`sound.playSellItem()`) and sell toast notification.
  - Added equipped inventory display with quick-sell buttons directly inside the Equipment Shop modal, in addition to the main HUD builds tray.

## 2. Architectural Design & Changes
- `Day 9/ml/js/sound.js`:
  - Added `playBuyItem()`: Ascending 4-tone arpeggio (C6 $\rightarrow$ E6 $\rightarrow$ G6 $\rightarrow$ C7) with metallic coin clink.
  - Added `playSellItem()`: Descending 2-tone coin refund chime (G6 $\rightarrow$ C6).
- `Day 9/ml/js/items.js`:
  - Updated `ItemShop.sellItem()` refund calculation to `Math.floor(item.cost * 0.50)` (50% value).
  - Updated shop UI sync to populate both the main HUD inventory tray and the modal's equipped items tray with 50% refund tooltips.
- `Day 9/ml/js/main.js`:
  - Added `showToast(message, iconHtml, borderColor)` with auto-fade and stack handling.
  - Triggered `playBuyItem()` and toast on purchase.
  - Triggered `playSellItem()` and toast on item sale.
- `Day 9/ml/index.html`:
  - Added `#gameToastContainer`.
  - Added `#shopInventorySection` inside `#shopOverlay` for selling items directly inside the shop.
  - Updated shop footer text to reflect 50% sell-back value.
- `Day 9/ml/css/style.css`:
  - Added `.game-toast-container`, `.game-toast`, and animations (`.show`, `.fade-out`).
  - Added `.shop-inventory-section` and slot styles for selling items in the shop modal.
