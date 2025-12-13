# Fallback Character System

## Overview

When 3D model files are not available in the `Race/Gender/FullSet.glb` structure, the game automatically generates coded geometric fallback characters for all race/gender combinations.

## Supported Combinations

The fallback system supports all 8 race/gender combinations:

- **Human Male** - Balanced proportions, standard features
- **Human Female** - Narrower shoulders, wider hips, varied hair styles
- **Elf Male** - Tall, slender, pointed ears
- **Elf Female** - Taller, more graceful, pointed ears
- **Dwarf Male** - Stocky build, broad shoulders, beard
- **Dwarf Female** - Shorter, sturdy, optional beard based on facial features
- **Demon Male** - Tall, muscular, horns, reddish skin tint
- **Demon Female** - Tall, horns (slightly smaller), reddish skin tint

## Features

### Gender-Specific Differences

- **Body Proportions**: 
  - Females: Narrower shoulders, wider hips, slimmer arms/legs
  - Males: Broader shoulders, narrower hips, thicker arms/legs

- **Hair Styles** (0-9 variations):
  - Style 0: Short hair
  - Style 1: Medium length
  - Style 2: Long hair (more detailed for females)
  - Style 3: Ponytail (female) or Spiky (male)
  - Style 4: Bun (female) or Bald/Very short (male)
  - Styles 5-9: Cycle through variations

### Race-Specific Features

- **Elf**: Pointed ears (slightly smaller for females)
- **Dwarf**: Broad shoulders, beard (males or females with facialFeatures > 5)
- **Demon**: Horns on head, reddish skin tint
- **Human**: Optional facial hair for males (based on facialFeatures value)

### Customization Options

All fallback characters respect:
- **Hair Color**: Customizable via color picker
- **Skin Tone**: Slider (0.0 - 1.0)
- **Face Type**: 0-9 variations (affects head size slightly)
- **Hair Style**: 0-9 variations (5 distinct styles that cycle)
- **Facial Features**: 0-9 (affects beard/facial hair for males, special features for females)

## Technical Details

### File Locations

- **Preview**: `src/characterPreview.js` - `createFallbackCharacter()` method
- **Game**: `src/character.js` - `createFallbackCharacter()` method

### Geometry Used

- **Body Parts**: THREE.BoxGeometry for torso, hips, head, arms, legs
- **Hair**: BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry (depending on style)
- **Race Features**: ConeGeometry (ears, horns), BoxGeometry (beard, shoulders)

### Scaling

Fallback characters are automatically scaled to a target height of 2.5 units and positioned so their feet are at y=0 (ground level).

## When Fallback is Used

The fallback system activates when:
1. No model found in `Race/Gender/FullSet.glb`
2. No model found in `Race/Gender/FullSet.gltf`
3. No model found in legacy path `race.glb` or `race.gltf`
4. Model loading fails for any reason

## Future Enhancements

- More detailed body shapes based on bodyShape slider
- Additional hair style variations
- More race-specific feature variations
- Animation support for fallback characters
