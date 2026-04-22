import { useState, useEffect, useRef } from "react";
import { useCollabStore } from "../../store/useCollabStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Send, Copy, Phone, Video } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import CollabParticipants from "./CollabParticipants";
import CallModal from "./CallModal";

const CollabChat = ({ sessionId }) => {
  const { socket, chatMessages, sendChatMessage, participants, initiateCall } = useCollabStore();
  const { authUser } = useAuthStore();
  const [newMessage, setNewMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const messagesEndRef = useRef(null);

  // Generate share link on component mount
  useEffect(() => {
    // Just use the current URL or construct it from sessionId
    setShareLink(`${window.location.origin}/collab/${sessionId}`);
  }, [sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !authUser) {
      console.log("Cannot send message: ", {
        newMessage: newMessage.trim(),
        socket: socket,
        authUser: authUser
      });
      return;
    }

    const message = {
      userId: authUser._id,
      userName: authUser.fullName,
      text: newMessage,
      timestamp: new Date(),
    };

    console.log("Sending message:", message);
    // Send the message through the store
    sendChatMessage(sessionId, message);
    setNewMessage("");
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleCall = (type = "video") => {
    const otherParticipants = Object.values(participants).filter(p => p.id !== authUser?._id);
    if (otherParticipants.length > 0) {
      if (authUser) {
        initiateCall(sessionId, otherParticipants[0].id, {
          id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic
        }, type);
      }
    } else {
      toast.error("No other participants to call!");
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      {/* Call Modal */}
      <CallModal sessionId={sessionId} />

      {/* Chat Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Team Chat</h3>
          <p className="text-[10px] text-base-content/50 uppercase tracking-widest font-bold">Session Workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleCall('voice')}
            className="btn btn-sm btn-ghost btn-circle text-primary"
            title="Voice Call"
          >
            <Phone size={18} />
          </button>
          <button 
            onClick={() => handleCall('video')}
            className="btn btn-sm btn-ghost btn-circle text-primary"
            title="Video Call"
          >
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="p-4 border-b border-base-300">
        <CollabParticipants sessionId={sessionId} />
      </div>

      {/* Share Link Section */}
      <div className="p-4 border-b border-base-300 bg-base-200">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Share this link</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="input input-bordered input-sm flex-1"
            />
            <button
              onClick={copyShareLink}
              className="btn btn-square btn-sm"
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-base-content/50 py-8">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isOwnMessage = msg.userId === authUser?._id;
            return (
              <div key={index} className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}>
                <div className="chat-header">
                  {isOwnMessage ? "You" : msg.userName}
                  <time className="text-xs opacity-50 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                <div className={`chat-bubble ${isOwnMessage ? "chat-bubble-primary" : ""}`}>{msg.text}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-base-300">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input input-bordered flex-1 input-sm"
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!newMessage.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollabChat;