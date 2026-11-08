import React from 'react';
import type { View, Character } from '../types';
import { Icons } from '../constants'; // Import Icons from constants

interface FooterProps {
  skillPoints: number;
  attributePoints: number;
  elementalPoints: number;
  character: Character;
  activeView: View;
  setView: (view: View) => void;
  onResetCharacter: () => void;
  onSaveGame: () => void;
  onMinimize?: () => void;
}

const FooterButton: React.FC<{
  label: string; 
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
  const inactiveClasses = 'bg-gray-800/50 text-gray-400 border-gray-600 hover:border-yellow-400 hover:text-white';
  
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col md:flex-col items-center justify-center flex-1 landscape:flex-none md:flex-none w-full landscape:w-12 md:w-16 h-10 md:h-16 border md:border-2 text-[8px] md:text-xs transition-colors ${isActive ? activeClasses : inactiveClasses}`}
      title={label} 
    >
      <div className="scale-90 md:scale-100 flex-shrink-0">{icon}</div>
      <span className="hidden md:inline text-[7px] md:text-[8px] font-bold tracking-tighter uppercase whitespace-nowrap mt-1">{label}</span>
      {isActive && (
        <div className="absolute -top-1.5 w-4 h-1 md:h-2 bg-yellow-400 pixelated-border-gold-top"></div>
      )}
    </button>
  );
};

const Footer: React.FC<FooterProps> = ({ skillPoints, attributePoints, elementalPoints, character, activeView, setView, onResetCharacter, onSaveGame, onMinimize }) => {
  const expPercentage = (character.experience.current / character.experience.max) * 100;

  return (
    <footer className="w-full bg-black/50 backdrop-blur-sm border-t-2 border-gray-700 p-1 md:p-2 flex flex-col landscape:flex-row md:flex-row justify-between items-center text-white z-10 text-xs gap-1 md:gap-0">
      {/* Left Side: Character Level & XP */}
      <div className="flex w-full landscape:w-auto md:w-auto items-center justify-between md:justify-start space-x-2 md:space-x-3 px-1 md:px-2 flex-1">
        <div className="flex space-x-1 md:space-x-2">
            <button 
                onClick={onResetCharacter} 
                className="px-2 md:px-3 py-1 md:py-2 border-2 text-[10px] md:text-xs bg-gray-700/50 border-gray-600 hover:border-gray-400 text-gray-300 transition-colors whitespace-nowrap"
             >
                 <span className="hidden sm:inline">Byt karaktär</span>
                 <span className="sm:hidden">Byt</span>
             </button>
            <button 
                onClick={onSaveGame} 
                className="px-2 md:px-3 py-1 md:py-2 border-2 text-[10px] md:text-xs bg-gray-700/50 border-gray-600 hover:border-yellow-500 text-yellow-400 transition-colors whitespace-nowrap"
                title="Spara spelet"
             >
                 Spara
             </button>
        </div>
        <div className="flex items-center space-x-2 flex-grow max-w-[200px] md:max-w-none">
            <div className="text-center">
                <div className="text-[10px] md:text-xs text-gray-400">LVL</div>
                <div className="text-sm md:text-lg font-bold text-white">{character.level}</div>
            </div>
            <div className="flex-grow">
                <div className="w-full bg-black/30 h-2 md:h-3 pixelated-border">
                    <div className="bg-purple-500 h-full" style={{width: `${expPercentage}%`}}></div>
                </div>
                <div className="text-center text-[8px] md:text-[10px] mt-1 text-gray-400 tracking-tighter">EXP: {character.experience.current}/{character.experience.max}</div>
            </div>
        </div>
      </div>

      {/* Center: Points */}
       <div className="flex space-x-4 md:space-x-4 px-2 md:px-4 py-1 md:py-0 w-full landscape:w-auto md:w-auto justify-center border-t border-b border-gray-800 landscape:border-none md:border-none">
        <div className="text-yellow-400 flex flex-row md:flex-col items-center space-x-1 md:space-x-0">
            <div className="w-4 h-4 md:w-6 md:h-6 flex items-center justify-center mb-0 md:mb-1"><Icons.Boon /></div>
            <div className="font-bold text-xs md:text-lg">{skillPoints}</div>
        </div>
        <div className="text-cyan-400 flex flex-row md:flex-col items-center space-x-1 md:space-x-0">
            <div className="w-4 h-4 md:w-6 md:h-6 flex items-center justify-center mb-0 md:mb-1"><Icons.Push /></div>
            <div className="font-bold text-xs md:text-lg">{attributePoints}</div>
        </div>
        <div className="text-orange-400 flex flex-row md:flex-col items-center space-x-1 md:space-x-0">
            <div className="w-4 h-4 md:w-6 md:h-6 flex items-center justify-center mb-0 md:mb-1"><Icons.Water /></div>
            <div className="font-bold text-xs md:text-lg">{elementalPoints}</div>
        </div>
       </div>

      {/* Right Side: Navigation */}
      <div className="flex space-x-1 md:space-x-2 w-full landscape:w-auto md:w-auto justify-between px-1">
        <FooterButton
          label="Däck"
          icon={<Icons.CardDraw />}
          isActive={activeView === 'deck'}
          onClick={() => setView('deck')}
        />
         <FooterButton
          label="Träd"
          icon={<Icons.Start />}
          isActive={activeView === 'skillTree'}
          onClick={() => setView('skillTree')}
        />
        <FooterButton
          label="Fokus"
          icon={<Icons.Earth />}
          isActive={activeView === 'characterSheet'}
          onClick={() => setView('characterSheet')}
        />
        <FooterButton
          label="Lager"
          icon={<Icons.Shield />}
          isActive={activeView === 'inventory'}
          onClick={() => setView('inventory')}
        />
        <FooterButton
          label="Debug"
          icon={<Icons.Choice />}
          isActive={activeView === 'debug'}
          onClick={() => setView('debug')}
        />
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="relative flex flex-col items-center justify-center flex-1 landscape:flex-none md:flex-none w-full landscape:w-12 md:w-16 h-10 md:h-16 border md:border-2 text-[8px] md:text-xs transition-colors bg-gray-800/50 text-gray-400 border-gray-600 hover:border-yellow-400 hover:text-white"
            title="Dölj meny"
          >
            <div className="scale-90 md:scale-100 flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 9h8v2H4V9z" fill="currentColor" />
              </svg>
            </div>
            <span className="hidden md:inline text-[7px] md:text-[8px] font-bold tracking-tighter uppercase whitespace-nowrap mt-1">Dölj</span>
          </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;