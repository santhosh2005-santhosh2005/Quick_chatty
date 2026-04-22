import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* Left Side - Form (50%) */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 z-10 w-full bg-white">
        <div className="w-full max-w-md space-y-8 neo-card p-8 bg-white">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 border-2 border-black bg-[#a487ff] flex items-center justify-center 
                shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <MessageSquare className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-4xl font-black mt-4 uppercase tracking-tighter">Welcome Back</h1>
              <p className="text-black font-bold uppercase text-xs tracking-widest">Log in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label pt-0 pb-1.5 pl-0">
                <span className="label-text font-black text-black uppercase tracking-[0.1em] text-xs">Email Address</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-black" />
                </div>
                <input
                  type="email"
                  className="w-full pl-12 h-14 border-2 border-black bg-gray-50 focus:bg-white font-black text-lg outline-none"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label pt-0 pb-1.5 pl-0">
                <span className="label-text font-black text-black uppercase tracking-[0.1em] text-xs">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 h-14 border-2 border-black bg-gray-50 focus:bg-white font-black text-lg outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-black hover:scale-110 transition-transform"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="neo-btn w-full h-14 bg-[#37d67a] text-lg font-black uppercase tracking-tighter"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-2">
            <p className="text-black font-black uppercase text-xs">
              New to QuickChat?{" "}
              <Link to="/signup" className="text-blue-600 underline font-black">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Video (50%) */}
      <div className="hidden lg:flex relative bg-black items-center justify-center overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Overlay for cinematic effect */}
        <div className="absolute inset-0 bg-black/30 bg-gradient-to-tr from-black/60 to-transparent" />
        
        <div className="relative z-10 p-12 w-full max-w-xl text-white">
          <h2 className="text-6xl font-black mb-6 leading-tight drop-shadow-2xl italic tracking-tighter">
            Experience <br/>  
            <span className="text-primary not-italic">QuickChat.</span>
          </h2>
          <p className="text-white/90 text-2xl font-black max-w-lg leading-tight uppercase tracking-tight">
            Lightning fast. <br/> Completely secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;