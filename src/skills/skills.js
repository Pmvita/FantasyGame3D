// Skills system
// This module will handle all skill-related functionality

export class SkillsSystem {
    constructor(character) {
        this.character = character;
        this.skills = [];
        this.skillSlots = new Map(); // Maps slot number (1-0, where 0 = slot 10) to skill
        this.maxSlots = 10;
    }

    // Add a skill to a specific slot
    addSkillToSlot(skill, slotNumber) {
        // Convert 0 to 10 for internal storage
        const internalSlot = slotNumber === 0 ? 10 : slotNumber;
        if (slotNumber < 0 || slotNumber > 9 || (slotNumber !== 0 && slotNumber < 1)) {
            console.error(`Invalid slot number: ${slotNumber}. Must be between 1-9 or 0`);
            return false;
        }

        this.skillSlots.set(internalSlot, skill);
        return true;
    }

    // Remove a skill from a slot
    removeSkillFromSlot(slotNumber) {
        // Convert 0 to 10 for internal storage
        const internalSlot = slotNumber === 0 ? 10 : slotNumber;
        if (slotNumber < 0 || slotNumber > 9 || (slotNumber !== 0 && slotNumber < 1)) {
            return false;
        }

        this.skillSlots.delete(internalSlot);
        return true;
    }

    // Get skill in a specific slot
    getSkillInSlot(slotNumber) {
        // Convert 0 to 10 for internal storage
        const internalSlot = slotNumber === 0 ? 10 : slotNumber;
        return this.skillSlots.get(internalSlot) || null;
    }

    // Use a skill from a slot
    useSkill(slotNumber) {
        const skill = this.getSkillInSlot(slotNumber);
        if (!skill) {
            console.log(`No skill in slot ${slotNumber}`);
            return false;
        }

        // TODO: Implement skill usage logic
        console.log(`Using skill: ${skill.name} from slot ${slotNumber}`);
        return true;
    }

    // Get all skills
    getAllSkills() {
        return this.skills;
    }

    // Get all slotted skills
    getSlottedSkills() {
        return Array.from(this.skillSlots.entries());
    }
}

// Skill data structure
export class Skill {
    constructor(data) {
        this.id = data.id;
        this.name = data.name || 'Unnamed Skill';
        this.description = data.description || '';
        this.icon = data.icon || 'fa-star'; // Font Awesome icon class
        this.cooldown = data.cooldown || 0; // Cooldown in seconds
        this.manaCost = data.manaCost || 0;
        this.level = data.level || 1;
        this.maxLevel = data.maxLevel || 10;
    }
}

