import { useState } from "react";
import { GitCommit, Check, RefreshCw, Plus, Minus, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

const CollabGit = () => {
    const [message, setMessage] = useState("");
    const [changes, setChanges] = useState([
        { id: 1, name: "App.jsx", type: "modified", path: "src/App.jsx" },
        { id: 2, name: "index.css", type: "modified", path: "src/index.css" },
        { id: 3, name: "utils.js", type: "added", path: "src/utils.js" },
    ]);

    const handleCommit = () => {
        if (!message) {
            toast.error("Please enter a commit message");
            return;
        }

        toast.success(`Committing "${message}"...`);
        // Simulate commit
        setTimeout(() => {
            setChanges([]);
            setMessage("");
            toast.success("Changes committed locally!");
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-[#18181b] text-gray-300">
            <div className="p-3 border-b border-[#27272a] flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Source Control</span>
                <div className="flex gap-2">
                    <RefreshCw size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                    <MoreVertical size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                </div>
            </div>

            <div className="p-3 border-b border-[#27272a]">
                <div className="flex flex-col gap-2">
                    <textarea
                        className="w-full bg-[#27272a] text-sm text-gray-200 p-2 rounded border border-transparent focus:border-blue-500 focus:outline-none resize-none placeholder-gray-500"
                        placeholder="Message (Ctrl+Enter to commit)"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleCommit();
                        }}
                    />
                    <button
                        onClick={handleCommit}
                        disabled={changes.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#27272a] disabled:text-gray-500 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check size={14} />
                        Commit
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {changes.length > 0 ? (
                    <div className="p-2">
                        <div className="flex justify-between items-center px-2 py-1 text-xs text-gray-400 mb-1">
                            <span>Changes</span>
                            <span className="bg-[#27272a] px-1.5 rounded-full">{changes.length}</span>
                        </div>
                        {changes.map(change => (
                            <div key={change.id} className="flex items-center justify-between p-2 hover:bg-[#2a2d2e] cursor-pointer rounded group">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`text-[10px] w-3 font-bold ${change.type === 'modified' ? 'text-yellow-500' : 'text-green-500'
                                        }`}>
                                        {change.type === 'modified' ? 'M' : 'U'}
                                    </span>
                                    <span className="text-sm text-gray-300 truncate">{change.name}</span>
                                    <span className="text-xs text-gray-600 truncate">{change.path}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={12} className="text-gray-400 hover:text-white" title="Stage Changes" />
                                    <RefreshCw size={12} className="text-gray-400 hover:text-white" title="Discard Changes" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-xs text-gray-500">
                        No changes to commit.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollabGit;
