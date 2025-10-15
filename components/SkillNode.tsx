import React, { useState } from 'react';
import Tooltip from './Tooltip';
import type { Skill } from '../types';
import { Element } from '../types';
import { elementThemes } from '../constants';
// ElementalVFX importeras inte längre här

interface SkillNodeProps {
  skill: Skill;
  currentRank: number;
  isUnlocked: boolean;
  canUnlock: boolean;
  onUnlock: () => void;
  // Ny prop för att indikera om VFX ska renderas av föräldern
  renderVFX?: boolean; 
}

const SkillNode: React.FC<SkillNodeProps> = ({ skill, currentRank, isUnlocked, canUnlock, onUnlock, renderVFX = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const isMaxed = currentRank === skill.maxRank;
  const Icon = skill.icon;

  const theme = elementThemes[skill.element] || elementThemes[Element.NEUTRAL];
  const shadowColor = theme.match(/shadow-([a-z]+-\d+)/)?.[0].replace('shadow-', 'shadow-[0_0_15px_rgba(')
    .replace('-500', ',_96,165,250,')
    .replace('-red-600', ',_220,38,38,')
    .replace('-lime-500', ',_132,204,22,')
    .replace('-teal-500', ',_20,184,166,')
     + '0.7)]'
     || 'shadow-white/50';


  const baseClasses = `w-14 h-14 border-2 flex items-center justify-center cursor-pointer transition-all duration-300 relative ${theme}`;
  
  let nodeClasses = baseClasses;
  if (isMaxed) {
    nodeClasses += ` border-yellow-400 shadow-[0_0_20px] shadow-yellow-400/50 brightness-150`;
  } else if (isUnlocked) {
    nodeClasses += ` shadow-[0_0_15px] ${shadowColor} brightness-125 hover:bg-yellow-500/30 hover:border-yellow-400`;
  } else if (canUnlock) {
    nodeClasses += ` animate-pulse-glow hover:bg-green-500/30 hover:border-green-400`;
  } else {
    nodeClasses += ` bg-black/50 border-gray-700 text-gray-600 cursor-not-allowed filter grayscale`;
  }
  
  const handleClick = () => {
    if ((canUnlock || isUnlocked) && !isMaxed) {
      onUnlock();
    }
  };

  return (
    <div 
        className="relative flex flex-col items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        <button 
            onClick={handleClick}
            className={nodeClasses}
            aria-label={`Färdighet: ${skill.name}`}
            disabled={!canUnlock && !isUnlocked}
        >
            {/* Elemental VFX renderas nu av SkillTree */}
            <div className={`relative z-10 ${isUnlocked || canUnlock ? "" : "opacity-50"}`}>
              <Icon />
            </div>
            {isUnlocked && skill.maxRank > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-black/80 border border-yellow-500 text-yellow-300 text-[10px] font-bold w-6 h-4 flex items-center justify-center rounded-sm z-20">
                    {currentRank}
                </div>
            )}
        </button>
        <div className="mt-2 text-[10px] w-24 text-center text-gray-300">{skill.name}</div>
        {isHovered && <Tooltip skill={skill} currentRank={currentRank} isUnlocked={isUnlocked} canUnlock={canUnlock} />}
    </div>
  );
};

export default SkillNode;