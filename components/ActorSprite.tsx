import React from 'react';
import type { Actor, EquipmentSlot, Item, StatusEffect } from '../types';
import { Icons } from '../constants';

const ActorSprite: React.FC<{
  actor: Actor;
  onDefeatAnimationEnd: (id: string) => void;
  equipment?: Record<EquipmentSlot, Item | null>;
  selectedTarget?: string | null;
  showCommandMenu?: boolean;
  showAbilityMenu?: boolean;
  showUltimateMenu?: boolean;
}> = ({ actor, onDefeatAnimationEnd, equipment, selectedTarget, showCommandMenu, showAbilityMenu, showUltimateMenu }) => {
  const isSelected = selectedTarget === actor.id && (showCommandMenu || showAbilityMenu || showUltimateMenu) && actor.type === 'ENEMY';
  const Icon = actor.icon;
  
  let animationClass = actor.isDefeated ? 'animate-defeat' : 'animate-idle-bob';
  if(actor.animationState === 'attacking' && !actor.isDefeated) {
      animationClass = actor.type === 'PLAYER' ? 'animate-attack-player' : 'animate-attack-enemy';
  } else if (actor.animationState === 'hit' && !actor.isDefeated) {
      animationClass = 'animate-hit-flash';
  }

  const statusIconMap: Partial<Record<StatusEffect['type'], { icon: React.FC; title: string; }>> = {
      'defending': { icon: Icons.Shield, title: "Defending" },
      'hasted': { icon: Icons.Wind, title: "Hasted" },
      'burning': { icon: Icons.Burn, title: "Burning" },
      'poisoned': { icon: Icons.Poison, title: "Poisoned" },
      'slowed': { icon: Icons.Slow, title: "Slowed" },
      'blinded': { icon: Icons.Blinded, title: "Blinded" },
      'retaliating': { icon: Icons.Magma, title: "Retaliating" },
      'full_flow': { icon: Icons.FullFlow, title: "Full Flow" },
      'overheated': { icon: Icons.Overheat, title: "Overheated" },
      'rooted': { icon: Icons.Rooted, title: "Rooted" },
      'steamed': { icon: Icons.Steamed, title: "Steamed" },
      'regenerating': { icon: Icons.Regenerating, title: "Regenerating" },
      'frozen': { icon: Icons.Frozen, title: "Frozen" },
      'paralyzed': { icon: Icons.Paralyzed, title: "Paralyzed" },
      'petrified': { icon: Icons.Petrified, title: "Petrified" },
      'frail': { icon: Icons.Frail, title: "Frail" },
      'frightened': { icon: Icons.Frightened, title: "Frightened" },
  };

  return (
     <div 
        ref={actor.ref} 
        className={`relative flex flex-col items-center ${animationClass}`}
        onAnimationEnd={() => { if(actor.isDefeated) onDefeatAnimationEnd(actor.id) }}
      >
        {isSelected && <div className="absolute -top-4 text-yellow-400 text-2xl">▼</div>}
        
        <div className="relative transform scale-[1.75] sm:scale-[2.5] md:scale-[3] landscape:scale-[1.8] w-12 h-12 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <Icon />
            {equipment && Object.values(equipment).map((item: Item | null) => {
                if (item && item.visual) {
                    const VisualComponent = item.visual;
                    return (
                        <div key={item.id} className="absolute inset-0 flex items-center justify-center">
                            <VisualComponent />
                        </div>
                    );
                }
                return null;
            })}
          </div>
          {/* Status Effect Visuals */}
          <div className="status-vfx-overlay">
              {actor.statusEffects.some(e => e.type === 'burning') && <div className="vfx-burning-overlay" />}
              {actor.statusEffects.some(e => e.type === 'poisoned') && <div className="vfx-poison-overlay" />}
              {actor.statusEffects.some(e => e.type === 'steamed') && <div className="vfx-steamed-overlay" />}
              {actor.statusEffects.some(e => e.type === 'petrified') && <div className="vfx-petrified-overlay" />}
              {actor.statusEffects.some(e => e.type === 'frail') && <div className="vfx-frail-overlay" />}
              {actor.statusEffects.some(e => e.type === 'frightened') && <div className="vfx-frightened-overlay" />}
          </div>
          {/* Status Effect Icons */}
           <div className="absolute top-0 left-0 w-full h-full">
              {actor.statusEffects.map((effect, index) => {
                  const iconData = statusIconMap[effect.type];
                  if (!iconData) return null;
                  const Icon = iconData.icon;
                  const angle = (index / actor.statusEffects.length) * 2 * Math.PI;
                  const x = Math.cos(angle) * 12 - 4;
                  const y = Math.sin(angle) * 12 - 4;
                  return (
                      <div
                          key={effect.type}
                          className="status-icon"
                          style={{ transform: `translate(${x}px, ${y}px) scale(0.55)` }}
                          title={`${iconData.title} (${effect.duration} turns left)`}
                      >
                          <Icon />
                          <span className="status-duration">{effect.duration}</span>
                      </div>
                  );
              })}
          </div>
        </div>

        <div className="w-24 mt-2 landscape:mt-1">
          <div className="text-xs text-center">{actor.name}</div>
          <div className="w-full bg-gray-700 h-2 mt-1 border border-black">
              <div className="health-bar-fg h-full" style={{width: `${(actor.hp / actor.maxHp) * 100}%`}}></div>
          </div>
          {actor.type === 'ENEMY' && (
            <div className="w-full atb-bar-bg h-2 mt-1 border border-black/50">
                <div className="atb-bar-fg h-full" style={{width: `${actor.atb}%`}}></div>
            </div>
          )}
        </div>
     </div>
  );
};

export default ActorSprite;
