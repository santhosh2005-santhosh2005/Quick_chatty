import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Zap, Box, ArrowRight, Loader2, Play, CheckCircle2, FileCode, Terminal as TerminalIcon, ChevronRight, Layout, Monitor, Code as CodeIcon, X, Maximize2, Minimize2, MoveRight, Key } from "lucide-react";
import toast from "react-hot-toast";
import { useCollabStore } from "../../store/useCollabStore";
import Editor from "@monaco-editor/react";

const CollabGenerator = ({ onClose }) => {
    const [prompt, setPrompt] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [steps, setSteps] = useState([]);
    const [hasStarted, setHasStarted] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');
    const bottomRef = useRef(null);

    // Store Actions
    const { addFilesFromGenerator } = useCollabStore();

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [steps]);

    const handleSaveApiKey = (e) => {
        e.preventDefault();
        if (apiKey.trim().length > 10) {
            setHasApiKey(true);
            toast.success("API Key configured");
        } else {
            toast.error("Please enter a valid API Key");
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setHasStarted(true);
        setSteps(prev => [...prev, { type: 'user', content: prompt }]);
        const currentPrompt = prompt;
        setPrompt("");
        setIsGenerating(true);

        // Simulation Bolt Flow (Enhanced)
        setTimeout(() => setSteps(prev => [...prev, { type: 'plan', content: "Reading context..." }]), 500);
        setTimeout(() => setSteps(prev => [...prev, { type: 'thought', content: `Planning architecture for: "${currentPrompt}"` }]), 1500);

        // Simulating different file types based on prompt
        setTimeout(() => {
            const files = [];

            if (currentPrompt.toLowerCase().includes("landing")) {
                files.push({
                    path: 'src/LandingPage.jsx',
                    content: `import React from 'react';\n\nexport default function LandingPage() {\n  return (\n    <div className="min-h-screen bg-gray-900 text-white p-10 flex flex-col items-center justify-center">\n      <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Antigravity</h1>\n      <p className="mt-4 text-gray-400 text-xl">Build faster with AI.</p>\n      <div className="mt-8 flex gap-4">\n         <button className="bg-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-500 transition">Get Started</button>\n         <button className="border border-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition">Documentation</button>\n      </div>\n    </div>\n  );\n}`
                });
                files.push({
                    path: 'src/index.css',
                    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`
                });
            } else {
                files.push({
                    path: 'src/App.jsx',
                    content: `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="p-10">\n      <h1 className="text-3xl font-bold mb-4">Generated App</h1>\n      <p className="mb-4">You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)} className="bg-blue-500 text-white px-4 py-2 rounded">Increment</button>\n    </div>\n  );\n}`
                });
            }

            // Emit file creation steps
            files.forEach(f => {
                setSteps(prev => [...prev, {
                    type: 'file',
                    path: f.path,
                    action: 'create',
                    content: f.content,
                    status: 'completed'
                }]);
            });

            setSteps(prev => [...prev, { type: 'success', content: "Build completed successfully." }]);
            setIsGenerating(false);
        }, 3000 + (Math.random() * 2000));
    };

    const handleMoveToCollab = () => {
        const generatedFiles = steps
            .filter(s => s.type === 'file' && s.status === 'completed')
            .map(s => ({ path: s.path, content: s.content }));

        if (generatedFiles.length === 0) {
            toast.error("No files generated to move.");
            return;
        }

        addFilesFromGenerator(generatedFiles);
        toast.success(`Moved ${generatedFiles.length} files to Workspace`);

        setTimeout(() => {
            if (onClose) onClose();
        }, 500);
    };

    if (!hasApiKey) {
        return (
            <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center font-sans">
                <div className="w-[400px] bg-[#1a1a1a] border border-white/10 rounded-xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                            <Key size={24} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white text-center mb-2">Configure AI Architect</h2>
                    <p className="text-gray-400 text-center text-sm mb-6">Enter your API Key to enable the generative engine.</p>

                    <form onSubmit={handleSaveApiKey} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">OpenAI / Anthropic Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="sk-..."
                            />
                        </div>
                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 rounded-lg transition-colors">
                            Initialize Architect
                        </button>
                    </form>
                    <button onClick={onClose} className="w-full mt-3 text-gray-500 text-xs hover:text-white transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col font-sans animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
                        <Sparkles size={16} />
                    </div>
                    <span className="font-bold text-gray-200 tracking-tight">Antigravity Architect</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMoveToCollab}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        <MoveRight size={14} />
                        Move to Workspace
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Chat / Steps */}
                <div className="w-[400px] flex flex-col border-r border-white/10 bg-[#0a0a0a] relative z-10">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-20">
                        {!hasStarted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <h2 className="text-lg font-semibold text-white mb-2">What would you like to build?</h2>
                                <p className="text-sm text-gray-500 max-w-[260px] mb-6">Describe your app or component, and I'll generate the code, install dependencies, and preview it instantly.</p>

                                <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                                    <button onClick={() => setPrompt("Create a landing page with hero section")} className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors text-left">
                                        Landing Page
                                    </button>
                                    <button onClick={() => setPrompt("Build a counter app with React")} className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors text-left">
                                        Counter App
                                    </button>
                                </div>
                            </div>
                        ) : (
                            steps.map((step, idx) => (
                                <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {step.type === 'user' && (
                                        <div className="flex gap-3 mb-4">
                                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                            <div className="text-sm text-gray-200 font-medium leading-relaxed bg-[#1a1a1a] px-3 py-2 rounded-lg border border-white/5">
                                                {step.content}
                                            </div>
                                        </div>
                                    )}
                                    {step.type === 'thought' && (
                                        <div className="flex gap-2 ml-9 mb-2">
                                            <div className="w-0.5 bg-gray-800 self-stretch my-1 ml-1" />
                                            <div className="text-xs text-gray-500 italic py-1">
                                                {step.content}
                                            </div>
                                        </div>
                                    )}
                                    {step.type === 'file' && (
                                        <div className="ml-9 mb-2 flex items-center justify-between bg-[#111] p-2 rounded border border-white/5 group hover:border-blue-500/30 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <FileCode size={14} className="text-blue-400" />
                                                <span className="text-xs text-gray-300 font-mono">{step.path}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-600 uppercase font-bold">{step.action}</span>
                                                <CheckCircle2 size={12} className="text-green-500" />
                                            </div>
                                        </div>
                                    )}
                                    {step.type === 'success' && (
                                        <div className="ml-9 mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-xs">
                                            <CheckCircle2 size={14} />
                                            {step.content}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
                        <form onSubmit={handleGenerate} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-lg pointer-events-none" />
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate(e);
                                    }
                                }}
                                placeholder="Describe your changes..."
                                className="w-full bg-[#18181b] text-sm text-gray-200 pl-4 pr-12 py-3 rounded-xl border border-white/10 focus:border-white/20 focus:outline-none placeholder-gray-600 resize-none transition-all shadow-xl relative z-10"
                                rows={hasStarted ? 2 : 3}
                            />
                            <button
                                type="submit"
                                disabled={!prompt.trim() || isGenerating}
                                className="absolute right-2 bottom-2 p-1.5 bg-white text-black rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors z-20"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Preview / Code */}
                <div className="flex-1 flex flex-col bg-[#0f0f11]">
                    {/* Tabs */}
                    <div className="h-10 border-b border-white/10 flex items-center px-4 gap-6 bg-[#0a0a0a]">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 h-full text-xs font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            <Monitor size={14} /> Preview
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex items-center gap-2 h-full text-xs font-medium border-b-2 transition-colors ${activeTab === 'code' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            <CodeIcon size={14} /> Code
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'preview' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                                {hasStarted && !isGenerating ? (
                                    <div className="w-full h-full overflow-y-auto">
                                        {/* Mock Preview Content - In a real app this would be an iframe */}
                                        <div className="w-full h-full bg-gray-50 flex flex-col">
                                            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                                                <div className="font-bold text-xl">Antigravity App</div>
                                                <div className="flex gap-4 text-sm text-gray-600">
                                                    <span>Home</span>
                                                    <span>Features</span>
                                                    <span>Contact</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                                <h1 className="text-5xl font-bold text-gray-900 mb-6 max-w-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                                    {steps.some(s => s.content.includes("LandingPage")) ? "Build The Future." : "Your Generated App"}
                                                </h1>
                                                <p className="text-xl text-gray-500 max-w-lg mb-8">
                                                    This application was architected, written, and deployed by Antigravity AI in seconds.
                                                </p>
                                                <button className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl">
                                                    Start Building
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <Monitor className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-sm">Generating application preview...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full">
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    theme="vs-dark"
                                    value={steps.find(s => s.type === 'file' && (s.path.endsWith('.jsx') || s.path.endsWith('.js')))?.content || "// Code will appear here..."}
                                    options={{ readOnly: true, minimap: { enabled: false } }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollabGenerator;
