import React from 'react';

const DeleteMessageModal = ({ isOpen, onClose, onDeleteForYou, onDeleteForEveryone, receiverName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-4 w-80">
        <h3 className="text-lg font-semibold mb-4">Delete message</h3>
        <p className="text-sm mb-6 text-base-content/70">Select an option to delete this message</p>
        
        <div className="space-y-3">
          <button
            onClick={onDeleteForYou}
            className="w-full text-left p-3 rounded-lg hover:bg-base-200 transition-colors"
          >
            <div className="font-medium">Delete for you</div>
            <div className="text-xs text-base-content/70">Delete this message for you only</div>
          </button>
          
          <button
            onClick={onDeleteForEveryone}
            className="w-full text-left p-3 rounded-lg hover:bg-base-200 transition-colors"
          >
            <div className="font-medium">Delete for everyone</div>
            <div className="text-xs text-base-content/70">Delete this message for you and {receiverName}</div>
          </button>
          
          <button
            onClick={onClose}
            className="w-full p-3 rounded-lg hover:bg-base-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;