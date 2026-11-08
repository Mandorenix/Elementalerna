import React, { useState, useRef, useCallback, useMemo } from 'react';
import SkillNode from './SkillNode';
import { SKILL_TREE_DATA, LIGHT_SKILL_TREE_DATA, DARK_SKILL_TREE_DATA } from '../constants';
import type { Skill, ArchetypeName } from '../types';

interface SkillTreeProps {
  unlockedSkills: Map<string, number>;
  skillPoints: number;
  unlockSkill: (skillId: string) => void;
  character: { archetype: ArchetypeName; secondaryArchetype?: ArchetypeName } | null;
  activeTreeId: string;
  onTreeChange: (treeId: 'universal' | 'light' | 'dark') => void;
}

const MAX_COLS = 29;
const MAX_ROWS = 17;
const CELL_WIDTH = 48;
const CELL_HEIGHT = 64;

const categoryLabels = [
    { label: 'ELD', x: 6, y: 1, color: 'text-red-500/30' },
    { label: 'JORD', x: 6, y: 15, color: 'text-green-500/30' },
    { label: 'VIND', x: 22, y: 1, color: 'text-sky-500/30' },
    { label: 'VATTEN', x: 22, y: 15, color: 'text-blue-500/30' },
    { label: 'HYBRIDER', x: 14, y: 7, color: 'text-purple-500/20' },
];

const SkillTree: React.FC<SkillTreeProps> = ({ unlockedSkills, skillPoints, unlockSkill, character, activeTreeId, onTreeChange }) => {
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.5;
    }
    return 0.8;
  });
  const [position, setPosition] = useState({ x: -200, y: -100 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const treeContainerRef = useRef<HTMLDivElement>(null);
  
  const initialTouchDist = useRef(0);
  const initialZoom = useRef(0.8);

  const availableTrees = useMemo(() => {
    const trees: { id: string; label: string; data: Skill[] }[] = [
      { id: 'universal', label: 'Universellt', data: SKILL_TREE_DATA },
    ];
    if (character) {
      const archetypes: ArchetypeName[] = [character.archetype];
      if (character.secondaryArchetype) archetypes.push(character.secondaryArchetype);
      if (archetypes.includes('Ljusbringaren')) {
        trees.push({ id: 'light', label: 'Ljus', data: LIGHT_SKILL_TREE_DATA });
      }
      if (archetypes.includes('Skuggvävaren')) {
        trees.push({ id: 'dark', label: 'Mörker', data: DARK_SKILL_TREE_DATA });
      }
    }
    return trees;
  }, [character]);

  const activeTree = useMemo(() => {
    const tree = availableTrees.find(t => t.id === activeTreeId);
    return tree || availableTrees[0];
  }, [availableTrees, activeTreeId]);

  const skillData = activeTree?.data || SKILL_TREE_DATA;

  const canUnlock = (skill: Skill) => {
    const currentRank = unlockedSkills.get(skill.id) || 0;
    if (currentRank > 0) return true;
    if (!skill.dependencies || skill.dependencies.length === 0) return true;
    return skill.dependencies.every(depId => (unlockedSkills.get(depId) || 0) > 0);
  };

  const skillMap = new Map<string, Skill>(skillData.map(s => [s.id, s]));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prevZoom => Math.max(0.3, Math.min(1.5, prevZoom + zoomAmount)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialTouchDist.current = dist;
      initialZoom.current = zoom;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      startDragPos.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    }
  }, [position, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDist.current > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / initialTouchDist.current;
      setZoom(Math.max(0.3, Math.min(1.5, initialZoom.current * factor)));
    } else if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - startDragPos.current.x,
        y: touch.clientY - startDragPos.current.y,
      });
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    initialTouchDist.current = 0;
  }, []);

  const resetView = useCallback(() => {
    const defaultZoom = typeof window !== 'undefined' && window.innerWidth < 768 ? 0.5 : 0.8;
    setZoom(defaultZoom);
    setPosition({ x: -200, y: -100 });
  }, []);

  return (
    <div className="flex-grow w-full h-full p-6 text-white flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
              backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
          }}
      />

      {/* Tree Tabs */}
      {availableTrees.length > 1 && (
        <div className="relative z-20 flex gap-1 mb-2" style={{ fontSize: '0.45rem' }}>
          {availableTrees.map(tree => (
            <button
              key={tree.id}
              onClick={() => onTreeChange(tree.id as 'universal' | 'light' | 'dark')}
              className={`px-3 py-1 rounded-sm border transition-all ${
                activeTreeId === tree.id
                  ? 'bg-yellow-800/60 border-yellow-500 text-yellow-300'
                  : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-700/40 hover:text-gray-200'
              }`}
            >
              {tree.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={treeContainerRef}
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ cursor: 'grab', top: availableTrees.length > 1 ? '40px' : '0' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative"
          style={{
            width: `${MAX_COLS * CELL_WIDTH}px`,
            height: `${MAX_ROWS * CELL_HEIGHT}px`,
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {activeTree?.id === 'universal' && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {categoryLabels.map(cat => (
                <div
                  key={cat.label}
                  className={`absolute font-bold ${cat.color}`}
                  style={{
                    left: `${cat.x * CELL_WIDTH}px`,
                    top: `${cat.y * CELL_HEIGHT}px`,
                    fontSize: '8px',
                    transform: 'translate(-50%, -50%)',
                    letterSpacing: '0.3em',
                  }}
                >
                  {cat.label}
                </div>
              ))}
            </div>
          )}

          {/* Connection lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" >
            {skillData.map(skill => {
              if (!skill.dependencies) return null;
              return skill.dependencies.map(depId => {
                const parent = skillMap.get(depId);
                if (!parent) return null;

                const isParentUnlocked = (unlockedSkills.get(parent.id) || 0) > 0;

                const x1 = parent.x * CELL_WIDTH + 22;
                const y1 = parent.y * CELL_HEIGHT + 22;
                const x2 = skill.x * CELL_WIDTH + 22;
                const y2 = skill.y * CELL_HEIGHT + 22;

                return (
                  <line
                    key={`${skill.id}-${depId}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    className={`transition-all duration-500 ${isParentUnlocked ? 'stroke-yellow-400 animate-energy-flow' : 'stroke-gray-600'}`}
                    strokeWidth={isParentUnlocked ? "3" : "2"}
                    strokeLinecap="round"
                  />
                );
              });
            })}
          </svg>

          {/* Skill Nodes */}
          {skillData.map(skill => {
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

      {/* Minimap */}
      <div className="absolute bottom-24 left-4 z-20 bg-black/70 border border-gray-700 rounded-sm p-1.5 shadow-lg">
          <div className="text-[8px] text-gray-500 mb-1 text-center">Översikt</div>
          <svg width="100" height="60" viewBox={`0 0 ${MAX_COLS} ${MAX_ROWS}`} className="block">
              <rect width={MAX_COLS} height={MAX_ROWS} fill="transparent" />
              {skillData.map(skill => {
                  const currentRank = unlockedSkills.get(skill.id) || 0;
                  const color = currentRank > 0
                      ? '#facc15'
                      : (canUnlock(skill) && skillPoints > 0 && currentRank !== skill.maxRank)
                          ? '#4ade80'
                          : '#4b5563';
                  return (
                      <circle
                          key={skill.id}
                          cx={skill.x + 0.5}
                          cy={skill.y + 0.5}
                          r={0.4}
                          fill={color}
                      />
                  );
              })}
          </svg>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col space-y-2">
        <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
            className="w-10 h-10 text-lg bg-gray-800/80 hover:bg-yellow-500/50 text-white font-bold pixelated-border flex items-center justify-center transition-colors"
            aria-label="Zooma in">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="w-10 h-10 text-lg bg-gray-800/80 hover:bg-yellow-500/50 text-white font-bold pixelated-border flex items-center justify-center transition-colors"
            aria-label="Zooma ut">-</button>
        <button onClick={resetView}
            className="w-10 h-10 text-[10px] bg-gray-800/80 hover:bg-yellow-500/50 text-white font-bold pixelated-border flex items-center justify-center transition-colors leading-tight">Noll<br/>ställ</button>
      </div>
    </div>
  );
};

export default SkillTree;