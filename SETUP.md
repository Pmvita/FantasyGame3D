# Setup Guide - Three.js Fantasy Game

## Space Requirements

- **Project files**: ~5-10 MB
- **Node modules** (optional): ~50-100 MB
- **Total**: Less than 100 MB! 🎉

## Option 1: Simple Setup (No Installation)

Just open `index.html` in your browser!

1. Double-click `index.html`
2. Game opens in your default browser
3. That's it!

**Note**: Some browsers may block local files. If it doesn't work, use Option 2.

## Option 2: With Local Server (Recommended)

### Step 1: Install Node.js (if not installed)

- Download from: https://nodejs.org/
- Install the LTS version (~50 MB)
- Verify: Open terminal and type `node --version`

### Step 2: Install Dependencies

Open terminal in project folder and run:

```bash
npm install
```

This downloads Three.js (~5 MB) and a simple web server.

### Step 3: Start Server

```bash
npm start
```

This will:
- Start a local web server
- Open the game in your browser automatically
- Server runs on `http://localhost:3000`

### Step 4: Play!

The game should open in your browser. You can:
- Create characters
- Customize appearance and stats
- Walk around the 3D world
- Use arrow keys or WASD to move

## Controls

- **Arrow Keys / WASD**: Move character
- **Q / E**: Rotate camera around character
- **Mouse**: Interact with objects (cursor changes to pointer on interactive objects)
- **Click**: Creates ripple animation and interacts with objects
- **Touch**: Works on mobile devices with ripple animation

## Features

✅ Character creation with customization
✅ Character selection
✅ Arrow key movement
✅ WASD movement
✅ Third-person camera (follows character automatically)
✅ Mouse interaction with objects
✅ Ripple animation on click/touch
✅ Interactive 3D objects (buildings, trees)
✅ Cursor changes on hover (crosshair/pointer)
✅ 3D world with buildings and trees
✅ Save/load characters (localStorage)
✅ Stats system
✅ Appearance customization

## Troubleshooting

### Game doesn't load
- Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari)
- Check browser console for errors (F12)
- Try using Option 2 (local server)

### Controls don't work
- Click on the game window first to focus it
- Make sure the game window has focus (click on it)
- Mouse is for interaction, not camera control
- Use Q/E keys to rotate camera if needed

### Characters don't save
- Check browser allows localStorage
- Some browsers block localStorage in private/incognito mode

## Next Steps

1. **Customize the world**: Edit `src/world.js` to add more buildings, NPCs, etc.
2. **Add character models**: Replace the simple cube with 3D models
3. **Add animations**: Import animations from Mixamo
4. **Add NPCs**: Create interactive NPCs
5. **Add more features**: Combat, quests, inventory, etc.

## File Structure

```
FantasyGame3D/
├── index.html          # Main HTML file
├── package.json        # Dependencies
├── src/
│   ├── app.js         # Main game logic
│   ├── character.js   # Character system
│   ├── world.js       # World creation
│   ├── controls.js    # Input handling
│   └── ui.js          # UI system
└── assets/            # Models, textures (add your own)
```

## Adding 3D Models

To add better character models:

1. Get models from Mixamo (free): https://www.mixamo.com/
2. Export as GLTF or FBX
3. Convert to GLTF if needed
4. Load in `character.js` using GLTFLoader

Example:
```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('assets/character.gltf', (gltf) => {
    this.mesh = gltf.scene;
    // Apply materials, etc.
});
```

## Browser Compatibility

Works in:
- ✅ Chrome/Edge (best performance)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Performance Tips

- Close other browser tabs for better performance
- Use Chrome/Edge for best performance
- Reduce quality settings if needed (edit in `world.js`)

Enjoy your lightweight 3D fantasy game! 🎮

