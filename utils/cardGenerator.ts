import type { EventCard, GameEvent, Outcome, Element, Item } from '../types';
import { ELEMENT_ICONS, Icons } from '../constants';
import { createCombatPayload, createBossCombatPayload, generateRandomItem } from '../constants'; // Import from constants

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