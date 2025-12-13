# WoW-Style Character Creation Structure

This document outlines the new WoW-style character creation layout to be implemented.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Gender: ♂ ♀]  [Character Type: New Level 1 | Class Trial] │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│  RACE    │     CHARACTER MODEL          │     CLASS         │
│  (Left)  │     (Center - Large)         │     (Right)       │
│          │                              │                   │
│ Alliance │                              │  Warrior          │
│  Human   │     [3D Character View]      │  Paladin          │
│  Elf     │                              │  Hunter           │
│  Dwarf   │                              │  Rogue            │
│          │                              │  Priest           │
│ Horde    │                              │  Shaman           │
│  Demon   │                              │  Mage             │
│          │                              │  Warlock          │
│          │                              │  Monk             │
│          │                              │  Druid            │
│          │                              │                   │
├──────────┴──────────────────────────────┴───────────────────┤
│  [Back]  [◄ Customize ►]  [More Info]                       │
└─────────────────────────────────────────────────────────────┘
```

## Components

1. **Top Controls**
   - Gender selector (top left): Male/Female icons
   - Character Type (top center): "New Level 1" / "Class Trial Level 110"

2. **Left Panel - Race Selection**
   - Alliance faction (blue background)
     - Human
     - Elf
     - Dwarf
   - Horde faction (red background)
     - Demon

3. **Center - Character Model**
   - Large 3D character preview
   - Spotlight/vignette effect
   - Rotatable/zoomable

4. **Right Panel - Class Selection**
   - List of classes with icons
   - Each class shows icon and name

5. **Bottom Buttons**
   - Back (left)
   - Customize (center, with left/right arrows)
   - More Info (right)

6. **Customization Panel** (hidden by default, shown when Customize clicked)
   - Face & Hair
   - Body & Appearance
   - Character Name
   - Stats (if applicable)

