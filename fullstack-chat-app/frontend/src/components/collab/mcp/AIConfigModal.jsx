import { useState } from "react";
import { useAIStore } from "../../../store/useAIStore";
import { X, Key, Bot, ExternalLink, Sparkles } from "lucide-react";

const AIConfigModal = ({ isOpen, onClose }) => {
    const { apiKey, modelName, provider, setApiKey, setModelName, setProvider } = useAIStore();
    const [localKey, setLocalKey] = useState(apiKey);
    const [localModel, setLocalModel] = useState(modelName);
    const [localProvider, setLocalProvider] = useState(provider || "openrouter");

    const handleSave = () => {
        setApiKey(localKey);
        setModelName(localModel);
        setProvider(localProvider);
        onClose();
    };

    const providerModels = {
        openrouter: [
            { label: "Auto (Best Free)", id: "openrouter/auto" },
            { label: "Gemini 2.0 Flash", id: "google/gemini-2.0-flash-exp:free" },
            { label: "Llama 3.1 70B", id: "meta-llama/llama-3.1-70b-instruct:free" },
            { label: "Gemma 2 9B", id: "google/gemma-2-9b-it:free" }
        ],
        groq: [
            { label: "Llama 3.3 70B", id: "llama-3.3-70b-versatile" },
            { label: "Llama 3.1 8B", id: "llama-3.1-8b-instant" },
            { label: "Mixtral 8x7b", id: "mixtral-8x7b-32768" },
            { label: "DeepSeek R1", id: "deepseek-r1-distill-llama-70b" }
        ]
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            {/* Antigravity Card Design */}
            <div className="relative bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden group">

                {/* Animated Background Gradients */}
                <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-purple-600 rounded-full blur-[80px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 p-16 -ml-16 -mb-16 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-purple-400" />
                                AI Configuration
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Power your coding assistant</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Provider Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">API Provider</label>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-gray-700">
                                <button
                                    onClick={() => {
                                        setLocalProvider("openrouter");
                                        setLocalModel("openrouter/auto");
                                    }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${localProvider === "openrouter" ? "bg-purple-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    OpenRouter
                                </button>
                                <button
                                    onClick={() => {
                                        setLocalProvider("groq");
                                        setLocalModel("llama-3.3-70b-versatile");
                                    }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${localProvider === "groq" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    Groq
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                {localProvider === "groq" ? "Groq API Key" : "OpenRouter API Key"}
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="password"
                                    className="w-full bg-black/40 border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600"
                                    placeholder="sk-..."
                                    value={localKey}
                                    onChange={(e) => setLocalKey(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <a
                                    href={localProvider === "groq" ? "https://console.groq.com/keys" : "https://openrouter.ai/keys"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                >
                                    <ExternalLink size={12} />
                                    Get API Key
                                </a>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Model Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-600"
                                placeholder={localProvider === "groq" ? "llama-3.3-70b-versatile" : "openrouter/auto"}
                                value={localModel}
                                onChange={(e) => setLocalModel(e.target.value)}
                            />
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                                {providerModels[localProvider].map((m) => (
                                    <button 
                                        key={m.id}
                                        type="button"
                                        onClick={() => setLocalModel(m.id)}
                                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${localModel === m.id ? 'bg-purple-600/30 border-purple-500 text-purple-200' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                            onClick={handleSave}
                        >
                            Save Configuration
                        </button>

                        <p className="text-center text-xs text-gray-600">
                            Your key is stored securely in your browser's local storage.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;
