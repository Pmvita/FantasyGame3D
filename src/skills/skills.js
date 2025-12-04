// Skills system
// This module will handle all skill-related functionality

export class SkillsSystem {
    constructor(character) {
        this.character = character;
        this.skills = [];
        this.skillSlots = new Map(); // Maps slot number (1-6) to skill
        this.maxSlots = 6;
    }

    // Add a skill to a specific slot
    addSkillToSlot(skill, slotNumber) {
        if (slotNumber < 1 || slotNumber > this.maxSlots) {
            console.error(`Invalid slot number: ${slotNumber}. Must be between 1 and ${this.maxSlots}`);
            return false;
        }

        this.skillSlots.set(slotNumber, skill);
        return true;
    }

    // Remove a skill from a slot
    removeSkillFromSlot(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.maxSlots) {
            return false;
        }

        this.skillSlots.delete(slotNumber);
        return true;
    }

    // Get skill in a specific slot
    getSkillInSlot(slotNumber) {
        return this.skillSlots.get(slotNumber) || null;
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

