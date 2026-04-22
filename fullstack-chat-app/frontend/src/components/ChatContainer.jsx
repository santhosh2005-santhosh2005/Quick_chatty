import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageOptions from "./MessageOptions";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessageForYou,
    deleteMessageForEveryone,
    isEncryptionDemoEnabled,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const { socket } = useAuthStore();

  useEffect(() => {
    if (selectedUser && selectedUser._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [selectedUser, selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages, socket]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDeleteMessageForYou = (messageId) => deleteMessageForYou(messageId);
  const handleDeleteMessageForEveryone = (messageId) => deleteMessageForEveryone(messageId);
  const handleDeleteAllMessages = () => {
    if (selectedUser && selectedUser._id) {
      if (window.confirm("Delete all messages?")) {
        useChatStore.getState().deleteAllMessages(selectedUser._id);
      }
    }
  };

  if (!selectedUser) return <div className="flex-1 flex items-center justify-center">No user selected</div>;

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader onDeleteAll={handleDeleteAllMessages} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader onDeleteAll={handleDeleteAllMessages} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === authUser._id;
          return (
            <div key={message._id} className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}>
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border border-base-300">
                  <img src={isOwnMessage ? authUser.profilePic || "/avatar.png" : (selectedUser.profilePic || "/avatar.png")} alt="avatar" />
                </div>
              </div>
              <div className="chat-header mb-1 opacity-70">
                <span className="text-xs font-medium">{isOwnMessage ? "You" : selectedUser.fullName}</span>
                <time className="text-xs ml-1">{formatMessageTime(message.createdAt)}</time>
              </div>
              <div className={`chat-bubble max-w-xs sm:max-w-md ${isOwnMessage ? "chat-bubble-primary" : "bg-base-200"} relative group`}>
                {message.image && <img src={message.image} alt="Attachment" className="max-w-full rounded-lg mb-2" />}
                {message.text && (
                  <div className="break-words">
                    {isEncryptionDemoEnabled ? (
                      <span className="font-mono text-[10px] break-all opacity-70">
                        {message._encryptedText || "Encrypted Content"}
                      </span>
                    ) : (
                      (message.text || "").split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                        // Check if it's a collab link
                        if (part.match(/collab\/[a-zA-Z0-9-]+/)) {
                          const sessionId = part.split('/collab/')[1];
                          return (
                            <Link
                              key={index}
                              to={`/collab/${sessionId}`}
                              className={`underline font-bold ${isOwnMessage ? "text-white" : "text-primary"} hover:opacity-80`}
                            >
                              {part}
                            </Link>
                          );
                        }
                        // Check if it's a general external link
                        if (part.match(/^https?:\/\//)) {
                          return (
                            <a
                              key={index}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline ${isOwnMessage ? "text-white" : "text-blue-600"} hover:opacity-80`}
                            >
                              {part}
                            </a>
                          );
                        }
                        return part;
                      })
                    )}
                  </div>
                )}
              </div>
              <div className="chat-footer opacity-50 text-xs mt-1">{message.seen ? "Seen" : "Delivered"}</div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;