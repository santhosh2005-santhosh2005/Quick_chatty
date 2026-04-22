import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  MessageCircle, ArrowRight, ShieldCheck, Lock, CheckCircle2, 
  Download, Video, MessageSquare, Send, Mic, 
  Search, Plus, Settings, Edit3, Image as ImageIcon,
  Twitter, Instagram, Linkedin, Youtube, Facebook, ChevronLeft, MoreHorizontal, Camera, MapPin, Play
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../landing.css";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const horizontalTrackRef = useRef(null);
  const horizontalSectionRef = useRef(null);

  useEffect(() => {
    // 1. Loader Logic
    const interval = setInterval(() => {
      setPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading) return;

    // 2. GSAP Animations (Syncing with original main.js logic)
    let ctx = gsap.context(() => {
      // Horizontal Scroll
      const track = horizontalTrackRef.current;
      if (track) {
        gsap.to(track, {
          x: () => -(track.offsetWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: horizontalSectionRef.current,
            start: "top top",
            end: () => `+=${track.offsetWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          }
        });
      }

      // Parallax Background Text
      gsap.to(".cine-bg-word", {
        x: -300,
        scrollTrigger: {
          trigger: horizontalSectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        }
      });

      // Animate Scroll elements
      gsap.from(".animate-scroll", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
            trigger: ".landing-hero",
            start: "top 80%",
        }
      });
    });

    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return (
      <div className="loader" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2.5rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'Poppins' }}>
            <span style={{ width: '40px', height: '40px', background: '#7B61FF', borderRadius: '10px' }}></span>
            <span>QuickChat</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#7B61FF' }}>
            <span>{percentage}</span>%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-nav-pill-container" style={{maxWidth: '1100px', margin: '0 auto', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderRadius: '100px', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div className="landing-logo">
            <span className="landing-logo-icon-wrapper" style={{color: '#7B61FF'}}><MessageCircle /></span>
            <span style={{fontWeight: 800, fontSize: '1.6rem'}}>QuickChat</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '25px'}}>
            <Link to="/login" style={{color: 'black', fontWeight: 600, textDecoration: 'none'}}>Log In</Link>
            <Link to="/signup" className="btn-landing-purple" style={{background: '#7B61FF', color: 'white', padding: '12px 28px', borderRadius: '40px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px'}}>
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#fdfcff', paddingTop: '80px'}}>
        <div className="landing-hero-container" style={{maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', alignItems: 'center', width: '100%'}}>
          <div className="landing-hero-content">
            <h1 className="landing-hero-title animate-scroll" style={{fontSize: '6.2rem', fontWeight: 900, lineHeight: 0.9, marginBottom: '25px', fontFamily: 'Poppins'}}>
              Connect.<br />
              <span style={{color: '#7B61FF'}}>Chat.</span><br />
              Stay in touch.
            </h1>
            <h3 className="animate-scroll" style={{color: '#8B7EFF', fontSize: '2.5rem', fontStyle: 'italic', marginBottom: '35px'}}>
              Seamless Messaging.<br />Connected Conversations.
            </h3>
            <p className="landing-hero-subtitle animate-scroll">
              A fast, secure, and beautiful messaging platform that keeps you connected with anyone, anywhere in the world.
            </p>
            <div className="landing-hero-cta animate-scroll" style={{display: 'flex', gap: '25px', marginBottom: '40px'}}>
              <Link to="/signup" className="btn-landing-purple" style={{padding: '20px 40px', borderRadius: '50px', fontSize: '1.1rem'}}>
                Get Started <ArrowRight />
              </Link>
              <a href="#download" className="btn-landing-white" style={{padding: '20px 40px', borderRadius: '50px', fontSize: '1.1rem'}}>
                <Download size={20} /> Download App
              </a>
            </div>
            <div className="landing-hero-features animate-scroll" style={{display: 'flex', gap: '15px', color: '#7B61FF', fontWeight: 600}}>
              <span className="feature-item"><ShieldCheck size={18} /> Secure</span>
              <span className="divider">|</span>
              <span className="feature-item"><Lock size={18} /> Private</span>
              <span className="divider">|</span>
              <span className="feature-item"><CheckCircle2 size={18} /> Reliable</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="phones-container">
              {/* Left Phone */}
              <div className="phone phone-left">
                <div className="phone-screen phone-purple">
                  <div className="phone-notch"></div>
                  <MessageCircle size={60} style={{marginBottom: '20px'}} />
                  <h2 style={{fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px'}}>QuickChat</h2>
                  <p style={{fontSize: '0.9rem', opacity: 0.9, marginBottom: '40px'}}>Seamless Messaging.<br />Connected Conversations.</p>
                  <div className="phone-buttons" style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <Link to="/signup" className="phone-btn-white" style={{background: 'white', color: '#7B61FF', padding: '14px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none'}}>Create Account</Link>
                    <Link to="/login" className="phone-btn-outline" style={{border: '1.5px solid white', padding: '14px', borderRadius: '12px', color: 'white', textDecoration: 'none'}}>Log In</Link>
                  </div>
                </div>
              </div>

              {/* Right Phone (Simplified) */}
              <div className="phone phone-right">
                <div className="phone-screen phone-white">
                  <div className="phone-header-white" style={{padding: '15px'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800}}>
                       <span>QuickChat</span>
                       <Edit3 size={18} />
                     </div>
                  </div>
                  <div className="phone-chat-content" style={{padding: '0 15px'}}>
                    <div style={{background: '#f3f4f6', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px'}}>
                       <Search size={16} /> Search...
                    </div>
                    <div className="chat-list" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                       {[
                         { name: "Min Seok Hyung", msg: "See you soon!", color: "#fee2e2" },
                         { name: "Yeollie Hyung", msg: "Voice Message", color: "#fef9c3" }
                       ].map((chat, i) => (
                         <div key={i} style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                            <div style={{width: '40px', height: '40px', borderRadius: '50%', background: chat.color}} />
                            <div>
                               <div style={{fontSize: '0.8rem', fontWeight: 700}}>{chat.name}</div>
                               <div style={{fontSize: '0.7rem', color: '#6b7280'}}>{chat.msg}</div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Horizontal Scroll */}
      <section ref={horizontalSectionRef} className="cine-scroll-wrapper" style={{background: '#0c0c0e'}}>
        <div className="cine-pin-container" style={{height: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden'}}>
          <div className="cine-bg-text-wrapper">
             <span className="cine-bg-word outlined">QUICKCHAT</span>
             <span className="cine-bg-word">QUICKCHAT</span>
          </div>
          <div className="cine-horizontal-track" ref={horizontalTrackRef}>
             <div className="cine-card cine-intro">
               <div className="cine-card-content" style={{border: 'none', background: 'transparent'}}>
                 <h2 style={{color: 'white', fontSize: '5rem', fontWeight: 900}}>Engineered for<br /><span className="outlined">OUTCOMES.</span></h2>
               </div>
             </div>
             {[
               { id: "01", title: "Military-grade Encryption", desc: "Your conversations are protected by end-to-end industry standards." },
               { id: "02", title: "Global Sync", desc: "Access your chats from any device, anywhere in the world." },
               { id: "03", title: "Edge Performance", desc: "Optimized core that works even on low-speed networks." }
             ].map((card, i) => (
               <div key={i} className="cine-card">
                 <div className="cine-card-content">
                    <div style={{color: '#7B61FF', fontWeight: 600, marginBottom: '1rem'}}>[ {card.id} ]</div>
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Full Video Section */}
      <section style={{height: '100vh', position: 'relative', background: '#000', overflow: 'hidden'}}>
         <video autoPlay loop muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6}}>
           <source src="/hero-video.mp4" type="video/mp4" />
         </video>
         <div style={{position: 'absolute', bottom: '100px', width: '100%', textAlign: 'center'}}>
           <h2 style={{color: 'white', fontSize: '3.5rem', fontWeight: 800}}>See QuickChat in Action</h2>
         </div>
      </section>

      {/* Bento Feature Section */}
      <section className="section-bento">
        <div className="container" style={{maxWidth: '1400px', margin: '0 auto', padding: '0 40px'}}>
           <div className="bento-grid">
              <div className="bento-card card-1 animate-scroll">
                 <div>
                    <h2 className="bento-title">Chat <span style={{color: '#7B61FF'}}>freely,</span> connect deeply.</h2>
                    <p className="bento-desc">Stay in touch with the people who matter most.</p>
                 </div>
              </div>
              <div className="bento-card card-3 animate-scroll">
                 <h2 className="bento-title" style={{color: 'white'}}>Share more than words.</h2>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div className="landing-logo">
              <MessageCircle style={{color: '#7B61FF'}} />
              <span style={{fontWeight: 800}}>QuickChat</span>
            </div>
            <p style={{color: '#6b7280', marginTop: '10px'}}>Seamless Messaging. Connected Conversations.</p>
          </div>
          <div className="footer-socials" style={{display: 'flex', gap: '20px'}}>
            <Twitter size={20} /> <Instagram size={20} /> <Linkedin size={20} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
