import { useAuthStore } from "../store/useAuthStore";
import { LogOut, Users, Code, Trash2, UserPlus, X, Lock, Unlock, Phone, Video } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ onDeleteAll }) => {
  const { logout, authUser, onlineUsers } = useAuthStore();
  const { selectedUser, setSelectedUser, toggleEncryptionDemo, isEncryptionDemoEnabled } = useChatStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      logout();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const handleCreateCollabSession = async () => {
    try {
      const res = await axiosInstance.post("/collab/create");
      window.open(res.data.shareLink, '_blank');
      toast.success("Collaboration session created!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create session");
    }
  };

  const handleCall = (type) => {
    if (selectedUser) {
      useChatStore.getState().initiateCall(selectedUser._id, authUser, type);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300 flex items-center justify-between bg-base-100/50 backdrop-blur-sm relative z-10">
      <div className="flex items-center gap-3">
        {selectedUser ? (
          <>
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="object-cover rounded-full" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base">{selectedUser.fullName}</h2>
              <p className="text-[10px] sm:text-xs text-base-content/70 flex items-center gap-1">
                {onlineUsers.some(id => String(id) === String(selectedUser._id)) ? (
                  <><span className="w-2 h-2 bg-green-500 rounded-full"></span> Online</>
                ) : (
                  <><span className="w-2 h-2 bg-gray-400 rounded-full"></span> Offline</>
                )}
              </p>
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-semibold">QuickChat</h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {selectedUser && (
          <div className="flex items-center gap-1 mr-2 sm:mr-4 border-r border-base-300 pr-2 sm:pr-4">
            <button className="btn btn-sm btn-ghost btn-circle text-primary" onClick={() => handleCall('voice')}><Phone size={18} /></button>
            <button className="btn btn-sm btn-ghost btn-circle text-primary" onClick={() => handleCall('video')}><Video size={18} /></button>
          </div>
        )}

        <button onClick={toggleEncryptionDemo} className={`btn btn-sm btn-circle ${isEncryptionDemoEnabled ? "btn-warning" : "btn-ghost"}`}>
          {isEncryptionDemoEnabled ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={handleCreateCollabSession}><Code size={18} /></button>

        <button onClick={handleLogout} className="btn btn-sm btn-ghost text-error"><LogOut size={18} /></button>
        <button onClick={() => setSelectedUser(null)} className="btn btn-sm btn-ghost md:hidden"><X size={18} /></button>
      </div>
    </div>
  );
};

export default ChatHeader;