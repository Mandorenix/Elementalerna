import React from 'react';
import type { Character, CharacterStats, Item, EquipmentSlot, ItemStats, Element } from '../types';
import ItemTooltip from './ItemTooltip';
import ElementalAffinities from './ElementalAffinities'; // Import new component
import { ELEMENT_ICONS, PASSIVE_TALENTS, ULTIMATE_ABILITIES } from '../constants'; // Add these imports

interface CharacterSheetProps {
  character: Character;
  equipment: Record<EquipmentSlot, Item | null>;
  attributePoints: number;
  increaseStat: (stat: keyof CharacterStats) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  elementalPoints: number; // New prop
  elementalAffinities: Partial<Record<Element, number>>; // New prop
  increaseElementalAffinity: (element: Element) => void; // New prop
  unlockedPassiveTalents: string[]; // New prop
  unlockedUltimateAbilities: string[]; // New prop
}

const resourceThemes: Record<string, { text: string; bg: string }> = {
    'Hetta': { text: 'text-orange-400', bg: 'bg-orange-500' },
    'Styrka': { text: 'text-amber-500', bg: 'bg-amber-600' },
    'Energi': { text: 'text-sky-400', bg: 'bg-sky-500' },
    'Flöde': { text: 'text-blue-400', bg: 'bg-blue-500' },
    'Aether': { text: 'text-blue-400', bg: 'bg-blue-500' }, // Fallback
};

const AttributeRow: React.FC<{ label: string; value: number; canIncrease: boolean; onIncrease: () => void; }> = ({ label, value, canIncrease, onIncrease }) => (
    <div className="flex justify-between items-center text-sm py-1.5">
        <div>
            <span className="text-gray-400">{label}:</span>
            <span className="text-white font-bold ml-2">{value}</span>
        </div>
        {canIncrease && (
            <button 
                onClick={onIncrease} 
                className="w-5 h-5 text-xs bg-yellow-600 hover:bg-yellow-500 text-white font-bold leading-none pixelated-border"
                aria-label={`Öka ${label}`}
            >+</button>
        )}
    </div>
);

const StatRow: React.FC<{ label: string; value: string | number; base: number; bonus: number }> = ({ label, value, base, bonus }) => (
  <div className="flex justify-between text-sm py-1 group relative">
    <span className="text-gray-400">{label}:</span>
    <div className="text-right">
      <span className="text-white font-bold">{value}</span>
      <div className="absolute right-0 bottom-full mb-1 w-max bg-black/80 p-1 px-2 text-[10px] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-gray-500">{base.toFixed(1)}</span>
        {bonus > 0 && <span className="text-green-400"> +{bonus.toFixed(1)}</span>}
        {bonus < 0 && <span className="text-red-400"> {bonus.toFixed(1)}</span>}
      </div>
    </div>
  </div>
);

const EquipmentSlotDisplay: React.FC<{ label: EquipmentSlot; item: Item | null; onUnequip: () => void }> = ({ label, item, onUnequip }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const rarityColor = item ? {
        'Vanlig': 'border-gray-400', 'Magisk': 'border-blue-500',
        'Sällsynt': 'border-yellow-500', 'Legendarisk': 'border-orange-500',
    }[item.rarity] : 'border-gray-700';
    const Icon = item?.icon;

    return (
        <div 
            className="flex items-center space-x-2 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                onClick={item ? onUnequip : undefined}
                className={`w-12 h-12 bg-black/50 border-2 ${rarityColor} flex items-center justify-center text-gray-500 text-2xl ${item ? 'cursor-pointer hover:bg-red-500/20' : ''}`}
            >
                {Icon ? <Icon /> : '?'}
            </div>
            <div>
                <div className="text-gray-500 text-[10px]">{label}</div>
                <div className="text-white text-xs">{item ? item.name : 'Tom'}</div>
            </div>
            {isHovered && item && <ItemTooltip item={item} context="unequip" />}
        </div>
    );
};

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, equipment, attributePoints, increaseStat, onUnequipItem, elementalPoints, elementalAffinities, increaseElementalAffinity, unlockedPassiveTalents, unlockedUltimateAbilities }) => {
  const equipmentStats = React.useMemo(() => {
    const totals: Required<ItemStats> = {
        strength: 0, dexterity: 0, intelligence: 0, constitution: 0,
        skada: 0, rustning: 0, undvikandechans: 0, kritiskTräff: 0
    };
    Object.values(equipment).forEach(item => {
        if (item) {
            // FIX: Use a type-safe loop to iterate over item stats and prevent 'unknown' type errors.
            for (const key in (item as Item).stats) { // Explicitly cast item to Item
                const stat = key as keyof ItemStats;
                const value = (item as Item).stats[stat]; // Explicitly cast item to Item
                if (value) {
                    totals[stat] += value;
                }
            }
        }
    });
    return totals;
  }, [equipment]);

  const totalStats = {
      strength: character.stats.strength + equipmentStats.strength,
      dexterity: character.stats.dexterity + equipmentStats.dexterity,
      intelligence: character.stats.intelligence + equipmentStats.intelligence,
      constitution: character.stats.constitution + equipmentStats.constitution,
  };
  
  const derivedStats = {
    skada: (totalStats.strength * 2) + equipmentStats.skada,
    rustning: (totalStats.constitution * 1.5) + (totalStats.strength * 0.5) + equipmentStats.rustning,
    undvikandechans: (totalStats.dexterity * 0.5) + equipmentStats.undvikandechans,
    kritiskTräff: (totalStats.dexterity * 0.2) + equipmentStats.kritiskTräff,
    manaRegen: (totalStats.intelligence * 0.1)
  };

  const resourceTheme = resourceThemes[character.resources.aether.name] || resourceThemes['Aether'];

  return (
    <div className="flex-grow w-full h-full p-6 text-white overflow-y-auto">
      <div className="text-center">
        <h1 className="text-2xl text-yellow-400 mb-1">{character.name}</h1>
        <p className="text-sm text-gray-400 mb-6">{character.archetype}</p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Panel: Attributes & Resources */}
        <div className="md:col-span-1 p-4 bg-black/30 pixelated-border flex flex-col">
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="text-lg text-yellow-500">Attribut</h3>
            {attributePoints > 0 && (
                <div className="text-xs text-yellow-300 animate-pulse">
                    {attributePoints} Poäng Tillgängliga
                </div>
            )}
          </div>
          <div className="space-y-1">
            <AttributeRow label="Styrka" value={character.stats.strength} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('strength')} />
            <AttributeRow label="Dexteritet" value={character.stats.dexterity} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('dexterity')} />
            <AttributeRow label="Intelligens" value={character.stats.intelligence} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('intelligence')} />
            <AttributeRow label="Konstitution" value={character.stats.constitution} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('constitution')} />
          </div>

          <h3 className="text-lg text-yellow-500 mt-6 mb-2">Resurser</h3>
          <div className="space-y-2">
            <div>
                <span className="text-sm text-red-400">Liv</span>
                <div className="w-full bg-gray-700 h-4 mt-1 pixelated-border">
                    <div className="bg-red-500 h-full" style={{width: `${(character.resources.health.current / character.resources.health.max) * 100}%`}}></div>
                </div>
                <div className="text-center text-xs mt-1">{character.resources.health.current} / {character.resources.health.max}</div>
            </div>
             <div>
                <span className={`text-sm ${resourceTheme.text}`}>{character.resources.aether.name}</span>
                <div className="w-full bg-gray-700 h-4 mt-1 pixelated-border">
                    <div className={`${resourceTheme.bg} h-full`} style={{width: `${(character.resources.aether.current / character.resources.aether.max) * 100}%`}}></div>
                </div>
                <div className="text-center text-xs mt-1">{character.resources.aether.current} / {character.resources.aether.max}</div>
            </div>
          </div>
        </div>

        {/* Middle Panel: Equipment & Elemental Affinities */}
        <div className="md:col-span-1 flex flex-col space-y-6">
            <div className="p-4 bg-black/30 pixelated-border">
                <h2 className="text-lg text-yellow-500 mb-4 text-center">Utrustning</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {(Object.keys(equipment) as EquipmentSlot[]).map(slot => (
                    <EquipmentSlotDisplay key={slot} label={slot} item={equipment[slot]} onUnequip={() => onUnequipItem(slot)} />
                ))}
                </div>
            </div>
            <ElementalAffinities 
                elementalAffinities={elementalAffinities}
                elementalPoints={elementalPoints}
                increaseElementalAffinity={increaseElementalAffinity}
            />

            {/* New: Passive Talents */}
            <div className="p-4 bg-black/30 pixelated-border">
                <h2 className="text-lg text-yellow-500 mb-4 text-center">Passiva Talanger</h2>
                {unlockedPassiveTalents && unlockedPassiveTalents.length > 0 ? (
                    <div className="space-y-3">
                        {unlockedPassiveTalents.map(talentId => {
                            const talent = PASSIVE_TALENTS[talentId];
                            if (!talent) return null;
                            const Icon = talent.icon;
                            return (
                                <div key={talent.id} className="flex items-center space-x-3">
                                    <div className="w-8 h-8 flex items-center justify-center border border-gray-600 text-yellow-300"><Icon /></div>
                                    <div>
                                        <h4 className="text-sm text-white">{talent.name}</h4>
                                        <p className="text-[10px] text-gray-400">{talent.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center">Inga passiva talanger upplåsta ännu.</p>
                )}
            </div>

            {/* New: Ultimate Abilities */}
            <div className="p-4 bg-black/30 pixelated-border">
                <h2 className="text-lg text-yellow-500 mb-4 text-center">Ultimata Förmågor</h2>
                {unlockedUltimateAbilities && unlockedUltimateAbilities.length > 0 ? (
                    <div className="space-y-3">
                        {unlockedUltimateAbilities.map(abilityId => {
                            const ability = ULTIMATE_ABILITIES[abilityId];
                            if (!ability) return null;
                            const Icon = ability.icon;
                            return (
                                <div key={ability.id} className="flex items-center space-x-3">
                                    <div className="w-8 h-8 flex items-center justify-center border border-gray-600 text-orange-400"><Icon /></div>
                                    <div>
                                        <h4 className="text-sm text-white">{ability.name}</h4>
                                        <p className="text-[10px] text-gray-400">{ability.description}</p>
                                        <p className="text-[10px] text-gray-500">Nedkylning: {ability.cooldown} rundor</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center">Inga ultimata förmågor upplåsta ännu.</p>
                )}
            </div>
        </div>

        {/* Right Panel: Total Stats */}
        <div className="md:col-span-1 p-4 bg-black/30 pixelated-border">
             <h2 className="text-lg text-yellow-500 mb-4">Totala Stats</h2>
              <div className="space-y-1">
                <StatRow label="Styrka" value={totalStats.strength} base={character.stats.strength} bonus={equipmentStats.strength} />
                <StatRow label="Dexteritet" value={totalStats.dexterity} base={character.stats.dexterity} bonus={equipmentStats.dexterity} />
                <StatRow label="Intelligens" value={totalStats.intelligence} base={character.stats.intelligence} bonus={equipmentStats.intelligence} />
                <StatRow label="Konstitution" value={totalStats.constitution} base={character.stats.constitution} bonus={equipmentStats.constitution} />
              </div>
              <h3 className="text-lg text-yellow-500 mt-6 mb-2">Stridsattribut</h3>
              <div className="space-y-1">
                 <StatRow label="Skada" value={derivedStats.skada} base={totalStats.strength * 2} bonus={equipmentStats.skada} />
                 <StatRow label="Rustning" value={Math.floor(derivedStats.rustning)} base={Math.floor((totalStats.constitution * 1.5) + (totalStats.strength * 0.5))} bonus={equipmentStats.rustning} />
                 <StatRow label="Undvikandechans" value={`${derivedStats.undvikandechans.toFixed(1)}%`} base={totalStats.dexterity * 0.5} bonus={equipmentStats.undvikandechans} />
                 <StatRow label="Kritisk Träff" value={`${derivedStats.kritiskTräff.toFixed(1)}%`} base={totalStats.dexterity * 0.2} bonus={equipmentStats.kritiskTräff} />
                 <StatRow label="Aether Regen/s" value={derivedStats.manaRegen.toFixed(1)} base={derivedStats.manaRegen} bonus={0} />
              </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;