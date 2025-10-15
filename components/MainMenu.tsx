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
        <h1 className="text-7xl mb-12 leading-tight relative z-10 flex justify-center">
          <span className="element-text-base element-fire-text relative inline-block">
            ELE
          </span>
          <span className="element-text-base element-water-text relative inline-block">
            MENT
          </span>
          <span className="element-text-base element-wind-text relative inline-block">
            ARIE
          </span>
          <span className="element-text-base element-earth-text relative inline-block">
            RNA
          </span>
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