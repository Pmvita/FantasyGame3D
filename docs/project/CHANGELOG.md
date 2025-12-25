# Changelog

All notable changes to the Fantasy3D project will be documented in this file.

## [Unreleased]

### Added
- **User Authentication System**: Complete JWT-based authentication with registration and login
- **MongoDB Integration**: Cloud database for persistent character storage
- **API Endpoints**: Full REST API for authentication and character management
- **Account Creation**: User registration with password strength validation
- **Cloud Character Sync**: Characters automatically synced to MongoDB Atlas
- **LocalStorage Migration**: Prompt to migrate existing local characters to cloud
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: UI feedback during API operations

### Changed
- **Project Structure**: Reorganized backend code to comply with Vercel function limits
  - Moved middleware and utilities to `lib/` directory
  - Reduced serverless functions from 14 to 7 (under 12 limit)
- **Character Storage**: Upgraded from LocalStorage-only to MongoDB with LocalStorage fallback
- **API Client**: Centralized API client with automatic token management
- **Project Naming**: Renamed from "Fantasy Game 3D" to "Fantasy3D" throughout codebase

### Technical
- **ES Modules**: Added `"type": "module"` to `package.json`
- **Vercel Configuration**: Configured `vercel.json` for serverless deployment
- **Database Setup**: MongoDB Atlas database, collections, and indexes created
- **Import Paths**: Updated all import paths after directory restructure
- **Dependencies**: Added backend dependencies (express, mongodb, jsonwebtoken, bcryptjs, cors)

### Fixed
- **Vercel Deployment**: Fixed serverless function limit issue by restructuring project
- **Import Errors**: Fixed all import paths after moving middleware/utils to `lib/`
- **Character Management**: Improved error handling and fallback logic

## [Previous Releases]

### Character Deletion Feature
- Added delete button (X) on each character card
- Confirmation dialog prevents accidental deletions
- Proper error handling and validation
- UI automatically refreshes after deletion

### Character Management
- Character creation with customization
- Character selection screen
- Character deletion with confirmation
- Save/load characters (now with cloud sync)

### Game Features
- 3D fantasy world with interactive objects
- Arrow key and WASD movement
- Third-person camera system
- Inventory system
- Skills system
- Minimap navigation
