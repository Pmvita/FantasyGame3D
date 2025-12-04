#!/bin/bash

echo "🔧 Fixing large file issue..."

# Remove large files from git tracking (but keep them locally)
echo "Removing large .glb files from git tracking..."
git rm --cached assets/characters/*.glb 2>/dev/null
git rm --cached assets/characters/**/*.glb 2>/dev/null
git rm --cached assets/characters/**/*.fbx 2>/dev/null
git rm --cached assets/characters/**/*.tga 2>/dev/null

# Add all other changes
echo "Adding other files..."
git add .

# Commit the removal
echo "Committing changes..."
git commit -m "Remove large asset files from git (use .gitignore), keep UI improvements"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Large files removed from git but kept locally."
echo "The .glb files are now in .gitignore and won't be pushed to GitHub."
echo "Users can add their own character models to the assets/characters/ folder."

