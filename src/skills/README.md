# Skills System

This folder contains the skills system for Fantasy3D.

## Files

- `skills.js` - Main skills system module

## Usage

```javascript
import { SkillsSystem, Skill } from './skills/skills.js';

// Create a skills system for a character
const skillsSystem = new SkillsSystem(character);

// Create a skill
const fireball = new Skill({
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a fireball at enemies',
    icon: 'fa-fire',
    cooldown: 5,
    manaCost: 20
});

// Add skill to slot 1
skillsSystem.addSkillToSlot(fireball, 1);

// Use skill from slot 1
skillsSystem.useSkill(1);
```

## Skill Slots

The game supports 6 skill slots (1-6) that can be activated with number keys.

## Future Features

- Skill cooldowns
- Skill levels and progression
- Skill trees
- Skill animations
- Skill effects

