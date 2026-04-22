#!/bin/bash

# This script updates the collaboration feature with the new implementation

# Backup existing files
echo "Backing up existing files..."
cp src/services/collab/CollabSocketHandler.ts src/services/collab/CollabSocketHandler.backup.ts
cp src/index.js src/index.backup.js

# Replace with new files
echo "Updating files..."
mv src/index.updated.js src/index.js

# Install dependencies if needed
echo "Checking dependencies..."
npm list @aws-sdk/client-s3 || npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm list redis || npm install redis

echo "Update complete! Please restart your server to apply changes."
echo "To revert changes, run: git checkout -- src/services/collab/CollabSocketHandler.ts src/index.js"
