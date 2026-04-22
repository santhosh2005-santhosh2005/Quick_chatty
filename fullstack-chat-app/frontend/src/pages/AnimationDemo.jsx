import { useState } from "react";
import { Link } from "react-router-dom";
import SpiralAnimation from "../components/ui/spiral-animation";

const AnimationDemo = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Animation Demos</h1>
          <p className="text-gray-300 mb-6">
            Explore different animations for your application
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <button 
              className="btn btn-primary"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? "Hide" : "Show"} Spiral Animation
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4">About This Animation</h2>
            <div className="space-y-4 text-gray-200">
              <p>
                This is a complex 3D spiral animation that demonstrates advanced canvas rendering 
                techniques combined with GSAP for smooth animations.
              </p>
              <p>
                Features include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>5000 individually animated stars</li>
                <li>3D perspective projection</li>
                <li>Elastic easing functions</li>
                <li>Dynamic spiral path generation</li>
                <li>Real-time canvas rendering</li>
              </ul>
              <p>
                The animation is fully contained in a reusable React component and can be easily 
                integrated into any part of your application.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            {isVisible && (
              <div className="w-full max-w-md aspect-square">
                <SpiralAnimation />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Try Other Animations</h2>
          <div className="space-y-4 text-gray-200">
            <p>
              We've created additional animation components for your application:
            </p>
            <Link to="/galaxy-demo" className="btn btn-secondary w-full">
              Explore Galaxy Background Animation
            </Link>
            <p className="text-sm text-gray-400 mt-2">
              Experience an interactive 3D galaxy background with Spline integration
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">How to Use Spiral Animation</h2>
          <div className="space-y-4 text-gray-200">
            <p>
              To use this component in your project, simply import it and include it in your JSX:
            </p>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
              {`import SpiralAnimation from "@/components/ui/spiral-animation";

const MyComponent = () => {
  return (
    <div className="w-96 h-96">
      <SpiralAnimation />
    </div>
  );
};`}
            </pre>
            <p>
              You can customize the size by setting width and height on the parent container, 
              and add additional styling using the className prop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationDemo;