import { useEffect } from "react";

const LandingPage = () => {
  useEffect(() => {
    // Ensure the body has no margin/padding during the landing session
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', border: 'none', margin: 0, padding: 0 }}>
      {/* 
          Using an Iframe for your Landing Page is the ONLY way to ensure 
          100% design fidelity and prevent React/Vite CSS from clashing with your GSAP animations.
      */}
      <iframe 
        src="/landing_original/index.html" 
        title="QuickChat Original Landing"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default LandingPage;
