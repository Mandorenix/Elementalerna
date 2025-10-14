import React, { useState, useCallback, useMemo } from 'react';
import SkillTree from './components/SkillTree';
import CharacterSheet from './components/CharacterSheet';
import Inventory from './components/Inventory';
import Footer from './components/Footer';
import CharacterSelection from './components/CharacterSelection';
import EventView from './components/EventView';
import DeckView from './components/DeckView';
import DebugView from './components/DebugView';
import type { View, Character, CharacterStats, Item, EquipmentSlot, Archetype, GameEvent, EventCard, Outcome, PlayerAbility, ItemStats } from './types';
import { INITIAL_CHARACTER_BASE, SKILL_TREE_DATA, Icons, PLAYER_ABILITIES, ItemVisuals, generateRandomItem } from './constants';
import { generateRandomCard, generateBossCard } from './utils/cardGenerator';

const initialEquipment: Record<EquipmentSlot, Item | null> = {
    'Hjälm': { id: 'start_helmet', name: 'Läderhuva', slot: 'Hjälm', rarity: 'Vanlig', stats: { rustning: 2 }, icon: Icons.Shield, visual: ItemVisuals.LeatherHelm },
    'Bröst': null,
    'Vapen 1': { id: 'start_weapon', name: 'Rostigt Svärd', slot: 'Vapen 1', rarity: 'Vanlig', stats: { skada: 3 }, icon: Icons.Fire, visual: ItemVisuals.RustySword },
    'Vapen 2': null,
    'Handskar': null,
    'Bälte': null,
    'Byxor': null,
    'Stövlar': null,
}

const CARDS_PER_ROUND = 8;

const generateNewRoundDeck = (playerLevel: number, round: number): EventCard[] => {
    const regularCards = Array.from({ length: CARDS_PER_ROUND - 1 }, () => generateRandomCard(playerLevel, round));
    const bossCard = generateBossCard(playerLevel, round);
    // The boss card is the last one in the deck array, so it will be the last one drawn.
    return [...regularCards, bossCard];
};


function App() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [skillPoints, setSkillPoints] = useState(0);
  const [attributePoints, setAttributePoints] = useState(0);
  const [unlockedSkills, setUnlockedSkills] = useState<Map<string, number>>(new Map());
  const [equipment, setEquipment] = useState<Record<EquipmentSlot, Item | null>>(initialEquipment);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [activeView, setActiveView] = useState<View>('skillTree');
  
  // New Deck State
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [discardPile, setDiscardPile] = useState<EventCard[]>([]);
  const [drawnCard, setDrawnCard] = useState<EventCard | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [roundLevel, setRoundLevel] = useState(1);


  const handleSelectArchetype = useCallback((archetype: Archetype) => {
    const baseStats = INITIAL_CHARACTER_BASE.stats;
    const newStats = {
        strength: baseStats.strength + (archetype.statBonuses.strength || 0),
        dexterity: baseStats.dexterity + (archetype.statBonuses.dexterity || 0),
        intelligence: baseStats.intelligence + (archetype.statBonuses.intelligence || 0),
        constitution: baseStats.constitution + (archetype.statBonuses.constitution || 0),
    };

    const isEnergyArchetype = archetype.name === 'Stormdansaren';
    const maxAether = 50 + (newStats.intelligence - 5) * 10;

    const newCharacter: Character = {
      ...INITIAL_CHARACTER_BASE,
      name: archetype.name,
      archetype: archetype.name,
      stats: newStats,
      resources: {
        health: {
          max: 100 + (newStats.constitution - 5) * 10,
          current: 100 + (newStats.constitution - 5) * 10,
        },
        aether: {
          name: archetype.resourceName,
          max: maxAether,
          current: isEnergyArchetype ? maxAether : 0,
        }
      }
    };
    
    setCharacter(newCharacter);
    setSkillPoints(1);
    setAttributePoints(0);
    
    const initialSkills = new Map([['start', 1]]);
    if (archetype.startingSkill) {
      initialSkills.set(archetype.startingSkill, 1);
    }
    setUnlockedSkills(initialSkills);
    
    setEquipment(initialEquipment);
    setInventory([]);
    setCurrentEvent(null);
    setDrawnCard(null);
    setRoundLevel(1);
    setDeck(generateNewRoundDeck(1, 1));
    setDiscardPile([]);
    setActiveView('deck');
  }, []);

  const handleResetCharacter = useCallback(() => {
    setCharacter(null);
  }, []);

  const unlockSkill = useCallback((skillId: string) => {
    const skillData = SKILL_TREE_DATA.find(s => s.id === skillId);
    if (!skillData) return;

    const currentRank = unlockedSkills.get(skillId) || 0;
    if (skillPoints > 0 && currentRank < skillData.maxRank) {
        setSkillPoints(sp => sp - 1);
        setUnlockedSkills(prevSkills => {
            const newSkills = new Map(prevSkills);
            newSkills.set(skillId, currentRank + 1);
            return newSkills;
        });
    }
  }, [skillPoints, unlockedSkills]);
  
  const gainExperience = useCallback((amount: number) => {
    if (!character) return;
    setCharacter(prevChar => {
        if (!prevChar) return null;
        let newExp = Math.max(0, prevChar.experience.current + amount);
        let newLevel = prevChar.level;
        let newMaxExp = prevChar.experience.max;
        let spGained = 0;
        let apGained = 0;

        while (newExp >= newMaxExp) {
            newLevel++;
            spGained++;
            apGained += 3;
            newExp -= newMaxExp;
            newMaxExp = Math.floor(newMaxExp * 1.5);
        }
        
        if (newLevel > prevChar.level) {
            setSkillPoints(sp => sp + spGained);
            setAttributePoints(ap => ap + apGained);
        }
        
        return {
            ...prevChar,
            level: newLevel,
            experience: { current: newExp, max: newMaxExp },
        };
    });
  }, [character]);

  const applyOutcome = useCallback((outcome: Outcome) => {
    if (outcome.xp) gainExperience(outcome.xp);
    if (outcome.items) setInventory(prev => [...prev, ...outcome.items]);
    if (outcome.healthChange && character) {
        setCharacter(c => c ? { ...c, resources: { ...c.resources, health: { ...c.resources.health, current: Math.max(0, Math.min(c.resources.health.max, c.resources.health.current + outcome.healthChange)) }}} : null);
    }
    // TODO: Add log message to a future game log panel
  }, [character, gainExperience]);

  const handleDrawCard = useCallback(() => {
    if (drawnCard || deck.length === 0) return;
    const [nextCard, ...restOfDeck] = deck;
    setDeck(restOfDeck);
    setDrawnCard(nextCard);
  }, [deck, drawnCard]);

  const handleResolveCard = useCallback((outcome?: Outcome) => {
    if (!drawnCard) return;

    if (drawnCard.type === 'COMBAT') {
        setCurrentEvent(drawnCard.payload as GameEvent);
        setActiveView('event');
        // NOTE: We do NOT clear drawnCard here. It will be cleared after combat.
    } else {
        if (outcome) { // This is from a choice
            applyOutcome(outcome);
        } else if (drawnCard.type === 'BOON' || drawnCard.type === 'CURSE') { // This is a simple boon/curse
            applyOutcome(drawnCard.payload as Outcome);
        }
        // For non-combat cards, resolve them immediately.
        setDiscardPile(prev => [...prev, drawnCard]);
        setDrawnCard(null);
    }
  }, [drawnCard, applyOutcome]);

  const handleStartNextRound = useCallback(() => {
    if (!character) return;
    const newRound = roundLevel + 1;
    setRoundLevel(newRound);
    setDeck(generateNewRoundDeck(character.level, newRound));
    setDiscardPile([]);
  }, [character, roundLevel]);

  const increaseStat = useCallback((stat: keyof CharacterStats) => {
    if (attributePoints > 0 && character) {
        setAttributePoints(ap => ap - 1);
        setCharacter(prevChar => {
            if (!prevChar) return null;
            const newStats = { ...prevChar.stats, [stat]: prevChar.stats[stat] + 1 };
            const newResources = { ...prevChar.resources };
            
            if (stat === 'constitution') {
                newResources.health = { max: prevChar.resources.health.max + 10, current: prevChar.resources.health.current + 10 };
            }
            if (stat === 'intelligence') {
                newResources.aether = { ...prevChar.resources.aether, max: prevChar.resources.aether.max + 10, current: prevChar.resources.aether.current + 10 };
            }
            return { ...prevChar, stats: newStats, resources: newResources };
        });
    }
  }, [attributePoints, character]);

  const handleCombatCompletion = useCallback((rewards: GameEvent['rewards']) => {
    if (drawnCard) {
        setDiscardPile(prev => [...prev, drawnCard]);
    }

    gainExperience(rewards.xp);
    setInventory(prev => [...prev, ...rewards.items]);
    
    // After combat, restore health and reset the unique resource
    if (character) {
        const isEnergyArchetype = character.archetype === 'Stormdansaren';
        setCharacter(c => c ? ({
            ...c,
            resources: {
                health: { ...c.resources.health, current: c.resources.health.max },
                aether: { ...c.resources.aether, current: isEnergyArchetype ? c.resources.aether.max : 0 }
            }
        }) : null);
    }

    // Reset state for next turn
    setCurrentEvent(null);
    setDrawnCard(null);
    setActiveView('deck');
  }, [gainExperience, drawnCard, character]);

  const equipItem = useCallback((itemToEquip: Item) => {
    if (itemToEquip.slot === 'Föremål') return;
    
    setInventory(prev => prev.filter(i => i.id !== itemToEquip.id));
    
    const currentlyEquipped = equipment[itemToEquip.slot as EquipmentSlot];
    if (currentlyEquipped) {
      setInventory(prev => [...prev, currentlyEquipped]);
    }
    
    setEquipment(prev => ({ ...prev, [itemToEquip.slot as EquipmentSlot]: itemToEquip }));
  }, [equipment]);

  const unequipItem = useCallback((slot: EquipmentSlot) => {
    const itemToUnequip = equipment[slot];
    if (!itemToUnequip) return;

    setEquipment(prev => ({...prev, [slot]: null}));
    setInventory(prev => [...prev, itemToUnequip]);
  }, [equipment]);
  
  const playerAbilities = useMemo(() => {
    const abilities: PlayerAbility[] = [];
    unlockedSkills.forEach((rank, skillId) => {
        if (rank > 0 && PLAYER_ABILITIES[skillId]) {
            abilities.push(PLAYER_ABILITIES[skillId]);
        }
    });
    return abilities;
  }, [unlockedSkills]);

  const playerCombatStats = useMemo(() => {
      if (!character) return null;
      // FIX: Use a type-safe loop to iterate over item stats and prevent 'unknown' type errors. The initial value is also typed.
      const equipmentStats = Object.values(equipment).reduce((acc, item) => {
          if (item) {
              for (const key in item.stats) {
                  const stat = key as keyof ItemStats;
                  const value = item.stats[stat];
                  if (value) {
                      acc[stat] = (acc[stat] || 0) + value;
                  }
              }
          }
          return acc;
      }, { strength: 0, dexterity: 0, intelligence: 0, constitution: 0, skada: 0, rustning: 0, undvikandechans: 0, kritiskTräff: 0 } as Required<ItemStats>);

      const totalStats = {
          strength: character.stats.strength + equipmentStats.strength,
          dexterity: character.stats.dexterity + equipmentStats.dexterity,
          intelligence: character.stats.intelligence + equipmentStats.intelligence,
          constitution: character.stats.constitution + equipmentStats.constitution,
      };

      return {
        health: character.resources.health.current,
        maxHealth: character.resources.health.max,
        aether: character.resources.aether.current,
        maxAether: character.resources.aether.max,
        resourceName: character.resources.aether.name,
        damage: (totalStats.strength * 2) + equipmentStats.skada,
        armor: Math.floor((totalStats.constitution * 1.5) + (totalStats.strength * 0.5) + equipmentStats.rustning),
        dodge: (totalStats.dexterity * 0.5) + equipmentStats.undvikandechans,
        crit: (totalStats.dexterity * 0.2) + equipmentStats.kritiskTräff,
        intelligence: totalStats.intelligence,
        abilities: playerAbilities,
      };
  }, [character, equipment, playerAbilities]);

  // --- DEBUG FUNCTIONS ---
  const debugAddXP = () => gainExperience(100);
  const debugAddSkillPoint = () => setSkillPoints(p => p + 1);
  const debugAddAttrPoint = () => setAttributePoints(p => p + 1);
  const debugAddItem = () => {
      if (character) {
          setInventory(inv => [...inv, generateRandomItem(character.level)]);
      }
  };
  const debugHealPlayer = () => {
      if (character) {
        const isEnergyArchetype = character.archetype === 'Stormdansaren';
        setCharacter(c => c ? ({
            ...c,
            resources: {
                health: { ...c.resources.health, current: c.resources.health.max },
                aether: { ...c.resources.aether, current: isEnergyArchetype ? c.resources.aether.max : 0 }
            }
        }) : null);
      }
  };

  if (!character) {
      return (
        <main className="text-gray-100 h-screen w-screen flex flex-col font-['Press_Start_2P'] overflow-hidden">
            <CharacterSelection onSelectArchetype={handleSelectArchetype} />
        </main>
      );
  }

  const renderActiveView = () => {
    if (currentEvent && playerCombatStats) {
      return <EventView event={currentEvent} character={character} playerStats={playerCombatStats} onComplete={handleCombatCompletion} equipment={equipment} unlockedSkills={unlockedSkills} />
    }

    switch (activeView) {
      case 'skillTree':
        return <SkillTree unlockedSkills={unlockedSkills} skillPoints={skillPoints} unlockSkill={unlockSkill} />;
      case 'characterSheet':
        return <CharacterSheet character={character} equipment={equipment as Record<EquipmentSlot, Item | null>} attributePoints={attributePoints} increaseStat={increaseStat} onUnequipItem={unequipItem} />;
      case 'inventory':
        return <Inventory items={inventory} onEquipItem={equipItem} />;
      case 'deck':
        return <DeckView roundLevel={roundLevel} deck={deck} discardPile={discardPile} drawnCard={drawnCard} onDraw={handleDrawCard} onStartNextRound={handleStartNextRound} onResolve={handleResolveCard} />;
      case 'debug':
        return <DebugView 
          addDebugXP={debugAddXP}
          addDebugSkillPoint={debugAddSkillPoint}
          addDebugAttrPoint={debugAddAttrPoint}
          addDebugItem={debugAddItem}
          debugHealPlayer={debugHealPlayer}
          resetCharacter={handleResetCharacter}
        />;
      default:
        return <SkillTree unlockedSkills={unlockedSkills} skillPoints={skillPoints} unlockSkill={unlockSkill} />;
    }
  }

  return (
    <main className="text-gray-100 h-screen w-screen flex flex-col font-['Press_Start_2P'] overflow-hidden">
        {renderActiveView()}
        <Footer 
            skillPoints={skillPoints} 
            attributePoints={attributePoints}
            character={character}
            activeView={activeView} 
            setView={setActiveView}
            onResetCharacter={handleResetCharacter}
        />
    </main>
  );
}

export default App;