import React from 'react';
import type { 
  Character, 
  PlayerAbility, 
  EquipmentSlot, 
  Item, 
  ItemStats, 
  UltimateAbility,
  Actor 
} from '../types';
import { Element } from '../types';

interface ActionMenuProps {
  showCommandMenu: boolean;
  setShowCommandMenu: (show: boolean) => void;
  showAbilityMenu: boolean;
  setShowAbilityMenu: (show: boolean) => void;
  showUltimateMenu: boolean;
  setShowUltimateMenu: (show: boolean) => void;
  showItemMenu: boolean;
  setShowItemMenu: (show: boolean) => void;
  previewItem: Item | null;
  setPreviewItem: (item: Item | null) => void;
  handlePlayerAction: (action: 'ATTACK' | 'SKILL' | 'DEFEND' | 'ULTIMATE', abilityId?: string) => void;
  handleUsePotion: (item: Item) => void;
  sortedAbilities: Array<[string, { element: Element; abilities: PlayerAbility[] }]>;
  unlockedUltimateAbilities: UltimateAbility[];
  unlockedSkills: Map<string, number>;
  actors: Actor[];
  character: Character;
  playerResource: number;
  inventory: Item[];
  equipment: Record<EquipmentSlot, Item | null>;
  playerStats: {
    health: number;
    maxHealth: number;
    aether: number;
    maxAether: number;
    resourceName: string;
    damage: number;
    armor: number;
    dodge: number;
    crit: number;
    intelligence: number;
    abilities: PlayerAbility[];
  };
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  showCommandMenu,
  setShowCommandMenu,
  showAbilityMenu,
  setShowAbilityMenu,
  showUltimateMenu,
  setShowUltimateMenu,
  showItemMenu,
  setShowItemMenu,
  previewItem,
  setPreviewItem,
  handlePlayerAction,
  handleUsePotion,
  sortedAbilities,
  unlockedUltimateAbilities,
  unlockedSkills,
  actors,
  character,
  playerResource,
  inventory,
  equipment,
  playerStats,
}) => {
  return (
    <>
      {showCommandMenu && (
        <div className="flex-shrink-0 h-16 landscape:h-full w-full landscape:w-auto flex flex-row landscape:flex-col gap-0.5 p-1 landscape:p-1 border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
          {/* Row 1 in landscape: Attack + Abilities */}
          <div className="flex landscape:flex-row flex-col gap-0.5 flex-1 landscape:flex-none">
            {/* Attack button */}
            <button
              onClick={() => handlePlayerAction('ATTACK')}
              className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-red-900/60 bg-gradient-to-r from-red-950/80 to-red-900/40 hover:from-red-800/80 hover:to-red-700/40 text-red-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Normala attack">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 2a1.5 1.5 0 012.12 0l.38.38a1.5 1.5 0 010 2.12L12 6.5 9.5 4l2-2zM8.5 5L1 12.5V15h2.5L11 7.5 8.5 5zM3 13h1v1H3v-1z" /></svg>
              <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Attack</span>
            </button>
            {/* Abilities button */}
            <button
              onClick={() => { setShowCommandMenu(false); setShowAbilityMenu(true); }}
              className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-purple-900/60 bg-gradient-to-r from-purple-950/80 to-purple-900/40 hover:from-purple-800/80 hover:to-purple-700/40 text-purple-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Förmågor">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z"/></svg>
              <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Förmågor</span>
            </button>
          </div>
          {/* Row 2 in landscape: Ultimate + Items + Defend */}
          <div className="flex landscape:flex-row flex-col gap-0.5 flex-1 landscape:flex-none">
            {/* Ultimate button */}
            <button
              onClick={() => { setShowCommandMenu(false); setShowUltimateMenu(true); }}
              className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-yellow-900/60 bg-gradient-to-r from-yellow-950/80 to-amber-900/40 hover:from-yellow-800/80 hover:to-amber-700/40 text-yellow-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Ultimata förmågor">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-2a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
              <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Ultimata</span>
            </button>
            {/* Items button */}
            <button
              onClick={() => { setShowCommandMenu(false); setShowItemMenu(true); }}
              className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-cyan-900/60 bg-gradient-to-r from-cyan-950/80 to-teal-900/40 hover:from-cyan-800/80 hover:to-teal-700/40 text-cyan-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Föremål">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h6v2H5V2zm1 4h4v8H6V6zm1 2v4h2V8H7z"/></svg>
              <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Föremål</span>
            </button>
            {/* Defend button */}
            <button
              onClick={() => handlePlayerAction('DEFEND')}
              className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-blue-900/60 bg-gradient-to-r from-blue-950/80 to-blue-900/40 hover:from-blue-800/80 hover:to-blue-700/40 text-blue-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Försvara">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5s5 1.5 5 5c0 3-3 5.5-5 7-2-1.5-5-4-5-7 0-3.5 5-5 5-5z"/></svg>
              <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Försvara</span>
            </button>
          </div>
        </div>
      )}
      {showAbilityMenu && (
        <div className="flex-shrink-0 w-full landscape:w-48 md:w-56 flex flex-col h-32 landscape:h-full md:h-full border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
          <div className="px-2 py-1 text-[8px] font-bold text-purple-400 uppercase tracking-wider border-b border-gray-700/50 flex items-center gap-1 flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z"/></svg>
            Förmågor
          </div>
          <ul className="flex-grow overflow-y-auto custom-scrollbar">
            {sortedAbilities.map(([elementName, { abilities }]: [string, { element: Element, abilities: PlayerAbility[] }]) => (
              <React.Fragment key={elementName}>
                <li className="px-2 py-0.5 text-[8px] font-bold text-yellow-500/80 uppercase tracking-wider bg-black/20">{elementName.toLowerCase().replace('_', ' ')}</li>
                {abilities.map(ability => {
                  const rank = unlockedSkills.get(ability.id) || 1;
                  const rankData = ability.ranks[rank - 1];
                  if (!rankData) return null;
                  const hasFullFlow = actors.find(a => a.type === 'PLAYER')?.statusEffects.some(e => e.type === 'full_flow');
                  const effectiveCost = hasFullFlow ? 0 : rankData.resourceCost;
                  
                  let gainedAmount = 0;
                  if (character.archetype === 'Pyromanten') {
                    gainedAmount = rankData.resourceCost;
                  } else if (character.archetype === 'Ljusbringaren' && rankData.resourceCost === 0) {
                    gainedAmount = 10 + (rankData.healMultiplier ? Math.floor(rankData.healMultiplier * 30) : (rankData.duration ? rankData.duration * 5 : 0));
                  } else if (character.archetype === 'Skuggvävaren' && rankData.resourceCost === 0) {
                    gainedAmount = 10 + (rankData.damageMultiplier ? Math.floor(rankData.damageMultiplier * 10) : 0);
                  } else if (character.archetype === 'Tidvattenvävaren' && ability.id === 'water_1') {
                    gainedAmount = 30; // FLODE_PER_HEAL_CC
                  } else if (character.archetype === 'Stenväktaren' && ability.id === 'earth_1') {
                    gainedAmount = 12 + rank * 3;
                  } else if (character.archetype === 'Stormdansaren' && ability.id === 'wind_1') {
                    gainedAmount = 15 + rank * 3;
                  }

                  const generatesResource = gainedAmount > 0;
                  const canAfford = generatesResource ? true : playerResource >= effectiveCost;
                  const costText = generatesResource ? `+${gainedAmount}` : `${effectiveCost}`;
                  
                  return (
                    <li key={ability.id}
                      onClick={() => canAfford ? handlePlayerAction('SKILL', ability.id) : undefined}
                      className={`px-3 py-1.5 flex justify-between items-center text-[9px] border-b border-gray-800/60 ${canAfford ? 'hover:bg-purple-900/30 cursor-pointer text-gray-200' : 'text-gray-600 cursor-not-allowed'}`}>
                      <span>{ability.name} {hasFullFlow && '⚡'}</span>
                      <span className={`text-[8px] font-bold ${generatesResource ? 'text-green-400' : canAfford ? 'text-purple-300' : 'text-gray-600'}`}>{costText}</span>
                    </li>
                  )
                })}
              </React.Fragment>
            ))}
          </ul>
          <button onClick={() => { setShowAbilityMenu(false); setShowCommandMenu(true); }} className="text-center w-full py-1 text-[8px] text-gray-500 hover:text-gray-300 flex-shrink-0 border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">◀ Tillbaka</button>
        </div>
      )}
      {showUltimateMenu && (
        <div className="flex-shrink-0 w-full landscape:w-48 md:w-56 flex flex-col h-32 landscape:h-full md:h-full border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
          <div className="px-2 py-1 text-[8px] font-bold text-yellow-400 uppercase tracking-wider border-b border-gray-700/50 flex items-center gap-1 flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-2a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
            Ultimata
          </div>
          <ul className="flex-grow overflow-y-auto custom-scrollbar">
            {unlockedUltimateAbilities.length > 0 ? (
              unlockedUltimateAbilities.map(ultimate => {
                const playerActor = actors.find(a => a.type === 'PLAYER');
                const currentCooldown = playerActor?.ultimateCooldowns[ultimate.id] || 0;
                const isReady = currentCooldown === 0;
                const Icon = ultimate.icon;
                return (
                  <li key={ultimate.id}
                    onClick={() => isReady ? handlePlayerAction('ULTIMATE', ultimate.id) : undefined}
                    className={`px-3 py-1.5 flex justify-between items-center text-[9px] border-b border-gray-800/60 ${isReady ? 'hover:bg-yellow-900/30 cursor-pointer text-gray-200' : 'text-gray-600 cursor-not-allowed'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center"><Icon /></div>
                      <span>{ultimate.name}</span>
                    </div>
                    <span className={`text-[8px] font-bold ${isReady ? 'text-yellow-400' : 'text-gray-600'}`}>{isReady ? 'Redo' : `CD: ${currentCooldown}`}</span>
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-gray-600 text-[9px] text-center">Inga ultimata upplåsta.</li>
            )}
          </ul>
          <button onClick={() => { setShowUltimateMenu(false); setShowCommandMenu(true); }} className="text-center w-full py-1 text-[8px] text-gray-500 hover:text-gray-300 flex-shrink-0 border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">◀ Tillbaka</button>
        </div>
      )}
      {showItemMenu && (
        <div className="flex-shrink-0 w-full landscape:w-52 md:w-60 flex flex-col h-auto landscape:h-full md:h-full border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
          <div className="px-2 py-1 text-[8px] font-bold text-cyan-400 uppercase tracking-wider border-b border-gray-700/50 flex items-center gap-1 flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h6v2H5V2zm1 4h4v8H6V6zm1 2v4h2V8H7z"/></svg>
            {previewItem ? previewItem.name : 'Föremål'}
            {previewItem && (
              <button onClick={() => setPreviewItem(null)} className="ml-auto text-gray-500 hover:text-gray-200 text-[9px] px-1">× Stäng</button>
            )}
          </div>

          {/* Item Preview Panel */}
          {previewItem ? (
            <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar p-2 gap-1.5">
              {/* Rarity badge + name */}
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  previewItem.rarity === 'Legendarisk' ? 'bg-orange-900/60 text-orange-300 border border-orange-700' :
                  previewItem.rarity === 'Sällsynt' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' :
                  previewItem.rarity === 'Magisk' ? 'bg-blue-900/60 text-blue-300 border border-blue-700' :
                  'bg-gray-800/60 text-gray-400 border border-gray-600'
                }`}>{previewItem.rarity}</span>
                <span className="text-[8px] text-gray-500">{previewItem.slot}</span>
              </div>

              {/* Consumable effect */}
              {previewItem.consumableEffect && (
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded p-1.5">
                  <p className="text-[9px] text-emerald-300 font-bold">
                    {previewItem.consumableEffect.type === 'HEAL' && `❤️ Läker ${previewItem.consumableEffect.value} HP`}
                    {previewItem.consumableEffect.type === 'AETHER' && `💧 Återställer ${previewItem.consumableEffect.value} ${playerStats.resourceName}`}
                    {previewItem.consumableEffect.type === 'BUFF' && `✨ Buff: ${previewItem.consumableEffect.description}`}
                    {previewItem.consumableEffect.type === 'REVIVE' && `☀️ Återupplivning: ${previewItem.consumableEffect.value} HP`}
                  </p>
                  <p className="text-[8px] text-gray-400 mt-0.5">{previewItem.consumableEffect.description}</p>
                </div>
              )}

              {/* Equipment stats comparison */}
              {!previewItem.consumableEffect && Object.keys(previewItem.stats || {}).length > 0 && (() => {
                const equippedInSlot = equipment[previewItem.slot as keyof typeof equipment] as Item | null | undefined;
                const statKeys = Array.from(new Set([
                  ...Object.keys(previewItem.stats || {}),
                  ...Object.keys(equippedInSlot?.stats || {})
                ])) as (keyof ItemStats)[];
                return (
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded p-1.5">
                    <p className="text-[7px] text-gray-500 uppercase tracking-wider mb-1">
                      {equippedInSlot ? `Jämförelse med: ${equippedInSlot.name}` : 'Stats (inget utrustat)'}
                    </p>
                    {statKeys.map(stat => {
                      const newVal = (previewItem.stats as any)[stat] || 0;
                      const oldVal = equippedInSlot ? ((equippedInSlot.stats as any)[stat] || 0) : 0;
                      const diff = newVal - oldVal;
                      return (
                        <div key={stat} className="flex justify-between items-center text-[8px] py-0.5 border-b border-gray-800/40 last:border-0">
                          <span className="text-gray-400 capitalize">{stat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{newVal}</span>
                            {equippedInSlot && (
                              <span className={`text-[7px] font-bold ${
                                diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'
                              }`}>
                                {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '='}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Affix / special */}
              {previewItem.affix && (
                <div className="bg-amber-950/30 border border-amber-800/40 rounded p-1.5">
                  <p className="text-[8px] text-amber-300">{previewItem.affix.description}</p>
                </div>
              )}

              {/* Use button (only for consumables) */}
              {previewItem.consumableEffect && (
                <button
                  onClick={() => { handleUsePotion(previewItem); setPreviewItem(null); }}
                  className="w-full py-2 mt-1 rounded border border-emerald-700 bg-gradient-to-r from-emerald-900/80 to-emerald-800/60 hover:from-emerald-700/80 hover:to-emerald-600/60 text-emerald-300 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  ✓ Använd {previewItem.name}
                </button>
              )}
            </div>
          ) : (
            /* Item List */
            <ul className="flex-grow overflow-y-auto custom-scrollbar">
              {inventory.filter(item => item.consumableEffect || Object.keys(item.stats || {}).length > 0).length > 0 ? (
                inventory.filter(item => item.consumableEffect || Object.keys(item.stats || {}).length > 0).map(item => (
                  <li key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className={`px-3 py-1.5 cursor-pointer flex justify-between items-center text-[9px] border-b border-gray-800/60 transition-colors ${
                      item.consumableEffect ? 'hover:bg-cyan-900/30' : 'hover:bg-gray-700/30'
                    }`}>
                    <div>
                      <span className={`font-bold ${
                        item.rarity === 'Legendarisk' ? 'text-orange-300' :
                        item.rarity === 'Sällsynt' ? 'text-purple-300' :
                        item.rarity === 'Magisk' ? 'text-blue-300' : 'text-yellow-300'
                      }`}>{item.name}</span>
                      <p className="text-gray-600 text-[8px] mt-0.5">
                        {item.consumableEffect ? item.consumableEffect.description : item.slot}
                      </p>
                    </div>
                    <span className="text-gray-500 text-[9px] ml-2">›</span>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-gray-600 text-[9px] text-center">Inga föremål att använda.</li>
              )}
            </ul>
          )}
          <button onClick={() => { setPreviewItem(null); setShowItemMenu(false); setShowCommandMenu(true); }} className="text-center w-full py-1 text-[8px] text-gray-500 hover:text-gray-300 flex-shrink-0 border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">◀ Tillbaka</button>
        </div>
      )}
    </>
  );
};

export default ActionMenu;
