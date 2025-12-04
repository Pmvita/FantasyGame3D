# Fantasy Character 3D Game - Web Version

A lightweight fantasy game built with **Three.js** that runs entirely in your web browser. No installation required!

## Why Three.js?

- ✅ **Zero installation** - Just open in browser
- ✅ **Tiny size** - Only ~5-10 MB total
- ✅ **Runs anywhere** - Works on any device with a browser
- ✅ **Easy to share** - Just send a link
- ✅ **Free and open source**

## Space Requirements

- **Project files**: ~5-10 MB
- **Node modules** (if using): ~50-100 MB
- **Total**: Less than 100 MB (vs 50+ GB for Unreal!)

## Quick Start

### Option 1: Simple HTML (No Installation)

1. Open `index.html` in your browser
2. That's it! Game runs immediately

### Option 2: With Node.js (For Development)

1. Install Node.js (if not installed): https://nodejs.org/ (~50 MB)
2. Run: `npm install`
3. Run: `npm start`
4. Open browser to `http://localhost:3000`

## Features

- ✅ Character customization (appearance, stats, equipment)
- ✅ Character selection and creation
- ✅ Arrow key movement
- ✅ WASD movement
- ✅ Third-person camera (follows character automatically)
- ✅ Mouse interaction with objects (cursor changes on hover)
- ✅ Ripple animation on click/touch
- ✅ Interactive 3D objects (buildings, trees)
- ✅ 3D fantasy world
- ✅ Save/load characters (localStorage)
- ✅ No installation needed!

## Technology Stack

- **Three.js** - 3D graphics library
- **JavaScript** - Game logic
- **HTML/CSS** - UI
- **LocalStorage** - Save system

## File Structure

```
FantasyGame3D/
├── index.html          # Main HTML file
├── src/
│   ├── app.js         # Main game logic
│   ├── character.js   # Character system
│   ├── world.js       # World creation
│   ├── controls.js    # Input handling
│   └── ui.js          # UI system
├── assets/            # Models, textures (optional)
└── package.json       # Dependencies (if using npm)
```

## Controls

- **Arrow Keys / WASD**: Move character
- **Q / E**: Rotate camera around character
- **Mouse**: Interact with objects (cursor changes on hover)
- **Click**: Creates ripple animation and interacts with objects

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Next Steps

See `SETUP.md` for detailed setup instructions.

