import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="flex-grow w-full h-full flex flex-col items-center justify-center text-white font-['Press_Start_2P'] relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
      {/* Bakgrundseffekter för retrokänsla */}
      <div className="absolute inset-0 z-0 opacity-20 bg-repeat" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C9C9C\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1V1H0V0h5zM0 5h1v1H0z\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/70 to-transparent"></div>

      <div className="relative z-10 text-center">
        <h1 className="text-6xl md:text-7xl lg:text-8xl mb-12 leading-tight text-yellow-400 drop-shadow-[0_0_10px_rgba(252,211,77,0.7)]">
          ELEMENTARIERNA
        </h1>
        <button
          onClick={onStartGame}
          className="px-8 py-4 text-xl md:text-2xl bg-yellow-800/50 border-2 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors pixelated-border animate-pulse-glow relative z-10"
        >
          Starta Äventyret
        </button>
      </div>
    </div>
  );
};

export default MainMenu;