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
}

const FooterButton: React.FC<{
  label: string; // Behåll label för title-attributet för tillgänglighet
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
  const inactiveClasses = 'bg-gray-800/50 text-gray-400 border-gray-600 hover:border-yellow-400 hover:text-white';
  
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-16 h-16 border-2 text-xs transition-colors ${isActive ? activeClasses : inactiveClasses}`}
      title={label} // Använd label för title-attributet för tillgänglighet
    >
      <div className="mb-1">{icon}</div>
      {isActive && (
        <div className="absolute -top-2 w-4 h-2 bg-yellow-400 pixelated-border-gold-top"></div>
      )}
    </button>
  );
};

const Footer: React.FC<FooterProps> = ({ skillPoints, attributePoints, elementalPoints, character, activeView, setView, onResetCharacter }) => {
  const expPercentage = (character.experience.current / character.experience.max) * 100;

  return (
    <footer className="w-full bg-black/50 backdrop-blur-sm border-t-2 border-gray-700 p-2 flex justify-between items-center text-white z-10 text-xs">
      {/* Left Side: Character Level & XP */}
      <div className="flex items-center space-x-3 px-2 flex-1">
        <button 
            onClick={onResetCharacter} 
            className="px-3 py-2 border-2 text-xs bg-gray-700/50 border-gray-600 hover:border-gray-400 text-gray-300 transition-colors"
         >
             Byt karaktär
         </button>
        <div className="text-center">
            <div className="text-xs text-gray-400">LVL</div>
            <div className="text-lg font-bold text-white">{character.level}</div>
        </div>
        <div className="flex-grow">
            <div className="w-full bg-black/30 h-3 pixelated-border">
                <div className="bg-purple-500 h-full" style={{width: `${expPercentage}%`}}></div>
            </div>
            <div className="text-center text-[10px] mt-1 text-gray-400 tracking-tighter">EXP: {character.experience.current} / {character.experience.max}</div>
        </div>
      </div>

      {/* Center: Points (nu med ikoner istället för text) */}
       <div className="flex space-x-4 px-4">
        <div className="text-yellow-400 text-center flex flex-col items-center">
            <div className="w-6 h-6 flex items-center justify-center mb-1"><Icons.Boon /></div>
            <div className="font-bold text-lg">{skillPoints}</div>
        </div>
        <div className="text-cyan-400 text-center flex flex-col items-center">
            <div className="w-6 h-6 flex items-center justify-center mb-1"><Icons.Push /></div>
            <div className="font-bold text-lg">{attributePoints}</div>
        </div>
        <div className="text-orange-400 text-center flex flex-col items-center">
            <div className="w-6 h-6 flex items-center justify-center mb-1"><Icons.Water /></div>
            <div className="font-bold text-lg">{elementalPoints}</div>
        </div>
       </div>

      {/* Right Side: Navigation (nu med bara ikoner) */}
      <div className="flex space-x-2">
        <FooterButton
          label="Däck"
          icon={<Icons.CardDraw />}
          isActive={activeView === 'deck'}
          onClick={() => setView('deck')}
        />
         <FooterButton
          label="Färdighetsträd"
          icon={<Icons.Start />}
          isActive={activeView === 'skillTree'}
          onClick={() => setView('skillTree')}
        />
        <FooterButton
          label="Karaktärsblad"
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
      </div>
    </footer>
  );
};

export default Footer;