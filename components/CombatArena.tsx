import React from 'react';
import type { Actor, EquipmentSlot, Item, Environment } from '../types';
import { Element } from '../types';
import CombatBackground from './CombatBackground';
import ActorSprite from './ActorSprite';

interface CombatArenaProps {
  actors: Actor[];
  handleDefeatAnimationEnd: (actorId: string) => void;
  selectedTarget: string | null;
  showCommandMenu: boolean;
  showAbilityMenu: boolean;
  showUltimateMenu: boolean;
  equipment: Record<EquipmentSlot, Item | null>;
  element: Element;
  environment?: Environment;
}

const CombatArena: React.FC<CombatArenaProps> = ({
  actors,
  handleDefeatAnimationEnd,
  selectedTarget,
  showCommandMenu,
  showAbilityMenu,
  showUltimateMenu,
  equipment,
  element,
  environment
}) => {
  return (
    <>
      <CombatBackground element={element} />

      {environment && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 pixelated-border p-3 text-center z-10 max-w-md landscape:top-2 landscape:p-1.5 landscape:max-w-xs">
          <h3 className="text-lg text-yellow-400 mb-1 landscape:text-xs">{environment.name}</h3>
          <p className="text-xs text-gray-300 landscape:text-[10px]">{environment.description}</p>
        </div>
      )}

      <div className="w-full flex-grow flex justify-between items-end px-4 sm:px-8 md:px-16 pb-12 pt-20 landscape:pb-2 landscape:pt-14 relative z-10">
        <div className="flex space-x-4 sm:space-x-8">
          {actors.filter(a => a.type === 'ENEMY').map(enemy => <ActorSprite key={enemy.id} actor={enemy} onDefeatAnimationEnd={handleDefeatAnimationEnd} selectedTarget={selectedTarget} showCommandMenu={showCommandMenu} showAbilityMenu={showAbilityMenu} showUltimateMenu={showUltimateMenu} />)}
        </div>
        <div className="flex">
          {actors.find(a => a.type === 'PLAYER') && <ActorSprite actor={actors.find(a => a.type === 'PLAYER')!} onDefeatAnimationEnd={handleDefeatAnimationEnd} equipment={equipment} selectedTarget={selectedTarget} showCommandMenu={showCommandMenu} showAbilityMenu={showAbilityMenu} showUltimateMenu={showUltimateMenu} />}
        </div>
      </div>
    </>
  );
};

export default CombatArena;
