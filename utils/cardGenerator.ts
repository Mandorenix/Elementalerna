import React from 'react';
import { Element, type EventCard, type GameEvent, type Outcome, type Item, type ItemStats, type ItemAffix, type EquipmentSlot, type Rarity, type Enemy, type PuzzleChallenge, type MerchantOffer, type CharacterStats, type ChoiceOption, type EnvironmentEffect, type Environment, type StatusEffect, type EnemyApplyStatusEffect } from '../types';
import { ELEMENT_ICONS, Icons, ItemVisuals } from '../constants';

// Re-map the enum to a plain object for easier iteration if needed, and to avoid circular dependencies
const ElementMap = {
    NEUTRAL: 0, FIRE: 1, EARTH: 2, WIND: 3, WATER: 4, MAGMA: 5, OBSIDIAN: 6,
    FIRESTORM: 7, HOT_AIR: 8, STEAM: 9, HOT_SPRINGS: 10, SAND: 11, EROSION: 12,
    MUD: 13, GROWTH: 14, ICE: 15, STORM: 16, VOLCANIC_STORM: 17,
    ELECTRIFIED_MUD: 18, VITRIFIED_STORM: 19,
};

// --- Core Data for Generation ---
const HYBRID_ELEMENT_MAP: Partial<Record<Element, Partial<Record<Element, Element>>>> = {
    [Element.FIRE]: { [Element.EARTH]: Element.MAGMA, [Element.WIND]: Element.FIRESTORM, [Element.WATER]: Element.STEAM, },
    [Element.EARTH]: { [Element.FIRE]: Element.MAGMA, [Element.WIND]: Element.SAND, [Element.WATER]: Element.MUD, },
    [Element.WIND]: { [Element.FIRE]: Element.FIRESTORM, [Element.EARTH]: Element.SAND, [Element.WATER]: Element.STORM, },
    [Element.WATER]: { [Element.FIRE]: Element.STEAM, [Element.EARTH]: Element.MUD, [Element.WIND]: Element.STORM, }
};

const ELEMENT_FLAVOR_TEXT: Record<number, { nouns: string[], adjs: string[] }> = {
    [Element.FIRE]: { nouns: ["Inferno", "Låga", "Aska", "Glöd"], adjs: ["Brinnande", "Svedd", "Pyroklastisk"] },
    [Element.EARTH]: { nouns: ["Skälvning", "Klippa", "Rot", "Grotta"], adjs: ["Stenig", "Jordbunden", "Orubblig"] },
    [Element.WIND]: { nouns: ["Orkan", "Vindpust", "Virvel", "Tornado"], adjs: ["Piskande", "Svepande", "Luftig"] },
    [Element.WATER]: { nouns: ["Tsunami", "Ström", "Källa", "Gejser"], adjs: ["Översvämmad", "Våt", "Flytande"] },
    [Element.MAGMA]: { nouns: ["Vulkan", "Magmaflod", "Utbrott"], adjs: ["Smältande", "Vulkanisk", "Flytande sten"] },
    [Element.FIRESTORM]: { nouns: ["Eldstorm", "Hett oväder", "Glödande vind"], adjs: ["Brännhet", "Rasande", "Cyklonisk"] },
    [Element.STEAM]: { nouns: ["Ångexplosion", "Tryckvåg", "Skållhet dimma"], adjs: ["Skållande", "Trycksatt", "Gaser"] },
    [Element.SAND]: { nouns: ["Sandstorm", "Ökenvåg", "Kvicksand"], adjs: ["Begravande", "Slipande", "Torr"] },
    [Element.MUD]: { nouns: ["Lerskred", "Träsk", "Gyttja"], adjs: ["Sugande", "Geggig", "Trög"] },
    [Element.STORM]: { nouns: ["Monsun", "Åskväder", "Orkan"], adjs: ["Elektrisk", "Regnig", "Stormig"] },
    [Element.NEUTRAL]: { nouns: ["Prövning", "Möte", "Öde"], adjs: ["Bortglömd", "Uråldrig", "Mystisk"] },
};
// Add fallbacks for complex elements to ensure flavor text always exists.
const allElements = Object.values(ElementMap).filter(v => typeof v === 'number') as Element[];
allElements.forEach(el => {
    if (!ELEMENT_FLAVOR_TEXT[el]) {
        ELEMENT_FLAVOR_TEXT[el] = ELEMENT_FLAVOR_TEXT[Element.NEUTRAL];
    }
});


const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- New Choice Card Scenarios ---
const CHOICE_SCENARIOS = [
    // Scenario 1: The Whispering Chest
    (playerLevel: number, round: number) => ({
        title: "En viskande kista",
        description: "Du hittar en mystisk, låst kista. Den surrar med en svag, magisk aura och det låter som om den viskar ditt namn.",
        payload: {
            options: [
                {
                    buttonText: "Dyrka upp låset",
                    description: "Riskera en fälla för chansen till en skatt.",
                    outcome: Math.random() > 0.35
                        ? { log: "Du lyckades! Inuti hittar du en skatt.", items: [generateRandomItem(playerLevel)] }
                        : { log: "FÄLLA! En giftig nål sticker dig.", healthChange: -15 - (round * 5) }
                },
                {
                    buttonText: "Lämna kistan",
                    description: "Det är inte värt risken.",
                    outcome: { log: "Du lämnar den mystiska kistan orörd." }
                }
            ]
        }
    }),
    // Scenario 2: The Ancient Altar
    (playerLevel: number, round: number) => ({
        title: "Ett uråldrigt altare",
        description: "Framför dig står ett uråldrigt, knakande altare täckt av mossa. En svag energi pulserar från det.",
        payload: {
            options: [
                {
                    buttonText: "Be vid altaret",
                    description: "Visa din vördnad och se vad som händer.",
                    outcome: Math.random() > 0.4
                        ? { log: "Gudarna hör din bön. Du känner dig stärkt och visare!", healthChange: 20, xp: 30 * round }
                        : { log: "Altaret var en fälla! Du känner dig försvagad.", healthChange: -20 }
                },
                {
                    buttonText: "Undersök runorna",
                    description: "Försök att tyda de gamla inskripterna.",
                    outcome: { log: "Du lär dig en glömd hemlighet från runorna.", xp: 50 * round }
                },
                {
                    buttonText: "Lämna det ifred",
                    description: "Vissa saker är bäst att inte störa.",
                    outcome: { log: "Du går försiktigt förbi altaret." }
                }
            ]
        }
    }),
    // Scenario 3: The Fountain of Elements
    (playerLevel: number, round: number, element: Element) => ({
        title: `Elementär källa`,
        description: `Du hittar en liten fontän som bubblar med ren ${Element[element]}-energi. Vattnet skimrar inbjudande.`,
        payload: {
            options: [
                 {
                    buttonText: "Drick från källan",
                    description: "Absorbera energin direkt.",
                    outcome: Math.random() > 0.25
                        ? { log: `Energin fyller dig! Du känner dig helt återställd.`, healthChange: 9999, xp: 25 * round }
                        : { log: "Energin var för instabil! Du tar skada.", healthChange: -25 }
                },
                {
                    buttonText: "Fyll din flaska",
                    description: "Spara energin för senare. (Få ett föremål)",
                    outcome: { log: `Du tappar upp den elementära essensen.`, items: [generateRandomItem(playerLevel)] }
                }
            ]
        }
    }),
];

// --- New Puzzle Card Scenarios ---
const PUZZLE_SCENARIOS = [
    (playerLevel: number, round: number, element: Element): PuzzleChallenge => ({
        challengeText: `En uråldrig runa blockerar din väg. Du måste lösa dess gåta för att passera.`,
        statCheck: 'intelligence',
        threshold: 5 + playerLevel + round,
        successOutcome: { log: "Du löste gåtan! Vägen öppnas och du känner dig stärkt.", xp: 50 * round, healthChange: 10 },
        failureOutcome: { log: "Gåtan var för svår. Du tar skada när du försöker tvinga dig förbi.", healthChange: -20 - (round * 5) },
        options: [
            { buttonText: "Försök lösa gåtan (Intelligens)", description: "Använd din visdom för att tyda runan.", outcome: { log: "Du försöker lösa gåtan." } },
            { buttonText: "Försök tvinga dig förbi (Styrka)", description: "Använd råstyrka för att bryta igenom.", outcome: { log: "Du försöker tvinga dig förbi." } },
        ]
    }),
    (playerLevel: number, round: number, element: Element): PuzzleChallenge => ({
        challengeText: `En magisk barriär av ${Element[element]}-energi spärrar vägen. Du måste hitta ett sätt att neutralisera den.`,
        elementalCheck: element,
        threshold: 3 + Math.floor(playerLevel / 2) + round, // Elemental affinity check
        successOutcome: { log: `Du kanaliserar din ${Element[element]}-affinitet och barriären upplöses!`, xp: 75 * round, items: [generateRandomItem(playerLevel)] },
        failureOutcome: { log: `Barriären slår tillbaka! Du tar skada och måste hitta en annan väg.`, healthChange: -30 - (round * 10) },
        options: [
            { buttonText: `Använd ${Element[element]}-affinitet`, description: `Försök att matcha barriärens energi.`, outcome: { log: `Du försöker använda din ${Element[element]}-affinitet.` } },
            { buttonText: "Sök efter en omväg", description: "Undvik konfrontation med barriären.", outcome: { log: "Du söker efter en omväg." } },
        ]
    }),
];

// --- New Merchant Card Scenarios ---
const MERCHANT_SCENARIOS = [
    (playerLevel: number, round: number): MerchantOffer => ({
        itemsForSale: [
            generateRandomItem(playerLevel, 'Magisk'),
            generateRandomItem(playerLevel, 'Vanlig'),
            generateRandomItem(playerLevel, 'Sällsynt'),
        ].map(item => ({ ...item, price: Math.floor(item.rarity === 'Vanlig' ? 20 : item.rarity === 'Magisk' ? 50 : 100 + (playerLevel * 10)) })),
        currencyName: "Guld",
        playerCurrency: 0, // This will be updated by App.tsx
        onPurchase: (item: Item) => ({ log: `Du köpte ${item.name} för ${item.price} Guld.`, items: [item] }),
        onLeave: { log: "Du lämnar handlaren." }
    })
];


// --- Card Generation Logic ---

export const generateRandomCard = (playerLevel: number, round: number = 1): EventCard => {
    // 1. Determine Element
    const baseElements = [Element.FIRE, Element.EARTH, Element.WIND, Element.WATER];
    const e1 = getRandom(baseElements);
    const e2 = getRandom(baseElements.filter(e => e !== e1)); // Ensure two different elements
    const primaryElement = HYBRID_ELEMENT_MAP[e1]?.[e2] || e1;
    
    // 2. Determine Card Type (weighted)
    const typeRoll = Math.random();
    let type: 'COMBAT' | 'BOON' | 'CURSE' | 'CHOICE' | 'PUZZLE' | 'MERCHANT' = 'COMBAT';
    if (typeRoll > 0.9) type = 'CURSE';
    else if (typeRoll > 0.75) type = 'BOON';
    else if (typeRoll > 0.55) type = 'CHOICE'; // Reduced chance for choice to make room for new types
    else if (typeRoll > 0.4) type = 'PUZZLE'; // New type
    else if (typeRoll > 0.3) type = 'MERCHANT'; // New type

    // 3. Generate Payload based on Type and Element
    let payload: EventCard['payload'];
    let title: string;
    let description: string;

    const flavor = ELEMENT_FLAVOR_TEXT[primaryElement] || ELEMENT_FLAVOR_TEXT[Element.NEUTRAL];

    switch (type) {
        case 'COMBAT':
            payload = createCombatPayload(playerLevel, primaryElement, 'medium', round);
            title = `${getRandom(flavor.adjs)} ${getRandom(flavor.nouns)}`;
            description = (payload as GameEvent).description;
            break;
        case 'BOON':
            const boonRoll = Math.random();
            if (boonRoll > 0.7) {
                payload = { log: `Du hittar en gömd skatt!`, items: [generateRandomItem(playerLevel)] };
                description = "En oväntad belöning.";
                title = "Gömda rikedomar";
            } else if (boonRoll > 0.3) {
                payload = { log: `Du hittar en källa av ren ${Element[primaryElement]}-energi. Full hälsa återställd!`, healthChange: 9999, xp: 20 * round };
                description = "En oväntad välsignelse."
                title = "Helande källa";
            } else {
                payload = { log: `En viskning från ${Element[primaryElement]}-planet ger dig insikt.`, xp: (50 + 10 * playerLevel) * round };
                description = "Du känner dig visare.";
                title = "Uråldrig insikt";
            }
            break;
        case 'CURSE':
             title = `${getRandom(flavor.adjs)} förbannelse`;
             payload = { log: `En fientlig ${Element[primaryElement]}-manifestation dränerar din energi.`, healthChange: -(15 + playerLevel * 2 + round * 5), xp: 0 };
             description = "En plötslig känsla av svaghet.";
            break;
        case 'CHOICE':
            const scenarioGenerator = getRandom(CHOICE_SCENARIOS);
            const scenario = scenarioGenerator(playerLevel, round, primaryElement);
            title = scenario.title;
            description = scenario.description;
            payload = scenario.payload;
            break;
        case 'PUZZLE': // New Puzzle Card
            const puzzleScenario = getRandom(PUZZLE_SCENARIOS)(playerLevel, round, primaryElement);
            title = `Gåtan av ${Element[primaryElement]}`;
            description = puzzleScenario.challengeText;
            payload = puzzleScenario;
            break;
        case 'MERCHANT': // New Merchant Card
            const merchantOffer = getRandom(MERCHANT_SCENARIOS)(playerLevel, round);
            title = `Vandrande Handlare`;
            description = "En mystisk handlare dyker upp med sällsynta varor.";
            payload = merchantOffer;
            break;
    }

    return {
        id: `gen-${Date.now()}-${Math.random()}`,
        title,
        description,
        icon: ELEMENT_ICONS[primaryElement] || Icons.Choice,
        element: primaryElement,
        type,
        payload
    };
};

export const generateBossCard = (playerLevel: number, round: number): EventCard => {
    const payload = createBossCombatPayload(playerLevel, round);
    return {
        id: `boss-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        icon: ELEMENT_ICONS[payload.element] || Icons.VolcanicStorm,
        element: payload.element,
        type: 'COMBAT',
        isBoss: true,
        payload
    };
};

export const createCombatPayload = (playerLevel: number, element: Element, difficulty: 'easy' | 'medium' | 'hard' | 'boss', round: number): GameEvent => {
    const baseHealth = 50 + (playerLevel * 10);
    const baseDamage = 5 + (playerLevel * 2);
    const baseArmor = 2 + Math.floor(playerLevel / 2);

    let healthMultiplier = 1;
    let damageMultiplier = 1;
    let armorMultiplier = 1;
    let enemyCount = 1;
    let description = "Du möter en fiende!";

    switch (difficulty) {
        case 'easy':
            healthMultiplier = 0.8;
            damageMultiplier = 0.8;
            armorMultiplier = 0.8;
            enemyCount = 1;
            break;
        case 'medium':
            healthMultiplier = 1.0;
            damageMultiplier = 1.0;
            armorMultiplier = 1.0;
            enemyCount = Math.random() > 0.7 ? 2 : 1;
            break;
        case 'hard':
            healthMultiplier = 1.2;
            damageMultiplier = 1.2;
            armorMultiplier = 1.2;
            enemyCount = Math.random() > 0.5 ? 2 : 1;
            description = "En farlig fiende står i din väg!";
            break;
        case 'boss':
            healthMultiplier = 2.5;
            damageMultiplier = 1.8;
            armorMultiplier = 1.5;
            enemyCount = 1;
            description = "En mäktig boss blockerar din väg!";
            break;
    }

    const enemies: Enemy[] = Array.from({ length: enemyCount }).map((_, i) => {
        const enemyElement = element; // For now, enemies match card element
        const enemyName = `${Element[enemyElement]} Fiende ${i + 1}`;
        const enemyIcon = ELEMENT_ICONS[enemyElement] || Icons.EnemyGoblin;

        // Define resistances and weaknesses based on the enemy's primary element
        const resistances: Partial<Record<Element, number>> = {
            [enemyElement]: 25, // 25% resistance to its own element
        };

        // Add weaknesses to opposing elements
        switch (enemyElement) {
            case Element.FIRE:
                resistances[Element.WATER] = -25; // Weak to Water
                resistances[Element.EARTH] = 10; // Slightly resists Earth
                break;
            case Element.EARTH:
                resistances[Element.WIND] = -25; // Weak to Wind
                resistances[Element.FIRE] = 10; // Slightly resists Fire
                break;
            case Element.WIND:
                resistances[Element.EARTH] = -25; // Weak to Earth
                resistances[Element.WATER] = 10; // Slightly resists Water
                break;
            case Element.WATER:
                resistances[Element.FIRE] = -25; // Weak to Fire
                resistances[Element.WIND] = 10; // Slightly resists Wind
                break;
        }

        let onHitEffect: Enemy['onHitEffect'] = undefined;
        const onHitRoll = Math.random();
        if (onHitRoll < 0.2) { // 20% chance for a basic on-hit effect
            const basicEffects: (
                | { type: 'burning'; duration: number; damage: number }
                | { type: 'poison'; duration: number; damage: number }
                | { type: 'slow'; duration: number }
            )[] = [
                { type: 'burning', duration: 2, damage: 3 + Math.floor(playerLevel / 5) },
                { type: 'poison', duration: 2, damage: 3 + Math.floor(playerLevel / 5) },
                { type: 'slow', duration: 2 },
            ];
            onHitEffect = getRandom(basicEffects);
        } else if (onHitRoll < 0.35) { // 15% chance for one of the new status effects
            const newStatusEffects: EnemyApplyStatusEffect[] = [
                { type: 'APPLY_STATUS', status: 'petrified', chance: 10 + (round * 2), duration: 1, value: 10 }, // 10% chance to petrify, increases damage taken by 10%
                { type: 'APPLY_STATUS', status: 'frail', chance: 15 + (round * 2), duration: 2, value: 15, isPercentage: true }, // 15% chance to apply Frail, increases damage taken by 15%
                { type: 'APPLY_STATUS', status: 'frightened', chance: 10 + (round * 2), duration: 2, value: 25 }, // 10% chance to frighten, 25% chance to miss turn
            ];
            onHitEffect = getRandom(newStatusEffects);
        }


        return {
            id: `enemy-${Date.now()}-${i}`,
            name: enemyName,
            level: playerLevel,
            element: enemyElement,
            stats: {
                health: Math.floor(baseHealth * healthMultiplier),
                maxHealth: Math.floor(baseHealth * healthMultiplier),
                damage: Math.floor(baseDamage * damageMultiplier),
                armor: Math.floor(baseArmor * armorMultiplier),
            },
            icon: enemyIcon,
            resistances: resistances,
            // More complex enemy behaviors
            behavior: Math.random() > 0.7 ? 'ATTACK_LOWEST_HP' : 'ATTACK_PLAYER',
            onHitEffect: onHitEffect,
        };
    });

    // Add dynamic environment effects based on element and round
    const environment: Environment | undefined = Math.random() > 0.6 ? (() => { // 40% chance for an environment effect
        const envEffects: EnvironmentEffect[] = [];
        const envName = `${Element[element]}s Aura`;
        const envDescription = `En aura av ${Element[element]}-energi genomsyrar striden.`;

        // Base DoT effect for all elements
        envEffects.push({
            description: `Alla tar ${2 + Math.floor(round / 2)} ${Element[element]}-skada varje runda.`,
            type: 'dot',
            element: element,
            value: 2 + Math.floor(round / 2),
            targetScope: 'all',
        });

        // Element-specific additional effects
        switch (element) {
            case Element.FIRE:
                envEffects.push({
                    description: `Spelaren får en chans att bli överhettad.`,
                    type: 'status_apply',
                    status: 'overheated',
                    statusDuration: 1,
                    statusChance: 15 + (round * 2),
                    targetScope: 'player',
                });
                break;
            case Element.EARTH:
                envEffects.push({
                    description: `Fiender har en chans att bli rotade.`,
                    type: 'status_apply',
                    status: 'rooted',
                    statusDuration: 1,
                    statusChance: 15 + (round * 2),
                    targetScope: 'enemies',
                });
                break;
            case Element.WIND:
                envEffects.push({
                    description: `Alla har en chans att få sin ATB sänkt.`,
                    type: 'atb_modifier',
                    value: -10 - (round * 2), // Reduce ATB by this amount
                    statusChance: 20 + (round * 2),
                    targetScope: 'all',
                });
                break;
            case Element.WATER:
                envEffects.push({
                    description: `Spelaren har en chans att regenerera hälsa.`,
                    type: 'status_apply',
                    status: 'regenerating',
                    statusDuration: 1,
                    value: 5 + (round * 2), // Heal amount
                    statusChance: 20 + (round * 2),
                    targetScope: 'player',
                });
                break;
            case Element.MAGMA:
                envEffects.push({
                    description: `Alla tar ökad eldskada.`,
                    type: 'stat_modifier',
                    stat: 'damage', // Represents damage taken increase
                    element: Element.FIRE,
                    value: 10 + (round * 2), // 10% increased fire damage taken
                    isPercentage: true,
                    targetScope: 'all',
                });
                break;
            case Element.STORM:
                envEffects.push({
                    description: `Alla har en chans att bli förlamade.`,
                    type: 'status_apply',
                    status: 'paralyzed',
                    statusDuration: 1,
                    value: 20 + (round * 2), // Chance to miss turn
                    statusChance: 20 + (round * 2),
                    targetScope: 'all',
                });
                break;
            // Add more hybrid element environments as needed
            default:
                // Fallback for other elements or no specific effect
                envEffects.push({
                    description: `En mystisk energi påverkar alla.`,
                    type: 'atb_modifier',
                    value: -5,
                    statusChance: 10,
                    targetScope: 'all',
                });
                break;
        }

        return {
            name: envName,
            description: envDescription,
            element: element,
            effects: envEffects,
        };
    })() : undefined;

    return {
        title: `${Element[element]} Konfrontation`,
        description: description,
        element: element,
        modifiers: [],
        environment: environment, // Add environment here
        enemies: enemies,
        rewards: {
            xp: (50 * round) * enemyCount * (difficulty === 'boss' ? 3 : 1),
            items: Array.from({ length: enemyCount }, () => generateRandomItem(playerLevel)),
        },
    };
};

export const createBossCombatPayload = (playerLevel: number, round: number): GameEvent => {
    const bossElement = [Element.FIRE, Element.EARTH, Element.WIND, Element.WATER][Math.floor(Math.random() * 4)];
    const bossName = `Den Uråldriga ${Element[bossElement]} Bossen`;
    const bossIcon = ELEMENT_ICONS[bossElement] || Icons.EnemyGolem;

    const baseHealth = 200 + (playerLevel * 50);
    const baseDamage = 15 + (playerLevel * 5);
    const baseArmor = 10 + (playerLevel * 2);

    // Define resistances and weaknesses for the boss
    const resistances: Partial<Record<Element, number>> = {
        [bossElement]: 50, // Bosses are highly resistant to their own element
        [Element.NEUTRAL]: -25, // But maybe weak to neutral attacks?
    };

    // Add weaknesses to opposing elements for the boss
    switch (bossElement) {
        case Element.FIRE:
            resistances[Element.WATER] = -50; // Boss is very weak to Water
            resistances[Element.EARTH] = 20; // Boss slightly resists Earth
            break;
        case Element.EARTH:
            resistances[Element.WIND] = -50; // Boss is very weak to Wind
            resistances[Element.FIRE] = 20; // Boss slightly resists Fire
            break;
        case Element.WIND:
            resistances[Element.EARTH] = -50; // Boss is very weak to Earth
            resistances[Element.WATER] = 20; // Boss slightly resists Water
            break;
        case Element.WATER:
            resistances[Element.FIRE] = -50; // Boss is very weak to Fire
            resistances[Element.WIND] = 20; // Boss slightly resists Wind
            break;
    }

    const boss: Enemy = {
        id: `boss-${Date.now()}`,
        name: bossName,
        level: playerLevel,
        element: bossElement,
        stats: {
            health: baseHealth,
            maxHealth: baseHealth,
            damage: baseDamage,
            armor: baseArmor,
        },
        icon: bossIcon,
        resistances: resistances,
        specialAbility: Math.random() > 0.5 ? 'HASTE_SELF' : undefined, // Boss might have a special ability
        onHitEffect: Math.random() > 0.5 ? { type: 'APPLY_STATUS', status: 'frail', chance: 30, duration: 3, value: 20, isPercentage: true } : undefined, // Example on-hit effect
        // Boss phases for more complex encounters
        phases: [
            {
                name: "Rasande",
                threshold: 0.5, // Below 50% HP
                newBehavior: 'ATTACK_HIGHEST_DAMAGE_PLAYER',
                statusEffectsToApplyToSelf: [{ type: 'hasted', duration: 99 } as StatusEffect],
                description: "Bossen blir rasande och attackerar den starkaste fienden!"
            },
            {
                name: "Försvar",
                threshold: 0.2, // Below 20% HP
                newBehavior: 'BUFF_SELF',
                statusEffectsToApplyToSelf: [{ type: 'defending', duration: 99, value: 50 } as StatusEffect],
                description: "Bossen drar sig tillbaka och förstärker sitt försvar!"
            }
        ]
    };

    return {
        title: `Bossstrid: ${bossName}`,
        description: `En uråldriga och mäktig ${Element[bossElement]} varelse blockerar din väg.`,
        element: bossElement,
        modifiers: [],
        enemies: [boss],
        rewards: {
            xp: (200 * round) + (playerLevel * 50),
            items: [generateRandomItem(playerLevel, 'Legendarisk')], // Bosses drop legendary items
        },
    };
};

export const generateRandomItem = (playerLevel: number, rarity: Rarity = 'Vanlig'): Item => {
    const itemTypes: { slot: EquipmentSlot | 'Föremål'; name: string[]; icon: React.FC; visual?: React.FC; }[] = [
        { slot: 'Hjälm', name: ['Läderhuva', 'Järnhjälm', 'Magisk Hatt'], icon: Icons.Shield, visual: ItemVisuals.LeatherHelm },
        { slot: 'Vapen 1', name: ['Rostigt Svärd', 'Stålsvärd', 'Magisk Stav'], icon: Icons.Fire, visual: ItemVisuals.RustySword },
        { slot: 'Bröst', name: ['Läderbrynja', 'Järnharnesk'], icon: Icons.Earth, visual: ItemVisuals.LeatherArmor },
        { slot: 'Stövlar', name: ['Läderstövlar', 'Järnstövlar'], icon: Icons.Wind, visual: ItemVisuals.LeatherHelm }, // Reusing helm visual for now
    ];

    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const randomName = randomType.name[Math.floor(Math.random() * randomType.name.length)];

    let stats: ItemStats = {};
    let affix: ItemAffix | undefined = undefined;

    const baseValue = Math.floor(playerLevel * 0.5) + 1;

    switch (randomType.slot) {
        case 'Hjälm':
            stats.rustning = baseValue + Math.floor(Math.random() * playerLevel);
            break;
        case 'Vapen 1':
            stats.skada = baseValue + Math.floor(Math.random() * playerLevel);
            if (Math.random() < 0.3) { // 30% chance for an affix
                affix = {
                    trigger: 'ON_HIT',
                    effect: { type: 'DEAL_ELEMENTAL_DAMAGE', element: Element.FIRE, damage: Math.floor(baseValue * 0.5), chance: 20 },
                    description: "Har en chans att bränna fienden vid träff."
                };
            }
            break;
        case 'Bröst':
            stats.rustning = baseValue * 2 + Math.floor(Math.random() * playerLevel);
            break;
        case 'Stövlar':
            stats.undvikandechans = Math.floor(baseValue * 0.2) + Math.floor(Math.random() * playerLevel * 0.1);
            break;
    }

    const rarities: Rarity[] = ['Vanlig', 'Magisk', 'Sällsynt', 'Legendarisk'];
    let finalRarity: Rarity = rarity;
    if (rarity === 'Vanlig') { // Only randomize if not specified as legendary (for bosses)
        const rarityRoll = Math.random();
        if (rarityRoll > 0.95) finalRarity = 'Legendarisk';
        else if (rarityRoll > 0.8) finalRarity = 'Sällsynt';
        else if (rarityRoll > 0.5) finalRarity = 'Magisk';
    }

    // Apply rarity bonuses
    if (finalRarity === 'Magisk') {
        Object.keys(stats).forEach(key => (stats as any)[key] = Math.floor(((stats as any)[key] || 0) * 1.2));
    } else if (finalRarity === 'Sällsynt') {
        Object.keys(stats).forEach(key => (stats as any)[key] = Math.floor(((stats as any)[key] || 0) * 1.5));
        if (!affix && Math.random() < 0.5) { // Higher chance for affix if rare and no affix yet
             affix = {
                trigger: 'ON_TAKE_DAMAGE',
                effect: { type: 'APPLY_STATUS', status: 'retaliating', duration: 2, damage: Math.floor(baseValue * 0.8), chance: 30 },
                description: "Har en chans att skada anfallare när du tar skada."
            };
        }
    } else if (finalRarity === 'Legendarisk') {
        Object.keys(stats).forEach(key => (stats as any)[key] = Math.floor(((stats as any)[key] || 0) * 2.0));
        // Ensure legendary items always have a powerful affix
        affix = {
            trigger: 'PASSIVE',
            effect: { type: 'APPLY_STATUS', status: 'hasted', duration: 99, chance: 100 }, // Permanent haste
            description: "Ger dig permanent Haste."
        };
    }

    return {
        id: `item-${Date.now()}-${Math.random()}`,
        name: randomName,
        rarity: finalRarity,
        slot: randomType.slot,
        stats: stats,
        icon: randomType.icon,
        visual: randomType.visual,
        affix: affix,
    };
};