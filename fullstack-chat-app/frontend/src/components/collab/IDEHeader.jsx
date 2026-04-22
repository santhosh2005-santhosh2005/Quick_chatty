import {
    Play, Terminal, Save, LogOut, Wifi, WifiOff, Users, Code2
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useCollabStore } from "../../store/useCollabStore";

const IDEHeader = ({
    fileName,
    onSave,
    onRun,
    onToggleTerminal,
    onToggleSidebar,
    onLeave,
    autoSave,
    setAutoSave,
    connectionStatus
}) => {
    const { authUser } = useAuthStore();
    const { participants } = useCollabStore();

    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case "connected": return "text-green-400";
            case "connecting": return "text-yellow-400";
            case "disconnected": return "text-red-400";
            case "error": return "text-red-500";
            default: return "text-gray-400";
        }
    };

    return (
        <div className="h-14 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between px-4 select-none text-gray-300 shadow-md z-20">
            {/* Left: Branding & Connection */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
                        <Code2 size={20} />
                    </div>
                    <span className="font-bold text-white hidden sm:block tracking-tight text-lg">Collab</span>
                </div>

                <div className="h-6 w-[1px] bg-[#27272a] mx-2"></div>

                {/* Connection Status */}
                <div className="flex items-center gap-2 bg-[#27272a]/50 px-3 py-1.5 rounded-full border border-white/5">
                    {connectionStatus === "connected" ? (
                        <Wifi size={14} className={getConnectionStatusColor()} />
                    ) : (
                        <WifiOff size={14} className={getConnectionStatusColor()} />
                    )}
                    <span className={`text-xs font-medium ${getConnectionStatusColor()} capitalize`}>
                        {connectionStatus}
                    </span>
                </div>
            </div>

            {/* Center: Controls (Terminal, AutoSave, Run) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-3">
                {/* Run Project */}
                <button
                    onClick={onRun}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md transition-all shadow-lg hover:shadow-green-500/20 font-medium text-xs"
                >
                    <Play size={14} fill="currentColor" />
                    Run Project
                </button>

                {/* Toggle Terminal */}
                <button
                    onClick={onToggleTerminal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 hover:text-white rounded-md transition-all text-xs border border-white/5"
                >
                    <Terminal size={14} />
                    Terminal
                </button>

                {/* Auto Save Toggle */}
                <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs border ${autoSave
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-[#27272a] text-gray-400 border-white/5 hover:bg-[#3f3f46]'
                        }`}
                >
                    <Save size={14} />
                    {autoSave ? 'Auto-Save On' : 'Auto-Save Off'}
                </button>
            </div>

            {/* Right: User & Session Actions */}
            <div className="flex items-center gap-3">
                {/* Participants Count */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#27272a] rounded-full text-xs text-gray-400 border border-white/5">
                    <Users size={14} />
                    <span>{participants ? participants.size : 1} active</span>
                </div>

                <div className="h-6 w-[1px] bg-[#27272a] mx-1"></div>

                <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                        <div className="text-xs font-medium text-white">{authUser?.fullName}</div>
                        <div className="text-[10px] text-gray-500">Online</div>
                    </div>
                    <img
                        src={authUser?.profilePic || "/avatar.png"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border border-[#27272a]"
                    />
                </div>

                <button
                    onClick={onLeave}
                    className="ml-2 p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Leave Session"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
};

export default IDEHeader;
