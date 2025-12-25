# Local Development Setup - Fantasy3D

Quick guide for setting up Fantasy3D for local development.

## Prerequisites

- **Node.js** (v18 or later) - Download from [nodejs.org](https://nodejs.org/)
- **Modern Browser** - Chrome, Firefox, Edge, or Safari

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (for API functionality):
   ```bash
   # Create .env.local file in project root
   cat > .env.local << EOF
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   EOF
   ```
   
   **⚠️ Important**: Replace placeholder values with your actual credentials. Never commit `.env.local` to Git!

3. **Start development server**:
   ```bash
   npm start
   ```
   
   This starts an Express server that handles both static files and API endpoints.

4. **Open browser**: Navigate to `http://localhost:3000`

That's it! The game should load with full API functionality.

## Project Structure

```
FantasyGame3D/
├── index.html          # Main HTML file
├── src/                # Game source code
│   ├── app.js         # Main game logic
│   ├── character.js   # Character system
│   ├── ui.js          # UI management
│   ├── world.js       # 3D world creation
│   └── ...
├── api/                # Backend API (for production)
├── lib/                # Shared backend code
└── assets/             # 3D models and textures
```

## Local Development Notes

- **Express Server**: `npm start` runs a local Express server that handles both static files and API endpoints
- **API Endpoints**: Available at `http://localhost:3000/api/*` when using `npm start`
- **Environment Variables**: Required in `.env.local` for MongoDB connection and JWT signing
- **Character Storage**: Uses MongoDB when API is available, falls back to LocalStorage if API fails

## Controls

- **Arrow Keys / WASD**: Move character
- **Q / E**: Rotate camera
- **Mouse**: Interact with objects
- **B Key**: Open inventory
- **ESC**: Close menus
- **1-0 Keys**: Activate skills

## Troubleshooting

### Game doesn't load
- Check browser console (F12) for errors
- Ensure you're using a modern browser
- Try clearing browser cache

### API errors in console
- **404 errors**: Make sure you're using `npm start` (Express server), not `npm run static` (http-server)
- **MongoDB connection errors**: Check `.env.local` file exists and has correct `MONGODB_URI`
- **JWT errors**: Ensure `JWT_SECRET` is set in `.env.local`
- The game will use LocalStorage as fallback if API is unavailable

### Characters don't save
- Check browser allows localStorage
- Some browsers block localStorage in private/incognito mode
- Check browser console for errors

## Next Steps

- **Add 3D Models**: See [Quick Model Setup](../development/QUICK_MODEL_SETUP.md)
- **Deploy to Production**: See [Deployment Guide](../deployment/DEPLOYMENT.md)
- **Customize World**: Edit `src/world.js`
- **Add Features**: Extend game systems in `src/`

## Development Tips

- Use browser DevTools (F12) for debugging
- Check console for errors and warnings
- Use Network tab to monitor API calls
- Use Performance tab to optimize rendering

Enjoy developing Fantasy3D! 🎮
