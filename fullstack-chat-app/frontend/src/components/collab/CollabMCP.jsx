import { useState, useMemo } from "react";
import { Server, Database, Globe, Github, HardDrive, MessageSquare, Terminal, Search, Shield, Plus, CheckCircle2, Box, Cloud, Lock, Cpu, BarChart, CreditCard, Mail, Key, X, Eye, EyeOff, LayoutTemplate } from "lucide-react";
import toast from "react-hot-toast";

// Helper to generate a large list of mock MCP servers (retained)
const generateMCPServers = () => {
    const categories = [
        { name: "Cloud Services", icon: Cloud, color: "text-sky-400" },
        { name: "Databases", icon: Database, color: "text-blue-300" },
        { name: "Developer Tools", icon: Terminal, color: "text-green-400" },
        { name: "Productivity", icon: CheckCircle2, color: "text-purple-400" },
        { name: "Monitoring", icon: BarChart, color: "text-red-400" },
        { name: "Security", icon: Shield, color: "text-orange-400" },
        { name: "Communication", icon: MessageSquare, color: "text-pink-400" },
        { name: "AI & ML", icon: Cpu, color: "text-indigo-400" },
        { name: "Payments", icon: CreditCard, color: "text-emerald-400" },
        { name: "Marketing", icon: Mail, color: "text-yellow-400" },
        { name: "Custom", icon: LayoutTemplate, color: "text-gray-400" }
    ];

    const popularServices = [
        // Cloud
        { name: "AWS S3", desc: "Object storage access", cat: "Cloud Services", fields: ["Access Key ID", "Secret Access Key", "Region"] },
        { name: "AWS EC2", desc: "Compute instance management", cat: "Cloud Services", fields: ["Access Key ID", "Secret Access Key", "Region"] },
        { name: "Vercel", desc: "Deployment status and logs", cat: "Cloud Services", fields: ["API Token", "Project ID"] },

        // Databases
        { name: "PostgreSQL", desc: "Relational database inspection", cat: "Databases", fields: ["Connection String (URI)"] },
        { name: "MongoDB", desc: "NoSQL document access", cat: "Databases", fields: ["Connection String (URI)"] },
        { name: "Redis", desc: "Key-value store management", cat: "Databases", fields: ["Redis URL", "Password"] },
        { name: "Supabase", desc: "Open source Firebase alternative", cat: "Databases", fields: ["Project URL", "Service Role Key"] },

        // Dev Tools
        { name: "GitHub", desc: "Repo and issue management", cat: "Developer Tools", fields: ["Personal Access Token"] },
        { name: "Docker", desc: "Container orchestration", cat: "Developer Tools", fields: ["Socket Path"] },
        { name: "Kubernetes", desc: "Cluster management", cat: "Developer Tools", fields: ["Kubeconfig Path"] },

        // AI
        { name: "OpenAI", desc: "GPT model context", cat: "AI & ML", fields: ["API Key"] },
        { name: "Anthropic", desc: "Claude details", cat: "AI & ML", fields: ["API Key"] },
        { name: "Pinecone", desc: "Vector database", cat: "AI & ML", fields: ["API Key", "Environment"] },

        // Communication
        { name: "Slack", desc: "Channel messaging", cat: "Communication", fields: ["Bot Token", "Signing Secret"] },
        { name: "Discord", desc: "Community server access", cat: "Communication", fields: ["Bot Token"] },

        // Payments
        { name: "Stripe", desc: "Payment processing", cat: "Payments", fields: ["Secret Key", "Publishable Key"] },
    ];

    let servers = [];
    let idCounter = 1;

    // Add popular authentic-looking services
    popularServices.forEach(s => {
        const catDetails = categories.find(c => c.name === s.cat) || categories[2];
        servers.push({
            id: `mcp-${idCounter++}`,
            name: s.name,
            description: s.desc,
            category: s.cat,
            icon: catDetails.icon,
            color: catDetails.color,
            status: 'disconnected',
            fields: s.fields || ["API Key"]
        });
    });

    // Fill with generic ones
    for (let i = 1; i <= 50; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        servers.push({
            id: `mcp-gen-${i}`,
            name: `${cat.name} Adapter ${i}`,
            description: `Generic adapter for ${cat.name} integration.`,
            category: cat.name,
            icon: cat.icon,
            color: cat.color,
            status: 'disconnected',
            fields: ["Connection Token", "Endpoint URL"]
        });
    }

    return servers;
};

// Configuration Modal Component (Existing)
const MCPConnectModal = ({ server, onClose, onConnect }) => {
    const [formData, setFormData] = useState({});
    const [showPassword, setShowPassword] = useState({});
    const [isConnecting, setIsConnecting] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const missingFields = server.fields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            toast.error(`Please fill in: ${missingFields.join(", ")}`);
            return;
        }
        setIsConnecting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        onConnect(server.id, formData);
        setIsConnecting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#18181b] w-96 rounded-lg border border-[#27272a] shadow-2xl flex flex-col">
                <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded bg-[#27272a] ${server.color}`}>
                            <server.icon size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Connect {server.name}</h3>
                            <p className="text-[10px] text-gray-500">{server.category}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {server.fields.map(field => (
                        <div key={field} className="space-y-1">
                            <label className="text-xs font-medium text-gray-400 block">{field}</label>
                            <div className="relative">
                                <input
                                    type={field.toLowerCase().includes("key") || field.toLowerCase().includes("token") || field.toLowerCase().includes("password") || field.toLowerCase().includes("secret")
                                        ? (showPassword[field] ? "text" : "password")
                                        : "text"
                                    }
                                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder={`Enter ${field}...`}
                                    value={formData[field] || ""}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                />
                                {(field.toLowerCase().includes("key") || field.toLowerCase().includes("token") || field.toLowerCase().includes("password") || field.toLowerCase().includes("secret")) && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-300"
                                        onClick={() => togglePassword(field)}
                                    >
                                        {showPassword[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isConnecting}
                            className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${isConnecting ? "bg-blue-600/50 cursor-wait text-white/50" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                }`}
                        >
                            {isConnecting ? "Verifying..." : "Connect Server"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// New Component: Add Custom Integration Modal
const AddCustomServerModal = ({ onClose, onAdd }) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Custom");
    const [description, setDescription] = useState("");
    const [fields, setFields] = useState("API Key, Endpoint URL");

    const categories = ["Cloud Services", "Databases", "Developer Tools", "Productivity", "Monitoring", "Security", "Communication", "AI & ML", "Custom"];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) return toast.error("Name is required");

        const fieldArray = fields.split(",").map(f => f.trim()).filter(f => f);
        if (fieldArray.length === 0) return toast.error("At least one configuration field is required");

        onAdd({
            name,
            category,
            description,
            fields: fieldArray
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#18181b] w-96 rounded-lg border border-[#27272a] shadow-2xl flex flex-col">
                <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Add Custom Integration</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 block">Integration Name</label>
                        <input
                            type="text"
                            className="w-full bg-[#27272a] border border-[#3f3f46] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. My Custom Internal Tool"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 block">Category</label>
                        <select
                            className="w-full bg-[#27272a] border border-[#3f3f46] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 block">Description</label>
                        <textarea
                            className="w-full bg-[#27272a] border border-[#3f3f46] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 h-16 resize-none"
                            placeholder="Briefly describe this integraion..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 block">Configuration Fields (comma separated)</label>
                        <input
                            type="text"
                            className="w-full bg-[#27272a] border border-[#3f3f46] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. API Key, Secret Token, Host URL"
                            value={fields}
                            onChange={(e) => setFields(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500">These are the values you'll need to provide to connect.</p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
                        >
                            Add Integration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const CollabMCP = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [servers, setServers] = useState(useMemo(() => generateMCPServers(), []));
    const [configuringServer, setConfiguringServer] = useState(null); // The server currently being connected
    const [showAddModal, setShowAddModal] = useState(false);

    const handleConnectClick = (server) => {
        if (server.status === 'connected') {
            setServers(prev => prev.map(s => s.id === server.id ? { ...s, status: 'disconnected', config: null } : s));
            toast(`Disconnected from ${server.name}`, { icon: '🔌' });
        } else {
            setConfiguringServer(server);
        }
    };

    const handleConfirmConnect = (id, config) => {
        setServers(prev => prev.map(server => {
            if (server.id === id) {
                toast.success(`Connected to ${server.name}`);
                return { ...server, status: "connected", config: config };
            }
            return server;
        }));
        setConfiguringServer(null);
    };

    const handleAddCustomServer = (details) => {
        const newServer = {
            id: `mcp-custom-${Date.now()}`,
            name: details.name,
            description: details.description || "Custom User Integration",
            category: details.category,
            fields: details.fields,
            status: 'disconnected',
            icon: LayoutTemplate, // Generic icon for custom
            color: 'text-white'
        };
        setServers(prev => [newServer, ...prev]);
        setShowAddModal(false);
        toast.success(`Added ${details.name} to Registry`);

        // Optionally jump straight to configuring it
        // setConfiguringServer(newServer); 
    };

    const filteredServers = servers.filter(
        s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-[#18181b] text-gray-300 relative">
            {/* Header */}
            <div className="p-3 border-b border-[#27272a] space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">MCP Registry</span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{servers.length} Integrations Available</div>
                    </div>
                    <button
                        className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-white"
                        onClick={() => setShowAddModal(true)}
                        title="Add Custom Integration"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search integration..."
                        className="w-full bg-[#27272a] text-sm text-white px-8 py-2 rounded-md border border-transparent focus:border-blue-500 focus:outline-none placeholder-gray-500 transition-all focus:bg-[#313136]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={14} className="absolute left-2.5 top-3 text-gray-500" />
                </div>

                {/* Info Block */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-[11px] text-blue-200 leading-relaxed">
                    <strong>What is MCP?</strong> It stands for <em>Model Context Protocol</em>.
                    It acts as a universal bridge, allowing the <strong>AI Assistant</strong> to directly access and control your external tools (like reading your Database, checking Cloud logs, or updating Jira tickets) to help you build your application faster.
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredServers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                        <Box size={32} className="opacity-20" />
                        <span className="text-xs mb-2">No integrations found</span>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded text-xs border border-blue-500/20 hover:bg-blue-600/20 transition-colors"
                        >
                            Add "{searchTerm}" Manually
                        </button>
                    </div>
                ) : (
                    filteredServers.map(server => (
                        <div
                            key={server.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${server.status === 'connected'
                                ? 'bg-[#1e1e20] border-blue-500/30 shadow-inner'
                                : 'bg-[#18181b] border-[#27272a] hover:bg-[#202023]'
                                }`}
                        >
                            <div className={`p-2 rounded-md bg-[#27272a] ${server.color} shrink-0`}>
                                <server.icon size={18} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className="font-semibold text-sm text-gray-200 truncate">{server.name}</h3>
                                    {server.status === 'connected' && (
                                        <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                                            <CheckCircle2 size={10} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1 rounded">{server.category}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">{server.description}</p>

                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConnectClick(server);
                                        }}
                                        className={`flex-1 py-1 text-[10px] font-medium rounded border transition-colors ${server.status === 'connected'
                                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                            : 'bg-blue-600 text-white border-transparent hover:bg-blue-500'
                                            }`}
                                    >
                                        {server.status === 'connected' ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Status Footer */}
            <div className="p-2 border-t border-[#27272a] text-[10px] text-gray-500 flex justify-between bg-[#1f1f22]">
                <span>Status: Online</span>
                <span>{servers.filter(s => s.status === 'connected').length} Connected</span>
            </div>

            {/* Modals */}
            {configuringServer && (
                <MCPConnectModal
                    server={configuringServer}
                    onClose={() => setConfiguringServer(null)}
                    onConnect={handleConfirmConnect}
                />
            )}

            {showAddModal && (
                <AddCustomServerModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddCustomServer}
                />
            )}
        </div>
    );
};

export default CollabMCP;
