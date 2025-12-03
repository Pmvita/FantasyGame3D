#!/bin/bash

# Initialize git repository if it doesn't exist
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Add all files
echo "Adding all files..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Update fantasy game: improved UI, modern icons, character preview layout"

# Check if remote exists
if ! git remote | grep -q origin; then
    echo ""
    echo "⚠️  No remote repository found!"
    echo "Please add your GitHub repository as origin:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo ""
    echo "Or if you already have a GitHub repo, run:"
    echo "  git remote add origin YOUR_REPO_URL"
    echo ""
    read -p "Press Enter after adding the remote, or Ctrl+C to cancel..."
fi

# Push to GitHub
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Your code has been pushed to GitHub."

