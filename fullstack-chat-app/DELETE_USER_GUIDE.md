# Delete User Account Feature Guide

## Overview

This document explains how to use the delete user account feature that has been implemented in the chat application. This feature allows users to permanently delete their accounts and all associated data.

## Feature Location

The delete user option is located in the **Profile Page** under the "Danger Zone" section.

## How to Access the Delete Feature

1. **Log in** to the application
2. Click on your **profile icon/name** in the top right corner of the navigation bar
3. Select **"Profile"** from the dropdown menu
4. Scroll down to the **"Danger Zone"** section (red background)
5. Click the **"Delete Account"** button

## How the Feature Works

### Frontend Implementation

1. **ProfilePage.jsx**:
   - Added a "Danger Zone" section with a delete account button
   - Includes confirmation dialog to prevent accidental deletion
   - Shows loading state during deletion process
   - Redirects to login page after successful deletion

2. **useAuthStore.js**:
   - Added `deleteUser` action that calls the backend API
   - Added `isDeletingAccount` state to track deletion status
   - Handles success/error responses and UI updates

### Backend Implementation

1. **user.controller.js**:
   - Added `deleteUser` function that:
     - Finds the authenticated user
     - Deletes all messages sent by the user
     - Deletes all messages received by the user
     - Deletes the user account from the database
     - Clears the JWT cookie for logout

2. **user.route.js**:
   - Added `DELETE /api/user/delete` route
   - Protected by authentication middleware

## Security Measures

1. **Authentication Required**: Only authenticated users can delete their accounts
2. **Confirmation Dialog**: Prevents accidental deletion
3. **Protected API Endpoint**: Backend endpoint requires valid JWT token
4. **Server-side Validation**: Ensures only the account owner can delete the account
5. **Complete Data Removal**: All user data is permanently deleted

## Data That Gets Deleted

When a user deletes their account, the following data is permanently removed:

1. **User Profile**: Full name, email, password, profile picture
2. **Messages**: All messages sent and received by the user
3. **Collaboration Data**: Any collaboration sessions created by the user
4. **Associated Records**: All other data linked to the user ID

## User Experience Flow

1. User navigates to Profile Page
2. User scrolls to Danger Zone section
3. User clicks "Delete Account" button
4. Confirmation dialog appears with warning message
5. User confirms deletion by clicking "OK"
6. Loading spinner appears on button
7. API request is sent to backend
8. Upon success:
   - Success message is displayed
   - User is logged out automatically
   - User is redirected to login page
9. Upon error:
   - Error message is displayed
   - User remains on profile page

## API Endpoint Details

### DELETE /api/user/delete

**Description**: Permanently deletes the authenticated user's account and all associated data

**Authentication**: Required (JWT token in cookies)

**Request**:
```
DELETE /api/user/delete
Content-Type: application/json
```

**Success Response**:
```
Status: 200 OK
Content-Type: application/json

{
  "message": "User account deleted successfully"
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
  "error": "Failed to delete user account"
}
```

## Testing the Feature

### Manual Testing

1. Log in to the application
2. Navigate to the Profile page
3. Find the "Delete Account" button in the Danger Zone
4. Click the button and confirm deletion
5. Verify that:
   - User is logged out
   - Redirected to login page
   - User cannot log back in with same credentials
   - All user data is removed from database

### API Testing

You can test the backend endpoint directly using curl:

```bash
# This will fail without authentication
curl -X DELETE http://localhost:5003/api/user/delete

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

## Implementation Files

### Backend Files
- `backend/src/controllers/user.controller.js` - Contains deleteUser function
- `backend/src/routes/user.route.js` - Contains DELETE route
- `backend/src/models/user.model.js` - User schema
- `backend/src/models/message.model.js` - Message schema

### Frontend Files
- `frontend/src/pages/ProfilePage.jsx` - UI implementation
- `frontend/src/store/useAuthStore.js` - Store actions
- `frontend/src/components/Navbar.jsx` - Navigation to profile

## Dependencies

This feature uses existing dependencies in the project:
- Express.js for routing
- Mongoose for database operations
- JWT for authentication
- React and Zustand for frontend state management

## Future Improvements

Potential enhancements that could be added:
1. Soft delete with recovery period
2. Export user data option before deletion
3. Email confirmation for sensitive accounts
4. Admin override for account deletion