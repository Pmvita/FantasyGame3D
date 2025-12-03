#!/bin/bash

# Check if git repository exists
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Check if remote exists, if not add it
if ! git remote | grep -q origin; then
    echo "Adding GitHub remote..."
    git remote add origin https://github.com/Pmvita/FantasyGame3D.git
else
    echo "Remote already configured."
    # Update remote URL in case it changed
    git remote set-url origin https://github.com/Pmvita/FantasyGame3D.git
fi

# Add all files
echo "Adding all files..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Update fantasy game: improved UI with modern icons, enhanced character preview layout, better race selection styling"

# Ensure we're on main branch
git branch -M main

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your code has been pushed to GitHub."
echo "View your repository at: https://github.com/Pmvita/FantasyGame3D"

