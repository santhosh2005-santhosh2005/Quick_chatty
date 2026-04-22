import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ArrowRight, Download, ShieldCheck, Lock, CheckCircle2, Video, MessageSquare, Send, Mic, Play, ChevronLeft, Search, Edit3, Plus, Signal, Wifi, Battery, Phone, Users, Settings, MoreHorizontal, Camera, MapPin, Image as LucideImage, Edit, Twitter, Instagram, Linkedin, Youtube, Facebook } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../landing.css";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const [loading, setLoading] = useState(true);
    const [percentage, setPercentage] = useState(0);
    const heroRef = useRef(null);
    const trackRef = useRef(null);

    // Loader Logic
    useEffect(() => {
        let count = 0;
        const interval = setInterval(() => {
            count += Math.floor(Math.random() * 15) + 5;
            if (count >= 100) {
                count = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
            setPercentage(count);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // GSAP Animations
    useEffect(() => {
        if (loading) return;

        // Ensure we are at top
        window.scrollTo(0, 0);

        // 1. Hero Animations
        gsap.from(".hero-title", {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: 0.2
        });

        gsap.from(".hero-subtitle", {
            y: 50,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: 0.4
        });

        gsap.from(".hero-cta", {
            y: 30,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: 0.6
        });

        gsap.from(".phones-container", {
            x: 100,
            opacity: 0,
            duration: 1.5,
            ease: "power4.out",
            delay: 0.8
        });

        gsap.from(".phone-left", {
            rotation: -20,
            duration: 2,
            ease: "elastic.out(1, 0.5)",
            delay: 1
        });

        gsap.from(".phone-right", {
            rotation: 20,
            duration: 2,
            ease: "elastic.out(1, 0.5)",
            delay: 1.2
        });

        // 2. Cinematic Horizontal Scroll
        const horizontalTrack = trackRef.current;
        const bgWords = document.querySelectorAll(".cine-bg-word");
        const cards = document.querySelectorAll(".cine-card");

        if (horizontalTrack) {
            let mm = gsap.matchMedia();

            mm.add("(min-width: 969px)", () => {
                const totalScrollWidth = horizontalTrack.scrollWidth - window.innerWidth;

                let scrollTween = gsap.to(horizontalTrack, {
                    x: -totalScrollWidth,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".cine-scroll-wrapper",
                        start: "top top",
                        end: () => `+=${totalScrollWidth + 2000}`,
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true
                    }
                });

                // Parallax Background Text (Fast moving)
                bgWords.forEach((word, index) => {
                    gsap.to(word, {
                        x: -800 * (index + 1),
                        ease: "none",
                        scrollTrigger: {
                            trigger: ".cine-scroll-wrapper",
                            start: "top top",
                            end: () => `+=${totalScrollWidth + 1500}`,
                            scrub: 2
                        }
                    });
                });

                // Animate Cards
                cards.forEach((card) => {
                    const content = card.querySelector(".cine-card-content");
                    if (!content) return;

                    gsap.from(content, {
                        opacity: 0,
                        x: 100,
                        duration: 1,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: card,
                            containerAnimation: scrollTween,
                            start: "left center+=40%",
                            toggleActions: "play none none reverse"
                        }
                    });
                });
            });

            mm.add("(max-width: 968px)", () => {
                // Mobile behavior: Simple vertical reveals
                cards.forEach((card) => {
                    const content = card.querySelector(".cine-card-content");
                    if (!content) return;
                    
                    gsap.from(content, {
                        y: 30,
                        opacity: 0,
                        duration: 1,
                        scrollTrigger: {
                            trigger: card,
                            start: "top 80%",
                            toggleActions: "play none none reverse"
                        }
                    });
                });
            });
        }

        // 3. Scroll Reveal for Global sections
        const revealElements = document.querySelectorAll(".animate-scroll");
        revealElements.forEach(el => {
            gsap.from(el, {
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
              },
              y: 50,
              opacity: 0,
              duration: 1
            });
        });

        // 4. Parallax Background Text (Global)
        const handleScroll = () => {
            const scrolled = window.scrollY;
            const bgHero = document.querySelector(".bg-text-hero");
            if (bgHero) {
                bgHero.style.transform = `translateY(-50%) translateX(${scrolled * 0.1}px)`;
            }
            const navbar = document.querySelector(".navbar");
            if (navbar) {
                if (scrolled > 50) navbar.classList.add("scrolled");
                else navbar.classList.remove("scrolled");
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            ScrollTrigger.getAll().forEach(t => t.kill());
            gsap.matchMedia().revert();
        };
    }, [loading]);

    return (
        <div className={`landing-root ${loading ? "is-loading" : ""}`}>
            {loading && (
                <div id="loader" className="loader">
                    <div className="loader-content">
                        <div className="loader-logo">
                            <span className="logo-icon bg-[#7B61FF] w-10 h-10 rounded-lg flex items-center justify-center">
                                <MessageCircle className="text-white" size={24} />
                            </span>
                            <span className="logo-text font-bold text-black ml-3">QuickChat</span>
                        </div>
                        <div className="percentage-container text-[#7B61FF] font-medium text-xl">
                            <span id="percentage">{percentage}</span>%
                        </div>
                    </div>
                    <div className="loader-bg"></div>
                </div>
            )}

            {!loading && (
                <div id="app">
                    {/* Navbar */}
                    <nav className="navbar border-none">
                        <div className="nav-pill-container">
                            <div className="logo cursor-pointer">
                                <span className="logo-icon-wrapper text-[#7B61FF]">
                                    <MessageCircle size={28} />
                                </span>
                                <span className="logo-text text-black font-extrabold text-2xl">QuickChat</span>
                            </div>
                            <div className="nav-pill hidden md:flex">
                                <a href="#hero" className="nav-pill-link active">Home</a>
                                <a href="#features" className="nav-pill-link">Products</a>
                                <a href="#video-feature" className="nav-pill-link">Blog</a>
                                <a href="#pricing" className="nav-pill-link">About</a>
                            </div>
                            <div className="nav-actions">
                                <Link to="/login" className="nav-btn-link font-bold text-black hover:text-[#7B61FF]">Log In</Link>
                                <Link to="/signup" className="btn-purple-pill bg-[#7B61FF] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2">
                                    Get Started <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </nav>

                    {/* Hero Section */}
                    <section id="hero" className="hero min-h-screen relative flex items-center pt-20" ref={heroRef}>
                        <div className="hero-container max-w-7xl mx-auto px-8 w-full grid md:grid-cols-2 gap-12 items-center">
                            <div className="hero-content">
                                <h1 className="hero-title text-7xl md:text-8xl font-black leading-none mb-6">
                                    Connect.<br />
                                    <span className="text-[#7B61FF]">Chat.</span><br />
                                    Stay in touch.
                                </h1>
                                <h3 className="hero-title-italic text-3xl italic font-medium text-gray-500 mb-8 leading-tight">
                                    Seamless Messaging.<br />
                                    Connected Conversations.
                                </h3>
                                <p className="hero-subtitle text-lg text-gray-400 max-w-md mb-12 leading-relaxed">
                                    A fast, secure, and beautiful messaging platform that keeps you connected with anyone, anywhere in the world.
                                </p>
                                <div className="hero-cta flex flex-wrap gap-4 mb-12">
                                    <Link to="/signup" className="btn-purple-pill-lg bg-[#7B61FF] text-white px-10 py-5 rounded-full font-bold text-lg flex items-center gap-3">
                                        Get Started <ArrowRight size={20} />
                                    </Link>
                                    <a href="#download" className="btn-white-pill bg-white border border-gray-100 px-10 py-5 rounded-full font-bold text-lg flex items-center gap-3">
                                        <Download size={20} /> Download App
                                    </a>
                                </div>
                                <div className="hero-features flex items-center gap-6 text-[#7B61FF] font-bold">
                                    <span className="flex items-center gap-2"><ShieldCheck size={18} /> Secure</span>
                                    <span className="text-gray-200">|</span>
                                    <span className="flex items-center gap-2"><Lock size={18} /> Private</span>
                                    <span className="text-gray-200">|</span>
                                    <span className="flex items-center gap-2"><CheckCircle2 size={18} /> Reliable</span>
                                </div>
                            </div>

                            <div className="hero-visual">
                                <div className="phones-container relative h-[600px] w-full">
                                    <div className="phone phone-left absolute left-0 top-1/2 -translate-y-1/2 w-[260px] h-[520px] bg-[#7B61FF] rounded-[45px] border-8 border-gray-900 shadow-2xl z-10 -rotate-12 translate-x-12 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white">
                                            <MessageCircle className="mb-8" size={60} />
                                            <h2 className="text-3xl font-bold mb-2">QuickChat</h2>
                                            <p className="opacity-70 text-sm mb-12">Seamless Messaging.<br />Connected Conversations.</p>
                                            <div className="w-full flex flex-col gap-3">
                                                <Link to="/signup" className="bg-white text-[#7B61FF] py-3 rounded-xl font-bold text-sm">Create Account</Link>
                                                <Link to="/login" className="border border-white/40 py-3 rounded-xl font-semibold text-sm">Log In</Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="phone phone-right absolute right-0 top-1/2 -translate-y-1/2 w-[260px] h-[520px] bg-white rounded-[45px] border-8 border-gray-900 shadow-2xl z-20 rotate-6 -translate-x-12 overflow-hidden">
                                        <div className="p-5 flex flex-col h-full bg-white">
                                            <div className="flex justify-between items-center mb-5">
                                                <span className="font-bold text-xl">QuickChat</span>
                                                <Edit3 size={18} />
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center gap-3 text-gray-400 text-xs mb-6">
                                                <Search size={14} /><span>Search messages</span>
                                            </div>
                                            <div className="flex gap-3 mb-6 overflow-hidden">
                                                <div className="flex flex-col items-center gap-1 min-w-[45px]">
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Plus size={16} className="text-gray-300" /></div>
                                                    <span className="text-[10px] font-semibold text-gray-400">Add</span>
                                                </div>
                                                {["Min Seok", "Yeollie", "Yixing"].map((name, i) => (
                                                    <div key={name} className="flex flex-col items-center gap-1 min-w-[45px]">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-[0_0_0_2px_#7B61FF]" />
                                                        <span className="text-[10px] font-semibold">{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex flex-col gap-5">
                                                {[
                                                    { name: "Min Seok Hyung", msg: "See you soon!", time: "1m", count: 2 },
                                                    { name: "Yeollie Hyung", msg: "Voice Message", time: "3m", icon: Mic },
                                                    { name: "Yixing Gege", msg: "Photo", time: "12m", icon: LucideImage }
                                                ].map((chat, i) => (
                                                    <div key={i} className="flex gap-4 items-center">
                                                        <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="flex justify-between mb-0.5">
                                                                <h4 className="text-xs font-bold">{chat.name}</h4>
                                                                <span className="text-[10px] text-gray-300">{chat.time}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">{chat.icon && <chat.icon size={10} />}{chat.msg}</p>
                                                                {chat.count && <span className="bg-[#7B61FF] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{chat.count}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-4 border-t flex justify-around items-center">
                                                <div className="text-[#7B61FF] flex flex-col items-center gap-1"><MessageCircle size={18} /><span className="text-[9px] font-bold">Chats</span></div>
                                                <div className="text-gray-300 flex flex-col items-center gap-1"><Phone size={18} /><span className="text-[9px] font-bold">Calls</span></div>
                                                <div className="bg-[#7B61FF] text-white w-9 h-9 rounded-full flex items-center justify-center"><Plus size={18} /></div>
                                                <div className="text-gray-300 flex flex-col items-center gap-1"><Users size={18} /><span className="text-[9px] font-bold">Contacts</span></div>
                                                <div className="text-gray-300 flex flex-col items-center gap-1"><Settings size={18} /><span className="text-[9px] font-bold">Settings</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="floating-element float-1 absolute top-[15%] right-[10%] w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-[#7B61FF] z-10"><Video size={24} /></div>
                                <div className="floating-element float-2 absolute top-[40%] left-[5%] w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-[#7B61FF] z-10"><MessageSquare size={24} /></div>
                                <div className="floating-element float-3 absolute bottom-[20%] right-[12%] w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-[#7B61FF] z-10"><Send size={24} /></div>
                            </div>
                        </div>
                    </section>

                    {/* Cinematic Experience Section */}
                    <section id="experience" className="cine-scroll-wrapper relative h-screen bg-[#0a0a0k] overflow-hidden">
                        <div className="cine-pin-container h-full sticky top-0 flex items-center overflow-hidden">
                            <div className="cine-bg-text-wrapper absolute inset-0 flex flex-col justify-center opacity-10 pointer-events-none select-none">
                                <span className="cine-bg-word outlined text-[15vw] font-black leading-none whitespace-nowrap">QUICKCHAT</span>
                                <span className="cine-bg-word text-[15vw] font-black leading-none whitespace-nowrap">QUICKCHAT</span>
                                <span className="cine-bg-word outlined text-[15vw] font-black leading-none whitespace-nowrap">QUICKCHAT</span>
                                <span className="cine-bg-word text-[15vw] font-black leading-none whitespace-nowrap">QUICKCHAT</span>
                            </div>

                            <div className="cine-horizontal-track flex h-full items-center pl-[20vw]" ref={trackRef}>
                                <div className="cine-card cine-intro min-w-[80vw] flex justify-center items-center">
                                    <div className="max-w-2xl">
                                        <h2 className="text-white text-8xl font-black leading-none italic uppercase mb-8">Engineered for<br /><span className="outlined text-transparent [-webkit-text-stroke:1px_white]">OUTCOMES.</span></h2>
                                        <p className="text-white/50 text-xl leading-relaxed">QuickChat is not just an application. It's a paradigm shift in how we stay connected.</p>
                                    </div>
                                </div>

                                {[
                                    { title: "Military-grade end-to-end encryption by default.", index: "01_ENCRYPTION", desc: "We use industry-standard protocols to ensure your conversations remain between you and your recipients. Zero-knowledge architecture guaranteed." },
                                    { title: "Context-aware AI that assists without invading.", index: "02_INTELLIGENCE", desc: "Our localized neural engine helps draft replies and summarizes long threads without your data ever leaving your device's secure enclave." },
                                    { title: "Optimized for the edge, delivered with zero latency.", index: "03_PERFORMANCE", desc: "Engineered with a lightweight core that works flawlessly even on 2G networks. Connectivity is a right, not a privilege." },
                                    { title: "Seamless cross-platform synchronization.", index: "04_GLOBAL", desc: "Switch between mobile, tablet, and desktop without missing a single character. Your workspace follows you everywhere." }
                                ].map((item, i) => (
                                    <div key={i} className="cine-card min-w-[80vw] flex justify-center items-center px-12">
                                        <div className="cine-card-content bg-white/5 backdrop-blur-2xl border border-white/10 p-16 rounded-[40px] max-w-2xl">
                                            <div className="text-[#a18dff] font-mono mb-8 opacity-60">{"[ " + item.index + " ]"}</div>
                                            <h3 className="text-white text-4xl font-bold mb-6 leading-tight">{item.title}</h3>
                                            <p className="text-white/50 text-lg leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="cine-card cine-outro min-w-[80vw] flex justify-center items-center">
                                    <div className="text-center">
                                        <h2 className="text-white text-8xl font-black leading-none italic uppercase mb-8 focus-visible:outline-none">Ready for the<br /><span className="outlined text-transparent [-webkit-text-stroke:1px_white]">FUTURE.</span></h2>
                                        <p className="text-white/50 text-xl leading-relaxed max-w-lg mx-auto">Join the revolution of private communication today.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Video Section */}
                    <section id="video-feature" className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
                        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                            <source src="/hero-video.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end items-center pb-24 text-center px-8">
                            <h2 className="text-white text-6xl font-black mb-6 tracking-tight">See QuickChat in Action</h2>
                            <p className="text-white/50 text-xl max-w-md">Privacy. Speed. Intelligence. Experience the future of messaging today.</p>
                        </div>
                    </section>

                    {/* Bento Features Section */}
                    <section id="features" className="py-32 bg-gray-50 overflow-hidden text-black">
                        <div className="max-w-7xl mx-auto px-8 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bento-card col-span-1 md:col-span-2 bg-[#7B61FF] rounded-[50px] p-16 text-white relative flex flex-col justify-between overflow-hidden group">
                                    <div>
                                        <h2 className="text-5xl font-black mb-6 leading-none">Chat <span className="opacity-50">freely,</span><br />connect deeply.</h2>
                                        <p className="text-white/70 text-xl max-w-sm">QuickChat helps you stay in touch with the people who matter most.</p>
                                    </div>
                                    <div className="mt-12 flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-lg"><MessageCircle size={28} /></div>
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="w-12 h-12 rounded-full border-4 border-[#7B61FF] bg-white/20 backdrop-blur-md" />)}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <MessageCircle size={400} />
                                    </div>
                                </div>

                                <div className="bento-card bg-white rounded-[50px] p-16 shadow-sm border border-gray-100 flex flex-col justify-between items-center text-center overflow-hidden relative">
                                    <h2 className="text-4xl font-black leading-tight mb-8">One app,<br />endless ways<br /><span className="text-[#a18dff]">to connect</span></h2>
                                    <div className="relative w-full h-40 flex items-center justify-center">
                                       <div className="absolute w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shadow-xl animate-bounce"><Video size={32} className="text-blue-500" /></div>
                                       <div className="absolute left-0 bottom-0 w-20 h-20 bg-green-50 rounded-full flex items-center justify-center shadow-lg -translate-x-4"><MessageSquare size={28} className="text-green-500" /></div>
                                       <div className="absolute right-0 bottom-0 w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center shadow-lg translate-x-4"><Mic size={28} className="text-orange-500" /></div>
                                    </div>
                                    <p className="text-gray-400 mt-12">Text, voice, video, and more — all in one place.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="bg-white py-24 border-t border-gray-100 text-black">
                        <div className="max-w-7xl mx-auto px-8 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
                                <div className="max-w-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <MessageCircle className="text-[#7B61FF]" size={40} />
                                        <span className="font-extrabold text-3xl tracking-tighter">QuickChat</span>
                                    </div>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">Seamless Messaging. Connected Conversations. The future of communication is here.</p>
                                    <div className="flex gap-6">
                                        {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => <Icon key={i} size={20} className="text-gray-300 hover:text-[#7B61FF] cursor-pointer transition-colors" />)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                                    <div>
                                        <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-[#7B61FF]">Product</h4>
                                        <ul className="flex flex-col gap-5 text-gray-400">
                                            <li className="hover:text-black cursor-pointer transition-colors">Features</li>
                                            <li className="hover:text-black cursor-pointer transition-colors">Security</li>
                                            <li className="hover:text-black cursor-pointer transition-colors">Enterprise</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-[#7B61FF]">Company</h4>
                                        <ul className="flex flex-col gap-5 text-gray-400">
                                            <li className="hover:text-black cursor-pointer transition-colors">About Us</li>
                                            <li className="hover:text-black cursor-pointer transition-colors">Careers</li>
                                            <li className="hover:text-black cursor-pointer transition-colors">Contact</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-[#7B61FF]">Support</h4>
                                        <ul className="flex flex-col gap-5 text-gray-400">
                                            <li className="hover:text-black cursor-pointer transition-colors">Help Center</li>
                                            <li className="hover:text-black cursor-pointer transition-colors">Privacy</li>
                                            <li className="hover:text-black cursor-pointer transition-colors">Terms</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8 text-sm text-gray-300">
                                <p>© 2026 QuickChat Inc. Made for 5th Sem Project.</p>
                                <div className="flex gap-12 font-medium">
                                    <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
                                    <span className="hover:text-gray-400 cursor-pointer">Terms & Conditions</span>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
