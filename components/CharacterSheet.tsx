import React from 'react';
import type { Character, CharacterStats, Item, EquipmentSlot, ItemStats } from '../types';
import { Element } from '../types';
import ItemTooltip from './ItemTooltip';
import ElementalAffinities from './ElementalAffinities';
import { PASSIVE_TALENTS, ULTIMATE_ABILITIES, ARCHETYPES } from '../constants';
import ElementalVFX from './ElementalVFX';

interface CharacterSheetProps {
  character: Character;
  equipment: Record<EquipmentSlot, Item | null>;
  attributePoints: number;
  increaseStat: (stat: keyof CharacterStats) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  elementalPoints: number;
  elementalAffinities: Partial<Record<Element, number>>;
  increaseElementalAffinity: (element: Element) => void;
  unlockedPassiveTalents: string[];
  unlockedUltimateAbilities: string[];
}

const archetypeThemes: Record<string, { banner: string; text: string; accent: string; badge: string }> = {
    'Pyromanten': { banner: 'from-red-900/80 via-red-800/40 to-transparent', text: 'text-red-400', accent: 'bg-red-600', badge: 'border-red-500 text-red-400' },
    'Stenväktaren': { banner: 'from-green-900/80 via-green-800/40 to-transparent', text: 'text-green-400', accent: 'bg-green-600', badge: 'border-green-500 text-green-400' },
    'Stormdansaren': { banner: 'from-sky-900/80 via-sky-800/40 to-transparent', text: 'text-sky-400', accent: 'bg-sky-600', badge: 'border-sky-500 text-sky-400' },
    'Tidvattenvävaren': { banner: 'from-blue-900/80 via-blue-800/40 to-transparent', text: 'text-blue-400', accent: 'bg-blue-600', badge: 'border-blue-500 text-blue-400' },
    'Ljusbringaren': { banner: 'from-yellow-900/80 via-yellow-800/40 to-transparent', text: 'text-yellow-300', accent: 'bg-yellow-500', badge: 'border-yellow-400 text-yellow-300' },
    'Skuggvävaren': { banner: 'from-purple-900/80 via-purple-800/40 to-transparent', text: 'text-purple-400', accent: 'bg-purple-600', badge: 'border-purple-500 text-purple-400' },
};

const resourceThemes: Record<string, { text: string; bg: string; glow: string }> = {
    'Hetta': { text: 'text-orange-400', bg: 'bg-orange-500', glow: 'shadow-orange-500/50' },
    'Styrka': { text: 'text-amber-500', bg: 'bg-amber-600', glow: 'shadow-amber-600/50' },
    'Energi': { text: 'text-sky-400', bg: 'bg-sky-500', glow: 'shadow-sky-500/50' },
    'Flöde': { text: 'text-blue-400', bg: 'bg-blue-500', glow: 'shadow-blue-500/50' },
    'Aether': { text: 'text-blue-400', bg: 'bg-blue-500', glow: 'shadow-blue-500/50' },
    'Nåd': { text: 'text-yellow-300', bg: 'bg-yellow-500', glow: 'shadow-yellow-500/50' },
    'Skugga': { text: 'text-purple-400', bg: 'bg-purple-600', glow: 'shadow-purple-600/50' },
};

const statIcons: Record<string, string> = {
    strength: '\u2694\uFE0F',
    dexterity: '\uD83C\uDFAF',
    intelligence: '\uD83D\uDD2E',
    constitution: '\uD83D\uDEE1\uFE0F',
};

const AttributeRow: React.FC<{ label: string; value: number; canIncrease: boolean; onIncrease: () => void; }> = ({ label, value, canIncrease, onIncrease }) => {
    const barPercent = Math.min(100, (value / 20) * 100);
    return (
        <div className="flex items-center justify-between text-sm py-1.5">
            <div className="flex items-center gap-2 flex-1">
                <span className="text-gray-400 w-24">{statIcons[label.toLowerCase()] || ''} {label}:</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-32">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${barPercent}%` }}
                    />
                </div>
                <span className="text-white font-bold w-6 text-right">{value}</span>
            </div>
            {canIncrease && (
                <button
                    onClick={onIncrease}
                    className="w-5 h-5 text-xs bg-yellow-600 hover:bg-yellow-500 text-white font-bold leading-none pixelated-border flex items-center justify-center"
                    aria-label={`Öka ${label}`}
                >+</button>
            )}
        </div>
    );
};

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
                className={`w-10 h-10 bg-black/50 border-2 ${rarityColor} flex items-center justify-center text-gray-500 text-xl ${item ? 'cursor-pointer hover:bg-red-500/20' : ''}`}
            >
                {Icon ? <Icon /> : '?'}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-gray-500 text-[10px]">{label}</div>
                <div className="text-white text-xs truncate">{item ? item.name : 'Tom'}</div>
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
            const typedItem = item as Item;
            for (const key in typedItem.stats) {
                const stat = key as keyof ItemStats;
                const value = typedItem.stats[stat];
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

  const primaryArch = ARCHETYPES.find(a => a.name === character.archetype);
  const secondaryArch = character.secondaryArchetype ? ARCHETYPES.find(a => a.name === character.secondaryArchetype) : null;
  const resourceNames = secondaryArch
    ? `${primaryArch?.resourceName || character.resources.aether.name} & ${secondaryArch?.resourceName || ''}`
    : character.resources.aether.name;
  const resourceTheme = resourceThemes[primaryArch?.resourceName || character.resources.aether.name] || resourceThemes['Aether'];
  const archetypeTheme = archetypeThemes[character.archetype] || archetypeThemes['Pyromanten'];

  const Sprite = React.useMemo(() => {
    const arch = ARCHETYPES.find(a => a.name === character.archetype);
    return arch?.sprite;
  }, [character.archetype]);

  const element = React.useMemo(() => {
    const arch = ARCHETYPES.find(a => a.name === character.archetype);
    return arch?.element ?? Element.NEUTRAL;
  }, [character.archetype]);

  return (
    <div className="flex-grow w-full h-full p-6 text-white overflow-y-auto relative">
      <div className="max-w-6xl mx-auto">
        {/* Character Banner */}
        <div className={`relative mb-6 p-6 pt-10 pb-6 bg-gradient-to-b ${archetypeTheme.banner} pixelated-border overflow-hidden`}>
            <div className="absolute top-2 right-3 flex items-center gap-2">
                <div className={`text-sm font-bold px-3 py-1 rounded-sm border ${archetypeTheme.badge} bg-black/50 animate-pulse-glow`}>
                    Nivå {character.level}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${archetypeTheme.text}`}>{character.name}</h1>
                    <p className="text-sm text-gray-400">{character.archetype}{character.secondaryArchetype ? ` + ${character.secondaryArchetype}` : ''}</p>
                </div>
                {attributePoints > 0 && (
                    <div className="ml-auto text-xs text-yellow-300 animate-pulse px-3 py-1 bg-yellow-900/30 rounded-sm border border-yellow-700">
                        {attributePoints} Attributpoäng
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Panel: Attributes & Resources */}
          <div className="md:col-span-1 p-4 bg-black/30 pixelated-border flex flex-col">
            {/* Visual Character Avatar with real-time elements VFX */}
            <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-gray-700/50 rounded-sm mb-4 relative overflow-hidden h-44 flex-shrink-0">
                <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
                    <ElementalVFX element={element} isActive={true} />
                </div>
                <div className="transform scale-[3.5] z-10">
                    <div className="animate-idle-bob">
                        {Sprite ? <Sprite /> : '?'}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-baseline mb-2">
              <h3 className="text-lg text-yellow-500">Attribut</h3>
            </div>
            <div className="space-y-1">
              <AttributeRow label="Styrka" value={character.stats.strength} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('strength')} />
              <AttributeRow label="Dexteritet" value={character.stats.dexterity} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('dexterity')} />
              <AttributeRow label="Intelligens" value={character.stats.intelligence} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('intelligence')} />
              <AttributeRow label="Konstitution" value={character.stats.constitution} canIncrease={attributePoints > 0} onIncrease={() => increaseStat('constitution')} />
            </div>

            <h3 className="text-lg text-yellow-500 mt-6 mb-2">Resurser</h3>
            <div className="space-y-3">
              <div>
                  <span className="text-sm text-red-400 flex justify-between">
                      <span>Liv</span>
                      <span>{character.resources.health.current} / {character.resources.health.max}</span>
                  </span>
                  <div className="w-full bg-gray-700 h-5 mt-1 rounded-sm overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                      <div className="h-full flex items-center justify-center text-xs font-bold text-white relative"
                          style={{width: `${(character.resources.health.current / character.resources.health.max) * 100}%`}}>
                          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                          <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{character.resources.health.current}/{character.resources.health.max}</span>
                      </div>
                  </div>
              </div>
               <div>
                  <span className={`text-sm ${resourceTheme.text} flex justify-between`}>
                      <span>{resourceNames}</span>
                      <span>{character.resources.aether.current} / {character.resources.aether.max}</span>
                  </span>
                  <div className="w-full bg-gray-700 h-5 mt-1 rounded-sm overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                      <div className="h-full flex items-center justify-center text-xs font-bold text-white relative"
                          style={{width: `${(character.resources.aether.current / character.resources.aether.max) * 100}%`}}>
                          <div className={`absolute inset-0 bg-gradient-to-r from-blue-700 to-${resourceTheme.bg.replace('bg-', '')} ${resourceTheme.glow}`} />
                          <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{character.resources.aether.current}/{character.resources.aether.max}</span>
                      </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Middle Panel: Equipment & Elemental Affinities */}
          <div className="md:col-span-1 flex flex-col space-y-6">
              <div className="p-4 bg-black/30 pixelated-border">
                  <h2 className="text-lg text-yellow-500 mb-4 text-center">Utrustning</h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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

              {/* Passive Talents */}
              <div className="p-4 bg-black/30 pixelated-border">
                  <h2 className="text-lg text-yellow-500 mb-4 text-center">Passiva Talanger</h2>
                  {unlockedPassiveTalents && unlockedPassiveTalents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                          {unlockedPassiveTalents.map(talentId => {
                              const talent = PASSIVE_TALENTS[talentId];
                              if (!talent) return null;
                              const Icon = talent.icon;
                              return (
                                  <div key={talent.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-sm border border-gray-700/50 hover:border-yellow-600/50 transition-colors">
                                      <div className="w-8 h-8 flex items-center justify-center border border-gray-600 text-yellow-300 bg-yellow-900/20 rounded-sm"><Icon /></div>
                                      <div className="flex-1 min-w-0">
                                          <h4 className="text-sm text-white">{talent.name}</h4>
                                          <p className="text-[10px] text-gray-400 truncate">{talent.description}</p>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <p className="text-xs text-gray-500 text-center">Inga passiva talanger upplåsta ännu.</p>
                  )}
              </div>

              {/* Ultimate Abilities */}
              <div className="p-4 bg-black/30 pixelated-border">
                  <h2 className="text-lg text-yellow-500 mb-4 text-center">Ultimata Förmågor</h2>
                  {unlockedUltimateAbilities && unlockedUltimateAbilities.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                          {unlockedUltimateAbilities.map(abilityId => {
                              const ability = ULTIMATE_ABILITIES[abilityId];
                              if (!ability) return null;
                              const Icon = ability.icon;
                              return (
                                  <div key={ability.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-sm border border-gray-700/50 hover:border-orange-600/50 transition-colors">
                                      <div className="w-8 h-8 flex items-center justify-center border border-gray-600 text-orange-400 bg-orange-900/20 rounded-sm"><Icon /></div>
                                      <div className="flex-1 min-w-0">
                                          <h4 className="text-sm text-white">{ability.name}</h4>
                                          <p className="text-[10px] text-gray-400 truncate">{ability.description}</p>
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
               <div className="space-y-2">
                   {([
                       { label: 'Styrka', key: 'strength' as keyof CharacterStats, base: character.stats.strength },
                       { label: 'Dexteritet', key: 'dexterity' as keyof CharacterStats, base: character.stats.dexterity },
                       { label: 'Intelligens', key: 'intelligence' as keyof CharacterStats, base: character.stats.intelligence },
                       { label: 'Konstitution', key: 'constitution' as keyof CharacterStats, base: character.stats.constitution },
                   ]).map(({ label, key, base }) => {
                       const bonus = equipmentStats[key] || 0;
                       return (
                           <div key={key} className="flex justify-between items-center py-1 px-2 bg-white/5 rounded-sm">
                               <span className="text-gray-400 text-sm">{label}</span>
                               <div className="flex items-center gap-2">
                                   <span className="text-white font-bold">{base + bonus}</span>
                                   {bonus > 0 && <span className="text-green-400 text-[10px]">(+{bonus})</span>}
                                   {bonus < 0 && <span className="text-red-400 text-[10px]">({bonus})</span>}
                               </div>
                           </div>
                       );
                   })}
               </div>

               <h3 className="text-lg text-yellow-500 mt-6 mb-3">Stridsattribut</h3>
               <div className="space-y-2">
                  {([
                      { label: 'Skada', value: derivedStats.skada, color: 'text-yellow-400', icon: '\u2694\uFE0F' },
                      { label: 'Rustning', value: Math.floor(derivedStats.rustning), color: 'text-red-400', icon: '\uD83D\uDEE1\uFE0F' },
                      { label: 'Undvikande', value: `${derivedStats.undvikandechans.toFixed(1)}%`, color: 'text-cyan-400', icon: '\uD83C\uDFAF' },
                      { label: 'Kritisk Träff', value: `${derivedStats.kritiskTräff.toFixed(1)}%`, color: 'text-yellow-400', icon: '\uD83D\uDCA5' },
                      { label: 'Aether Regen', value: `${derivedStats.manaRegen.toFixed(1)}/s`, color: 'text-blue-400', icon: '\uD83D\uDD2E' },
                  ]).map(({ label, value, color, icon }) => (
                      <div key={label} className="flex justify-between items-center py-1 px-2 bg-white/5 rounded-sm">
                          <span className="text-gray-400 text-sm">{icon} {label}</span>
                          <span className={`font-bold ${color}`}>{value}</span>
                      </div>
                  ))}
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
