#!/bin/bash

# Build and deploy script for Job Application Tracker
echo "Building and deploying Job Application Tracker..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local file not found!"
  echo "Please create a .env.local file with your Google OAuth Client ID:"
  echo "VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com"
  exit 1
fi

# Build the app
echo "Building the application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed! Please check the errors above."
  exit 1
fi

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deployment complete! Your app should be live at:"
echo "https://scientistigwe.github.io/JobApplicationTracker/"
