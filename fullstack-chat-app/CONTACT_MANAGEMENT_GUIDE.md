# Contact Management Feature Guide

## Overview

This document explains how to use the contact management feature that has been implemented in the chat application. This feature allows users to manage their contacts by adding and removing contacts from their contact list.

## Feature Location

The remove contact option is located in the **Sidebar** next to each contact.

## How to Access the Contact Management Feature

1. **Navigate to the Contacts Sidebar**:
   - The sidebar on the left shows all your contacts
   - Each contact has a "more options" button (three dots) next to their name

2. **Access Contact Options**:
   - Click the "more options" button (three dots) next to any contact
   - A dropdown menu will appear with the "Remove Contact" option

3. **Remove the Contact**:
   - Click "Remove Contact" from the dropdown menu
   - Confirm the removal in the confirmation dialog
   - The contact will be removed from your contact list

## How the Feature Works

### Frontend Implementation

1. **Sidebar.jsx**:
   - Added a "more options" button (three dots) next to each contact
   - Added dropdown menu with "Remove Contact" option
   - Includes confirmation dialog to prevent accidental removal
   - Shows loading state during removal process

2. **useChatStore.js**:
   - Added `removeContact` action that calls the backend API
   - Added `addContact` action for adding contacts
   - Added `getContacts` action for retrieving contacts
   - Handles success/error responses and UI updates

### Backend Implementation

1. **user.controller.js**:
   - Added `removeContact` function that:
     - Removes a contact from the user's contact list
     - Also removes the user from the contact's contact list (mutual relationship)
   - Added `addContact` function for adding contacts
   - Added `getContacts` function for retrieving contacts

2. **user.route.js**:
   - Added `DELETE /api/user/contacts/:contactId` route
   - Added `POST /api/user/contacts` route
   - Added `GET /api/user/contacts` route
   - All routes protected by authentication middleware

3. **user.model.js**:
   - Added `contacts` field to store user's contacts
   - Contacts are stored as an array of user IDs

## Security Measures

1. **Authentication Required**: Only authenticated users can manage their contacts
2. **Contact Validation**: Prevents users from adding themselves as contacts
3. **Duplicate Prevention**: Prevents adding the same contact multiple times
4. **Mutual Relationship Management**: When a contact is removed, the relationship is removed from both users
5. **Protected API Endpoints**: All contact management endpoints require valid JWT tokens

## User Experience Features

1. **Confirmation Dialog**: Prevents accidental contact removal
2. **Visual Feedback**: Clear indication of which contact menu is open
3. **Responsive Design**: Contact options only visible on larger screens
4. **Loading States**: Proper loading indicators during operations
5. **Error Handling**: User-friendly error messages

## API Endpoint Details

### DELETE /api/user/contacts/:contactId

**Description**: Removes a contact from the authenticated user's contact list

**Authentication**: Required (JWT token in cookies)

**Request**:
```
DELETE /api/user/contacts/:contactId
```

**Success Response**:
```
Status: 200 OK
Content-Type: application/json

{
  "message": "Contact removed successfully"
}
```

**Error Responses**:
```
Status: 401 Unauthorized
{
  "message": "Unauthorized - No Token Provided"
}

Status: 404 Not Found
{
  "error": "User not found"
}

Status: 500 Internal Server Error
{
  "error": "Failed to remove contact"
}
```

### POST /api/user/contacts

**Description**: Adds a contact to the authenticated user's contact list

**Authentication**: Required (JWT token in cookies)

**Request**:
```
POST /api/user/contacts
Content-Type: application/json

{
  "contactId": "user_id"
}
```

**Success Response**:
```
Status: 200 OK
Content-Type: application/json

{
  "message": "Contact added successfully"
}
```

### GET /api/user/contacts

**Description**: Retrieves all contacts for the authenticated user

**Authentication**: Required (JWT token in cookies)

**Request**:
```
GET /api/user/contacts
```

**Success Response**:
```
Status: 200 OK
Content-Type: application/json

[
  {
    "_id": "user_id",
    "fullName": "User Name",
    "email": "user@example.com",
    "profilePic": "image_url"
  }
]
```

## Testing the Feature

### Manual Testing

1. Log in to the application
2. Navigate to the Contacts sidebar
3. Find a contact and click the "more options" button (three dots)
4. Select "Remove Contact" from the dropdown menu
5. Confirm the removal in the confirmation dialog
6. Verify that:
   - The contact is removed from your contact list
   - The contact can still be found through search
   - You can still message the contact (they will be re-added to your contacts)

### API Testing

You can test the backend endpoints directly using curl:

```bash
# This will fail without authentication
curl -X DELETE http://localhost:5003/api/user/contacts/user_id

# To test with authentication, you would need to:
# 1. Log in first to get a JWT token
# 2. Include the token in the request
```

## Error Handling

The feature handles several error scenarios:

1. **Unauthenticated Requests**: Returns 401 Unauthorized
2. **User Not Found**: Returns 404 Not Found
3. **Database Errors**: Returns 500 Internal Server Error
4. **Network Issues**: Frontend shows appropriate error messages
5. **Invalid Contact ID**: Returns 400 Bad Request

## Implementation Files

### Backend Files
- `backend/src/models/user.model.js` - Updated user schema with contacts field
- `backend/src/controllers/user.controller.js` - Contains contact management functions
- `backend/src/routes/user.route.js` - Contains contact management routes

### Frontend Files
- `frontend/src/components/Sidebar.jsx` - UI implementation with contact options
- `frontend/src/store/useChatStore.js` - Store actions for contact management

## Dependencies

This feature uses existing dependencies in the project:
- Express.js for routing
- Mongoose for database operations
- JWT for authentication
- React and Zustand for frontend state management
- Lucide React for icons

## Future Improvements

Potential enhancements that could be added:
1. Add contact groups/folders
2. Add favorite contacts feature
3. Add contact blocking functionality
4. Add contact search by tags or categories
5. Add import/export contacts functionality
6. Add contact request/accept flow
7. Add contact online status notifications