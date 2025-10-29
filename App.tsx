import React, { useState, useCallback, useMemo } from 'react';
import SkillTree from './components/SkillTree';
import CharacterSheet from './components/CharacterSheet';
import Inventory from './components/Inventory';
import Footer from './components/Footer';
import CharacterSelection from './components/CharacterSelection';
import EventView from './components/EventView';
import DeckView from './components/DeckView';
import DebugView from './components/DebugView';
import MainMenu from './components/MainMenu'; // Import the new MainMenu component
import type { View, Character, CharacterStats, Item, EquipmentSlot, Archetype, GameEvent, EventCard, Outcome, PlayerAbility, ItemStats, Element } from './types';
import { INITIAL_CHARACTER_BASE, SKILL_TREE_DATA, Icons, PLAYER_ABILITIES, ItemVisuals, ELEMENTAL_AFFINITY_BONUSES, PASSIVE_TALENTS, ULTIMATE_ABILITIES } from './constants';
import { generateRandomCard, generateBossCard, generateRandomItem } from './utils/cardGenerator'; // Corrected import for generateRandomItem

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
  const [elementalPoints, setElementalPoints] = useState(0);
  const [unlockedSkills, setUnlockedSkills] = useState<Map<string, number>>(new Map()); // Corrected useState initialization
  const [equipment, setEquipment] = useState<Record<EquipmentSlot, Item | null>>(initialEquipment);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [activeView, setActiveView] = useState<View>('skillTree');
  const [gold, setGold] = useState(100); // New: Player's gold
  const [gameStarted, setGameStarted] = useState(false); // New state for main menu
  
  // New Deck State
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [discardPile, setDiscardPile] = useState<EventCard[]>([]);
  const [drawnCard, setDrawnCard] = useState<EventCard | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [roundLevel, setRoundLevel] = useState(1);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
  }, []);

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
      },
      elementalAffinities: {},
      unlockedPassiveTalents: [],
      unlockedUltimateAbilities: [],
    };
    
    setCharacter(newCharacter);
    setSkillPoints(1);
    setAttributePoints(0);
    setElementalPoints(0);
    setGold(100); // Reset gold
    
    const initialSkills = new Map([['start', 1]]);
    if (archetype.startingSkill) {
      initialSkills.set(archetype.startingSkill, 1);
    }
    setUnlockedSkills(initialSkills); // Corrected usage
    
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
    setGameStarted(false); // Go back to main menu on reset
  }, []);

  const unlockSkill = useCallback((skillId: string) => {
    const skillData = SKILL_TREE_DATA.find(s => s.id === skillId);
    if (!skillData) return;

    const currentRank = unlockedSkills.get(skillId) || 0;
    if (skillPoints > 0 && currentRank < skillData.maxRank) {
        setSkillPoints(sp => sp - 1);
        setUnlockedSkills(prevSkills => { // Corrected usage
            const newSkills = new Map(prevSkills);
            newSkills.set(skillId, currentRank + 1);
            return newSkills;
        });
    }
  }, [skillPoints, unlockedSkills, setSkillPoints, setUnlockedSkills]);
  
  const gainExperience = useCallback((amount: number) => {
    if (!character) return;
    setCharacter(prevChar => {
        if (!prevChar) return null;
        let newExp = Math.max(0, prevChar.experience.current + amount);
        let newLevel = prevChar.level;
        let newMaxExp = prevChar.experience.max;
        let spGained = 0;
        let apGained = 0;
        let epGained = 0;

        while (newExp >= newMaxExp) {
            newLevel++;
            spGained++;
            apGained += 3;
            epGained++;
            newExp -= newMaxExp;
            newMaxExp = Math.floor(newMaxExp * 1.5);
        }
        
        if (newLevel > prevChar.level) {
            setSkillPoints(sp => sp + spGained);
            setAttributePoints(ap => ap + apGained);
            setElementalPoints(ep => ep + epGained);
        }
        
        return {
            ...prevChar,
            level: newLevel,
            experience: { current: newExp, max: newMaxExp },
        };
    });
  }, [character, setCharacter, setSkillPoints, setAttributePoints, setElementalPoints]);

  const applyOutcome = useCallback((outcome: Outcome, purchasedItem?: Item) => {
    if (outcome.xp) gainExperience(outcome.xp);
    if (outcome.items) setInventory(prev => [...prev, ...outcome.items]);
    if (outcome.healthChange && character) {
        setCharacter(c => c ? { ...c, resources: { ...c.resources, health: { ...c.resources.health, current: Math.max(0, Math.min(c.resources.health.max, c.resources.health.current + outcome.healthChange)) }}} : null);
    }
    if (purchasedItem && purchasedItem.price) {
        setGold(prevGold => prevGold - purchasedItem.price);
    }
  }, [character, gainExperience, setInventory, setCharacter, setGold]);

  const handleDrawCard = useCallback(() => {
    if (drawnCard || deck.length === 0) return;
    const [nextCard, ...restOfDeck] = deck;
    setDeck(restOfDeck);
    setDrawnCard(nextCard);
  }, [deck, drawnCard, setDeck, setDrawnCard]);

  const handleResolveCard = useCallback((outcome?: Outcome, purchasedItem?: Item) => {
    if (!drawnCard) return;

    switch (drawnCard.type) {
        case 'COMBAT':
            setCurrentEvent(drawnCard.payload as GameEvent);
            setActiveView('event');
            break;
        case 'BOON':
        case 'CURSE':
        case 'CHOICE':
        case 'PUZZLE': // Handle puzzle outcome
        case 'MERCHANT': // Handle merchant outcome
            if (outcome) {
                applyOutcome(outcome, purchasedItem);
            }
            setDiscardPile(prev => [...prev, drawnCard]);
            setDrawnCard(null);
            break;
    }
  }, [drawnCard, applyOutcome, setCurrentEvent, setActiveView, setDiscardPile, setDrawnCard]);

  const handleStartNextRound = useCallback(() => {
    if (!character) return;
    const newRound = roundLevel + 1;
    setRoundLevel(newRound);
    setDeck(generateNewRoundDeck(character.level, newRound));
    setDiscardPile([]);
  }, [character, roundLevel, setRoundLevel, setDeck, setDiscardPile]);

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
  }, [attributePoints, character, setAttributePoints, setCharacter]);

  const increaseElementalAffinity = useCallback((element: Element) => {
    if (elementalPoints > 0 && character) {
        setElementalPoints(ep => ep - 1);
        setCharacter(prevChar => {
            if (!prevChar) return null;
            const currentAffinity = prevChar.elementalAffinities[element] || 0;
            const newAffinity = currentAffinity + 1;

            const newElementalAffinities = {
                ...prevChar.elementalAffinities,
                [element]: newAffinity,
            };

            let newUnlockedPassiveTalents = [...prevChar.unlockedPassiveTalents];
            let newUnlockedUltimateAbilities = [...prevChar.unlockedUltimateAbilities];

            const bonusesForElement = ELEMENTAL_AFFINITY_BONUSES[element] || [];
            for (const bonus of bonusesForElement) {
                if (newAffinity >= bonus.threshold) {
                    if (bonus.effect.type === 'PASSIVE_TALENT' && bonus.effect.talentId) {
                        if (!newUnlockedPassiveTalents.includes(bonus.effect.talentId)) {
                            newUnlockedPassiveTalents.push(bonus.effect.talentId);
                            console.log(`Unlocked passive talent: ${PASSIVE_TALENTS[bonus.effect.talentId].name}`);
                        }
                    } else if (bonus.effect.type === 'ULTIMATE_ABILITY' && bonus.effect.abilityId) {
                        if (!newUnlockedUltimateAbilities.includes(bonus.effect.abilityId)) {
                            newUnlockedUltimateAbilities.push(bonus.effect.abilityId);
                            console.log(`Unlocked ultimate ability: ${ULTIMATE_ABILITIES[bonus.effect.abilityId].name}`);
                        }
                    }
                }
            }

            return {
                ...prevChar,
                elementalAffinities: newElementalAffinities,
                unlockedPassiveTalents: newUnlockedPassiveTalents,
                unlockedUltimateAbilities: newUnlockedUltimateAbilities,
            };
        });
    }
  }, [elementalPoints, character, setElementalPoints, setCharacter]);

  const handleCombatCompletion = useCallback((rewards: GameEvent['rewards']) => {
    if (drawnCard) {
        setDiscardPile(prev => [...prev, drawnCard]);
    }

    gainExperience(rewards.xp);
    setInventory(prev => [...prev, ...rewards.items]);
    
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

    setCurrentEvent(null);
    setDrawnCard(null);
    setActiveView('deck');
  }, [gainExperience, drawnCard, character, setDiscardPile, setInventory, setCharacter, setCurrentEvent, setDrawnCard, setActiveView]);

  const equipItem = useCallback((itemToEquip: Item) => {
    if (itemToEquip.slot === 'Föremål') return;
    
    setInventory(prev => prev.filter(i => i.id !== itemToEquip.id));
    
    const currentlyEquipped = equipment[itemToEquip.slot as EquipmentSlot];
    if (currentlyEquipped) {
      setInventory(prev => [...prev, currentlyEquipped]);
    }
    
    setEquipment(prev => ({ ...prev, [itemToEquip.slot as EquipmentSlot]: itemToEquip }));
  }, [equipment, setInventory, setEquipment]);

  const unequipItem = useCallback((slot: EquipmentSlot) => {
    const itemToUnequip = equipment[slot];
    if (!itemToUnequip) return;

    setEquipment(prev => ({...prev, [slot]: null}));
    setInventory(prev => [...prev, itemToUnequip]);
  }, [equipment, setEquipment, setInventory]);
  
  const playerAbilities = useMemo(() => {
    const abilities: PlayerAbility[] = [];
    unlockedSkills.forEach((rank, skillId) => {
        if (rank > 0 && PLAYER_ABILITIES[skillId]) { // 'rank' is now correctly typed as number
            abilities.push(PLAYER_ABILITIES[skillId]);
        }
    });
    return abilities;
  }, [unlockedSkills]);

  const playerCombatStats = useMemo(() => {
      if (!character) return null;

      const initialEquipmentStats: Required<ItemStats> = {
          strength: 0, 
          dexterity: 0, 
          intelligence: 0, 
          constitution: 0, 
          skada: 0, 
          rustning: 0, 
          undvikandechans: 0, 
          kritiskTräff: 0 
      };

      const equipmentStats = Object.values(equipment).reduce<Required<ItemStats>>((acc, item) => {
          if (item) {
              const typedItem = item as Item;
              for (const key of Object.keys(initialEquipmentStats) as Array<keyof ItemStats>) {
                  const statValue = typedItem.stats[key];
                  if (statValue !== undefined) {
                      acc[key] += statValue; 
                  }
              }
          }
          return acc;
      }, initialEquipmentStats);

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
        totalStats: totalStats, // Added for puzzle checks
      };
  }, [character, equipment, playerAbilities]);

  // --- DEBUG FUNCTIONS ---
  const debugAddXP = useCallback(() => gainExperience(100), [gainExperience]);
  const debugAddSkillPoint = useCallback(() => setSkillPoints(p => p + 1), [setSkillPoints]);
  const debugAddAttrPoint = useCallback(() => setAttributePoints(p => p + 1), [setAttributePoints]);
  const debugAddElementalPoint = useCallback(() => setElementalPoints(p => p + 1), [setElementalPoints]);
  const debugAddItem = useCallback(() => {
      if (character) {
          setInventory(inv => [...inv, generateRandomItem(character.level)]);
      }
  }, [character, setInventory]);
  const debugHealPlayer = useCallback(() => {
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
  }, [character, setCharacter]);
  const debugAddGold = useCallback(() => setGold(g => g + 100), [setGold]); // New debug function

  if (!gameStarted) {
    return (
      <main className="text-gray-100 h-screen w-screen flex flex-col font-['Press_Start_2P'] overflow-hidden">
        <MainMenu onStartGame={handleStartGame} />
      </main>
    );
  }

  if (!character) {
      return (
        <main className="text-gray-100 h-screen w-screen flex flex-col font-['Press_Start_2P'] overflow-hidden">
            <CharacterSelection onSelectArchetype={handleSelectArchetype} />
        </main>
      );
  }

  const renderActiveView = () => {
    if (currentEvent && playerCombatStats) {
      return <EventView 
                event={currentEvent} 
                character={character} 
                playerStats={playerCombatStats} 
                onComplete={handleCombatCompletion} 
                equipment={equipment} 
                unlockedSkills={unlockedSkills} 
            />
    }

    switch (activeView) {
      case 'skillTree':
        return <SkillTree unlockedSkills={unlockedSkills} skillPoints={skillPoints} unlockSkill={unlockSkill} />;
      case 'characterSheet':
        return <CharacterSheet 
            character={character} 
            equipment={equipment as Record<EquipmentSlot, Item | null>} 
            attributePoints={attributePoints} 
            increaseStat={increaseStat} 
            onUnequipItem={unequipItem}
            elementalPoints={elementalPoints}
            elementalAffinities={character.elementalAffinities}
            unlockedPassiveTalents={character.unlockedPassiveTalents}
            unlockedUltimateAbilities={character.unlockedUltimateAbilities}
            increaseElementalAffinity={increaseElementalAffinity}
        />;
      case 'inventory':
        return <Inventory items={inventory} onEquipItem={equipItem} />;
      case 'deck':
        return <DeckView 
            roundLevel={roundLevel} 
            deck={deck} 
            discardPile={discardPile} 
            drawnCard={drawnCard} 
            onDraw={handleDrawCard} 
            onStartNextRound={handleStartNextRound} 
            onResolve={handleResolveCard} 
            playerCurrency={gold} // Pass gold to DeckView
            playerStats={playerCombatStats} // Pass player stats for puzzle checks
            elementalAffinities={character.elementalAffinities} // Pass elemental affinities for puzzle checks
        />;
      case 'debug':
        return <DebugView 
          addDebugXP={debugAddXP}
          addDebugSkillPoint={debugAddSkillPoint}
          addDebugAttrPoint={debugAddAttrPoint}
          addDebugItem={debugAddItem}
          debugHealPlayer={debugHealPlayer}
          resetCharacter={handleResetCharacter}
          addDebugElementalPoint={debugAddElementalPoint}
          addDebugGold={debugAddGold} // New debug button
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
            elementalPoints={elementalPoints}
            character={character}
            activeView={activeView} 
            setView={setActiveView}
            onResetCharacter={handleResetCharacter}
        />
    </main>
  );
}

export default App;