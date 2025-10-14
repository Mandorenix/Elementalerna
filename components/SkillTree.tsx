import React, { useState, useRef, useCallback } from 'react';
import SkillNode from './SkillNode';
import { SKILL_TREE_DATA } from '../constants';
import type { Skill } from '../types';

interface SkillTreeProps {
  unlockedSkills: Map<string, number>;
  skillPoints: number;
  unlockSkill: (skillId: string) => void;
}

const MAX_COLS = 29;
const MAX_ROWS = 17;
const CELL_WIDTH = 60; // Corresponds to Tailwind's w-16, plus some gap
const CELL_HEIGHT = 80; // Corresponds to Tailwind's h-16, plus some gap

const SkillTree: React.FC<SkillTreeProps> = ({ unlockedSkills, skillPoints, unlockSkill }) => {
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: -200, y: -100 }); // Start slightly centered
  const [isDragging, setIsDragging] = useState(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const treeContainerRef = useRef<HTMLDivElement>(null);
  
  const canUnlock = (skill: Skill) => {
    const currentRank = unlockedSkills.get(skill.id) || 0;
    if (currentRank > 0) return true; // Can always upgrade if unlocked
    if (!skill.dependencies || skill.dependencies.length === 0) return true;
    return skill.dependencies.every(depId => (unlockedSkills.get(depId) || 0) > 0);
  };

  const skillMap = SKILL_TREE_DATA; // SKILL_TREE_DATA is already a Record

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prevZoom => Math.max(0.3, Math.min(1.5, prevZoom + zoomAmount)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag with left mouse button
    setIsDragging(true);
    startDragPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    if (treeContainerRef.current) {
      treeContainerRef.current.style.cursor = 'grabbing';
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startDragPos.current.x,
      y: e.clientY - startDragPos.current.y,
    });
  }, [isDragging]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
    if (treeContainerRef.current) {
      treeContainerRef.current.style.cursor = 'grab';
    }
  }, []);

  const resetView = useCallback(() => {
    setZoom(0.8);
    setPosition({ x: -200, y: -100 });
  }, []);


  return (
    <div className="flex-grow w-full h-full p-6 text-white flex flex-col overflow-hidden relative">
      <div className="max-w-7xl mx-auto text-center flex-shrink-0 z-10">
        <h1 className="text-2xl text-yellow-400 mb-2">Färdighetsträd</h1>
        <p className="text-sm text-gray-400 mb-4">Du har {skillPoints} färdighetspoäng. Använd mushjulet för att zooma, dra för att flytta.</p>
      </div>

      <div
        ref={treeContainerRef}
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ cursor: 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <div
          className="relative"
          style={{
            width: `${Object.values(SKILL_TREE_DATA).reduce((max, s) => Math.max(max, s.x), 0) * CELL_WIDTH + CELL_WIDTH}px`, // Dynamic width
            height: `${Object.values(SKILL_TREE_DATA).reduce((max, s) => Math.max(max, s.y), 0) * CELL_HEIGHT + CELL_HEIGHT}px`, // Dynamic height
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* SVG for drawing lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" >
            {Object.values(SKILL_TREE_DATA).map(skill => { // Iterate over values
              if (!skill.dependencies) return null;
              return skill.dependencies.map(depId => {
                const parent = skillMap[depId]; // Access as object property
                if (!parent) return null;
                
                const isParentUnlocked = (unlockedSkills.get(parent.id) || 0) > 0;

                const x1 = parent.x * CELL_WIDTH + 28; // Center of the node
                const y1 = parent.y * CELL_HEIGHT + 28;
                const x2 = skill.x * CELL_WIDTH + 28;
                const y2 = skill.y * CELL_HEIGHT + 28;

                return (
                  <line 
                    key={`${skill.id}-${depId}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    className={`transition-all duration-500 ${isParentUnlocked ? 'stroke-yellow-400' : 'stroke-gray-600'}`}
                    strokeWidth="2"
                  />
                );
              });
            })}
          </svg>

          {/* Skill Nodes */}
          {Object.values(SKILL_TREE_DATA).map(skill => { // Iterate over values
            const currentRank = unlockedSkills.get(skill.id) || 0;
            const isUnlocked = currentRank > 0;
            const isMaxed = currentRank === skill.maxRank;
            
            return (
              <div
                key={skill.id}
                className="absolute z-10"
                style={{
                  left: `${skill.x * CELL_WIDTH}px`,
                  top: `${skill.y * CELL_HEIGHT}px`,
                }}
              >
                <SkillNode
                  skill={skill}
                  currentRank={currentRank}
                  isUnlocked={isUnlocked}
                  canUnlock={canUnlock(skill) && skillPoints > 0 && !isMaxed}
                  onUnlock={() => unlockSkill(skill.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
      
       <div className="absolute bottom-24 right-4 z-20 flex flex-col space-y-2">
        <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-10 h-10 text-lg bg-gray-800/80 hover:bg-yellow-500/50 text-white font-bold pixelated-border" aria-label="Zooma in">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-10 h-10 text-lg bg-gray-800/80 hover:bg-yellow-500/50 text-white font-bold pixelated-border" aria-label="Zooma ut">-</button>
        <button onClick={resetView} className="w-10 h-10 text-xs bg-gray-800/80 hover:bg-yellow-500/50 text-white font-bold pixelated-border">Nollställ</button>
      </div>
    </div>
  );
};

export default SkillTree;