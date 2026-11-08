import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import SkillTree from './components/SkillTree';
import CharacterSheet from './components/CharacterSheet';
import Inventory from './components/Inventory';
import Footer from './components/Footer';
import CharacterSelection from './components/CharacterSelection';
import EventView from './components/EventView';
import DeckView from './components/DeckView';
import DebugView from './components/DebugView';
import GameOverScreen from './components/GameOverScreen';
import VictoryOverlay from './components/VictoryOverlay';
import MainMenu from './components/MainMenu';
import BackgroundMusic from './components/BackgroundMusic';
import { configureAI } from './src/services/aiService';
import type { View, Character, CharacterStats, Item, EquipmentSlot, Archetype, ArchetypeName, Skill, GameEvent, EventCard, Outcome, PlayerAbility, Element } from './types';
import { INITIAL_CHARACTER_BASE, SKILL_TREE_DATA, LIGHT_SKILL_TREE_DATA, DARK_SKILL_TREE_DATA, ARCHETYPES, Icons, PLAYER_ABILITIES, ItemVisuals, ELEMENTAL_AFFINITY_BONUSES, PASSIVE_TALENTS, ULTIMATE_ABILITIES, MAX_ROUNDS } from './constants';
import { generateRandomCard, generateBossCard, generateRandomItem } from './utils/cardGenerator';
import { calculatePlayerCombatStats } from './utils/playerCombatStats';
import { saveGame, loadGame, hasSaveData, restoreItem } from './save';
import musicConfig from './src/music-config.json';

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
if (typeof window !== 'undefined') {
  (window as any).generateRandomCard = generateRandomCard;
  (window as any).generateRandomItem = generateRandomItem;
}


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
  const [gameResult, setGameResult] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [discardPile, setDiscardPile] = useState<EventCard[]>([]);
  const [drawnCard, setDrawnCard] = useState<EventCard | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [roundLevel, setRoundLevel] = useState(1);
  const [isFooterMinimized, setIsFooterMinimized] = useState(false);
  const [activeSkillTreeId, setActiveSkillTreeId] = useState<'universal' | 'light' | 'dark'>('universal');
  const [showVictory, setShowVictory] = useState(false);
  const [victoryRewards, setVictoryRewards] = useState<GameEvent['rewards'] | null>(null);

  const handleSaveGame = useCallback(() => {
    if (!character) return;
    saveGame(
      character, skillPoints, attributePoints, elementalPoints,
      unlockedSkills, equipment, inventory, gold, roundLevel,
      true, activeView,
    );
  }, [character, skillPoints, attributePoints, elementalPoints, unlockedSkills, equipment, inventory, gold, roundLevel, activeView]);

  const handleLoadGame = useCallback(() => {
    const data = loadGame();
    if (!data) return;

    setCharacter(data.character);
    setSkillPoints(data.skillPoints);
    setAttributePoints(data.attributePoints);
    setElementalPoints(data.elementalPoints);
    setUnlockedSkills(new Map(data.unlockedSkillEntries));

    const restoredEquipment: Record<string, Item | null> = {};
    for (const [slot, item] of Object.entries(data.equipment)) {
      restoredEquipment[slot] = item ? restoreItem(item) : null;
    }
    setEquipment(restoredEquipment as Record<EquipmentSlot, Item | null>);
    setInventory(data.inventory.map(restoreItem));
    setGold(data.gold);
    setRoundLevel(data.roundLevel);
    setGameStarted(true);
    setActiveView(data.activeView);

    setDeck(generateNewRoundDeck(data.character.level, data.roundLevel));
    setDiscardPile([]);
    setDrawnCard(null);
    setCurrentEvent(null);
  }, []);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
  }, []);

  const handleSelectCharacter = useCallback((primary: Archetype, secondary?: Archetype) => {
    const baseStats = INITIAL_CHARACTER_BASE.stats;
    const newStats = {
        strength: baseStats.strength + (primary.statBonuses.strength || 0),
        dexterity: baseStats.dexterity + (primary.statBonuses.dexterity || 0),
        intelligence: baseStats.intelligence + (primary.statBonuses.intelligence || 0),
        constitution: baseStats.constitution + (primary.statBonuses.constitution || 0),
    };

    if (secondary) {
        newStats.strength += Math.floor((secondary.statBonuses.strength || 0) / 2);
        newStats.dexterity += Math.floor((secondary.statBonuses.dexterity || 0) / 2);
        newStats.intelligence += Math.floor((secondary.statBonuses.intelligence || 0) / 2);
        newStats.constitution += Math.floor((secondary.statBonuses.constitution || 0) / 2);
    }

    const isEnergyArchetype = primary.name === 'Stormdansaren';
    const maxAether = 50 + (newStats.intelligence - 5) * 10;
    const aetherBonus = secondary ? 20 : 0;

    const resourceName = secondary
        ? `${primary.resourceName} & ${secondary.resourceName}`
        : primary.resourceName;

    const newCharacter: Character = {
      ...INITIAL_CHARACTER_BASE,
      name: primary.name + (secondary ? ` + ${secondary.name}` : ''),
      archetype: primary.name,
      secondaryArchetype: secondary?.name,
      stats: newStats,
      resources: {
        health: {
          max: 100 + (newStats.constitution - 5) * 10,
          current: 100 + (newStats.constitution - 5) * 10,
        },
        aether: {
          name: resourceName,
          max: maxAether + aetherBonus,
          current: isEnergyArchetype ? maxAether + aetherBonus : 0,
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
    setGold(100);
    setGameResult('playing');
    
    const initialSkills = new Map([['start', 1]]);
    if (primary.startingSkill) {
      initialSkills.set(primary.startingSkill, 1);
    }
    if (secondary?.startingSkill) {
      initialSkills.set(secondary.startingSkill, 1);
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
    setActiveSkillTreeId('universal');
  }, []);

  const handleResetCharacter = useCallback(() => {
    setCharacter(null);
    setGameResult('playing');
    setGameStarted(false);
  }, []);

  const handleRestartGame = useCallback(() => {
    setCharacter(null);
    setGameResult('playing');
    setGameStarted(true);
  }, []);

  const allSkillData = useMemo(() => {
    const characterArchetypes: ArchetypeName[] = character ? [character.archetype] : [];
    if (character?.secondaryArchetype) {
      characterArchetypes.push(character.secondaryArchetype);
    }
    const trees: Skill[] = [...SKILL_TREE_DATA];
    const isLight = characterArchetypes.some(a => a === 'Ljusbringaren');
    const isDark = characterArchetypes.some(a => a === 'Skuggvävaren');
    if (isLight) trees.push(...LIGHT_SKILL_TREE_DATA);
    if (isDark) trees.push(...DARK_SKILL_TREE_DATA);
    return trees;
  }, [character]);

  const unlockSkill = useCallback((skillId: string) => {
    const skillData = allSkillData.find(s => s.id === skillId);
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
  }, [skillPoints, unlockedSkills, setSkillPoints, setUnlockedSkills, allSkillData]);
  
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
    if (newRound > MAX_ROUNDS) {
      setGameResult('victory');
      return;
    }
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

  const handleCombatCompletion = useCallback((rewards: GameEvent['rewards'], isDefeat?: boolean) => {
    if (isDefeat) {
      setGameResult('defeat');
      setCurrentEvent(null);
      setDrawnCard(null);
      return;
    }

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
    setVictoryRewards(rewards);
    setShowVictory(true);
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
      return calculatePlayerCombatStats(character, equipment, inventory, unlockedSkills, playerAbilities);
  }, [character, equipment, playerAbilities, inventory, unlockedSkills]);

  // --- DEBUG FUNCTIONS ---
  const handleConsumePotion = useCallback((itemId: string) => {
      setInventory(prev => prev.filter(i => i.id !== itemId));
  }, [setInventory]);

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

  // --- AI STATE ---
  const [aiApiKey, setAiApiKey] = useState<string>('');
  const [aiModel, setAiModel] = useState<string>('openai');
  const [npcDialogueEnabled, setNpcDialogueEnabled] = useState(false);
  const [aiEventGenEnabled, setAiEventGenEnabled] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const _aiApiKey = aiApiKey;

  const handleAIConfig = useCallback((key: string) => {
    configureAI(key);
  }, []);

  useEffect(() => {
    if (!character || !gameStarted) return;
    const timer = setTimeout(() => handleSaveGame(), 1000);
    return () => clearTimeout(timer);
  }, [character, equipment, inventory, skillPoints, gold, roundLevel, gameStarted, handleSaveGame]);

  useEffect(() => {
    if (currentEvent || drawnCard) {
      setIsFooterMinimized(true);
    } else {
      setIsFooterMinimized(false);
    }
  }, [currentEvent, drawnCard]);

  const renderActiveView = () => {
    if (currentEvent && playerCombatStats) {
      return <EventView 
                event={currentEvent} 
                character={character} 
                playerStats={playerCombatStats} 
                onComplete={handleCombatCompletion} 
                equipment={equipment} 
                unlockedSkills={unlockedSkills}
                inventory={inventory}
                onConsumePotion={handleConsumePotion}
            />;
    }

    switch (activeView) {
      case 'skillTree':
        return <SkillTree
          unlockedSkills={unlockedSkills}
          skillPoints={skillPoints}
          unlockSkill={unlockSkill}
          character={character}
          activeTreeId={activeSkillTreeId}
          onTreeChange={setActiveSkillTreeId}
        />;
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
        return <Inventory items={inventory} equipment={equipment} onEquipItem={equipItem} />;
      case 'deck':
        return <DeckView 
            roundLevel={roundLevel} 
            deck={deck} 
            discardPile={discardPile} 
            drawnCard={drawnCard} 
            onDraw={handleDrawCard} 
            onStartNextRound={handleStartNextRound} 
            onResolve={handleResolveCard} 
            playerCurrency={gold}
            playerStats={playerCombatStats}
            elementalAffinities={character.elementalAffinities}
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
          addDebugGold={debugAddGold}
          aiApiKey={aiApiKey}
          aiModel={aiModel}
          npcDialogueEnabled={npcDialogueEnabled}
          aiEventGenEnabled={aiEventGenEnabled}
          onAIConfig={handleAIConfig}
          onAIModelChange={setAiModel}
          onNPCToggle={setNpcDialogueEnabled}
          onEventGenToggle={setAiEventGenEnabled}
        />;
      default:
        return <SkillTree
          unlockedSkills={unlockedSkills}
          skillPoints={skillPoints}
          unlockSkill={unlockSkill}
          character={character}
          activeTreeId={activeSkillTreeId}
          onTreeChange={setActiveSkillTreeId}
        />;
    }
  }

  const getViewKey = () => {
    if (!gameStarted) return 'mainMenu';
    if (!character) return 'characterSelection';
    if (gameResult !== 'playing') return 'gameOver';
    if (currentEvent) return 'event';
    return activeView;
  };

  const getViewConfig = (viewKey: string) => {
    const entry = (musicConfig as any)[viewKey];
    if (!entry) return null;
    if (typeof entry === 'string') {
      return { files: entry ? [entry] : [], shuffle: false, continuePlaying: false, continueOnTabs: [], resumePosition: false };
    }
    return {
      files: Array.isArray(entry.files) ? entry.files : [],
      shuffle: entry.shuffle === true,
      continuePlaying: entry.continuePlaying === true,
      continueOnTabs: Array.isArray(entry.continueOnTabs) ? entry.continueOnTabs : [],
      resumePosition: entry.resumePosition === true,
    };
  };

  const musicStateRef = useRef({ src: '', viewKey: '' });
  const [currentMusicSrc, setCurrentMusicSrc] = useState('');
  const savedPositionsRef = useRef<Record<string, { src: string; position: number }>>({});
  const [initialPosition, setInitialPosition] = useState(0);
  const currentViewKeyRef = useRef('');

  useEffect(() => {
    const viewKey = getViewKey();
    const config = getViewConfig(viewKey);
    if (!config) {
      musicStateRef.current = { src: '', viewKey };
      setCurrentMusicSrc('');
      setInitialPosition(0);
      currentViewKeyRef.current = '';
      return;
    }

    const prevState = musicStateRef.current;

    if (config.continuePlaying && prevState.viewKey && config.continueOnTabs.includes(prevState.viewKey)) {
      currentViewKeyRef.current = viewKey;
      return;
    }

    let newSrc = '';
    if (config.files.length > 0) {
      if (config.shuffle) {
        newSrc = config.files[Math.floor(Math.random() * config.files.length)];
      } else {
        newSrc = config.files[0];
      }
    }

    let pos = 0;
    if (config.resumePosition && newSrc) {
      const saved = savedPositionsRef.current[viewKey];
      if (saved && saved.src === newSrc) {
        pos = saved.position;
      }
    }

    musicStateRef.current = { src: newSrc, viewKey };
    currentViewKeyRef.current = viewKey;
    setInitialPosition(pos);
    setCurrentMusicSrc(newSrc);
  }, [gameStarted, character, gameResult, currentEvent, activeView]);

  const handleMusicPositionChange = useCallback((position: number) => {
    const viewKey = currentViewKeyRef.current;
    if (viewKey) {
      savedPositionsRef.current[viewKey] = { src: currentMusicSrc, position };
    }
  }, [currentMusicSrc]);

  return (
    <main className="text-gray-100 h-screen w-screen flex flex-col font-['Press_Start_2P'] overflow-hidden">
      <BackgroundMusic src={currentMusicSrc} volume={0.25} loop={true} startPlaying={true} initialPosition={initialPosition} onPositionChange={handleMusicPositionChange} />
      {showVictory && victoryRewards && character && (
        <VictoryOverlay
          rewards={victoryRewards}
          character={character}
          onDismiss={() => setShowVictory(false)}
        />
      )}
      {!gameStarted ? (
        <div className="relative flex-grow w-full overflow-hidden">
          <MainMenu onStartGame={handleStartGame} onContinueGame={handleLoadGame} hasSave={hasSaveData()} />
        </div>
      ) : !character ? (
        <CharacterSelection onSelectCharacter={handleSelectCharacter} />
      ) : gameResult !== 'playing' ? (
        <GameOverScreen
          result={gameResult}
          character={character}
          roundLevel={roundLevel}
          onNewGame={handleRestartGame}
          onMainMenu={handleResetCharacter}
        />
      ) : (
        <div className={`relative flex-grow flex flex-col min-h-0 w-full overflow-hidden ${isFooterMinimized ? 'footer-minimized' : ''}`}>
          <div className="flex-grow flex flex-col min-h-0 overflow-hidden relative">
            {renderActiveView()}
          </div>
          <div className={`transition-all duration-300 ${isFooterMinimized ? 'h-0 overflow-hidden opacity-0 pointer-events-none' : 'h-auto opacity-100'}`}>
            <Footer 
                skillPoints={skillPoints} 
                attributePoints={attributePoints}
                elementalPoints={elementalPoints}
                character={character}
                activeView={activeView} 
                setView={setActiveView}
                onResetCharacter={handleResetCharacter}
                onSaveGame={handleSaveGame}
                onMinimize={() => setIsFooterMinimized(true)}
            />
          </div>
          {isFooterMinimized && (
            <button
              onClick={() => setIsFooterMinimized(false)}
              className="absolute bottom-2 right-2 z-50 px-2 py-1 bg-black/80 hover:bg-yellow-600/80 border-2 border-yellow-500 text-yellow-400 hover:text-white text-[8px] font-bold font-['Press_Start_2P'] transition-all pixelated-border-gold shadow-lg cursor-pointer"
              title="Visa meny"
            >
              ▲ VISA MENY
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default App;