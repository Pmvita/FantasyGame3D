// Equipment scaling configuration
// This file allows manual adjustment of equipment scale factors
// Use this when automatic scaling doesn't work properly due to model export differences

export const EQUIPMENT_SCALE_OVERRIDES = {
    // Format: className_equipmentType_gender: scaleFactor
    // Scale factors are applied AFTER automatic normalization
    // A value of 1.0 means use automatic scaling
    // Values < 1.0 make equipment smaller, > 1.0 make it larger
    
    // Warrior equipment
    'warrior_armour_male': 0.8,      // Armour too big, reducing significantly
    'warrior_armour_female': 0.8,
    'warrior_helmet_male': 0.25,     // Helmet way too big, making it much smaller
    'warrior_helmet_female': 0.25,
    'warrior_boots_male': 1.0,
    'warrior_boots_female': 1.0,
    'warrior_cape_male': 1.0,
    'warrior_cape_female': 1.0,
    'warrior_weapon_male': 1.0,
    'warrior_weapon_female': 1.0,
    
    // Add other classes as needed
    // 'mage_armour_male': 1.0,
    // etc...
};

/**
 * Get the scale override for a specific equipment item
 * @param {string} className - The class name (e.g., 'warrior')
 * @param {string} equipmentType - The equipment type (e.g., 'armour')
 * @param {string} gender - The gender ('male' or 'female')
 * @returns {number} - The scale override factor (defaults to 1.0 if not found)
 */
export function getEquipmentScaleOverride(className, equipmentType, gender = 'male') {
    const key = `${className}_${equipmentType.toLowerCase()}_${gender.toLowerCase()}`;
    return EQUIPMENT_SCALE_OVERRIDES[key] || 1.0;
}
