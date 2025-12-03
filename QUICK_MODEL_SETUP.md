# Quick Setup Guide - Adding 3D Character Models

## Step 1: Get Models from Mixamo (Easiest)

1. Go to https://www.mixamo.com/
2. Sign up for free Adobe account (if needed)
3. Click "Characters" tab
4. Search for characters:
   - Type "Knight" or "Swordmaster" for human
   - Type "Elf" for elf characters
   - Type "Dwarf" for dwarf characters
   - Type "Demon" or "Tiefling" for demon
5. Click on a character you like
6. Click "Download" button
7. Settings:
   - Format: **FBX**
   - Pose: **T-Pose** (important!)
   - Skin: Default
8. Click "Download"

## Step 2: Convert to GLB (Recommended)

**Option A: Convert to GLB (Single File - EASIER)**
1. Go to: https://products.aspose.app/3d/conversion/fbx-to-glb
2. Upload your FBX file
3. Click "Convert"
4. Download the GLB file

**Option B: Convert to GLTF (Multiple Files)**
1. Go to: https://products.aspose.app/3d/conversion/fbx-to-gltf
2. Upload your FBX file
3. Click "Convert"
4. Download the GLTF file (and any texture files if separate)

## Step 3: Rename and Place

1. Rename the file to match the race:
   - `human.glb` (preferred) or `human.gltf`
   - `elf.glb` (preferred) or `elf.gltf`
   - `dwarf.glb` (preferred) or `dwarf.gltf`
   - `demon.glb` (preferred) or `demon.gltf`

2. Place in: `FantasyGame3D/assets/characters/`

**Note**: GLB is preferred because it's a single file. GLTF works too, but you may need to include texture files.

## Step 4: Test

1. Refresh your browser
2. Open character creation
3. Select the race
4. The 3D model should appear!

## GLB vs GLTF - Which to Use?

**GLB (Recommended)**:
- Single file (includes textures)
- Easier to manage
- Smaller file size
- Use: https://products.aspose.app/3d/conversion/fbx-to-glb

**GLTF**:
- JSON file + separate texture files
- More files to manage
- Use: https://products.aspose.app/3d/conversion/fbx-to-gltf

**The code supports both**, but GLB is easier!

## Troubleshooting

**Model doesn't appear?**
- Check browser console (F12) for errors
- Make sure file is named correctly (lowercase: `human.glb`)
- Make sure file is in `assets/characters/` folder
- Try refreshing the page

**Model is too big/small?**
- The code will auto-scale, but you can adjust in the model file
- Or modify scale in `character.js` if needed

**Model looks wrong?**
- Make sure you downloaded in T-Pose
- Check that textures are included in GLB file

## Quick Links

- **Mixamo**: https://www.mixamo.com/
- **FBX to GLTF Converter**: https://products.aspose.app/3d/conversion/fbx-to-gltf
- **Sketchfab** (alternative): https://sketchfab.com/ (search "fantasy character free")

That's it! Your characters will look much better with real 3D models!

