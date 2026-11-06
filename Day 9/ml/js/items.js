/**
 * Item Shop & 6-Slot Inventory System
 * Phase 3 implementation - MLBB-inspired item catalog, purchasing, and stat recalculation
 */

const ITEM_CATALOG = [
  {
    id: "swift_boots",
    name: "Swift Boots",
    cost: 500,
    icon: '<i class="fa-solid fa-shoe-prints" style="color: #68d391;"></i>',
    stats: { spd: 0.25 },
    desc: "+25% Movement Speed"
  },
  {
    id: "blade_of_despair",
    name: "Blade of Despair",
    cost: 1200,
    icon: '<i class="fa-solid fa-khanda" style="color: #63b3ed;"></i>',
    stats: { atk: 55 },
    desc: "+55 Attack Damage"
  },
  {
    id: "athenas_shield",
    name: "Athena's Shield",
    cost: 850,
    icon: '<i class="fa-solid fa-shield-halved" style="color: #f6ad55;"></i>',
    stats: { hp: 450 },
    desc: "+450 Max HP"
  },
  {
    id: "bloodlust_axe",
    name: "Bloodlust Axe",
    cost: 950,
    icon: '<i class="fa-solid fa-droplet" style="color: #fc8181;"></i>',
    stats: { atk: 25, lifesteal: 0.20 },
    desc: "+25 Attack Damage, +20% Lifesteal"
  },
  {
    id: "holy_crystal",
    name: "Holy Crystal",
    cost: 1100,
    icon: '<i class="fa-solid fa-gem" style="color: #b794f4;"></i>',
    stats: { abilityPower: 60 },
    desc: "+60 Ability Power"
  },
  {
    id: "immortality",
    name: "Immortality",
    cost: 1400,
    icon: '<i class="fa-solid fa-crown" style="color: #f6e05e;"></i>',
    stats: { hp: 400, revive: true },
    desc: "+400 Max HP, Resurrects once with 35% HP"
  }
];

class ItemShop {
  constructor() {
    this.inventory = []; // Max 6 items
    this.maxSlots = 6;
    this.hasUsedRevive = false;
  }

  buyItem(itemId, hero, gameStats, combatTexts) {
    if (this.inventory.length >= this.maxSlots) {
      if (combatTexts) {
        combatTexts.push({ x: hero.x, y: hero.y - 25, text: "INVENTORY FULL!", color: "#e74c3c", life: 1, maxLife: 1 });
      }
      return false;
    }

    const item = ITEM_CATALOG.find(i => i.id === itemId);
    if (!item) return false;

    if (gameStats.gold < item.cost) {
      if (combatTexts) {
        combatTexts.push({ x: hero.x, y: hero.y - 25, text: "NEED MORE GOLD!", color: "#e74c3c", life: 1, maxLife: 1 });
      }
      return false;
    }

    // Deduct gold & equip
    gameStats.gold -= item.cost;
    this.inventory.push({ ...item, uid: Date.now() + Math.random() });
    this.recalculateHeroStats(hero);

    if (combatTexts) {
      combatTexts.push({ x: hero.x, y: hero.y - 25, text: `BOUGHT ${item.name.toUpperCase()}!`, color: "#4ecca3", life: 1.2, maxLife: 1.2 });
    }

    this.updateShopUI(gameStats);
    return true;
  }

  sellItem(slotIndex, hero, gameStats, combatTexts) {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return false;

    const item = this.inventory[slotIndex];
    // Minus 50% gold value (50% refund)
    const refund = Math.floor(item.cost * 0.50);
    gameStats.gold += refund;

    this.inventory.splice(slotIndex, 1);
    this.recalculateHeroStats(hero);

    if (combatTexts && hero) {
      combatTexts.push({
        x: hero.x,
        y: hero.y - 25,
        text: `SOLD ${item.name.toUpperCase()} (+${refund}g)!`,
        color: "#ffd700",
        life: 1.2,
        maxLife: 1.2
      });
    }

    this.updateShopUI(gameStats);
    return true;
  }

  recalculateHeroStats(hero) {
    if (!hero) return;

    // Reset to base stats
    let bonusHp = 0;
    let bonusAtk = 0;
    let bonusSpd = 0;

    this.inventory.forEach(item => {
      if (item.stats.hp) bonusHp += item.stats.hp;
      if (item.stats.atk) bonusAtk += item.stats.atk;
      if (item.stats.spd) bonusSpd += item.stats.spd;
    });

    const oldMaxHp = hero.maxHp;
    hero.maxHp = hero.stats.hp + bonusHp;
    if (hero.maxHp > oldMaxHp) {
      hero.hp += (hero.maxHp - oldMaxHp);
    }
    hero.attackDamage = (hero.stats.atk || 100) + bonusAtk;
    hero.speed = (hero.stats.spd * 45) * (1 + bonusSpd);
  }

  updateShopUI(gameStats) {
    // 1. Update gold display on both HUD and Shop Modal
    const goldDisplay = document.getElementById("playerGoldDisplay");
    if (goldDisplay) {
      goldDisplay.textContent = `${gameStats.gold || 0}g`;
    }
    const shopGold = document.getElementById("shopGoldText");
    if (shopGold) {
      shopGold.textContent = `${gameStats.gold || 0}g`;
    }

    // 2. Update HUD inventory slots
    for (let i = 0; i < 6; i++) {
      const slotEl = document.getElementById(`invSlot${i}`);
      if (slotEl) {
        if (i < this.inventory.length) {
          const item = this.inventory[i];
          const refund = Math.floor(item.cost * 0.50);
          slotEl.innerHTML = `<span title="${item.name}: ${item.desc} (Click to sell: +${refund}g)">${item.icon}</span>`;
          slotEl.className = "inv-slot filled";
        } else {
          slotEl.innerHTML = "";
          slotEl.className = "inv-slot empty";
          slotEl.removeAttribute("title");
        }
      }
    }

    // 3. Update shop modal equipped items tray if present
    const shopInvCount = document.getElementById("shopInvCount");
    if (shopInvCount) {
      shopInvCount.textContent = `${this.inventory.length}/${this.maxSlots} Slots`;
    }

    for (let i = 0; i < 6; i++) {
      const shopSlotEl = document.getElementById(`shopInvSlot${i}`);
      if (shopSlotEl) {
        if (i < this.inventory.length) {
          const item = this.inventory[i];
          const refund = Math.floor(item.cost * 0.50);
          shopSlotEl.innerHTML = `
            <div class="shop-inv-icon">${item.icon}</div>
            <div class="shop-inv-meta">
              <span class="shop-inv-name">${item.name}</span>
              <span class="shop-inv-refund"><i class="fa-solid fa-coins"></i> +${refund}g <span class="sell-loss-tag">(-50%)</span></span>
            </div>
            <button class="shop-inv-sell-btn" data-slot="${i}" title="Sell for ${refund}g (-50%)"><i class="fa-solid fa-trash-can"></i> Sell</button>
          `;
          shopSlotEl.className = "shop-inv-item filled";
        } else {
          shopSlotEl.innerHTML = `<span class="empty-slot-label">Empty Slot ${i + 1}</span>`;
          shopSlotEl.className = "shop-inv-item empty";
        }
      }
    }
  }
}
