# UI Components

This directory contains reusable UI components for the chat application.

## Particles Component

The Particles component creates an interactive particle background that responds to mouse movement.

### Usage

```jsx
import { Particles } from "@/components/ui/particles";

// Basic usage
<Particles />

// With custom properties
<Particles
  className="absolute inset-0"
  quantity={100}
  ease={80}
  color="#ffffff"
  refresh
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | "" | Additional CSS classes to apply |
| quantity | number | 100 | Number of particles to render |
| staticity | number | 50 | Controls how static particles are |
| ease | number | 50 | Easing factor for particle movement |
| size | number | 0.4 | Base size of particles |
| refresh | boolean | false | Whether to refresh particles on change |
| color | string | "#ffffff" | Color of particles in hex format |
| vx | number | 0 | Horizontal velocity |
| vy | number | 0 | Vertical velocity |

### Demo

To see the particles in action, you can import and use the `ParticlesDemo` component:

```jsx
import { ParticlesDemo } from "@/components/ui/particles-demo";

// In your JSX
<ParticlesDemo />
```

### Theme Integration

The particles can be integrated with the application's theme system. The color can be dynamically changed based on the current theme:

```jsx
import { useThemeStore } from "@/store/useThemeStore";
import { Particles } from "@/components/ui/particles";

const MyComponent = () => {
  const { theme } = useThemeStore();
  
  // Determine particle color based on theme
  const particleColor = [
    'dark', 'business', 'synthwave', 'halloween', 'forest', 'black', 
    'luxury', 'dracula', 'night', 'coffee'
  ].includes(theme) ? "#ffffff" : "#000000";

  return (
    <div className="relative">
      <Particles
        className="absolute inset-0"
        quantity={50}
        ease={80}
        color={particleColor}
        refresh
      />
      {/* Other content */}
    </div>
  );
};
```