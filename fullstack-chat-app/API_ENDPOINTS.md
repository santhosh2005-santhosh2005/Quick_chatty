# RESTful API Endpoints Documentation

This document provides a comprehensive list of all RESTful API endpoints available in the chat application.

## Base URL

```
http://localhost:5003/api
```

## Authentication Endpoints

### POST /auth/signup
**Description**: Register a new user account
- **Request Body**: 
  ```json
  {
    "fullName": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with JWT token in cookies

### POST /auth/login
**Description**: Log in to an existing account
- **Request Body**: 
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with JWT token in cookies

### POST /auth/logout
**Description**: Log out of the current session
- **Response**: Success message with cleared JWT cookie

### PUT /auth/update-profile
**Description**: Update user profile information
- **Authentication**: Required
- **Request Body**: 
  ```json
  {
    "profilePic": "base64_image_string"
  }
  ```
- **Response**: Updated user object

### GET /auth/check
**Description**: Check if user is authenticated
- **Authentication**: Required
- **Response**: Current user object

## User Management Endpoints

### GET /user/search
**Description**: Search for users by email or full name
- **Authentication**: Required
- **Query Parameters**: `q` (search query)
- **Response**: Array of user objects

### POST /user/invite
**Description**: Send a collaboration invitation to another user
- **Authentication**: Required
- **Request Body**: 
  ```json
  {
    "userId": "string",
    "sessionId": "string",
    "shareLink": "string"
  }
  ```
- **Response**: Success message with invitation details

### DELETE /user/delete
**Description**: Delete the current user's account and all associated data
- **Authentication**: Required
- **Response**: Success message

### POST /user/contacts
**Description**: Add a user to contacts
- **Authentication**: Required
- **Request Body**: 
  ```json
  {
    "contactId": "string"
  }
  ```
- **Response**: Success message

### DELETE /user/contacts/:contactId
**Description**: Remove a user from contacts
- **Authentication**: Required
- **Path Parameters**: `contactId` (ID of user to remove)
- **Response**: Success message

### GET /user/contacts
**Description**: Get all contacts for the current user
- **Authentication**: Required
- **Response**: Array of contact objects

## Messaging Endpoints

### GET /messages/users
**Description**: Get all users for the sidebar (contacts or all users)
- **Authentication**: Required
- **Response**: Array of user objects

### GET /messages/:id
**Description**: Get messages between current user and another user
- **Authentication**: Required
- **Path Parameters**: `id` (ID of user to get messages with)
- **Response**: Array of message objects

### POST /messages/send/:id
**Description**: Send a message to another user
- **Authentication**: Required
- **Path Parameters**: `id` (ID of user to send message to)
- **Request Body**: 
  ```json
  {
    "text": "string",
    "image": "base64_image_string" (optional)
  }
  ```
- **Response**: Sent message object

### DELETE /messages/delete-for-you/:id
**Description**: Delete a message for the current user only
- **Authentication**: Required
- **Path Parameters**: `id` (ID of message to delete)
- **Response**: Success message

### DELETE /messages/delete-for-everyone/:id
**Description**: Delete a message for all users (sender only can do this)
- **Authentication**: Required
- **Path Parameters**: `id` (ID of message to delete)
- **Response**: Success message

### DELETE /messages/delete-all/:id
**Description**: Delete all messages between current user and another user
- **Authentication**: Required
- **Path Parameters**: `id` (ID of user to delete all messages with)
- **Response**: Success message

## Collaboration Endpoints

### POST /collab/create
**Description**: Create a new collaboration session
- **Authentication**: Required
- **Response**: Collaboration session details with share link

## WebSocket Events

The application also uses WebSocket for real-time communication:

### Message Events
- `newMessage`: When a new message is received
- `messageDeletedForYou`: When a message is deleted for the current user
- `messageDeletedForEveryone`: When a message is deleted for all users
- `allMessagesDeleted`: When all messages between two users are deleted

### User Events
- `getOnlineUsers`: List of currently online users
- `invitationReceived`: When a collaboration invitation is received

### Collaboration Events
- `collabUpdate`: When collaboration content is updated
- `userJoined`: When a user joins a collaboration session
- `userLeft`: When a user leaves a collaboration session

## Authentication

All endpoints marked with "Authentication: Required" need a valid JWT token in the cookies.

## Error Responses

All endpoints can return the following error responses:

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: User doesn't have permission to perform the action
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Rate Limiting

Currently, there is no rate limiting implemented on the API endpoints.

## CORS

The API allows requests from:
- http://localhost:5173
- http://localhost:5195
- http://localhost:5196

With credentials enabled.