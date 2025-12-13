# Character Models Directory

This directory contains character model asset sets organized by race and gender.

## Folder Structure

The game uses organized asset sets for each race and gender combination:

```
assets/characters/
├── Human/
│   ├── Male/
│   │   └── FullSet.glb
│   └── Female/
│       └── FullSet.glb
├── Elf/
│   ├── Male/
│   │   └── FullSet.glb
│   └── Female/
│       └── FullSet.glb
├── Dwarf/
│   ├── Male/
│   │   └── FullSet.glb
│   └── Female/
│       └── FullSet.glb
└── Demon/
    ├── Male/
    │   └── FullSet.glb
    └── Female/
        └── FullSet.glb
```

## Current Status

- **Human Race**: ✅ Ready (Male: `HumanSet/Man/FullSet.glb`, Female: `HumanSet/Woman/` available)
- **Elf Race**: ⚠️ Needs conversion (FBX files in `Elf Set/BodyA/` and `Elf Set/BodyB/` need conversion to GLB)
- **Dwarf & Demon Races**: ⏳ No asset sets available yet (using fallback geometry)

## File Naming Convention

**Preferred (New Structure)**: Place models in `Race/Gender/FullSet.glb`
- `Human/Male/FullSet.glb` - Human male character
- `Human/Female/FullSet.glb` - Human female character
- `Elf/Male/FullSet.glb` - Elf male character
- `Elf/Female/FullSet.glb` - Elf female character
- And so on for Dwarf and Demon races

**Legacy (Fallback)**: The code will also try legacy paths:
- `human.glb` or `human.gltf` - Human character (gender defaults to male)
- `elf.glb` or `elf.gltf` - Elf character (gender defaults to male)
- `dwarf.glb` or `dwarf.gltf` - Dwarf character (gender defaults to male)
- `demon.glb` or `demon.gltf` - Demon character (gender defaults to male)

**Note**: The code will try `.glb` first, then `.gltf`. **GLB is preferred** because it's a single file (includes textures), but GLTF also works.

## How to Add Models

1. Download a character model from:
   - Mixamo: https://www.mixamo.com/
   - Sketchfab: https://sketchfab.com/
   - Or other sources (see ASSET_SOURCES.md)

2. Convert to GLTF/GLB if needed:
   - Use online converter: https://products.aspose.app/3d/conversion/fbx-to-gltf
   - Or use Blender

3. Place the file in this directory with the correct name

4. The game will automatically load the model when that race is selected

## Model Requirements

- Format: **GLB (preferred)** or GLTF
  - **GLB** = Single binary file (includes textures) - EASIER
  - **GLTF** = JSON file + separate texture files - More files to manage
- Pose: T-pose or A-pose recommended
- Scale: Reasonable size (will auto-scale if needed)
- Textures: Should be included (GLB includes them automatically)

## Testing

After adding a model:
1. Refresh the browser
2. Open character creation
3. Select the race
4. The model should appear in the preview

If the model doesn't load, check the browser console (F12) for errors.

## Troubleshooting

### Error: "Kaydara FB" or "Unexpected token 'K'"
**Problem**: Your file is an FBX file that was renamed to `.glb`. FBX files cannot be loaded directly.

**Solution**: 
1. Convert the FBX file to GLB using:
   - Online converter: https://products.aspose.app/3d/conversion/fbx-to-gltf
   - Blender: Import FBX → Export as GLB
2. Replace the file with the converted GLB version

### Error: "Failed to load buffer scene.bin" or missing texture files
**Problem**: Your GLTF file references external files (`.bin`, textures) that are missing.

**Solution**:
1. **Option 1 (Recommended)**: Convert to GLB format - GLB includes everything in one file
   - Use: https://products.aspose.app/3d/conversion/gltf-to-glb
   - Or Blender: Import GLTF → Export as GLB
2. **Option 2**: Make sure ALL files from the GLTF export are in the `assets/characters/` folder:
   - `dwarf.gltf` (or `dwarf.glb`)
   - `scene.bin` (if using GLTF)
   - `textures/` folder with all texture files
   - Any other `.bin` files

### Model appears in the grass or too low
**Fixed**: The code now automatically positions models so their feet are at ground level (y=0).

### Model not rotating in preview
**Fixed**: The rotation animation now works for all models, including cached ones.

## Quick Fix Checklist

- [ ] All model files are in `assets/characters/` folder
- [ ] Files are named correctly: `human.glb`, `elf.glb`, `dwarf.glb`, `demon.glb`
- [ ] Files are actual GLB/GLTF format (not FBX renamed)
- [ ] If using GLTF, all external files (`.bin`, textures) are included
- [ ] Browser console shows no errors (F12 → Console tab)

