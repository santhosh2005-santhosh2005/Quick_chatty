import { useState } from "react";
import { useCollabStore } from "../../store/useCollabStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Users, Phone, Video, UserPlus } from "lucide-react";
import AddPeopleModal from "./AddPeopleModal";

const CollabParticipants = ({ sessionId }) => {
  const [showAddPeopleModal, setShowAddPeopleModal] = useState(false);
  const { participants, initiateCall } = useCollabStore();
  const { authUser } = useAuthStore();

  // Convert participants object to array
  const participantsArray = Object.values(participants);

  const handleCallUser = (userId, type = "video") => {
    if (authUser) {
      initiateCall(sessionId, userId, {
        id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic
      }, type);
    }
  };

  return (
    <div className="bg-base-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Users size={16} />
        <h3 className="font-bold text-sm">Participants ({participantsArray.length})</h3>
        <button
          className="btn btn-xs btn-ghost ml-auto"
          onClick={() => setShowAddPeopleModal(true)}
          title="Add people"
        >
          <UserPlus size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {participantsArray.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-2 p-2 bg-base-100 rounded"
          >
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-6">
                <span className="text-xs">
                  {participant.name?.charAt(0)?.toUpperCase() || participant.id?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <span className="text-sm truncate flex-1">
              {participant.id === authUser?._id ? (
                <span className="font-medium">{authUser?.fullName || "You"} (You)</span>
              ) : (
                <span>{participant.name || participant.id?.substring(0, 8) || "Unknown"}</span>
              )}
            </span>
            {participant.id !== authUser?._id && (
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-xs btn-ghost btn-circle text-primary"
                  onClick={() => handleCallUser(participant.id, 'voice')}
                  title="Voice call"
                >
                  <Phone size={14} />
                </button>
                <button
                  className="btn btn-xs btn-ghost btn-circle text-primary"
                  onClick={() => handleCallUser(participant.id, 'video')}
                  title="Video call"
                >
                  <Video size={14} />
                </button>
              </div>
            )}
            <div className="badge badge-success badge-xs"></div>
          </div>
        ))}
        {participantsArray.length === 0 && (
          <p className="text-base-content/50 text-sm">No participants yet</p>
        )}
      </div>

      {showAddPeopleModal && (
        <AddPeopleModal
          sessionId={sessionId}
          onClose={() => setShowAddPeopleModal(false)}
        />
      )}
    </div>
  );
};

export default CollabParticipants;