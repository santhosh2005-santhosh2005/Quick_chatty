import { useState } from "react";
import { Search, File, ChevronRight, ChevronDown } from "lucide-react";
import { useCollabStore } from "../../store/useCollabStore";

const CollabSearch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const { files, setActiveFile } = useCollabStore();
    const [results, setResults] = useState([]);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (!term.trim()) {
            setResults([]);
            return;
        }

        // Flatten file tree to search
        const searchResults = [];
        const searchTree = (tree) => {
            Object.values(tree).forEach(item => {
                if (item.type === 'file') {
                    if (item.name.toLowerCase().includes(term.toLowerCase()) ||
                        (item.content && item.content.toLowerCase().includes(term.toLowerCase()))) {
                        searchResults.push(item);
                    }
                } else if (item.children) {
                    searchTree(item.children);
                }
            });
        };

        searchTree(files);
        setResults(searchResults);
    };

    return (
        <div className="flex flex-col h-full bg-[#18181b] text-gray-300">
            <div className="p-3 border-b border-[#27272a]">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Search</span>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-[#27272a] text-sm text-white px-2 py-1.5 rounded border border-transparent focus:border-blue-500 focus:outline-none placeholder-gray-500"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                    {searchTerm && (
                        <div className="absolute right-2 top-2 text-xs text-gray-500">
                            {results.length} results
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {searchTerm && results.length === 0 && (
                    <div className="text-center text-xs text-gray-500 mt-4">
                        No results found.
                    </div>
                )}

                {results.map(file => (
                    <div
                        key={file.id}
                        className="flex flex-col gap-1 p-2 hover:bg-[#2a2d2e] cursor-pointer rounded mb-1"
                        onClick={() => setActiveFile(file)}
                    >
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                            <File size={14} className="text-gray-400" />
                            <span className="truncate">{file.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6 truncate">
                            Match found in file content...
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CollabSearch;
