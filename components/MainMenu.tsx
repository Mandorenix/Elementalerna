import React, { useRef, useState, useEffect } from 'react';
import ElementalTitleParticles from './ElementalTitleParticles'; // Import the new particle component

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const [h1Rect, setH1Rect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (h1Ref.current) {
      setH1Rect(h1Ref.current.getBoundingClientRect());
    }
    // Recalculate on window resize
    const handleResize = () => {
      if (h1Ref.current) {
        setH1Rect(h1Ref.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-grow w-full h-full flex flex-col items-center justify-center text-white font-['Press_Start_2P'] relative overflow-hidden">
      {/* En subtil bakgrundsgradient för att ge djup */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-70"></div>

      <div className="relative z-10 text-center">
        {/* Partiklarna renderas här, bakom texten men framför bakgrunden */}
        {h1Rect && (
          <div 
            style={{
              position: 'absolute',
              top: h1Rect.top,
              left: h1Rect.left,
              width: h1Rect.width,
              height: h1Rect.height,
              pointerEvents: 'none',
              zIndex: 5, // Lower z-index than the h1 text
            }}
          >
            <ElementalTitleParticles h1Rect={h1Rect} />
          </div>
        )}
        <h1 ref={h1Ref} className="text-7xl mb-12 leading-tight relative z-10"> {/* Ensure h1 text is above particles */}
          <span className="element-text-base element-fire-text">ELE</span>
          <span className="element-text-base element-water-text">MENT</span>
          <span className="element-text-base element-wind-text">ARIE</span>
          <span className="element-text-base element-earth-text">RNA</span>
        </h1>
        <button
          onClick={onStartGame}
          className="px-8 py-4 text-xl bg-yellow-800/50 border-2 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors pixelated-border animate-pulse-glow relative z-10"
        >
          Starta Spel
        </button>
      </div>
    </div>
  );
};

export default MainMenu;