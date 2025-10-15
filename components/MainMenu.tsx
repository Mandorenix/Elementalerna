import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="flex-grow w-full h-full flex flex-col items-center justify-center text-white font-['Press_Start_2P'] relative overflow-hidden">
      {/* En subtil bakgrundsgradient för att ge djup */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-70"></div>

      <div className="relative z-10 text-center">
        <h1 className="text-7xl mb-12 leading-tight">
          <span className="element-text-base element-fire-text">ELE</span>
          <span className="element-text-base element-water-text">MENT</span>
          <span className="element-text-base element-wind-text">ARIE</span>
          <span className="element-text-base element-earth-text">RNA</span>
        </h1>
        <button
          onClick={onStartGame}
          className="px-8 py-4 text-xl bg-yellow-800/50 border-2 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors pixelated-border animate-pulse-glow"
        >
          Starta Spel
        </button>
      </div>
    </div>
  );
};

export default MainMenu;