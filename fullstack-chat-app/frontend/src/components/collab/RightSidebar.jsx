import { useState, useRef, useEffect } from "react";
import { useAIStore } from "../../store/useAIStore";
import { Send, Bot, Terminal as TerminalIcon, Sparkles, MessageSquare, Settings } from "lucide-react";
import CollabChat from "./CollabChat";

// New Right Sidebar that combines AI and Team Chat
const RightSidebar = ({ sessionId, onConfigureAI }) => {
    const [activeTab, setActiveTab] = useState("ai"); // 'ai' or 'chat'
    const { messages, askAI, isLoading, isConfigured } = useAIStore();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeTab]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // AI Logic
        const userPrompt = input;
        setInput("");
        // We can inject context about the active file here if we lift the state or pass it in
        await askAI(userPrompt);
    };

    return (
        <div className="w-80 h-full bg-[#18181b] border-l border-[#27272a] flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-[#27272a] bg-[#18181b]">
                <button
                    onClick={() => setActiveTab("ai")}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
            ${activeTab === "ai" ? "text-white" : "text-gray-500 hover:text-gray-300"}
          `}
                >
                    <Sparkles size={16} className={activeTab === "ai" ? "text-purple-400" : ""} />
                    AI Assistant
                    {activeTab === "ai" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500"></div>}
                </button>
                <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
            ${activeTab === "chat" ? "text-white" : "text-gray-500 hover:text-gray-300"}
          `}
                >
                    <MessageSquare size={16} className={activeTab === "chat" ? "text-blue-400" : ""} />
                    Team Chat
                    {activeTab === "chat" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "ai" ? (
                    <div className="h-full flex flex-col">
                        {/* AI Header / Config */}
                        {!isConfigured && (
                            <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
                                <p className="text-xs text-yellow-200 mb-2">Configure AI to start coding smarter.</p>
                                <button onClick={onConfigureAI} className="btn btn-xs btn-outline btn-warning w-full">Set API Key</button>
                            </div>
                        )}
                        {isConfigured && (
                            <div className="p-2 border-b border-[#27272a] flex justify-end">
                                <button onClick={onConfigureAI} className="p-1 hover:bg-[#27272a] rounded text-gray-500 hover:text-gray-300">
                                    <Settings size={14} />
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center space-y-4 opacity-50">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                        <Bot size={32} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">How can I help you code today?</p>
                                        <p className="text-xs mt-2">Try: "Fix this bug" or "Explain this code"</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                                            ? "bg-purple-600 text-white"
                                            : msg.role === "error"
                                                ? "bg-red-900/50 text-red-200 border border-red-800"
                                                : "bg-[#27272a] text-gray-200"
                                            }`}>
                                            <div className="whitespace-pre-wrap">{msg.text}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#27272a] rounded-2xl px-4 py-3 text-sm text-gray-400 animate-pulse flex items-center gap-2">
                                        <Sparkles size={12} className="animate-spin" />
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-[#18181b] border-t border-[#27272a]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={!isConfigured || isLoading}
                                    placeholder={isConfigured ? "Ask AI..." : "Configure API First"}
                                    className="w-full bg-[#27272a] text-white text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading || !isConfigured}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Team Chat Tab */
                    <div className="h-full flex flex-col">
                        <CollabChat sessionId={sessionId} compact={true} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSidebar;
