import React from 'react';
import ReactDOM from 'react-dom/client';
import CollaborationLayout from './components/CollaborationLayout';
import './index.css';

// Mock auth context for the preview
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
};

// Create a mock room ID for the preview
const PreviewApp = () => {
  const mockUser = {
    id: 'user-preview-123',
    name: 'Demo User',
    email: 'demo@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=random'
  };

  return (
    <AuthProvider>
      <CollaborationLayout />
    </AuthProvider>
  );
};

// Render the app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <PreviewApp />
  </React.StrictMode>
);
