import type { EventCard, GameEvent, Outcome, Element, Item, ItemStats, ItemAffix, EquipmentSlot, Rarity, Enemy } from '../types';
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
    [ElementMap.FIRE]: { [ElementMap.EARTH]: ElementMap.MAGMA, [ElementMap.WIND]: ElementMap.FIRESTORM, [ElementMap.WATER]: ElementMap.STEAM, },
    [ElementMap.EARTH]: { [ElementMap.FIRE]: ElementMap.MAGMA, [ElementMap.WIND]: ElementMap.SAND, [ElementMap.WATER]: ElementMap.MUD, },
    [ElementMap.WIND]: { [ElementMap.FIRE]: ElementMap.FIRESTORM, [ElementMap.EARTH]: ElementMap.SAND, [ElementMap.WATER]: ElementMap.STORM, },
    [ElementMap.WATER]: { [ElementMap.FIRE]: ElementMap.STEAM, [ElementMap.EARTH]: ElementMap.MUD, [ElementMap.WIND]: ElementMap.STORM, }
};

const ELEMENT_FLAVOR_TEXT: Record<number, { nouns: string[], adjs: string[] }> = {
    [ElementMap.FIRE]: { nouns: ["Inferno", "Låga", "Aska", "Glöd"], adjs: ["Brinnande", "Svedd", "Pyroklastisk"] },
    [ElementMap.EARTH]: { nouns: ["Skälvning", "Klippa", "Rot", "Grotta"], adjs: ["Stenig", "Jordbunden", "Orubblig"] },
    [ElementMap.WIND]: { nouns: ["Orkan", "Vindpust", "Virvel", "Tornado"], adjs: ["Piskande", "Svepande", "Luftig"] },
    [ElementMap.WATER]: { nouns: ["Tsunami", "Ström", "Källa", "Gejser"], adjs: ["Översvämmad", "Våt", "Flytande"] },
    [ElementMap.MAGMA]: { nouns: ["Vulkan", "Magmaflod", "Utbrott"], adjs: ["Smältande", "Vulkanisk", "Flytande sten"] },
    [ElementMap.FIRESTORM]: { nouns: ["Eldstorm", "Hett oväder", "Glödande vind"], adjs: ["Brännhet", "Rasande", "Cyklonisk"] },
    [ElementMap.STEAM]: { nouns: ["Ångexplosion", "Tryckvåg", "Skållhet dimma"], adjs: ["Skållande", "Trycksatt", "Gaser"] },
    [ElementMap.SAND]: { nouns: ["Sandstorm", "Ökenvåg", "Kvicksand"], adjs: ["Begravande", "Slipande", "Torr"] },
    [ElementMap.MUD]: { nouns: ["Lerskred", "Träsk", "Gyttja"], adjs: ["Sugande", "Geggig", "Trög"] },
    [ElementMap.STORM]: { nouns: ["Monsun", "Åskväder", "Orkan"], adjs: ["Elektrisk", "Regnig", "Stormig"] },
    [ElementMap.NEUTRAL]: { nouns: ["Prövning", "Möte", "Öde"], adjs: ["Bortglömd", "Uråldrig", "Mystisk"] },
};
// Add fallbacks for complex elements to ensure flavor text always exists.
const allElements = Object.values(ElementMap).filter(v => typeof v === 'number') as Element[];
allElements.forEach(el => {
    if (!ELEMENT_FLAVOR_TEXT[el]) {
        ELEMENT_FLAVOR_TEXT[el] = ELEMENT_FLAVOR_TEXT[ElementMap.NEUTRAL];
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
        description: `Du hittar en liten fontän som bubblar med ren ${Object.keys(ElementMap).find(key => ElementMap[key as keyof typeof ElementMap] === element)}-energi. Vattnet skimrar inbjudande.`,
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

// --- Card Generation Logic ---

export const generateRandomCard = (playerLevel: number, round: number = 1): EventCard => {
    // 1. Determine Element
    const baseElements = [ElementMap.FIRE, ElementMap.EARTH, ElementMap.WIND, ElementMap.WATER];
    const e1 = getRandom(baseElements);
    const e2 = getRandom(baseElements.filter(e => e !== e1)); // Ensure two different elements
    const primaryElement = HYBRID_ELEMENT_MAP[e1]?.[e2] || e1;
    
    // 2. Determine Card Type (weighted)
    const typeRoll = Math.random();
    let type: 'COMBAT' | 'BOON' | 'CURSE' | 'CHOICE' = 'COMBAT';
    if (typeRoll > 0.9) type = 'CURSE';
    else if (typeRoll > 0.75) type = 'BOON';
    else if (typeRoll > 0.5) type = 'CHOICE';

    // 3. Generate Payload based on Type and Element
    let payload: EventCard['payload'];
    let title: string;
    let description: string;

    const flavor = ELEMENT_FLAVOR_TEXT[primaryElement] || ELEMENT_FLAVOR_TEXT[ElementMap.NEUTRAL];

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
                payload = { log: `Du hittar en källa av ren ${Object.keys(ElementMap).find(key => ElementMap[key as keyof typeof ElementMap] === primaryElement)}-energi. Full hälsa återställd!`, healthChange: 9999, xp: 20 * round };
                description = "En oväntad välsignelse."
                title = "Helande källa";
            } else {
                payload = { log: `En viskning från ${Object.keys(ElementMap).find(key => ElementMap[key as keyof typeof ElementMap] === primaryElement)}-planet ger dig insikt.`, xp: (50 + 10 * playerLevel) * round };
                description = "Du känner dig visare.";
                title = "Uråldrig insikt";
            }
            break;
        case 'CURSE':
             title = `${getRandom(flavor.adjs)} förbannelse`;
             payload = { log: `En fientlig ${Object.keys(ElementMap).find(key => ElementMap[key as keyof typeof ElementMap] === primaryElement)}-manifestation dränerar din energi.`, healthChange: -(15 + playerLevel * 2 + round * 5), xp: 0 };
             description = "En plötslig känsla av svaghet.";
            break;
        case 'CHOICE':
            const scenarioGenerator = getRandom(CHOICE_SCENARIOS);
            const scenario = scenarioGenerator(playerLevel, round, primaryElement);
            title = scenario.title;
            description = scenario.description;
            payload = scenario.payload;
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

export const generateBossCard = (playerLevel: number, round: number = 1): EventCard => {
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
            resistances: {
                [enemyElement]: 25, // 25% resistance to its own element
            },
        };
    });

    return {
        title: `${Element[element]} Konfrontation`,
        description: description,
        element: element,
        modifiers: [],
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
        resistances: {
            [bossElement]: 50, // Bosses are highly resistant to their own element
            [Element.NEUTRAL]: -25, // But maybe weak to neutral attacks?
        },
        ability: Math.random() > 0.5 ? 'HASTE_SELF' : undefined, // Boss might have a special ability
        onHitEffect: Math.random() > 0.5 ? { type: 'burning', duration: 2, damage: 5 } : undefined, // Example on-hit effect
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