import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CollabEditor from "../components/collab/CollabEditor";
import CollabSidebar from "../components/collab/CollabSidebar";
import RightSidebar from "../components/collab/RightSidebar";
import TerminalPanel from "../components/collab/mcp/TerminalPanel";
import AIConfigModal from "../components/collab/mcp/AIConfigModal";
import IDEHeader from "../components/collab/IDEHeader";
import ActivityBar from "../components/collab/ActivityBar";
import CollabExtensions from "../components/collab/CollabExtensions";
import CollabSearch from "../components/collab/CollabSearch";
import CollabGit from "../components/collab/CollabGit";
import CollabDebug from "../components/collab/CollabDebug";
import CollabMCP from "../components/collab/CollabMCP";
import CollabGenerator from "../components/collab/CollabGenerator";
import { useCollabStore } from "../store/useCollabStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Bug } from "lucide-react";

const CollabPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, connect, disconnect, sendUserInfo, activeFile } = useCollabStore();
  const { authUser } = useAuthStore();

  // Layout State
  const [activeView, setActiveView] = useState("files");
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false); // Bottom panel
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (sessionId) {
      connect(sessionId, token);
    }
    return () => disconnect();
  }, [sessionId, connect, disconnect]);

  useEffect(() => {
    if (!socket) {
      setConnectionStatus("disconnected");
      return;
    }
    const handleConnect = () => {
      setConnectionStatus("connected");
      if (authUser) {
        setTimeout(() => {
          sendUserInfo(sessionId, { id: authUser._id, name: authUser.fullName });
        }, 100);
      }
    };
    const handleDisconnect = () => setConnectionStatus("disconnected");
    const handleConnectError = () => setConnectionStatus("error");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) setConnectionStatus("connected");

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, authUser, sessionId, sendUserInfo]);

  const handleLeaveSession = () => {
    disconnect();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] overflow-hidden text-gray-300 font-sans">
      {/* 1. IDE Header (Menu Bar + Controls) */}
      <IDEHeader
        fileName={activeFile?.name}
        autoSave={autoSaveEnabled}
        setAutoSave={setAutoSaveEnabled}
        onRun={() => setShowTerminal(true)} // 'Run' opens terminal
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        onToggleSidebar={() => setShowLeftSidebar(!showLeftSidebar)}
        onLeave={handleLeaveSession}
        connectionStatus={connectionStatus}
      />

      {/* 2. Main Workspace (3-Pane Layout) */}
      <div className="flex-1 flex overflow-hidden">

        {/* Activity Bar */}
        <ActivityBar
          activeView={activeView}
          setActiveView={(view) => {
            if (activeView === view && showLeftSidebar) {
              setShowLeftSidebar(false);
            } else {
              setActiveView(view);
              setShowLeftSidebar(true);
            }
          }}
        />

        {/* Left Sidebar (Files) */}
        {showLeftSidebar && (
          <div className="w-64 border-r border-[#27272a] bg-[#18181b] flex flex-col transition-all duration-300 ease-in-out">
            {activeView === 'files' && (
              <CollabSidebar sessionId={sessionId} compacted={true} />
            )}
            {activeView === 'search' && (
              <CollabSearch />
            )}
            {activeView === 'git' && (
              <CollabGit />
            )}
            {activeView === 'extensions' && (
              <CollabExtensions />
            )}
            {activeView === 'debug' && (
              <CollabDebug />
            )}
            {activeView === 'mcp' && (
              <CollabMCP />
            )}
            {/* Gen is now an overlay, handled outside this sidebar layout */}

            {!['files', 'search', 'git', 'extensions', 'debug', 'mcp'].includes(activeView) && activeView !== 'gen' && (
              <div className="p-4 text-gray-500 text-xs uppercase tracking-wider font-bold">
                {activeView.toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Generator Overlay */}
        {activeView === 'gen' && (
          <CollabGenerator onClose={() => setActiveView('files')} />
        )}
        {/* Center: Editor + Bottom Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] relative">
          {/* Editor Area */}
          <div className="flex-1 relative">
            <CollabEditor sessionId={sessionId} />
          </div>

          {/* Bottom Panel (Terminal) */}
          {showTerminal && (
            <div className="h-48 border-t border-[#27272a] bg-[#18181b]">
              <div className="flex justify-between items-center px-4 py-1 bg-[#18181b] border-b border-[#27272a]">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Terminal</span>
                <button onClick={() => setShowTerminal(false)} className="text-gray-500 hover:text-white"><X size={12} /></button>
              </div>
              <div className="h-[calc(100%-24px)]">
                <TerminalPanel />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (AI & Chat) */}
        {showRightSidebar && (
          <RightSidebar
            sessionId={sessionId}
            onConfigureAI={() => setShowAIConfig(true)}
          />
        )}

      </div>

      {/* 3. Status Bar (Footer) */}
      <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-xs justify-between select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>main*</span>
          </div>
          <span>{connectionStatus}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded">Spaces: 2</span>
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded">UTF-8</span>
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded">JavaScript</span>
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded">Prettier</span>
        </div>
      </div>

      {/* Generic Modals */}
      <AIConfigModal isOpen={showAIConfig} onClose={() => setShowAIConfig(false)} />
    </div>
  );
};

export default CollabPage;
