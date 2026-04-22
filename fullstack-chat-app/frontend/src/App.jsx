import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ParticlesTestPage from "./pages/ParticlesTestPage";
import CollabPage from "./pages/CollabPage";
import AnimationDemo from "./pages/AnimationDemo";
import LandingPage from "./pages/LandingPage";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import SpiralAnimation from "./components/ui/spiral-animation";
import GeneralCallModal from "./components/GeneralCallModal";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log("App Auth State:", { isCheckingAuth, authUser: authUser?._id, path: location.pathname });

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader className="size-8 text-primary animate-spin" />
          </div>
          <p className="text-base-content/70">Loading QuickChat...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} className="min-h-screen relative">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 opacity-20 overflow-hidden">
        <SpiralAnimation className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full" />
      </div>

      {/* General Call Modal */}
      <GeneralCallModal />

      {/* Content */}
      <div className="relative z-10">
        {!['/', '/landing'].includes(location.pathname) && !location.pathname.startsWith('/collab') && <Navbar />}

        <div className={['/', '/landing'].includes(location.pathname) ? 'pt-0' : location.pathname.startsWith('/collab') ? 'pt-0' : 'pt-16'}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/home" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/home" />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/home" />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/particles-demo" element={<ParticlesTestPage />} />
            <Route path="/collab/:sessionId" element={authUser ? <CollabPage /> : <Navigate to="/login" />} />
            <Route path="/animation-demo" element={<AnimationDemo />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-base-100 !text-base-content !border !border-base-300 !shadow-lg",
            duration: 3000,
          }}
        />
      </div>
    </div>
  );
};
export default App;