# Fantasy3D

A 3D fantasy game built with **Three.js** that runs entirely in your web browser. Features user authentication, cloud-synced character data, and a full 3D world to explore.

## 🎮 Features

- ✅ **Character Customization** - Create and customize characters with appearance and stats
- ✅ **Character Management** - Save, load, and delete characters
- ✅ **User Authentication** - Secure account creation and login with JWT
- ✅ **Cloud Sync** - Character data synced to MongoDB Atlas
- ✅ **3D World** - Interactive fantasy world with buildings and objects
- ✅ **Movement Controls** - Arrow keys or WASD movement
- ✅ **Third-Person Camera** - Camera follows character automatically
- ✅ **Inventory System** - Manage items and equipment
- ✅ **Skills System** - Character skills and abilities
- ✅ **Minimap** - Navigate with the minimap
- ✅ **No Installation Required** - Runs entirely in browser

## 🚀 Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (create `.env.local` file):
   ```bash
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   ```
   
   **⚠️ Important**: Never commit `.env.local` or any files containing credentials to Git!

3. **Start development server**:
   ```bash
   npm start
   ```
   
   This starts an Express server that handles both static files and API endpoints.

4. **Open browser**: Navigate to `http://localhost:3000`

### Production Deployment

The project is configured for deployment to **Vercel**. See [Deployment Guide](./docs/deployment/DEPLOYMENT.md) for complete instructions.

**Current Status**: 
- ✅ MongoDB Atlas database configured
- ✅ Backend API endpoints ready
- ⏳ Vercel deployment pending (fix applied, awaiting deployment)

## 🛠️ Technology Stack

### Frontend
- **Three.js** - 3D graphics and rendering
- **JavaScript (ES6 Modules)** - Game logic and UI
- **HTML5/CSS3** - User interface
- **Font Awesome** - Icons
- **Google Fonts** - Typography

### Backend
- **Node.js** - Runtime environment
- **Express.js** - API framework (via Vercel serverless functions)
- **MongoDB Atlas** - Cloud database (free tier)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Hosting and serverless functions
- **MongoDB Atlas** - Database hosting

## 📁 Project Structure

```
FantasyGame3D/
├── api/                    # Backend API endpoints (7 serverless functions)
│   ├── auth/
│   │   ├── login.js
│   │   ├── register.js
│   │   └── verify.js
│   └── characters/
│       ├── get.js
│       ├── create.js
│       ├── update.js
│       └── delete.js
├── lib/                    # Shared backend code (not serverless functions)
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── cors.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── errors.js
│       ├── jwt.js
│       ├── mongodb.js
│       └── validation.js
├── src/                    # Frontend game code
│   ├── api/                # API client
│   │   ├── auth.js
│   │   ├── characters.js
│   │   └── client.js
│   ├── app.js              # Main game logic
│   ├── character.js        # Character system
│   ├── characterPreview.js # Character preview
│   ├── controls.js         # Input handling
│   ├── minimap.js          # Minimap system
│   ├── ui.js               # UI system
│   ├── world.js            # World creation
│   ├── inventory/          # Inventory system
│   └── skills/             # Skills system
├── assets/                 # 3D models and textures
│   ├── characters/         # Character models
│   └── animations/         # Animation files
├── tests/                  # Test files
├── index.html              # Main HTML file
├── package.json            # Dependencies
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## 🎯 Controls

- **Arrow Keys / WASD**: Move character
- **Q / E**: Rotate camera around character
- **Mouse**: Interact with objects (cursor changes on hover)
- **Click**: Creates ripple animation and interacts with objects
- **Double-tap/Click**: Run (1.5x speed, consumes energy)
- **B Key**: Open inventory
- **ESC**: Close menus
- **1-0 Keys**: Activate skills

## 📚 Documentation

All documentation is organized in the [`docs/`](./docs/) folder:

### Setup & Configuration
- **[Setup Guide](./docs/setup/SETUP.md)** - Complete local development setup
- **[Local Development](./docs/setup/LOCAL_DEVELOPMENT.md)** - Local development workflow
- **[MongoDB Setup](./docs/setup/MONGODB_SETUP.md)** - MongoDB Atlas configuration

### Deployment
- **[Deployment Guide](./docs/deployment/DEPLOYMENT.md)** - Production deployment to Vercel
- **[Vercel Troubleshooting](./docs/deployment/VERCEL_GITHUB_TROUBLESHOOTING.md)** - Common deployment issues

### Development
- **[Quick Model Setup](./docs/development/QUICK_MODEL_SETUP.md)** - Adding 3D character models
- **[Asset Sources](./docs/development/ASSET_SOURCES.md)** - Where to find game assets
- **[Character Creation Structure](./docs/development/WOW_CHARACTER_CREATION_STRUCTURE.md)** - Character system architecture

### Reference
- **[MMORPG UI/UX Reference](./docs/reference/MMORPG_UI_UX_REFERENCE.md)** - UI/UX design guidelines
- **[Login Background Guide](./docs/reference/LOGIN_BACKGROUND_GUIDE.md)** - Background customization

### Project Management
- **[Changelog](./docs/project/CHANGELOG.md)** - Project version history
- **[Implementation Status](./docs/project/IMPLEMENTATION_STATUS.md)** - Current feature status
- **[Documentation Index](./docs/project/DOCUMENTATION.md)** - Documentation overview

### Admin
- **[Admin Users](./docs/admin/ADMIN_USERS.md)** - Admin user management (⚠️ Contains sensitive info)

## 🔐 Environment Variables

For production deployment, set these in Vercel:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fantasy3d?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-project.vercel.app
```

## 🌐 Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 📝 License

MIT
