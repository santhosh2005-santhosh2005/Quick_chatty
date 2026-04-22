import React, { useState, useCallback } from 'react';
import { FileText, Folder, FolderOpen, ChevronRight, ChevronDown, File as FileIcon } from 'lucide-react';
import { FileMetadata } from '../hooks/useCollabFiles';

interface FileExplorerProps {
  files: FileMetadata[];
  onFileSelect: (path: string) => void;
  selectedPath?: string | null;
  onUploadFiles?: (files: FileList) => void;
  onCreateFile?: (path: string, isDirectory: boolean) => void;
  onDeleteFile?: (path: string) => void;
  className?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  selectedPath,
  onUploadFiles,
  onCreateFile,
  onDeleteFile,
  className = ''
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; path: string} | null>(null);
  const [newItem, setNewItem] = useState<{path: string; type: 'file' | 'folder' | null}>({ path: '', type: null });

  // Build a tree structure from the flat file list
  const buildFileTree = useCallback(() => {
    const tree: Record<string, any> = { name: '', path: '', children: [], isDirectory: true };

    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      let current = tree;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        let child = current.children.find((c: any) => c.name === part);

        if (!child && !isLast) {
          child = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            children: [],
            isDirectory: true
          };
          current.children.push(child);
        } else if (!child && isLast) {
          child = { ...file, name: part };
          current.children.push(child);
        }

        if (child) {
          current = child;
        }
      });
    });

    return tree;
  }, [files]);

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  const handleNewItem = (type: 'file' | 'folder', parentPath: string) => {
    const basePath = parentPath.endsWith('/') ? parentPath : `${parentPath}/`;
    setNewItem({ path: basePath, type });
    setExpandedDirs(prev => ({ ...prev, [parentPath]: true }));
  };

  const handleCreateItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItem.path && newItem.type) {
      const fullPath = newItem.path + (newItem.type === 'folder' ? '' : e.currentTarget.value);
      if (onCreateFile) {
        onCreateFile(fullPath, newItem.type === 'folder');
      }
      setNewItem({ path: '', type: null });
    } else if (e.key === 'Escape') {
      setNewItem({ path: '', type: null });
    }
  };

  const renderTree = (node: any, depth = 0) => {
    const isExpanded = expandedDirs[node.path] ?? false;
    const isSelected = selectedPath === node.path;
    const isDirectory = node.isDirectory;
    const hasChildren = node.children && node.children.length > 0;
    const showChildren = isDirectory && (isExpanded || depth === 0);

    return (
      <div key={node.path || 'root'} className="w-full">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => isDirectory ? toggleDirectory(node.path) : onFileSelect(node.path)}
          onContextMenu={(e) => handleContextMenu(e, node.path)}
        >
          {isDirectory ? (
            <button 
              className="mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={(e) => { e.stopPropagation(); toggleDirectory(node.path); }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-5 h-5 mr-1 flex-shrink-0" />
          )}
          
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-blue-500 mr-2 flex-shrink-0" />
            ) : (
              <Folder size={16} className="text-blue-500 mr-2 flex-shrink-0" />
            )
          ) : (
            <FileIcon size={16} className="text-gray-500 mr-2 flex-shrink-0" />
          )}
          
          <span className="truncate">{node.name}</span>
        </div>

        {showChildren && (
          <div>
            {node.children.map((child: any) => renderTree(child, depth + 1))}
            
            {newItem.path === node.path && (
              <div 
                className="flex items-center py-1 px-2"
                style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
              >
                {newItem.type === 'folder' ? (
                  <Folder size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                ) : (
                  <FileText size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                )}
                <input
                  type="text"
                  className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyDown={handleCreateItem}
                  onBlur={() => setNewItem({ path: '', type: null })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree();

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">Files</h3>
        <div className="flex space-x-1">
          <button
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => onUploadFiles && (document.getElementById('file-upload') as HTMLInputElement)?.click()}
            title="Upload files"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={(e) => e.target.files && onUploadFiles?.(e.target.files)}
          />
          <div className="relative group">
            <button
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="New file or folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleNewItem('file', '')}
              >
                New File
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleNewItem('folder', '')}
              >
                New Folder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500 dark:text-gray-400">
            <FolderOpen size={48} className="mb-2 text-gray-300 dark:text-gray-600" />
            <p className="mb-4">No files yet</p>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Upload Files
            </button>
          </div>
        ) : (
          renderTree(fileTree)
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 z-50"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              onFileSelect(contextMenu.path);
              setContextMenu(null);
            }}
          >
            Open
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              const path = contextMenu.path;
              const isDirectory = files.some(f => f.path === path && f.isDirectory);
              handleNewItem('file', isDirectory ? `${path}/` : path.substring(0, path.lastIndexOf('/') + 1));
              setContextMenu(null);
            }}
          >
            New File
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              const path = contextMenu.path;
              const isDirectory = files.some(f => f.path === path && f.isDirectory);
              handleNewItem('folder', isDirectory ? `${path}/` : path.substring(0, path.lastIndexOf('/') + 1));
              setContextMenu(null);
            }}
          >
            New Folder
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this item?')) {
                onDeleteFile?.(contextMenu.path);
              }
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
