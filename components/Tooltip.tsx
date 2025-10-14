import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Skill } from '../types';
import { PLAYER_ABILITIES } from '../constants';

interface TooltipProps {
  skill: Skill;
  currentRank: number;
  isUnlocked: boolean;
  canUnlock: boolean;
}

function Tooltip({ skill, currentRank, isUnlocked, canUnlock }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
      if (tooltipRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const parentElement = tooltipRef.current.parentElement;
          if (!parentElement) return;

          const parentRect = parentElement.getBoundingClientRect();

          const margin = 12; // Spacing around the tooltip

          let finalLeft = parentRect.width + margin; // Default to right of parent
          let finalTop = (parentRect.height - tooltipRect.height) / 2; // Default to vertically centered

          // --- Horizontal positioning ---
          // Check if it goes off the right edge of the viewport
          if (parentRect.right + finalLeft + tooltipRect.width > window.innerWidth) {
              finalLeft = -tooltipRect.width - margin; // Move to left of parent
          }
          // If after moving left, it still goes off the left edge of the viewport
          if (parentRect.left + finalLeft < 0) {
              finalLeft = -parentRect.left + margin; // Clamp to viewport left edge
          }


          // --- Vertical positioning ---
          // Check if it goes off the bottom edge of the viewport
          if (parentRect.top + finalTop + tooltipRect.height > window.innerHeight) {
              finalTop = window.innerHeight - tooltipRect.height - parentRect.top - margin; // Clamp to bottom of viewport
          }
          // Check if it goes off the top edge of the viewport
          if (parentRect.top + finalTop < 0) {
              finalTop = -parentRect.top + margin; // Clamp to top of viewport
          }
          
          setStyle({
              left: `${finalLeft}px`,
              top: `${finalTop}px`,
          });
      }
  }, [skill, currentRank, isUnlocked, canUnlock]); // Recalculate when relevant props change

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
    <div 
        ref={tooltipRef}
        className="absolute w-64 p-2 bg-black/80 tooltip-pixel-border z-20 text-left text-xs shadow-lg"
        style={style} // Apply dynamic style
    >
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