import React from 'react';
import type { Actor } from '../types';

type VisualEffect = {
  id: number;
  type: 'slash' | 'fireball' | 'heal' | 'haste' | 'frozen' | 'paralyzed' | 'meteor_impact' | 'earthquake_vfx' | 'wind_burst_vfx' | 'water_bless_vfx' | 'electrified_vfx' | 'molten_ground_vfx' | 'quicksand_vfx' | 'petrified_vfx' | 'frail_vfx' | 'frightened_vfx' | 'blood_spatter' | 'burning_spell_vfx' | 'blizzard_storm_vfx' | 'flying_stones_vfx';
  targetId: string;
  originId: string;
};

const VFXLayer: React.FC<{
  visualEffects: VisualEffect[];
  actors: Actor[];
}> = ({ visualEffects, actors }) => {
  return (
    <>
      {visualEffects.map(vfx => {
          const origin = actors.find(a => a.id === vfx.originId);
          const target = actors.find(a => a.id === vfx.targetId);
          if (!origin?.ref?.current || !target?.ref?.current) return null;
          
          const originRect = origin.ref.current.getBoundingClientRect();
          const targetRect = target.ref.current.getBoundingClientRect();

          if (vfx.type === 'fireball') {
              return <div key={vfx.id} className="vfx-fireball absolute" style={{ left: originRect.left, top: originRect.top, transform: `translate(${targetRect.left - originRect.left}px, ${targetRect.top - originRect.top}px)` }} />;
          }
          if(vfx.type === 'slash') {
              return <div key={vfx.id} className="vfx-slash absolute" style={{ left: targetRect.left + 10, top: targetRect.top + 10 }} />
          }
          if (vfx.type === 'heal') {
              return <div key={vfx.id} className="absolute" style={{ left: targetRect.left + targetRect.width / 2, top: targetRect.top }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="vfx-heal-drop" style={{ left: `${Math.random() * 40 - 20}px`, animationDelay: `${i * 0.1}s` }} />)}
              </div>
          }
           if (vfx.type === 'haste') {
              return <div key={vfx.id} className="absolute w-16 h-16 border-2 border-dashed border-sky-400 rounded-full animate-spin" style={{ left: targetRect.left, top: targetRect.top }} />
          }
          if (vfx.type === 'frozen') {
              return <div key={vfx.id} className="absolute w-16 h-16 bg-blue-300/50 rounded-full animate-pulse" style={{ left: targetRect.left, top: targetRect.top }} />
          }
          if (vfx.type === 'paralyzed') {
              return <div key={vfx.id} className="absolute w-16 h-16 border-4 border-yellow-400 rounded-full animate-pulse" style={{ left: targetRect.left, top: targetRect.top }} />
          }
          if (vfx.type === 'meteor_impact') {
              return <div key={vfx.id} className="absolute w-24 h-24 bg-red-500/70 rounded-full animate-pulse-glow" style={{ left: targetRect.left - 24, top: targetRect.top - 24, boxShadow: '0 0 30px 15px #ef4444' }} />
          }
          if (vfx.type === 'earthquake_vfx') {
              return <div key={vfx.id} className="absolute w-full h-full bg-amber-700/30 animate-pulse" style={{ left: 0, top: 0, boxShadow: 'inset 0 0 50px #a16207' }} />
          }
          if (vfx.type === 'wind_burst_vfx') {
              return <div key={vfx.id} className="absolute w-full h-full bg-sky-500/30 animate-pulse" style={{ left: 0, top: 0, boxShadow: 'inset 0 0 50px #0ea5e9' }} />
          }
          if (vfx.type === 'water_bless_vfx') {
              return <div key={vfx.id} className="absolute w-full h-full bg-blue-500/30 animate-pulse" style={{ left: 0, top: 0, boxShadow: 'inset 0 0 50px #3b82f6' }} />
          }
          if (vfx.type === 'electrified_vfx') {
              return <div key={vfx.id} className="absolute w-20 h-20 border-4 border-yellow-300 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #facc15' }} />
          }
          if (vfx.type === 'molten_ground_vfx') {
              return <div key={vfx.id} className="absolute w-20 h-20 bg-orange-600/50 rounded-full animate-pulse-glow" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #d97706' }} />
          }
          if (vfx.type === 'quicksand_vfx') {
              return <div key={vfx.id} className="absolute w-20 h-20 bg-stone-700/50 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #78350f' }} />
          }
          if (vfx.type === 'petrified_vfx') { // New VFX for petrified
              return <div key={vfx.id} className="absolute w-20 h-20 bg-gray-500/50 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #78716c' }} />
          }
          if (vfx.type === 'frail_vfx') { // New VFX for frail
              return <div key={vfx.id} className="absolute w-20 h-20 border-4 border-red-500 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #ef4444' }} />
          }
          if (vfx.type === 'frightened_vfx') { // New VFX for frightened
              return <div key={vfx.id} className="absolute w-20 h-20 border-4 border-purple-500 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #a855f7' }} />
          }
          if (vfx.type === 'burning_spell_vfx') {
              return (
                  <div key={vfx.id} className="absolute" style={{ left: targetRect.left + (targetRect.width/2) - 32, top: targetRect.top + (targetRect.height/2) - 32 }}>
                      <div className="vfx-flame-burst" />
                      {[...Array(8)].map((_, i) => (
                          <div key={i} className="vfx-flame-particle" style={{ animationDelay: `${i * 0.08}s`, left: `${Math.random() * 40 - 20}px` }} />
                      ))}
                  </div>
              );
          }
          if (vfx.type === 'blizzard_storm_vfx') {
              return (
                  <div key={vfx.id} className="vfx-blizzard-overlay absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 100 }}>
                      {[...Array(30)].map((_, i) => {
                          const randomX = Math.random() * 100;
                          const randomDelay = Math.random() * 1.5;
                          const randomScale = 0.5 + Math.random() * 1.5;
                          return (
                              <div 
                                  key={i} 
                                  className="vfx-snowflake" 
                                  style={{ 
                                      left: `${randomX}%`, 
                                      top: `-${10 + Math.random() * 20}px`,
                                      animationDelay: `${randomDelay}s`,
                                      transform: `scale(${randomScale})`
                                  }} 
                              />
                          );
                      })}
                  </div>
              );
          }
          if (vfx.type === 'flying_stones_vfx') {
              const dx = targetRect.left - originRect.left;
              const dy = targetRect.top - originRect.top;
              return (
                  <div key={vfx.id} className="absolute" style={{ left: originRect.left + originRect.width / 2, top: originRect.top + originRect.height / 2 }}>
                      {[...Array(6)].map((_, i) => {
                          const delay = i * 0.12;
                          const scatterX = (Math.random() - 0.5) * 30;
                          const scatterY = (Math.random() - 0.5) * 30;
                          return (
                              <div 
                                  key={i} 
                                  className="vfx-flying-stone" 
                                  style={{ 
                                      '--dx': `${dx + scatterX}px`, 
                                      '--dy': `${dy + scatterY}px`,
                                      animationDelay: `${delay}s` 
                                  } as React.CSSProperties} 
                              />
                          );
                      })}
                  </div>
              );
          }
          if (vfx.type === 'blood_spatter') {
              return <div key={vfx.id} className="vfx-blood-spatter" style={{ left: targetRect.left + (targetRect.width/2) - 20, top: targetRect.top + (targetRect.height/2) - 20 }} />
          }
          return null;
      })}
    </>
  )
};

export default VFXLayer;
