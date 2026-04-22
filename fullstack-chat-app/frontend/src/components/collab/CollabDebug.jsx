import { useState, useEffect } from "react";
import { Play, Pause, StepForward, RefreshCw, Bug, Trash2, Plus, Ban } from "lucide-react";
import { useCollabStore } from "../../store/useCollabStore";
import toast from "react-hot-toast";

const CollabDebug = () => {
    const { activeFile } = useCollabStore();
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState([]);
    const [variables, setVariables] = useState([]);
    const [watchList, setWatchList] = useState(["params", "user_id"]);

    // Simple code parser to find declared variables for the "Variables" view
    useEffect(() => {
        if (activeFile?.content) {
            const vars = [];
            const regex = /(?:const|let|var)\s+(\w+)\s*=/g;
            let match;
            while ((match = regex.exec(activeFile.content)) !== null) {
                vars.push({ name: match[1], value: "undefined" });
            }
            setVariables(vars);
        }
    }, [activeFile]);

    const handleRun = async () => {
        if (!activeFile) return;

        setIsRunning(true);
        setOutput([]);
        toast.success("Starting Debug Session...");

        // Simulate initialization
        await new Promise(r => setTimeout(r, 800));
        setOutput(prev => [...prev, `> node ${activeFile.name}`]);

        try {
            // Capture console.logs
            const logs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                logs.push(args.join(" "));
                originalLog(...args); // Keep original behavior too
            };

            // Safe-ish eval for demonstration (Use with caution in prod)
            // We wrap it to prevent breaking the app, but allowing basic JS execution
            if (activeFile.name.endsWith('.js') || activeFile.name.endsWith('.jsx')) {
                try {
                    // Primitive execution
                    // eslint-disable-next-line no-new-func
                    new Function(activeFile.content)();

                    // Update variables with fake values to simulate "runtime" state
                    setVariables(prev => prev.map(v => ({
                        ...v,
                        value: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : '"string_val"'
                    })));

                } catch (e) {
                    console.log("Error:", e.message);
                }
            } else {
                console.log("Debugger: File type not supported for live execution.");
            }

            // Restore log
            console.log = originalLog;

            // Stream logs to UI
            logs.forEach((log, i) => {
                setTimeout(() => {
                    setOutput(prev => [...prev, log]);
                }, i * 100);
            });

        } catch (error) {
            setOutput(prev => [...prev, `Error: ${error.message}`]);
        } finally {
            setTimeout(() => setIsRunning(false), 1500);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#18181b] text-gray-300">
            {/* Header */}
            <div className="p-3 border-b border-[#27272a] flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Run and Debug</span>
                <div className="flex gap-2">
                    <Plus size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                    <RefreshCw size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                </div>
            </div>

            {/* Controls */}
            <div className="p-3 bg-[#18181b] border-b border-[#27272a]">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${isRunning ? 'bg-red-500/20 text-red-400' : 'bg-green-600 text-white hover:bg-green-500'
                            }`}
                    >
                        {isRunning ? <Pause size={14} /> : <Play size={14} />}
                        {isRunning ? "Stop" : "Run Script"}
                    </button>
                    <button className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-300" title="Step Over">
                        <StepForward size={14} />
                    </button>
                </div>

                <div className="text-xs text-gray-500 bg-[#27272a] p-2 rounded flex items-center justify-between">
                    <span>Configuration: Node.js</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* VARIABLES SECTION */}
                <div className="border-b border-[#27272a]">
                    <div className="px-3 py-1 bg-[#1e1e20] text-xs font-bold text-gray-400 flex items-center cursor-pointer hover:text-white">
                        <span className="mr-2">▼</span> VARIABLES
                    </div>
                    <div className="px-3 py-2">
                        {variables.length > 0 ? variables.map((v, i) => (
                            <div key={i} className="flex text-xs font-mono my-0.5 group">
                                <span className="text-blue-400 min-w-[80px] truncate">{v.name}:</span>
                                <span className="text-orange-300 truncate">{v.value}</span>
                            </div>
                        )) : (
                            <div className="text-xs text-gray-500 italic">No variables found</div>
                        )}
                    </div>
                </div>

                {/* WATCH SECTION */}
                <div className="border-b border-[#27272a]">
                    <div className="px-3 py-1 bg-[#1e1e20] text-xs font-bold text-gray-400 flex items-center justify-between cursor-pointer hover:text-white group">
                        <div className="flex items-center"><span className="mr-2">▼</span> WATCH</div>
                        <Plus size={12} className="opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="px-3 py-2">
                        {watchList.map((w, i) => (
                            <div key={i} className="flex text-xs font-mono my-0.5 justify-between group">
                                <div className="flex gap-2">
                                    <span className="text-blue-400">{w}:</span>
                                    <span className="text-gray-500">undefined</span>
                                </div>
                                <Trash2 size={10} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => setWatchList(prev => prev.filter(item => item !== w))} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CALL STACK SECTION */}
                <div className="border-b border-[#27272a]">
                    <div className="px-3 py-1 bg-[#1e1e20] text-xs font-bold text-gray-400 flex items-center cursor-pointer hover:text-white">
                        <span className="mr-2">▼</span> CALL STACK
                    </div>
                    <div className="px-3 py-2 text-xs text-gray-400 space-y-1">
                        {isRunning ? (
                            <>
                                <div className="text-yellow-500">Running {activeFile?.name || "script"}...</div>
                                <div className="pl-4 text-gray-500">at Object.&lt;anonymous&gt; (loader.js:4:1)</div>
                            </>
                        ) : (
                            <div className="italic text-gray-600">Not paused</div>
                        )}
                    </div>
                </div>

                {/* BREAKPOINTS SECTION */}
                <div className="border-b border-[#27272a]">
                    <div className="px-3 py-1 bg-[#1e1e20] text-xs font-bold text-gray-400 flex items-center justify-between cursor-pointer hover:text-white">
                        <span className="mr-2">▼</span> BREAKPOINTS
                        <Plus size={12} />
                    </div>
                    <div className="px-3 py-2 text-xs flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400/20 border border-red-500"></div>
                        <span className="text-gray-500 text-[10px]">Uncaught Exceptions</span>
                    </div>
                </div>

                {/* DEBUG CONSOLE (Mini) */}
                <div className="mt-4 px-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400">DEBUG CONSOLE</span>
                        <Ban size={12} className="text-gray-500 hover:text-white cursor-pointer" onClick={() => setOutput([])} />
                    </div>
                    <div className="bg-[#121214] rounded p-2 h-32 overflow-y-auto font-mono text-xs border border-[#27272a]">
                        {output.length === 0 && <span className="text-gray-600">output will appear here...</span>}
                        {output.map((line, i) => (
                            <div key={i} className="text-gray-300 border-b border-white/5 py-0.5">{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollabDebug;
