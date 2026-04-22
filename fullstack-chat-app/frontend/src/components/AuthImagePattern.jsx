import { Particles } from "@/components/ui/particles";
import { useThemeStore } from "@/store/useThemeStore";

const AuthImagePattern = ({ title, subtitle }) => {
  const { theme } = useThemeStore();
  
  // Determine particle color based on theme
  const particleColor = [
    'dark', 'business', 'synthwave', 'halloween', 'forest', 'black', 
    'luxury', 'dracula', 'night', 'coffee'
  ].includes(theme) ? "#ffffff" : "#000000";

  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-12 relative overflow-hidden">
      <Particles
        className="absolute inset-0"
        quantity={50}
        ease={80}
        color={particleColor}
        refresh
      />
      <div className="max-w-md text-center relative z-10">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/10 ${
                i % 2 === 0 ? "animate-pulse" : ""
              }`}
            />
          ))}
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-base-content/70 text-lg">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;