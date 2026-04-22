import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useCollabFiles from '../hooks/useCollabFiles';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import { FileMetadata } from '../hooks/useCollabFiles';

const CollaborationLayout: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'chat'>('files');
  
  const {
    files,
    selectedFile,
    isConnected,
    error,
    openFile,
    updateFileContent,
    uploadFiles,
    createFile,
    deleteFile,
    hasFiles
  } = useCollabFiles(roomId || '', user?.id || '');

  const handleFileSelect = useCallback((path: string) => {
    openFile(path);
  }, [openFile]);

  const handleFileChange = useCallback((content: string) => {
    if (selectedFile) {
      updateFileContent(selectedFile.path, content);
    }
  }, [selectedFile, updateFileContent]);

  const handleUploadFiles = useCallback((fileList: FileList) => {
    uploadFiles(fileList).catch(console.error);
  }, [uploadFiles]);

  const handleCreateFile = useCallback(async (path: string, isDirectory: boolean) => {
    try {
      await createFile(path, isDirectory);
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  }, [createFile]);

  const handleDeleteFile = useCallback(async (path: string) => {
    try {
      await deleteFile(path);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }, [deleteFile]);

  // Show loading state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Connecting to collaboration session...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-800 dark:text-white">
            {roomId ? `Room: ${roomId}` : 'Collaboration Workspace'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className={`h-2 w-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-md ${isChatOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            title="Toggle chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        {isSidebarOpen && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex justify-between items-center">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('files')}
                  className={`px-3 py-1 text-sm rounded-md ${activeTab === 'files' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 text-sm rounded-md ${activeTab === 'chat' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  Chat
                </button>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Collapse sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeTab === 'files' ? (
                <FileExplorer
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedPath={selectedFile?.path}
                  onUploadFiles={handleUploadFiles}
                  onCreateFile={handleCreateFile}
                  onDeleteFile={handleDeleteFile}
                  className="h-full"
                />
              ) : (
                <div className="p-4 h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Chat feature coming soon!
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled
                      />
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isSidebarOpen && (
            <div className="absolute top-2 left-2 z-10">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                title="Show sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
          
          {selectedFile && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                  {selectedFile.name}
                </span>
                {selectedFile.uploaderName && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (edited by {selectedFile.uploaderName})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(selectedFile.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              file={selectedFile || null}
              onChange={handleFileChange}
              theme={window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
              readOnly={!selectedFile || selectedFile.isDirectory}
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <div>
              {selectedFile ? (
                <span>
                  {selectedFile.path} • {selectedFile.mime}
                </span>
              ) : (
                <span>No file selected</span>
              )}
            </div>
            <div>
              {isConnected ? (
                <span className="text-green-500">● Connected</span>
              ) : (
                <span className="text-red-500">● Disconnected</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        {isChatOpen && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
              <h3 className="font-medium text-gray-800 dark:text-white">Chat</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Close chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Chat feature coming soon!
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled
                />
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationLayout;
