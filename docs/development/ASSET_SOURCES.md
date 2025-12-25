# Free 3D Character Model Sources

## Best Sources for Fantasy Characters

### 1. **Mixamo** (Recommended - Best Quality)
**Website**: https://www.mixamo.com/
**Format**: FBX, OBJ (convert to GLTF)
**License**: Free with Adobe account
**Features**:
- High quality character models
- Multiple fantasy characters
- Already rigged and animated
- Can download in T-pose for customization

**How to use**:
1. Create free Adobe account
2. Browse characters
3. Download in T-pose
4. Convert FBX to GLTF using:
   - Online: https://products.aspose.app/3d/conversion/fbx-to-gltf
   - Or Blender (free)

### 2. **Sketchfab**
**Website**: https://sketchfab.com/
**Format**: GLTF/GLB (ready to use!)
**License**: Check individual model licenses
**Search**: "fantasy character", "elf", "dwarf", "demon"

**How to use**:
1. Search for "fantasy character" or specific race
2. Filter by "Downloadable" and "Free"
3. Download GLTF/GLB format
4. Place in `assets/characters/` folder

### 3. **CGTrader**
**Website**: https://www.cgtrader.com/
**Format**: Various (prefer GLTF/GLB)
**License**: Check individual licenses
**Search**: "fantasy character free"

### 4. **TurboSquid**
**Website**: https://www.turbosquid.com/
**Format**: Various
**License**: Check individual licenses
**Search**: Filter by "Free" and "GLTF"

### 5. **Poly Haven** (Characters)
**Website**: https://polyhaven.com/models
**Format**: GLTF
**License**: CC0 (completely free)

## Recommended Model Structure

Place models in:
```
assets/
├── characters/
│   ├── human-male.glb
│   ├── human-female.glb
│   ├── elf-male.glb
│   ├── elf-female.glb
│   ├── dwarf-male.glb
│   ├── dwarf-female.glb
│   ├── demon-male.glb
│   └── demon-female.glb
```

## Converting Models to GLB/GLTF

**GLB is preferred** (single file, includes textures)

### Option 1: Online Converter (Easiest)
- **FBX to GLB**: https://products.aspose.app/3d/conversion/fbx-to-glb (Recommended!)
- **FBX to GLTF**: https://products.aspose.app/3d/conversion/fbx-to-gltf
- https://www.gltfconverter.com/

### Option 2: Blender (Free)
1. Download Blender: https://www.blender.org/
2. Import model (File → Import → FBX)
3. Export as GLB (File → Export → glTF 2.0 → Format: GLB)

## Quick Start with Mixamo

1. Go to https://www.mixamo.com/
2. Click "Characters" tab
3. Search for:
   - "Knight" (human male)
   - "Swordmaster" (human)
   - "Elf" (elf characters)
   - "Dwarf" (dwarf characters)
4. Select character
5. Click "Download" → Choose "T-Pose"
6. Format: FBX
7. Convert to GLTF using online converter
8. Save to `assets/characters/`

## Model Requirements

For best results, models should:
- Format: **GLB (preferred)** or GLTF
  - GLB = Single file (easier)
  - GLTF = JSON + textures (more files)
- Be in T-pose or A-pose (arms out)
- Have reasonable scale (not too large/small)
- Include textures/materials (GLB includes them automatically)
- Be rigged (for future animations)

## License Notes

Always check the license:
- **CC0**: Completely free, no attribution needed
- **CC BY**: Free, but must credit creator
- **Royalty-Free**: Free to use, but check terms
- **Editorial Use Only**: Cannot use in games

## Tips

1. **Start with Mixamo** - Best quality and easiest to use
2. **Use GLTF/GLB format** - Works directly with Three.js
3. **Test models** - Make sure they load before using
4. **Check scale** - Models might need scaling
5. **Organize files** - Keep models in `assets/characters/` folder

