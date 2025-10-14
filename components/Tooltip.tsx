import React from 'react';
import type { Skill } from '../types';
import { PLAYER_ABILITIES } from '../constants';

interface TooltipProps {
  skill: Skill;
  currentRank: number;
  isUnlocked: boolean;
  canUnlock: boolean;
}

function Tooltip({ skill, currentRank, isUnlocked, canUnlock }: TooltipProps) {
  const isMaxed = currentRank === skill.maxRank;
  const abilityData = PLAYER_ABILITIES[skill.id];

  const getStatus = () => {
    if (isMaxed) return { text: "Max Rank", color: "text-purple-400" };
    if (isUnlocked) return { text: "Uppgraderbar", color: "text-yellow-400" };
    if (canUnlock) return { text: "Kan låsas upp", color: "text-green-400" };
    return { text: "Låst", color: "text-red-400" };
  };

  const { text: statusText, color: statusColor } = getStatus();
  
  const currentRankData = abilityData?.ranks[currentRank - 1];
  const nextRankData = abilityData?.ranks[currentRank];


  return (
    <div className="absolute bottom-full mb-3 w-64 p-2 bg-black/80 tooltip-pixel-border z-20 text-left text-xs shadow-lg">
      <h4 className="font-bold text-yellow-300 text-sm mb-1 flex justify-between">
        <span>{skill.name}</span>
        <span>Rank {currentRank}/{skill.maxRank}</span>
      </h4>
      <p className="text-gray-300 text-[10px] leading-tight mb-2">{skill.description}</p>
      
      {isUnlocked && currentRankData && (
        <div className="text-[10px] text-cyan-300 my-1">
          <p><span className="font-bold">Nuvarande:</span> {currentRankData.description}</p>
        </div>
      )}
      {!isMaxed && nextRankData && (
        <div className="text-[10px] text-yellow-300 my-1">
          <p><span className="font-bold">Nästa Rank:</span> {nextRankData.description}</p>
        </div>
      )}

      <div className="border-t border-gray-600/50 pt-1 mt-1">
        <p className="text-[10px]">
          Status: <span className={`${statusColor} font-bold`}>{statusText}</span>
        </p>
        {skill.dependencies && skill.dependencies.length > 0 && !skill.dependencies.includes('start') && (
          <p className="text-[10px] mt-1">
            Kräver: <span className="text-gray-400">{skill.dependencies.map(dep => dep.replace(/_\d/g, '')).join(', ')}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Tooltip;