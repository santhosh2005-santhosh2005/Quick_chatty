import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Star, Download, Globe, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCollabStore } from "../../store/useCollabStore";

// Fallback data in case API fails
const FALLBACK_EXTENSIONS = [
    {
        id: "python",
        namespace: "ms-python",
        name: "python",
        displayName: "Python",
        publisher: "Microsoft",
        description: "Intellisense, linting, debugging, code formatting, refactoring, unit tests, and more.",
        version: "2024.2.1",
        downloads: "110M",
        rating: 4.5,
        files: { icon: "https://raw.githubusercontent.com/microsoft/vscode-icons/master/icons/dark/python.svg" }
    },
    // ... we can keep a few reliable ones
];

const CollabExtensions = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [extensions, setExtensions] = useState([]);

    // Use Store for global state
    const { installedExtensions, toggleExtension } = useCollabStore();

    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");

    // Open VSX doesn't have "categories" in the simple search endpoint easily mapped, 
    // strictly speaking, but users expect chips. We can use them as query pre-fills or sort.
    const categories = ["All", "Themes", "Linters", "Snippets", "Programming Languages", "Formatters", "AI"];

    const searchExtensions = useCallback(async (query) => {
        setLoading(true);
        try {
            // Default query for initial load
            const q = query || "python";
            const response = await fetch(`https://open-vsx.org/api/-/search?query=${q}&size=20`);

            if (!response.ok) throw new Error("API Limit or Error");

            const data = await response.json();
            setExtensions(data.extensions || []);
        } catch (error) {
            console.error("Failed to fetch extensions:", error);
            // Fallback to local list if API fails (CORS or rate limits)
            if (!query) setExtensions(FALLBACK_EXTENSIONS);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        searchExtensions("popular");
    }, [searchExtensions]);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm) {
                searchExtensions(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchExtensions]);

    const handleInstall = (extId, extName) => {
        const isInstalled = installedExtensions.has(extId);

        if (isInstalled) {
            toast(`Uninstalling ${extName}...`, { icon: '🗑️' });
            // Simulate delay
            setTimeout(() => {
                toggleExtension(extId);
                toast.success(`${extName} uninstalled`);
            }, 1000);
        } else {
            toast.success(`Installing ${extName}...`);
            setTimeout(() => {
                toggleExtension(extId);
                toast.success(`${extName} activated`);
            }, 1500);
        }
    };

    const handleCategoryClick = (cat) => {
        setActiveCategory(cat);
        if (cat === "All") {
            searchExtensions("popular");
            setSearchTerm("");
        } else {
            setSearchTerm(cat); // Use category as search term for Open VSX
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#18181b] text-gray-300">
            {/* Header */}
            <div className="p-3 border-b border-[#27272a] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Marketplace</span>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search Extensions"
                        className="w-full bg-[#27272a] text-sm text-white px-8 py-2 rounded-md border border-transparent focus:border-blue-500 focus:outline-none placeholder-gray-500 transition-all focus:bg-[#313136]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={14} className="absolute left-2.5 top-3 text-gray-500" />
                    {loading && <Loader2 size={14} className="absolute right-2.5 top-3 text-blue-500 animate-spin" />}
                </div>

                {/* Categories Pill List */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            draggable="false"
                            onClick={() => handleCategoryClick(cat)}
                            className={`whitespace-nowrap px-2.5 py-1 text-[10px] rounded-full transition-colors border ${activeCategory === cat
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-[#27272a] border-[#3f3f46] text-gray-400 hover:bg-[#3f3f46] hover:text-gray-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {extensions.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                        <Search size={24} className="opacity-20" />
                        <span className="text-xs">No extensions found</span>
                    </div>
                ) : (
                    extensions.map(ext => {
                        // Open VSX API structure adaption
                        const id = `${ext.namespace}.${ext.name}`;
                        const isInstalled = installedExtensions.has(id);
                        const iconUrl = ext.files?.icon || "https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg";
                        const publisher = ext.namespace;
                        const description = ext.description || "No description provided.";
                        const rating = ext.averageRating ? ext.averageRating.toFixed(1) : "N/A";
                        // Simplify download count logic (e.g. 10000 -> 10k)
                        const downloads = ext.downloadCount
                            ? (ext.downloadCount > 1000000 ? (ext.downloadCount / 1000000).toFixed(1) + 'M' : (ext.downloadCount / 1000).toFixed(0) + 'k')
                            : "0";

                        return (
                            <div key={id} className="flex gap-3 p-3 hover:bg-[#2a2d2e] cursor-pointer group border-b border-[#27272a]/40 transition-colors">
                                {/* Icon */}
                                <div className="w-10 h-10 min-w-[40px] bg-[#222] rounded flex items-center justify-center shrink-0 border border-white/5">
                                    <img
                                        src={iconUrl}
                                        alt={ext.name}
                                        className="w-7 h-7 object-contain"
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg" }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    {/* Title & Config */}
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-gray-100 truncate pr-2 leading-tight" title={ext.displayName || ext.name}>{ext.displayName || ext.name}</h4>
                                        </div>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed my-1 h-8" title={description}>{description}</p>
                                    </div>

                                    {/* Meta stats */}
                                    <div className="flex items-center justify-between mt-1.5">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1 font-medium text-gray-400">
                                                {publisher}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                                            <span className="flex items-center gap-1">
                                                {isInstalled ? (
                                                    <span className="text-blue-400 flex items-center gap-1"><Star size={10} fill="currentColor" /> Installed</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-yellow-500"><Star size={10} fill="currentColor" /> {rating}</span>
                                                )}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                                            <span className="flex items-center gap-1"><Download size={10} /> {downloads}</span>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleInstall(id, ext.displayName || ext.name);
                                            }}
                                            className={`px-2.5 py-1 text-[10px] rounded transition-all font-medium border ${isInstalled
                                                ? 'bg-[#27272a] text-gray-400 border-white/5 hover:bg-[#3f3f46] hover:text-gray-200'
                                                : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-sm shadow-blue-500/20'
                                                }`}
                                        >
                                            {isInstalled ? 'Manage' : 'Install'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CollabExtensions;
