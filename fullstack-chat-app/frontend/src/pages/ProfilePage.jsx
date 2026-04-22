import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { 
  Camera, Mail, User, Shield, Trash2, MessageSquare, 
  Phone, Video, ChevronLeft, MoreVertical, Bell, 
  Lock, Image as ImageIcon, MessageCircle, CreditCard,
  Clock
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, isDeletingAccount, deleteUser } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    about: "QuickChat Explorer. Passionate about real-time connectivity and secure communications. Part of the 5th semester project team.",
  });
  const navigate = useNavigate();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleUpdateProfile = async () => {
    await updateProfile({
      fullName: formData.fullName,
      // In a real app, you'd have an 'about' field in your DB model
      // For now we'll just update fullName and toggle off editing
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      await deleteUser();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7ECE1] relative pb-10">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-6">
        <button onClick={() => navigate(-1)} className="hover:scale-110 transition-transform">
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>
        <div className="w-20 h-8 bg-black rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-2"></div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-1 border-2 border-black rounded-full font-black uppercase text-[10px] neo-shadow-sm transition-all
            ${isEditing ? "bg-red-400" : "bg-white"}
          `}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-[#f6a5b6] flex items-center justify-center border-4 border-black neo-shadow-sm p-1">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-black"
              />
            </div>
            <label
              htmlFor="avatar-upload"
              className={`
                absolute bottom-2 right-2 
                bg-white border-2 border-black
                p-2 rounded-full cursor-pointer 
                transition-all duration-200 neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px]
                ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
              `}
            >
              <Camera className="w-5 h-5 text-black" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </label>
          </div>
          
          <div className="mt-4 text-center w-full">
            {isEditing ? (
              <input 
                type="text"
                className="text-2xl font-black text-black tracking-tight uppercase italic border-2 border-black p-2 bg-transparent w-full text-center outline-none focus:bg-white transition-colors"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            ) : (
              <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">{authUser?.fullName}</h1>
            )}
            <p className="text-black/60 font-medium text-sm tracking-widest uppercase mt-1">{authUser?.email}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-8 py-2">
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center neo-shadow-sm group-hover:bg-[#a487ff] transition-colors">
              <MessageSquare className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-black uppercase text-black">Chat</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center neo-shadow-sm group-hover:bg-[#37d67a] transition-colors">
              <Phone className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-black uppercase text-black">Audio</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center neo-shadow-sm group-hover:bg-[#ff8e6e] transition-colors">
              <Video className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-black uppercase text-black">Video</span>
          </div>
        </div>

        {/* About Section */}
        <div className="neo-card bg-white p-6 space-y-2">
          <h2 className="text-lg font-black uppercase tracking-tight text-black italic">About</h2>
          {isEditing ? (
            <textarea 
              className="w-full h-24 border-2 border-black p-4 bg-gray-50 focus:bg-white font-medium leading-relaxed outline-none transition-colors"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            />
          ) : (
            <p className="text-black/70 font-medium leading-relaxed">
              {formData.about}
            </p>
          )}
        </div>

        {isEditing && (
          <button 
            onClick={handleUpdateProfile}
            disabled={isUpdatingProfile}
            className="w-full bg-[#37d67a] border-2 border-black p-4 text-lg font-black uppercase tracking-tight neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
          >
            {isUpdatingProfile ? "Saving..." : "Save Changes"}
          </button>
        )}

        {/* Settings List Card */}
        <div className="neo-card bg-white p-2 divide-y-2 divide-black/5 overflow-hidden">
          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-[#f6a5b6]">
                <ImageIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-black">Media</h3>
                <p className="text-[10px] font-bold text-black/40 uppercase">View all photos and videos</p>
              </div>
            </div>
          </div>
          {/* ... other menu items ... */}
          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-[#fdfa66]">
                <Bell className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-black">Notifications</h3>
                <p className="text-[10px] font-bold text-black/40 uppercase">Sound, Badge & Alerts</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-black/60 bg-gray-200 px-2 py-1 rounded border border-black uppercase">On</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-[#37d67a]">
                <Lock className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-black">Encryption</h3>
                <p className="text-[10px] font-bold text-black/40 uppercase">Messages are end-to-end encrypted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info Bar */}
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-black/40" />
            <span className="text-[10px] font-black uppercase text-black/40">Joined {new Date(authUser?.createdAt).toLocaleDateString()}</span>
          </div>
          <button 
            onClick={handleDeleteAccount}
            className="text-[10px] font-black uppercase text-red-500 hover:underline"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;