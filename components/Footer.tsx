import React from 'react';
import type { View, Character } from '../types';
import { Icons } from '../constants';

interface FooterProps {
  skillPoints: number;
  attributePoints: number;
  elementalPoints: number; // New prop
  character: Character;
  activeView: View;
  setView: (view: View) => void;
  onResetCharacter: () => void;
}

const FooterButton: React.FC<{
  label: string;
  // FIX: Changed JSX.Element to React.ReactElement to resolve namespace error.
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
  const inactiveClasses = 'bg-gray-800/50 text-gray-400 border-gray-600 hover:border-yellow-400 hover:text-white';
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 border-2 text-xs transition-colors ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span>{label}</span>
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

      {/* Center: Points */}
       <div className="flex space-x-4 px-4">
        <div className="text-yellow-400 text-center">
            <span className="text-xs">Färdighetspoäng</span>
            <div className="font-bold text-lg">{skillPoints}</div>
        </div>
        <div className="text-cyan-400 text-center">
            <span className="text-xs">Attributpoäng</span>
            <div className="font-bold text-lg">{attributePoints}</div>
        </div>
        <div className="text-orange-400 text-center"> {/* New: Elemental Points */}
            <span className="text-xs">Elementpoäng</span>
            <div className="font-bold text-lg">{elementalPoints}</div>
        </div>
       </div>

      {/* Right Side: Navigation */}
      <div className="flex space-x-2">
        <FooterButton
          label="Däck"
          icon={<CardDrawIcon />}
          isActive={activeView === 'deck'}
          onClick={() => setView('deck')}
        />
         <FooterButton
          label="Färdighetsträd"
          icon={<SkillTreeIcon />}
          isActive={activeView === 'skillTree'}
          onClick={() => setView('skillTree')}
        />
        <FooterButton
          label="Karaktärsblad"
          icon={<CharacterSheetIcon />}
          isActive={activeView === 'characterSheet'}
          onClick={() => setView('characterSheet')}
        />
        <FooterButton
          label="Lager"
          icon={<InventoryIcon />}
          isActive={activeView === 'inventory'}
          onClick={() => setView('inventory')}
        />
        <FooterButton
          label="Debug"
          icon={<DebugIcon />}
          isActive={activeView === 'debug'}
          onClick={() => setView('debug')}
        />
      </div>
    </footer>
  );
};

const SkillTreeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>;
const CharacterSheetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h2V6a1 1 0 112 0v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H6a1 1 0 01-1-1z" /><path d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" /></svg>;
const CardDrawIcon = () => <div className="w-4 h-4"><Icons.CardDraw/></div>;
const DebugIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414 0l.707-.707a1 1 0 11-1.414-1.414l-.707.707a1 1 0 010 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>;

export default Footer;