import { useState, useRef, useEffect } from "react";
import { Files, Search, GitGraph, Bug, Puzzle, Settings, CircleUser, LogOut, Command, Palette, Keyboard, User, Download, Server, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

const ActivityBar = ({ activeView, setActiveView }) => {
    const { authUser, logout } = useAuthStore();
    const [activePopup, setActivePopup] = useState(null); // 'accounts', 'settings', or null
    const barRef = useRef(null);

    const topIcons = [
        { id: 'files', icon: Files, tooltip: 'Explorer' },
        { id: 'search', icon: Search, tooltip: 'Search' },
        { id: 'gen', icon: Sparkles, tooltip: 'AI Architect' },
        { id: 'git', icon: GitGraph, tooltip: 'Source Control' },
        { id: 'debug', icon: Bug, tooltip: 'Run and Debug' },
        { id: 'mcp', icon: Server, tooltip: 'MCP Servers' },
        { id: 'extensions', icon: Puzzle, tooltip: 'Extensions' },
    ];

    // Close popups when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (barRef.current && !barRef.current.contains(event.target)) {
                setActivePopup(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const togglePopup = (popup) => {
        setActivePopup(activePopup === popup ? null : popup);
    };

    const handleLogout = () => {
        logout();
        setActivePopup(null);
    };

    return (
        <div ref={barRef} className="w-12 bg-[#18181b] flex flex-col items-center py-2 justify-between h-full select-none border-r border-[#27272a] relative z-50">
            {/* Top Icons */}
            <div className="flex flex-col w-full">
                {topIcons.map(({ id, icon: Icon, tooltip }) => (
                    <button
                        key={id}
                        onClick={() => setActiveView(id)}
                        className={`w-full flex justify-center py-3 relative group transition-colors ${activeView === id
                            ? 'text-white'
                            : 'text-[#858585] hover:text-white'
                            }`}
                        title={tooltip}
                    >
                        <Icon size={24} strokeWidth={1.5} />
                        {activeView === id && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Bottom Icons */}
            <div className="flex flex-col w-full pb-2 relative">

                {/* ACCOUNTS BUTTON */}
                <button
                    onClick={() => togglePopup('accounts')}
                    className={`w-full flex justify-center py-3 transition-colors ${activePopup === 'accounts' ? 'text-white' : 'text-[#858585] hover:text-white'}`}
                    title="Accounts"
                >
                    {authUser?.profilePic ? (
                        <img src={authUser.profilePic} alt="User" className="w-6 h-6 rounded-full border border-gray-600" />
                    ) : (
                        <CircleUser size={24} strokeWidth={1.5} />
                    )}
                </button>

                {/* SETTINGS BUTTON */}
                <button
                    onClick={() => togglePopup('settings')}
                    className={`w-full flex justify-center py-3 transition-colors ${activePopup === 'settings' ? 'text-white' : 'text-[#858585] hover:text-white'}`}
                    title="Manage"
                >
                    <Settings size={24} strokeWidth={1.5} />
                </button>

                {/* MENUS */}
                {activePopup === 'accounts' && (
                    <div className="absolute left-11 bottom-12 w-64 bg-[#1f1f22] border border-[#454545] rounded shadow-xl text-gray-300 py-1 text-xs">
                        {authUser ? (
                            <>
                                <div className="px-3 py-2 border-b border-[#333] mb-1">
                                    <div className="font-medium text-white">{authUser.fullName || "User"}</div>
                                    <div className="text-gray-500 truncate">{authUser.email}</div>
                                </div>
                                <div className="px-2">
                                    <button className="w-full text-left px-2 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center gap-2" onClick={() => toast.success("Status set to Online")}>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Set Status
                                    </button>
                                </div>
                                <div className="h-[1px] bg-[#333] my-1"></div>
                                <div className="px-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-2 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center gap-2 text-red-400 hover:text-white"
                                    >
                                        <LogOut size={14} /> Sign Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="px-3 py-2 text-center text-gray-500">Not signed in</div>
                        )}
                    </div>
                )}

                {activePopup === 'settings' && (
                    <div className="absolute left-11 bottom-2 w-72 bg-[#1f1f22] border border-[#454545] rounded shadow-xl text-gray-300 py-1 text-sm">
                        <div className="px-2 space-y-0.5">
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center justify-between group" onClick={() => toast("Command Palette (Ctrl+Shift+P)")}>
                                <span>Command Palette...</span>
                                <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Ctrl+Shift+P</span>
                            </button>
                            <div className="h-[1px] bg-[#333] my-1"></div>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center justify-between group" onClick={() => toast("Settings (Ctrl+,)")}>
                                <span>Settings</span>
                                <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Ctrl+,</span>
                            </button>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded" onClick={() => toast("Extensions")}>Extensions</button>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded" onClick={() => toast("Keyboard Shortcuts")}>Keyboard Shortcuts</button>
                            <div className="h-[1px] bg-[#333] my-1"></div>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded" onClick={() => toast("User Snippets")}>User Snippets</button>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center justify-between group" onClick={() => toast("Color Theme")}>
                                <span>Color Theme</span>
                                <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Ctrl+K Ctrl+T</span>
                            </button>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center gap-2" onClick={() => toast("File Icon Theme")}>
                                File Icon Theme
                            </button>
                            <div className="h-[1px] bg-[#333] my-1"></div>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white rounded flex items-center justify-between" onClick={() => toast.success("Already on latest version")}>
                                <span>Check for Updates...</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ActivityBar;
