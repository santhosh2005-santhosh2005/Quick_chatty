import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Search, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";

const AddPeopleModal = ({ sessionId, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState({});

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // In a real implementation, you would search for users by email or name
      // For now, we'll simulate this with a mock API call
      const res = await axiosInstance.get(`/user/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(res.data.users || []);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search users");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId, userEmail, userName) => {
    setInviting(prev => ({ ...prev, [userId]: true }));
    try {
      // Send invitation to the user
      const shareLink = `${window.location.origin}/collab/${sessionId}`;
      await axiosInstance.post("/user/invite", {
        userId,
        sessionId,
        shareLink
      });
      
      toast.success(`Invitation sent to ${userName || userEmail}`);
    } catch (error) {
      console.error("Invite failed:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add People</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="form-control mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by email or name"
              className="input input-bordered flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button 
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div 
                key={user._id} 
                className="flex items-center justify-between p-2 bg-base-200 rounded"
              >
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-8">
                      <span className="text-sm">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-xs text-base-content/70">{user.email}</div>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleInvite(user._id, user.email, user.fullName)}
                  disabled={inviting[user._id]}
                >
                  {inviting[user._id] ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <UserPlus size={16} />
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-base-content/50">
              {searchTerm ? (
                <p>No users found</p>
              ) : (
                <p>Search for users to invite</p>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-base-content/70">
          <p>Invitations will be sent directly to the user's chat.</p>
        </div>
      </div>
    </div>
  );
};

export default AddPeopleModal;