# Inventory System

This folder contains the inventory system for the Fantasy Game 3D.

## Files

- `inventory.js` - Main inventory system module

## Usage

```javascript
import { InventorySystem, Item } from './inventory/inventory.js';

// Create an inventory system for a character
const inventory = new InventorySystem(character);

// Create an item
const healthPotion = new Item({
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 50 HP',
    icon: 'fa-flask',
    type: 'consumable',
    stackable: true,
    maxStack: 99,
    value: 10
});

// Add item to inventory
inventory.addItem(healthPotion, 5);

// Remove item from inventory
inventory.removeItem('health_potion', 2);
```

## Inventory Grid

The inventory has 30 slots (6 columns x 5 rows) displayed in a grid.

## Item Types

- `weapon` - Weapons that can be equipped
- `armor` - Armor pieces that can be equipped
- `consumable` - Items that can be used (potions, food, etc.)
- `misc` - Miscellaneous items

## Item Rarity

- `common` - Common items (gray)
- `uncommon` - Uncommon items (green)
- `rare` - Rare items (blue)
- `epic` - Epic items (purple)
- `legendary` - Legendary items (orange)

## Future Features

- Item tooltips
- Drag and drop
- Item sorting
- Item filtering
- Equipment slots
- Item comparison
- Item sets

