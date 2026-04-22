import { Link } from "react-router-dom";
import { MessageSquare, ShieldCheck, Zap, Globe, ArrowRight } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="h-screen bg-[#FEE12B] overflow-hidden flex flex-col lg:flex-row">
      
      {/* Left Info Section - Text & CTA */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 z-10 w-full lg:w-1/2">
        <div className="w-full max-w-xl space-y-12">
          
          {/* Header Area */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-black text-white neo-shadow-sm font-black uppercase text-xs tracking-widest">
              <Zap size={14} className="fill-yellow-400 text-yellow-400" />
              <span>Version 2.0 Now Live</span>
            </div>
            
            <h1 className="text-7xl sm:text-8xl font-black leading-[0.9] tracking-tighter text-black uppercase">
              Connect.<br/>
              <span className="text-white [-webkit-text-stroke:2px_black]">Chat.</span><br/>
              Explore.
            </h1>
            
            <p className="text-xl sm:text-2xl font-black text-black/80 max-w-md leading-tight uppercase tracking-tight">
              The world's most <br/> 
              <span className="bg-white px-2 py-1 neo-border">dynamic</span> messaging platform.
            </p>
          </div>

          {/* Features Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black flex items-center justify-center neo-shadow-sm">
                <ShieldCheck className="text-[#37d67a]" size={20} />
              </div>
              <span className="font-black uppercase text-sm">Military Grade</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black flex items-center justify-center neo-shadow-sm">
                <Globe className="text-[#a487ff]" size={20} />
              </div>
              <span className="font-black uppercase text-sm">Zero Latency</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              to="/signup" 
              className="neo-btn flex-1 bg-black text-white h-16 flex items-center justify-center gap-3 text-xl hover:bg-zinc-900"
            >
              Get Started <ArrowRight size={24} />
            </Link>
            <Link 
              to="/login" 
              className="neo-btn flex-1 bg-white text-black h-16 flex items-center justify-center gap-3 text-xl hover:bg-gray-50 border-4 border-black"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Visual Section - Cinematic Video */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center overflow-hidden neo-border-l border-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] contrast-125"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

        <div className="relative z-10 p-12 text-center">
            <div className="w-24 h-24 bg-[#FEE12B] neo-border neo-shadow flex items-center justify-center mx-auto mb-8 animate-bounce">
                <MessageSquare className="w-12 h-12 text-black" />
            </div>
            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4 shadow-black drop-shadow-xl">
                Ready to Join?
            </h2>
            <p className="text-white/80 font-bold uppercase text-sm tracking-[0.2em]">
                Secure • Global • Instant
            </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
