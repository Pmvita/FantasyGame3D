# Character Models Directory

Place your 3D character models here in GLTF or GLB format.

## File Naming Convention

Name your files based on race:
- `human.glb` or `human.gltf` - Human character
- `elf.glb` or `elf.gltf` - Elf character
- `dwarf.glb` or `dwarf.gltf` - Dwarf character
- `demon.glb` or `demon.gltf` - Demon character

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

