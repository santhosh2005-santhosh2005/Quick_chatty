import { useEffect, useState } from "react";
import { Users, Search, MoreHorizontal, Trash2 } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, removeContact, unreadUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactMenu, setShowContactMenu] = useState(null); // Track which contact menu is open

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .filter((user) => {
      const isOnline = onlineUsers.includes(user._id);
      const showUser = !showOnlineOnly || isOnline;
      return showUser;
    })
    .sort((a, b) => {
      const aIsOnline = onlineUsers.some(id => String(id) === String(a._id));
      const bIsOnline = onlineUsers.some(id => String(id) === String(b._id));
      if (aIsOnline && !bIsOnline) return -1;
      if (!aIsOnline && bIsOnline) return 1;
      return a.fullName.localeCompare(b.fullName);
    });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <span className="text-sm">Online only</span>
          </label>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers && filteredUsers.map((user) => {
          const isOnline = onlineUsers.some(id => String(id) === String(user._id));
          return (
            <div key={user._id} className="relative group">
              <button
                onClick={() => setSelectedUser(user)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-200 transition-colors
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      ring-2 ring-zinc-900 rounded-full"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {useChatStore.getState().unreadUsers.includes(user._id) ? (
                       <span className="text-primary font-bold animate-pulse">New Message</span>
                    ) : (
                       isOnline ? "Online" : "Offline"
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;