import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Copy, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const CollabLinkShare = () => {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createSession = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/collab/create");
      setLink(res.data.shareLink);
      toast.success("Collaboration session created!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          <Share2 size={24} />
          Code Collaboration
        </h2>
        <p className="text-base-content/70">
          Create a collaboration session and share the link with others to edit code in real-time.
        </p>
        
        {!link ? (
          <button 
            onClick={createSession}
            disabled={isLoading}
            className="btn btn-primary mt-4"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Creating Session...
              </>
            ) : (
              "Create Collab Session"
            )}
          </button>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Share this link with collaborators</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={link} 
                  readOnly 
                  className="input input-bordered flex-1" 
                />
                <button 
                  onClick={copyToClipboard}
                  className="btn btn-square"
                  title="Copy to clipboard"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Code is not stored on the server. All changes are synchronized in real-time between participants.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabLinkShare;