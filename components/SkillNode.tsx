import React, { useState } from 'react';
import Tooltip from './Tooltip';
import type { Skill } from '../types';
import { Element } from '../types';
import { elementThemes } from '../constants';
import ElementalVFX from './ElementalVFX';

interface SkillNodeProps {
  skill: Skill;
  currentRank: number;
  isUnlocked: boolean;
  canUnlock: boolean;
  onUnlock: () => void;
}

const LockIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0.5 right-0.5 z-30 opacity-70">
        <rect x="4" y="6" width="8" height="8" rx="1" fill="#6b7280"/>
        <path d="M5 6V4.5C5 3 6 2 8 2s3 1 3 2.5V6" stroke="#6b7280" strokeWidth="1.5" fill="none"/>
    </svg>
);

const SkillNode: React.FC<SkillNodeProps> = ({ skill, currentRank, isUnlocked, canUnlock, onUnlock }) => {
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

  const baseClasses = `w-11 h-11 border-2 flex items-center justify-center cursor-pointer transition-all duration-300 relative ${theme}`;
  
  let nodeClasses = baseClasses;
  if (isMaxed) {
    nodeClasses += ` border-yellow-400 shadow-[0_0_20px] shadow-yellow-400/50 brightness-150`;
  } else if (isUnlocked) {
    nodeClasses += ` shadow-[0_0_15px] ${shadowColor} brightness-125 hover:bg-yellow-500/30 hover:border-yellow-400`;
  } else if (canUnlock) {
    nodeClasses += ` animate-skill-glow hover:bg-green-500/30 hover:border-green-400`;
  } else {
    nodeClasses += ` bg-black/50 border-gray-700 text-gray-600 cursor-not-allowed filter grayscale`;
  }

  const handleClick = () => {
    if ((canUnlock || isUnlocked) && !isMaxed) {
      onUnlock();
    }
  };

  const elementTextColor = elementThemes[skill.element]?.match(/text-([a-z]+-\d+)/)?.[0] || 'text-gray-300';

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
            {!isUnlocked && !canUnlock && <LockIcon />}
            <div className={isUnlocked || canUnlock ? "z-20 relative" : "opacity-50 z-20 relative"}>
              <Icon />
            </div>
            
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none rounded-sm">
                <ElementalVFX element={skill.element} isActive={isUnlocked} variant="node" />
            </div>

            {isUnlocked && skill.maxRank > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-400 text-yellow-200 text-[10px] font-bold w-6 h-4 flex items-center justify-center rounded-sm shadow-[0_0_6px_rgba(234,179,8,0.5)]">
                    {currentRank}
                </div>
            )}
        </button>
        <div className={`mt-2 text-[10px] w-24 text-center ${elementTextColor} leading-tight hidden md:block`}>{skill.name}</div>
        {isHovered && <Tooltip skill={skill} currentRank={currentRank} isUnlocked={isUnlocked} canUnlock={canUnlock} />}
    </div>
  );
};

export default SkillNode;