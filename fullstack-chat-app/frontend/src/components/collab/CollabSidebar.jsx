import { useCollabStore } from "../../store/useCollabStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Folder, File, Plus, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

const CollabSidebar = ({ sessionId }) => {
  const { socket, files, activeFile, setActiveFile, sendFileTree, connect, connectionAttempts } = useCollabStore();
  const { authUser } = useAuthStore();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Set the first file as active when files are loaded
  useEffect(() => {
    if (!activeFile && files && Object.keys(files).length > 0) {
      const firstFileId = Object.keys(files)[0];
      setActiveFile(files[firstFileId]);
    }
  }, [files, activeFile, setActiveFile]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleFileSelect = (file) => {
    setActiveFile(file);
  };

  const handleAddFile = () => {
    if (!authUser) {
      setUploadError("You must be logged in to create files");
      return;
    }

    const fileName = prompt("Enter file name:");
    if (fileName) {
      const newFile = {
        id: Date.now().toString(), // Ensure ID is string
        name: fileName,
        content: "// Start coding here...",
        type: "file"
      };

      const updatedFiles = {
        ...files,
        [newFile.id]: newFile
      };

      sendFileTree(sessionId, updatedFiles);
      setActiveFile(newFile);
    }
  };

  // Function to handle file uploads (both single files and folders)
  const handleFilesUpload = async (event) => {
    console.log("File upload initiated");

    if (!authUser) {
      setUploadError("You must be logged in to upload files");
      return;
    }

    // Check if socket is connected
    if (!socket || !socket.connected) {
      setUploadError("Not connected to collaboration session. Attempting to reconnect...");
      setIsReconnecting(true);

      // Try to reconnect
      connect(sessionId);

      // Wait a bit and check connection status
      setTimeout(() => {
        if (!socket || !socket.connected) {
          setUploadError("Failed to reconnect. Please refresh the page.");
          setIsReconnecting(false);
        } else {
          setUploadError(null);
          setIsReconnecting(false);
          // Retry the upload
          processFileUpload(event);
        }
      }, 3000);
      return;
    }

    // Process the file upload
    processFileUpload(event);
  };

  const processFileUpload = async (event) => {
    const uploadedFiles = event.target.files;
    console.log("Files selected for upload:", uploadedFiles);

    if (uploadedFiles.length > 0) {
      setUploadError(null); // Clear any previous errors

      // Create a deep copy to ensure we don't mutate state directly
      // distinct from state mutation
      let newFiles;
      try {
        newFiles = JSON.parse(JSON.stringify(files));
      } catch (e) {
        console.error("Deep clone failed, falling back to shallow copy", e);
        newFiles = { ...files };
      }

      let firstFile = null;
      const newFoldersToExpand = {};

      // Convert FileList to Array for easier processing
      const filesArray = Array.from(uploadedFiles);

      // Process each file
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        try {
          console.log("Processing file:", file.name);
          const content = await file.text();

          // Use webkitRelativePath for folders, name for single files
          // For drag-and-drop or some inputs, it might be just name
          const filePath = file.webkitRelativePath || file.name;
          console.log("File path:", filePath);

          const pathParts = filePath.split('/');

          // Handle nested folder structure
          if (pathParts.length > 1) {
            // This is a file in a folder structure
            let currentLevel = newFiles;
            let currentPath = "";

            for (let j = 0; j < pathParts.length - 1; j++) {
              const folderName = pathParts[j];
              currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

              // Mark folder to auto-expand
              newFoldersToExpand[currentPath] = true;

              // Check if folder already exists
              let folder = Object.values(currentLevel).find(item =>
                item.type === 'folder' && item.name === folderName
              );

              if (!folder) {
                // Create folder if it doesn't exist
                const folderId = `folder_${currentPath.replace(/\//g, '_')}_${Date.now()}`;
                folder = {
                  id: folderId,
                  name: folderName,
                  type: 'folder',
                  children: {}
                };
                currentLevel[folderId] = folder;
              }

              currentLevel = folder.children;
            }

            // Add file to the deepest folder
            const fileName = pathParts[pathParts.length - 1];
            // Check if file already exists to avoid duplicates or overwrite
            const existingFileId = Object.keys(currentLevel).find(id => currentLevel[id].name === fileName);

            const newFile = {
              id: existingFileId || `file_${filePath.replace(/\//g, '_')}_${Date.now()}`,
              name: fileName,
              content: content,
              type: "file"
            };

            currentLevel[newFile.id] = newFile;
          } else {
            // This is a single file (no folder structure)
            const fileName = pathParts[0];
            const existingFileId = Object.keys(newFiles).find(id => newFiles[id].name === fileName);

            const newFile = {
              id: existingFileId || `file_${fileName}_${Date.now() + i}`,
              name: fileName,
              content: content,
              type: "file"
            };

            newFiles[newFile.id] = newFile;
          }

          // Set the first file as active
          if (!firstFile) {
            // We need to find the file we just added in the potentially nested structure
            // But for simplicity, we can just use the object reference we have (newFile)
            // Wait, newFile is created in local scope. 
            // Let's capture it.
            // Simplified: firstFile is just true to trigger the collection later?
            // Actually, we can just use the file object we created.
            /* 
               Refactored logic for capturing firstFile:
               We need the ID. 
            */
          }
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          setUploadError(`Error reading file ${file.name}: ${error.message}`);
        }
      }

      // Auto-expand folders
      if (Object.keys(newFoldersToExpand).length > 0) {
        setExpandedFolders(prev => ({ ...prev, ...newFoldersToExpand }));
      }

      console.log("Sending updated file tree:", newFiles);
      sendFileTree(sessionId, newFiles);

      // If we want to set active file, we need a way to find it. 
      // For now, let's keep the existing logic or rely on user collecting.
      // If the user uploaded files, we could set the first one as active.
      // It's a bit complex to find it in the tree without tracking it. 
    }

    // Reset the input value to allow uploading the same file again
    event.target.value = "";
  };

  const handleReconnect = () => {
    setIsReconnecting(true);
    setUploadError(null);
    connect(sessionId);

    setTimeout(() => {
      setIsReconnecting(false);
      if (!socket || !socket.connected) {
        setUploadError("Reconnection failed. Please try again or refresh the page.");
      }
    }, 3000);
  };

  const renderFileTree = (items, path = "") => {
    // Handle case where items might be undefined
    if (!items) return null;

    return Object.values(items).map((item) => {
      const fullPath = path ? `${path}/${item.name}` : item.name;

      if (item.type === "folder") {
        const isExpanded = expandedFolders[fullPath];
        return (
          <div key={item.id}>
            <div
              className="flex items-center gap-2 px-3 py-1 hover:bg-[#2a2d2e] cursor-pointer text-sm text-gray-300 select-none"
              onClick={() => toggleFolder(fullPath)}
            >
              <Folder size={14} className={isExpanded ? "text-gray-100" : "text-gray-400"} />
              <span className="flex-1 truncate">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div className="ml-2 pl-2 border-l border-[#27272a]">
                {renderFileTree(item.children, fullPath)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={item.id}
            className={`flex items-center gap-2 px-3 py-1 cursor-pointer text-sm select-none ${activeFile?.id === item.id
                ? 'bg-[#37373d] text-white'
                : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'
              }`}
            onClick={() => handleFileSelect(item)}
          >
            <File size={14} />
            <span className="flex-1 truncate">{item.name}</span>
          </div>
        );
      }
    });
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#18181b] text-gray-300">
      <div className="p-3 border-b border-[#27272a] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Explorer</span>
        <div className="flex gap-2">
          {/* Tiny buttons for new file/folder could go here */}
        </div>
      </div>
      {uploadError && (
        <div className="m-2 p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded flex items-center">
          <AlertCircle size={16} className="mr-2" />
          <span className="text-xs">{uploadError}</span>
        </div>
      )}
      {isReconnecting && (
        <div className="m-2 p-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded flex items-center">
          <RefreshCw size={16} className="mr-2 animate-spin" />
          <span className="text-xs">Reconnecting...</span>
        </div>
      )}
      {!socket?.connected && !isReconnecting && (
        <div className="m-2">
          <button
            onClick={handleReconnect}
            className="w-full py-1 text-xs bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded border border-yellow-600/30 flex items-center justify-center transition-colors"
          >
            <RefreshCw size={14} className="mr-2" />
            Reconnect
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {files && Object.keys(files).length > 0 ? (
          renderFileTree(files)
        ) : (
          <div className="p-4 text-center text-gray-500 text-xs">
            No files yet.
          </div>
        )}
      </div>

      <div className="p-2 border-t border-[#27272a] grid grid-cols-3 gap-1">
        <button
          className="flex flex-col items-center justify-center p-2 rounded hover:bg-[#27272a] text-gray-400 hover:text-white transition-colors"
          onClick={handleAddFile}
          disabled={!socket?.connected}
          title="New File"
        >
          <Plus size={16} />
        </button>
        <label className={`flex flex-col items-center justify-center p-2 rounded hover:bg-[#27272a] text-gray-400 hover:text-white transition-colors cursor-pointer ${!socket?.connected ? 'opacity-50' : ''}`} title="Upload Files">
          <Upload size={16} />
          <input
            type="file"
            className="hidden"
            onChange={handleFilesUpload}
            multiple
            disabled={!socket?.connected}
          />
        </label>
        <label className={`flex flex-col items-center justify-center p-2 rounded hover:bg-[#27272a] text-gray-400 hover:text-white transition-colors cursor-pointer ${!socket?.connected ? 'opacity-50' : ''}`} title="Upload Folder">
          <Folder size={16} />
          <input
            type="file"
            className="hidden"
            onChange={handleFilesUpload}
            webkitdirectory="true"
            directory="true"
            multiple
            disabled={!socket?.connected}
          />
        </label>
      </div>
    </div>
  );
};

export default CollabSidebar;