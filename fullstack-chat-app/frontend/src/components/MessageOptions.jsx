import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Reply, Forward, Star, Copy } from 'lucide-react';
import DeleteMessageModal from './DeleteMessageModal';

const MessageOptions = ({ 
  messageId, 
  onDeleteForYou, 
  onDeleteForEveryone, 
  onReply, 
  onForward, 
  onStar, 
  onCopy, 
  messageText,
  receiverName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteClick = () => {
    setIsOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleCopy = () => {
    if (messageText) {
      navigator.clipboard.writeText(messageText);
    }
    setIsOpen(false);
  };

  const options = [
    { icon: Reply, label: "Reply", action: onReply },
    { icon: Forward, label: "Forward", action: onForward },
    { icon: Copy, label: "Copy", action: handleCopy },
    { icon: Star, label: "Star", action: onStar },
    { icon: Trash2, label: "Delete", action: handleDeleteClick },
  ];

  return (
    <>
      <div className="relative inline-block" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-xs btn-circle btn-ghost text-current opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-0 mt-8 w-48 bg-base-100 border border-base-300 rounded-md shadow-lg z-10">
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm hover:bg-base-200 transition-colors duration-150"
                  disabled={!option.action}
                >
                  <option.icon size={16} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteForYou={() => {
          onDeleteForYou(messageId);
          setIsDeleteModalOpen(false);
        }}
        onDeleteForEveryone={() => {
          onDeleteForEveryone(messageId);
          setIsDeleteModalOpen(false);
        }}
        receiverName={receiverName}
      />
    </>
  );
};

export default MessageOptions;