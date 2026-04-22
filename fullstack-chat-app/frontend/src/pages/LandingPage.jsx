import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  MessageCircle, ArrowRight, ShieldCheck, Lock, CheckCircle2, 
  Download, Video, MessageSquare, Send, Mic, 
  Search, Plus, Phone, Users, Settings, Edit3, Image as ImageIcon,
  Twitter, Instagram, Linkedin, Youtube, Facebook, ChevronLeft, MoreHorizontal, Camera, MapPin, Play
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./landing.css";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const horizontalTrackRef = useRef(null);
  const horizontalSectionRef = useRef(null);

  useEffect(() => {
    // GSAP Horizontal Scroll Logic (Perfectly replicated)
    let ctx = gsap.context(() => {
      const track = horizontalTrackRef.current;
      const getScrollAmount = () => {
        let trackWidth = track.offsetWidth;
        return -(trackWidth - window.innerWidth / 1);
      };

      gsap.to(track, {
        x: getScrollAmount,
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

      // Background Parallax Text Animation
      gsap.to(".cine-bg-word", {
        x: -200,
        scrollTrigger: {
          trigger: horizontalSectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-nav-pill-container">
          <div className="landing-logo">
            <span className="landing-logo-icon-wrapper"><MessageCircle className="landing-logo-icon-svg" /></span>
            <span className="landing-logo-text">QuickChat</span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="nav-btn-link">Log In</Link>
            <Link to="/signup" className="btn-landing-purple">
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          <div className="landing-hero-content">
            <h1 className="landing-hero-title">
              Connect.<br />
              <span className="landing-text-purple">Chat.</span><br />
              Stay in touch.
            </h1>
            <h3 className="landing-hero-title-italic">
              Seamless Messaging.<br />
              Connected Conversations.
            </h3>
            <p className="landing-hero-subtitle">
              A fast, secure, and beautiful messaging platform that keeps you connected with anyone, anywhere in the world.
            </p>
            <div className="landing-hero-cta">
              <Link to="/signup" className="btn-landing-purple-lg btn-landing-purple">
                Get Started <ArrowRight />
              </Link>
              <a href="#download" className="btn-landing-white">
                <Download size={20} /> Download App
              </a>
            </div>
            <div className="landing-hero-features">
              <span className="feature-item"><ShieldCheck size={18} /> Secure</span>
              <span className="divider">|</span>
              <span className="feature-item"><Lock size={18} /> Private</span>
              <span className="divider">|</span>
              <span className="feature-item"><CheckCircle2 size={18} /> Reliable</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="phones-container">
              {/* Left Phone (Purple) */}
              <div className="phone phone-left">
                <div className="phone-screen phone-purple">
                  <div className="phone-notch"></div>
                  <div className="phone-content-center">
                    <MessageCircle className="logo-icon-phone" size={60} />
                    <h2 className="phone-title">QuickChat</h2>
                    <p className="phone-subtitle-text">Seamless Messaging.<br />Connected Conversations.</p>
                    <div className="phone-buttons">
                      <Link to="/signup" className="phone-btn-white">Create Account</Link>
                      <Link to="/login" className="phone-btn-outline">Log In</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Phone (Chat List) */}
              <div className="phone phone-right">
                <div className="phone-screen phone-white">
                    <div className="phone-header-white" style={{padding: '10px 25px'}}>
                      <div className="phone-notch-black" style={{left: '50%', transform: 'translateX(-50%)', width: '100px', height: '25px'}}></div>
                      <div className="phone-top-info" style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700}}>
                        <span>9:41</span>
                        <div style={{display: 'flex', gap: '4px'}}>
                          <Settings size={12} /> <Settings size={12} /> <Settings size={12} />
                        </div>
                      </div>
                    </div>
                    <div className="phone-chat-content" style={{padding: '0 15px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', margin: '10px 0 15px'}}>
                        <span style={{fontWeight: 800, fontSize: '1.2rem'}}>QuickChat</span>
                        <Edit3 size={18} />
                      </div>
                      <div style={{background: '#f3f4f6', padding: '10px', borderRadius: '12px', display: 'flex', gap: '10px', color: '#9ca3af', fontSize: '0.85rem', marginBottom: '20px'}}>
                        <Search size={16} /> <span>Search messages</span>
                      </div>
                      <div style={{display: 'flex', gap: '12px', marginBottom: '25px'}}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                           <div style={{width: '45px', height: '45px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d1d5db'}}><Plus size={20} /></div>
                           <span style={{fontSize: '0.65rem'}}>Add</span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                           <div style={{width: '45px', height: '45px', borderRadius: '50%', background: '#fee2e2'}} />
                           <span style={{fontSize: '0.65rem'}}>Min Seok</span>
                        </div>
                      </div>
                      {/* Chat Items */}
                      <div className="chat-list" style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                         {[
                           { name: "Min Seok Hyung", msg: "See you soon!", time: "1m", unread: 2, color: "#fee2e2" },
                           { name: "Yeollie Hyung", msg: "Voice Message", time: "3m", color: "#fef9c3" },
                         ].map((chat, i) => (
                           <div key={i} style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                             <div style={{width: '45px', height: '45px', borderRadius: '50%', background: chat.color}} />
                             <div style={{flex: 1}}>
                               <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                 <h4 style={{fontSize: '0.85rem', fontWeight: 700}}>{chat.name}</h4>
                                 <span style={{fontSize: '0.7rem', color: '#9ca3af'}}>{chat.time}</span>
                               </div>
                               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                 <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{chat.msg}</p>
                                 {chat.unread && <span style={{background: '#7B61FF', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '100px'}}>{chat.unread}</span>}
                               </div>
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

      {/* Cinematic Scroll Section */}
      <section id="experience" ref={horizontalSectionRef} className="cine-scroll-wrapper bg-grid">
        <div className="cine-pin-container">
          <div className="cine-bg-text-wrapper">
            <span className="cine-bg-word outlined">QUICKCHAT</span>
            <span className="cine-bg-word">QUICKCHAT</span>
            <span className="cine-bg-word outlined">QUICKCHAT</span>
            <span className="cine-bg-word">QUICKCHAT</span>
          </div>

          <div className="cine-horizontal-track" ref={horizontalTrackRef}>
            <div className="cine-card cine-intro">
              <div className="cine-card-content" style={{border: 'none', background: 'transparent', backdropFilter: 'none'}}>
                <h2 style={{color: '#FFFFFF', fontSize: '5rem', fontWeight: 900}}>Engineered for<br /><span className="outlined">OUTCOMES.</span></h2>
              </div>
            </div>
            
            {[
              { id: "01_ENCRYPTION", title: "Military-grade end-to-end encryption by default.", desc: "We use industry-standard protocols to ensure your conversations remain between you and your recipients." },
              { id: "02_INTELLIGENCE", title: "Context-aware AI that assists without invading.", desc: "Our localized neural engine helps draft replies and summarizes long threads without your data leaving your device." },
              { id: "03_PERFORMANCE", title: "Optimized for the edge, delivered with zero latency.", desc: "Engineered with a lightweight core that works flawlessly even on 2G networks. Connectivity is a right." }
            ].map((card, i) => (
              <div key={i} className="cine-card">
                <div className="cine-card-content">
                  <div className="card-index" style={{color: '#7B61FF', fontWeight: 600, marginBottom: '1rem'}}>[ {card.id} ]</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Screen Video */}
      <section style={{height: '100vh', position: 'relative', overflow: 'hidden', background: '#000'}}>
        <video autoPlay loop muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7}}>
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div style={{position: 'absolute', bottom: '100px', left: '0', width: '100%', textAlign: 'center'}}>
          <h2 style={{color: 'white', fontSize: '4rem', fontWeight: 900}}>See QuickChat in Action</h2>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div className="landing-logo">
              <span className="landing-logo-icon-wrapper"><MessageCircle /></span>
              <span className="landing-logo-text">QuickChat</span>
            </div>
            <p style={{marginTop: '10px', color: '#6b7280'}}>Seamless Messaging. Connected Conversations.</p>
          </div>
          <div className="footer-socials">
            <Twitter size={20} /> <Instagram size={20} /> <Linkedin size={20} /> <Youtube size={20} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
