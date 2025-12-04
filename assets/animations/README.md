# Shared Animations Folder

This folder is for shared animations that can be used by all characters.

## How It Works

If you want to use the same animations for all characters (instead of embedding them in each model), you can:

1. Export animations separately from Mixamo or other sources
2. Place them in this folder
3. The game will automatically load and apply them to any character

## File Naming Convention

Name your animation files with descriptive names:
- `walk.glb` or `walk.gltf` - Walking animation
- `idle.glb` or `idle.gltf` - Idle/standing animation
- `jump.glb` or `jump.gltf` - Jumping animation
- `run.glb` or `run.gltf` - Running animation

## Getting Animations from Mixamo

1. Go to https://www.mixamo.com/
2. Click "Animations" tab
3. Search for animations (e.g., "Walking", "Idle", "Jump")
4. Download as **FBX with skin**
5. Convert FBX to GLB/GLTF using:
   - https://products.aspose.app/3d/conversion/fbx-to-glb
6. Place the GLB file in this folder

## Note

The current code supports both:
- **Embedded animations** (in each character model) - Recommended, simpler
- **Shared animations** (in this folder) - More flexible, requires code update

If you want to use shared animations, the code needs to be updated to load them separately.

