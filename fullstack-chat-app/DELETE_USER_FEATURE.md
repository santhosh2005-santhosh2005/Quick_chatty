# Delete User Account Feature

## Location of Delete User Option

The delete user option is located in the **Profile Page** at the bottom in the "Danger Zone" section.

## How to Access

1. **Navigate to Profile Page:**
   - After logging in, click on your profile icon in the top navigation bar
   - Select "Profile" from the dropdown menu
   - Or directly navigate to `/profile` if you know the route

2. **Find the Delete Option:**
   - Scroll down to the bottom of the Profile page
   - Look for the section titled "Danger Zone" with a red background
   - You'll see a button labeled "Delete Account" with a trash icon

## How to Use

1. Click the "Delete Account" button
2. A confirmation dialog will appear warning you about permanent data loss
3. Click "OK" to confirm deletion or "Cancel" to abort
4. If confirmed, your account and all associated data will be permanently deleted
5. You'll be automatically logged out and redirected to the login page

## What Gets Deleted

When you delete your account:
- Your user profile and all personal information
- All messages you've sent to other users
- All messages you've received from other users
- Any collaboration sessions you've created
- All associated data in the database

## Security Measures

- Confirmation dialog to prevent accidental deletion
- Protected API endpoint that requires authentication
- Server-side validation to ensure only the account owner can delete the account
- Automatic logout after deletion

## Technical Implementation

**Backend:**
- Controller: `backend/src/controllers/user.controller.js` (deleteUser function)
- Route: `DELETE /api/user/delete` (protected route)

**Frontend:**
- Component: `frontend/src/pages/ProfilePage.jsx`
- Store: `frontend/src/store/useAuthStore.js` (deleteUser action)