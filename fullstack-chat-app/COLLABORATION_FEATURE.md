# Code Collaboration Feature

This document explains how to use the real-time code collaboration feature in the chat application.

## Overview

The collaboration feature allows users to:
1. Create a collaboration session
2. Share a link with others
3. Edit code in real-time with multiple users
4. Work on files without storing code on the server

## How to Use

### Starting a Collaboration Session

1. In the chat interface, click the "Collab" button in the header
2. A new tab will open with the collaboration editor
3. Copy the collaboration link from the editor interface
4. Share the link with other users

### Joining a Collaboration Session

1. Click on a collaboration link shared by another user
2. You'll be taken to the collaboration editor
3. Start editing code together in real-time

### Features

- **Real-time Editing**: Changes are synchronized instantly between all participants
- **File Management**: Create new files or upload existing ones
- **Syntax Highlighting**: Monaco Editor provides syntax highlighting for multiple languages
- **Cursor Tracking**: See where other users are editing
- **No Server Storage**: Code is never stored on the server, only in participants' browsers

## Technical Implementation

### Backend

- Collaboration routes for session creation
- WebSocket handling for real-time communication
- No code storage on the server

### Frontend

- Monaco Editor for code editing
- Zustand store for state management
- Real-time synchronization via Socket.IO
- File tree management

## Security

- Only authenticated users can create collaboration sessions
- Sessions are identified by UUIDs
- No code is stored on the server
- All data is transmitted securely via WebSockets