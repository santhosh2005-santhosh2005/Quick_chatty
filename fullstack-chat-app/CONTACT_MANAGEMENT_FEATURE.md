# Contact Management Feature

## Overview

This document explains how to use the contact management feature that has been implemented in the chat application. This feature allows users to manage their contacts by adding and removing contacts from their contact list.

## Feature Location

The remove contact option is located in the **Sidebar** next to each contact.

## How to Use the Contact Management Feature

### Removing a Contact

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

### Adding a Contact

Contacts can be added through the search functionality:
1. Use the search bar in the sidebar to find users
2. When you message a user, they are automatically added to your contacts

## How the Feature Works

### Backend Implementation

1. **User Model**:
   - Added a `contacts` field to store user's contacts
   - Contacts are stored as an array of user IDs

2. **User Controller**:
   - Added `addContact` function to add a contact
   - Added `removeContact` function to remove a contact
   - Added `getContacts` function to retrieve user's contacts

3. **User Routes**:
   - `POST /api/user/contacts` - Add a contact
   - `DELETE /api/user/contacts/:contactId` - Remove a contact
   - `GET /api/user/contacts` - Get all contacts

### Frontend Implementation

1. **Sidebar Component**:
   - Added "more options" button next to each contact
   - Added dropdown menu with "Remove Contact" option
   - Added confirmation dialog for contact removal

2. **Chat Store**:
   - Added `addContact` action
   - Added `removeContact` action
   - Added `getContacts` action

## Technical Details

### Database Schema Changes

The User model has been updated to include a contacts field:

```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
});
```

### API Endpoints

1. **Add Contact**:
   ```
   POST /api/user/contacts
   Body: { contactId: "user_id" }
   ```

2. **Remove Contact**:
   ```
   DELETE /api/user/contacts/:contactId
   ```

3. **Get Contacts**:
   ```
   GET /api/user/contacts
   ```

### Frontend Components

1. **Sidebar.jsx**:
   - Added state to track open contact menus
   - Added "more options" button for each contact
   - Added dropdown menu with remove contact option
   - Added confirmation dialog

2. **useChatStore.js**:
   - Added contact management actions
   - Added state for contacts

## Security Measures

1. **Authentication Required**: All contact management endpoints require authentication
2. **Contact Validation**: Prevents users from adding themselves as contacts
3. **Duplicate Prevention**: Prevents adding the same contact multiple times
4. **Mutual Connection Management**: When a contact is removed, the relationship is removed from both users

## User Experience Features

1. **Confirmation Dialog**: Prevents accidental contact removal
2. **Visual Feedback**: Clear indication of which contact menu is open
3. **Responsive Design**: Contact options only visible on larger screens
4. **Loading States**: Proper loading indicators during operations
5. **Error Handling**: User-friendly error messages

## Implementation Files

### Backend Files
- `backend/src/models/user.model.js` - Updated user schema
- `backend/src/controllers/user.controller.js` - Added contact management functions
- `backend/src/routes/user.route.js` - Added contact management routes

### Frontend Files
- `frontend/src/components/Sidebar.jsx` - Updated UI with contact options
- `frontend/src/store/useChatStore.js` - Added contact management actions

## Future Improvements

Potential enhancements that could be added:
1. Add contact groups/folders
2. Add favorite contacts feature
3. Add contact blocking functionality
4. Add contact search by tags or categories
5. Add import/export contacts functionality