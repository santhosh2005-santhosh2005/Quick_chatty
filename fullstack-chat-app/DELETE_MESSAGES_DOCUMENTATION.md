# Delete Message Functionality

This document explains how to use the new delete message functionality in the chat application.

## Features Added

1. **Delete Individual Messages** - Users can delete their own messages
2. **Delete All Messages** - Users can delete all messages in a conversation
3. **Real-time Updates** - Message deletion is synchronized across all connected clients

## Backend Implementation

### Controllers

Two new controller functions were added to `message.controller.js`:

1. `deleteMessage` - Deletes a single message
   - Only allows users to delete their own messages
   - Emits a "messageDeleted" event to both sender and receiver

2. `deleteAllMessages` - Deletes all messages between two users
   - Deletes messages where the current user is either sender or receiver
   - Emits an "allMessagesDeleted" event to both users

### Routes

Two new routes were added to `message.route.js`:

1. `DELETE /messages/delete/:id` - Delete a specific message
2. `DELETE /messages/delete-all/:id` - Delete all messages with a specific user

## Frontend Implementation

### Store

The `useChatStore` was updated with:

1. `deleteMessage` function - Deletes a single message from the backend and updates the local state
2. `deleteAllMessages` function - Deletes all messages from the backend and clears the local state
3. Socket listeners for real-time updates:
   - `messageDeleted` - Removes a deleted message from the UI
   - `allMessagesDeleted` - Clears all messages from the UI

### UI Components

1. **DropdownMenu** - A reusable dropdown component for message options
2. **ChatContainer** - Updated to show delete options for each message
3. **ChatHeader** - Updated to include a "Delete All Messages" button

## Usage

### Deleting Individual Messages

1. Send a message in a conversation
2. Hover over your own message
3. Click the three dots menu that appears
4. Select "Delete message"
5. The message will be removed from both users' chat views

### Deleting All Messages

1. Open a conversation with another user
2. Click the trash can icon in the chat header
3. Confirm the deletion in the dialog that appears
4. All messages in the conversation will be deleted for both users

## Security

- Users can only delete their own messages
- Proper authentication is required for all delete operations
- Real-time updates ensure both users see the same messages

## Error Handling

- Appropriate error messages are shown for failed operations
- Confirmation dialogs prevent accidental deletions
- Backend validation ensures users can't delete others' messages