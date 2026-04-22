// Initialize Libraries
lucide.createIcons();
gsap.registerPlugin(ScrollTrigger);

// Loader Logic
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const percentage = document.getElementById('percentage');
    
    let count = 0;
    const interval = setInterval(() => {
        count += Math.floor(Math.random() * 15) + 5;
        if (count >= 100) {
            count = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('fade-out');
                app.classList.remove('hidden');
                initAnimations();
            }, 500);
        }
        percentage.innerText = count;
    }, 100);
});

function initAnimations() {
    // 1. Hero Animations
    gsap.from('.hero-title', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.2
    });

    gsap.from('.hero-subtitle', {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.4
    });

    gsap.from('.hero-cta', {
        y: 30,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.6
    });

    gsap.from('.phones-container', {
        x: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        delay: 0.8
    });

    gsap.from('.phone-left', {
        rotation: -20,
        duration: 2,
        ease: 'elastic.out(1, 0.5)',
        delay: 1
    });

    gsap.from('.phone-right', {
        rotation: 20,
        duration: 2,
        ease: 'elastic.out(1, 0.5)',
        delay: 1.2
    });

    // 2. Cinematic Horizontal Scroll (The Big One)
    const horizontalTrack = document.querySelector('.cine-horizontal-track');
    const bgWords = document.querySelectorAll('.cine-bg-word');
    const cards = document.querySelectorAll('.cine-card');

    if (horizontalTrack) {
        let mm = gsap.matchMedia();

        mm.add("(min-width: 969px)", () => {
            // Desktop behavior: Horizontal Scroll
            const totalScrollWidth = horizontalTrack.scrollWidth - window.innerWidth;

            let scrollTween = gsap.to(horizontalTrack, {
                x: -totalScrollWidth,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.cine-scroll-wrapper',
                    start: 'top top',
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
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.cine-scroll-wrapper',
                        start: 'top top',
                        end: () => `+=${totalScrollWidth + 1500}`,
                        scrub: 2
                    }
                });
            });

            // Animate Cards
            cards.forEach((card, i) => {
                const content = card.querySelector('.cine-card-content');
                if (!content) return;

                gsap.from(content, {
                    opacity: 0,
                    x: 100,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: scrollTween,
                        start: 'left center+=40%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });
        });

        mm.add("(max-width: 968px)", () => {
            // Mobile behavior: Vertical Stack with simple reveals
            cards.forEach((card) => {
                const content = card.querySelector('.cine-card-content');
                if (!content) return;
                
                gsap.from(content, {
                    y: 30,
                    opacity: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });

            // Static visible messages on mobile for simplicity or simple timed reveal
            document.querySelectorAll('.chat-msg').forEach(msg => msg.classList.add('visible'));
        });
    }

    // 3. Scroll Reveal for Other Sections
    const revealElements = document.querySelectorAll('.animate-scroll');
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));

    // 4. Parallax Background Text (Global)
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Hero Background Text Parallax
        const bgHero = document.querySelector('.bg-text-hero');
        if (bgHero) {
            bgHero.style.transform = `translateY(-50%) translateX(${scrolled * 0.1}px)`;
        }

        // Navbar blur on scroll
        const navbar = document.querySelector('.navbar');
        if (scrolled > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('open');
    });
}
