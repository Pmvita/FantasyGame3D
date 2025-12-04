// Inventory system
// This module will handle all inventory-related functionality

export class InventorySystem {
    constructor(character) {
        this.character = character;
        this.items = [];
        this.maxSlots = 30; // 6 columns x 5 rows = 30 slots
        this.slots = new Array(this.maxSlots).fill(null);
    }

    // Add an item to the inventory
    addItem(item, quantity = 1) {
        // Check if item is stackable and already exists
        if (item.stackable) {
            const existingItem = this.items.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += quantity;
                this.updateInventoryDisplay();
                return true;
            }
        }

        // Find an empty slot
        const emptySlotIndex = this.slots.findIndex(slot => slot === null);
        if (emptySlotIndex === -1) {
            console.log('Inventory is full!');
            return false;
        }

        // Add item to inventory
        const inventoryItem = {
            ...item,
            quantity: quantity,
            slotIndex: emptySlotIndex
        };

        this.items.push(inventoryItem);
        this.slots[emptySlotIndex] = inventoryItem;
        this.updateInventoryDisplay();
        return true;
    }

    // Remove an item from the inventory
    removeItem(itemId, quantity = 1) {
        const itemIndex = this.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            return false;
        }

        const item = this.items[itemIndex];
        
        if (item.stackable && item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            // Remove item completely
            this.slots[item.slotIndex] = null;
            this.items.splice(itemIndex, 1);
        }

        this.updateInventoryDisplay();
        return true;
    }

    // Get item at a specific slot
    getItemAtSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) {
            return null;
        }
        return this.slots[slotIndex];
    }

    // Move item from one slot to another
    moveItem(fromSlot, toSlot) {
        if (fromSlot < 0 || fromSlot >= this.maxSlots || 
            toSlot < 0 || toSlot >= this.maxSlots) {
            return false;
        }

        const fromItem = this.slots[fromSlot];
        const toItem = this.slots[toSlot];

        // Swap items
        this.slots[fromSlot] = toItem;
        this.slots[toSlot] = fromItem;

        // Update slot indices
        if (fromItem) fromItem.slotIndex = toSlot;
        if (toItem) toItem.slotIndex = fromSlot;

        this.updateInventoryDisplay();
        return true;
    }

    // Get all items
    getAllItems() {
        return this.items;
    }

    // Check if inventory is full
    isFull() {
        return this.slots.every(slot => slot !== null);
    }

    // Get number of empty slots
    getEmptySlotCount() {
        return this.slots.filter(slot => slot === null).length;
    }

    // Update inventory display (called by UI)
    updateInventoryDisplay() {
        // This will be called by the UI system to update the display
        if (window.game && window.game.ui) {
            window.game.ui.updateInventoryDisplay();
        }
    }
}

// Item data structure
export class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name || 'Unnamed Item';
        this.description = data.description || '';
        this.icon = data.icon || 'fa-box'; // Font Awesome icon class
        this.type = data.type || 'misc'; // weapon, armor, consumable, misc
        this.rarity = data.rarity || 'common'; // common, uncommon, rare, epic, legendary
        this.stackable = data.stackable || false;
        this.maxStack = data.maxStack || 1;
        this.value = data.value || 0; // Gold value
        this.quantity = data.quantity || 1;
    }
}

