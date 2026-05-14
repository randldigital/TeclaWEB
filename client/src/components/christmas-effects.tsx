import { useEffect, useState } from "react";
import { useChristmasTheme } from "@/hooks/use-christmas-theme";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
}

interface Light {
  id: number;
  left: number;
  color: string;
  delay: number;
}

export function ChristmasEffects() {
  const { isChristmas, effectsEnabled } = useChristmasTheme();
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [lights, setLights] = useState<Light[]>([]);

  useEffect(() => {
    if (!isChristmas || !effectsEnabled) {
      setSnowflakes([]);
      setLights([]);
      return;
    }

    // Generate snowflakes
    const generateSnowflakes = () => {
      const count = 50; // Number of snowflakes
      const flakes: Snowflake[] = [];
      
      for (let i = 0; i < count; i++) {
        flakes.push({
          id: i,
          left: Math.random() * 100,
          animationDuration: 10 + Math.random() * 20, // 10-30 seconds
          animationDelay: Math.random() * 5,
          size: 4 + Math.random() * 6, // 4-10px
          opacity: 0.3 + Math.random() * 0.5, // 0.3-0.8
        });
      }
      
      setSnowflakes(flakes);
    };

    // Generate Christmas lights
    const generateLights = () => {
      const count = 20; // Number of lights
      const colors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
      const lightArray: Light[] = [];
      
      for (let i = 0; i < count; i++) {
        lightArray.push({
          id: i,
          left: (i / count) * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 2,
        });
      }
      
      setLights(lightArray);
    };

    generateSnowflakes();
    generateLights();
  }, [isChristmas, effectsEnabled]);

  if (!isChristmas || !effectsEnabled) {
    return null;
  }

  return (
    <>
      {/* Falling Snowflakes */}
      <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute top-0 text-white"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.size}px`,
              opacity: flake.opacity,
              animation: `snowfall ${flake.animationDuration}s linear infinite`,
              animationDelay: `${flake.animationDelay}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Christmas Lights String - Top */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-[40] h-12 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Light string wire */}
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{ height: '2px' }}
          >
            <line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke="#333"
              strokeWidth="2"
            />
          </svg>
          
          {/* Twinkling lights */}
          {lights.map((light) => (
            <div
              key={light.id}
              className="absolute top-2 rounded-full"
              style={{
                left: `${light.left}%`,
                width: '12px',
                height: '12px',
                backgroundColor: light.color,
                boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}`,
                animation: `twinkle 1.5s ease-in-out infinite`,
                animationDelay: `${light.delay}s`,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Christmas Lights String - Bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[40] h-12 overflow-hidden">
        <div className="relative w-full h-full">
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{ height: '2px' }}
          >
            <line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke="#333"
              strokeWidth="2"
            />
          </svg>
          
          {lights.map((light) => (
            <div
              key={`bottom-${light.id}`}
              className="absolute top-2 rounded-full"
              style={{
                left: `${light.left}%`,
                width: '12px',
                height: '12px',
                backgroundColor: light.color,
                boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}`,
                animation: `twinkle 1.5s ease-in-out infinite`,
                animationDelay: `${light.delay + 0.5}s`,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

