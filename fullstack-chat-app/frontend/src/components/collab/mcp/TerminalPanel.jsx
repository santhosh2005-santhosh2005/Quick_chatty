import { useState, useRef, useEffect } from "react";
import { useAIStore } from "../../../store/useAIStore";
import { useCollabStore } from "../../../store/useCollabStore";
import { Send, Terminal as TerminalIcon, Bot, Play, Trash2, Settings } from "lucide-react";

const TerminalPanel = ({ onConfigureAI }) => {
    const { messages, askAI, isLoading, isConfigured } = useAIStore();
    const { activeFile } = useCollabStore();
    const [input, setInput] = useState("");
    const [activeTab, setActiveTab] = useState("ai"); // 'ai' or 'terminal'
    const [terminalOutput, setTerminalOutput] = useState([]);
    const messagesEndRef = useRef(null);
    const terminalEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalOutput]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (activeTab === 'ai') {
            const currentCode = activeFile ? `\nCurrent Code in ${activeFile.name}:\n\`\`\`${activeFile.name.split('.').pop()}\n${activeFile.content}\n\`\`\`` : "";
            const systemContext = "You are a helpful coding assistant. You can see the user's current code below." + currentCode;

            const userPrompt = input;
            setInput("");
            await askAI(userPrompt, systemContext);
        } else {
            // Terminal execution simulation
            handleRunCommand(input);
            setInput("");
        }
    };

    const handleRunCommand = (cmd) => {
        const newOutput = [...terminalOutput, { type: 'command', text: `> ${cmd}` }];

        // Simple JS Eval Sandbox (Very limited/unsafe for real prod, but okay for demo)
        // Capture console.log
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(' '));

        try {
            // eslint-disable-next-line no-eval
            const result = eval(cmd);
            if (logs.length > 0) {
                newOutput.push({ type: 'log', text: logs.join('\n') });
            }
            if (result !== undefined) {
                newOutput.push({ type: 'result', text: String(result) });
            }
        } catch (err) {
            newOutput.push({ type: 'error', text: err.toString() });
        } finally {
            console.log = originalLog;
            setTerminalOutput(newOutput);
        }
    };

    const clearTerminal = () => setTerminalOutput([]);

    return (
        <div className="flex flex-col h-full bg-base-100 border-t border-base-300">
            {/* Tabs */}
            <div className="flex items-center border-b border-base-300 bg-base-200">
                <button
                    onClick={() => setActiveTab("ai")}
                    className={`px-4 py-2 flex items-center gap-2 text-sm font-medium ${activeTab === "ai" ? "bg-base-100 border-t-2 border-primary" : "hover:bg-base-300"}`}
                >
                    <Bot size={16} />
                    AI Assistant
                </button>
                <button
                    onClick={() => setActiveTab("terminal")}
                    className={`px-4 py-2 flex items-center gap-2 text-sm font-medium ${activeTab === "terminal" ? "bg-base-100 border-t-2 border-primary" : "hover:bg-base-300"}`}
                >
                    <TerminalIcon size={16} />
                    Terminal / Console
                </button>
                <div className="ml-auto px-2 flex gap-2">
                    {activeTab === 'ai' && !isConfigured && (
                        <button onClick={onConfigureAI} className="btn btn-xs btn-warning">Configure AI</button>
                    )}
                    {activeTab === 'ai' && isConfigured && (
                        <button onClick={onConfigureAI} className="btn btn-xs btn-ghost"><Settings size={14} /></button>
                    )}
                    {activeTab === 'terminal' && (
                        <button onClick={clearTerminal} className="btn btn-xs btn-ghost text-error"><Trash2 size={14} /></button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#1e1e1e] text-gray-300">
                {activeTab === "ai" ? (
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-4">
                                <Bot size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Ask me anything about your code!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                                    ? "bg-primary text-primary-content"
                                    : msg.role === "error"
                                        ? "bg-error/20 text-error border border-error/50"
                                        : "bg-base-300"
                                    }`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-base-300 rounded-lg p-3 animate-pulse">Thinking...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="text-gray-500 mb-2">// JavaScript Console Sandbox</div>
                        {terminalOutput.map((line, idx) => (
                            <div key={idx} className={`
                ${line.type === 'command' ? 'text-blue-400 font-bold' : ''}
                ${line.type === 'error' ? 'text-red-400' : ''}
                ${line.type === 'result' ? 'text-green-400' : ''}
                ${line.type === 'log' ? 'text-gray-300' : ''}
              `}>
                                {line.text}
                            </div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-2 bg-base-200 border-t border-base-300 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeTab === "ai" ? "Ask a question..." : "Enter JavaScript to run..."}
                    className="input input-sm flex-1 font-mono"
                />
                <button
                    type="submit"
                    className={`btn btn-sm ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={activeTab === 'ai' && (isLoading || !isConfigured)}
                >
                    {activeTab === "ai" ? <Send size={16} /> : <Play size={16} />}
                    {activeTab === "ai" ? "Send" : "Run"}
                </button>
            </form>
        </div>
    );
};

export default TerminalPanel;
