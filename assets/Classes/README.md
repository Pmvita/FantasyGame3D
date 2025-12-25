# Class System - Fantasy3D

This directory contains the character class system organized by base class and progression ranks.

## Base Classes

The game features three foundational character classes, each with distinct roles and playstyles:

### 🗡️ Warrior
**Role:** Physical Combat Specialist  
**Strengths:** High health, frontline presence, versatile melee combat  
**Description:** Warriors are masters of physical combat, excelling in close-quarters fighting. They can specialize as tanks, damage dealers, or agile fighters depending on their advancement path.

### ⚡ Mage  
**Role:** Arcane Magic Specialist  
**Strengths:** Powerful elemental magic, ranged attacks, spell versatility  
**Description:** Mages harness the power of arcane and elemental forces. They specialize in ranged combat and area-of-effect damage, with paths branching into specific elemental schools or unique magical disciplines.

### ✨ Healer
**Role:** Support and Restoration Specialist  
**Strengths:** Healing abilities, buffs, support magic, group utility  
**Description:** Healers are essential support classes, keeping allies alive and enhancing their capabilities. They can specialize in pure healing, defensive support, or even hybrid offensive/support roles.

## Class Progression System

Classes progress through six ranks, starting from the base class and advancing through specialized paths:

### C-Rank (Base Class)
The starting point for all characters. These are the fundamental classes:
- **Warrior** - Basic melee combatant
- **Mage** - Basic magic user
- **Healer** - Basic support class

### B-Rank (First Specialization)
Early branching paths that define initial specialization:
- **Warrior** → Knight, Berserker, Paladin, Thief, Ranger
- **Mage** → Battle Mage, Enchanter
- **Healer** → Cleric, Bard

### A-Rank (Advanced Specialization)
More refined specializations building on B-Rank:
- **Warrior** → Arch Knight, Hunter, Warlord, Gladiator
- **Mage** → Wizard, Witch, Warlock, Elemental Mages (Fire, Water, Wind, Earth, Light, Dark), Chronomancer
- **Healer** → Priest

### S-Rank (Elite Classes)
Highly specialized elite classes:
- **Warrior** → Assassin, Demon Hunter, Ninja, Samurai
- **Mage** → Elemental Arch Mages (Fire, Water, Wind, Earth, Light, Dark)
- **Healer** → Divine Priest, Necromancer, Potion Master

### SS-Rank (Master Classes)
Master-level classes with unique abilities:
- **Warrior** → Death Knight, Holy Knight, Sword Master, Sword Saint
- **Mage** → Card Caster, Illusionist, Shaman, Spell Master, Sword Caster, Vampire
- **Healer** → Angel, Demon, Druid, Monk

### SSS-Rank (Legendary Classes)
The ultimate legendary classes, representing the pinnacle of each path:
- **Warrior** → Magic Swordsman
- **Mage** → Akashic Caster, Omni Caster, Spell Breaker
- **Healer** → Arch Angel, Arch Demon, Sage, Summoner

## Directory Structure

```
Classes/
├── Warrior/
│   ├── C-Rank/
│   │   └── Warrior/
│   ├── B-Rank/
│   │   ├── Berserker/
│   │   ├── Knight/
│   │   ├── Paladin/
│   │   └── Thief/
│   ├── A-Rank/
│   │   ├── Arch Knight/
│   │   ├── Hunter/
│   │   └── Warlord/
│   ├── S-Rank/
│   │   ├── Assassin/
│   │   ├── Demon Hunter/
│   │   ├── Ninja/
│   │   └── Samurai/
│   ├── SS-Rank/
│   │   ├── Death Knight/
│   │   ├── Holy Knight/
│   │   ├── Sword Master/
│   │   └── Sword Saint/
│   └── SSS-Rank/
│       └── Magic Swordsman/
│
├── Mage/
│   ├── C-Rank/
│   │   └── Mage/
│   ├── B-Rank/
│   │   └── Battle Mage/
│   ├── A-Rank/
│   │   ├── Dark Mage/
│   │   ├── Earth Mage/
│   │   ├── Fire Mage/
│   │   ├── Light Mage/
│   │   ├── Warlock/
│   │   ├── Water Mage/
│   │   ├── Wind Mage/
│   │   ├── Witch/
│   │   └── Wizard/
│   ├── S-Rank/
│   │   ├── Dark Arch Mage/
│   │   ├── Earth Arch Mage/
│   │   ├── Fire Arch Mage/
│   │   ├── Light Arch Mage/
│   │   ├── Water Arch Mage/
│   │   └── Wind Arch Mage/
│   ├── SS-Rank/
│   │   ├── Card Caster/
│   │   ├── Illusionist/
│   │   ├── Shaman/
│   │   ├── Spell Master/
│   │   ├── Sword Caster/
│   │   └── Vampire/
│   └── SSS-Rank/
│       ├── Akashic Caster/
│       ├── Omni Caster/
│       └── Spell Breaker/
│
└── Healer/
    ├── C-Rank/
    │   └── Healer/
    ├── B-Rank/
    │   └── Cleric/
    ├── A-Rank/
    │   └── Priest/
    ├── S-Rank/
    │   ├── Divine Priest/
    │   ├── Necromancer/
    │   └── Potion Master/
    ├── SS-Rank/
    │   ├── Angel/
    │   ├── Demon/
    │   ├── Druid/
    │   └── Monk/
    └── SSS-Rank/
        ├── Arch Angel/
        ├── Arch Demon/
        ├── Sage/
        └── Summoner/
```

## Progression Paths

### Warrior Path Example
```
C-Rank: Warrior
  ↓
B-Rank: Knight → A-Rank: Arch Knight → S-Rank: [Various] → SS-Rank: Holy Knight → SSS-Rank: [Legendary]
B-Rank: Berserker → A-Rank: [Various] → S-Rank: [Various] → SS-Rank: [Various] → SSS-Rank: Magic Swordsman
B-Rank: Paladin → A-Rank: [Various] → S-Rank: [Various] → SS-Rank: Holy Knight → SSS-Rank: [Legendary]
B-Rank: Thief → A-Rank: Hunter → S-Rank: Assassin/Ninja → SS-Rank: [Various] → SSS-Rank: [Legendary]
```

### Mage Path Example
```
C-Rank: Mage
  ↓
B-Rank: Battle Mage
  ↓
A-Rank: Fire Mage → S-Rank: Fire Arch Mage → SS-Rank: [Various] → SSS-Rank: Omni Caster/Spell Breaker
A-Rank: Wizard → S-Rank: [Various] → SS-Rank: Spell Master → SSS-Rank: Akashic Caster
```

### Healer Path Example
```
C-Rank: Healer
  ↓
B-Rank: Cleric
  ↓
A-Rank: Priest → S-Rank: Divine Priest → SS-Rank: Angel → SSS-Rank: Arch Angel
A-Rank: Priest → S-Rank: Necromancer → SS-Rank: Demon → SSS-Rank: Arch Demon
```

## Class Details

Each class has a detailed README file containing:
- **Role:** The class's primary function in combat
- **Rank:** The progression tier of the class
- **Base Class:** The foundational class this specialization derives from
- **Description:** Comprehensive overview of the class's playstyle and capabilities
- **Skills:** Five core abilities unique to the class, each with:
  - Type (Damage, Heal, Buff, Debuff, etc.)
  - Mana Cost
  - Cooldown time
  - Detailed description of effects

## Additional MMORPG Classes Added

To enhance diversity and fill progression gaps, the following popular MMORPG classes have been added:
- **Ranger** (Warrior B-Rank): Ranged physical DPS with tracking abilities
- **Gladiator** (Warrior A-Rank): Arena specialist and duelist
- **Enchanter** (Mage B-Rank): Buff and debuff specialist
- **Chronomancer** (Mage A-Rank): Time magic specialist
- **Bard** (Healer B-Rank): Musical support and buffer

## Notes

- Each class directory contains a README.md file with full class description and 5 main skills
- Progression from one rank to another typically requires meeting level and quest requirements
- Some classes may have prerequisites or require specific achievements
- Each advancement unlocks new abilities, stats, and playstyles
- Skills are designed to be balanced and thematic to each class's role and identity

