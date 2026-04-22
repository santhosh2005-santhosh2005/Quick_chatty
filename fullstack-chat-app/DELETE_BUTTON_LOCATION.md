# Delete Button Location Guide

## Where to Find the Delete Account Button

### Step 1: Access Your Profile
1. Log in to the application
2. Look at the top right corner of the navigation bar
3. Click on your profile picture and name
4. Select "Profile" from the dropdown menu

### Step 2: Locate the Danger Zone
1. On the Profile page, scroll down to the bottom
2. Look for the section with a red background titled "Danger Zone"
3. This section contains the delete account button

### Visual Description of the Delete Button
- Button text: "Delete Account"
- Icon: Trash can icon (🗑️)
- Color: Red/error color to indicate danger
- Full width button
- Shows loading spinner during deletion process

### What Happens When You Click It
1. A confirmation dialog appears with a warning message
2. You must click "OK" to confirm or "Cancel" to abort
3. If confirmed, your account and all data will be permanently deleted
4. You'll be automatically logged out and redirected to the login page

### Code Implementation Details

The delete button is implemented in:
- File: `frontend/src/pages/ProfilePage.jsx`
- Section: "Delete Account Section" (at the bottom)
- Function: `handleDeleteAccount()`
- Store action: `deleteUser()` from `useAuthStore`

The button has these features:
- Confirmation dialog to prevent accidental deletion
- Loading state with spinner animation
- Disabled state during deletion process
- Error handling and user feedback