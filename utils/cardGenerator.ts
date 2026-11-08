import React from 'react';
import { Element, type EventCard, type GameEvent, type Item, type ItemStats, type ItemAffix, type EquipmentSlot, type Rarity, type Enemy, type PuzzleChallenge, type MerchantOffer, type EnvironmentEffect, type Environment, type StatusEffect, type EnemyApplyStatusEffect, type EnemyAbility, type EnemyBehavior } from '../types';
import { ELEMENT_ICONS, Icons, ItemVisuals, ENEMY_ABILITIES } from '../constants';


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
    // Scenario 4: Campfire (Rastplats)
    (playerLevel: number, round: number) => ({
        title: "Rastplats vid elden",
        description: "Du stöter på en övergiven lägerplats med ett fortfarande glödande bål. Det vore klokt att stanna och samla krafter.",
        payload: {
            options: [
                {
                    buttonText: "🔥 Vila (Läk 40% HP)",
                    description: "Slappna av vid elden och återhämta dina sår.",
                    outcome: { log: "Du vilar vid elden och dina sår läks.", healthChange: Math.floor(100 * 0.4) /* placeholder; App sees healthChange as flat but the logic reads % */ }
                },
                {
                    buttonText: "⚔️ Träna (Kostar 40 Guld → +XP)",
                    description: "Använd tiden till att öva på din stridsteknik.",
                    outcome: { log: "Du tränar hårt i skenet av elden och känner dig starkare!", xp: (60 + playerLevel * 10) * round, goldChange: -40 }
                },
                {
                    buttonText: "🛠️ Smida (Kostar 50 Guld → Föremål)",
                    description: "Använd eldkällan för att smida ett nytt vapen eller rusta ditt utrustning.",
                    outcome: { log: "Du smidar med stor skicklighet och skapar ett nytt föremål!", items: [generateRandomItem(playerLevel, 'Magisk')], goldChange: -50 }
                },
                {
                    buttonText: "Lämna rastplatsen",
                    description: "Du har inte tid att slösa.",
                    outcome: { log: "Du fortsätter din resa utan att stanna." }
                }
            ]
        }
    }),
    // Scenario 5: Mystisk Mekanism/Spakdrag
    (playerLevel: number, round: number) => ({
        title: "Mystisk mekanism",
        description: "Du hittar en gammal maskin med en stor spak. Kugghjul och kedjor löper in i väggarna och ett svagt sken pulserar från mekanismens hjärta.",
        payload: {
            options: [
                {
                    buttonText: "🕹️ Dra i spaken",
                    description: "Våga dra i spaken och se vad som händer.",
                    outcome: Math.random() > 0.5
                        ? { log: "Kugghjulen snurrar igång! En gömd kammare öppnas med rikedomar!", items: [generateRandomItem(playerLevel)] }
                        : { log: "Ett varningsljud! En fälla utlöses!", healthChange: -20 - (round * 5) }
                },
                {
                    buttonText: "🔧 Undersök mekanismen",
                    description: "Försök förstå hur maskinen fungerar innan du agerar.",
                    outcome: Math.random() > 0.4
                        ? { log: "Du hittar rätt kombination! Mekanismen belönar din klokhet!", xp: 60 * round, items: [generateRandomItem(playerLevel)] }
                        : { log: "Mekanismen är för komplex. Du retar upp den och tar skada!", healthChange: -15 }
                },
                {
                    buttonText: "Lämna mekanismen",
                    description: "Vissa maskiner är bäst att inte röra.",
                    outcome: { log: "Du lämnar den mystiska mekanismen orörd." }
                }
            ]
        }
    }),
    // Scenario 6: Ancient Altar (Uråldrigt Offersaltare)
    (playerLevel: number, round: number, element: Element) => ({
        title: "Uråldrigt Offersaltare",
        description: `Ett kraftfullt altare rest till ${Element[element]}-elementets ande står mitt i en glänta. Det pulserar med dunkel energi och verkar vilja ta emot ett offer.`,
        payload: {
            options: [
                {
                    buttonText: "🗡️ Kanalisera kraft (−20% HP → +XP)",
                    description: "Offra en del av din livsenergi till altaret för att få dess välsignelse.",
                    outcome: { log: `Altaret absorberar din kraft! Du blöder men känner en ny ström av ${Element[element]}-energi.`, xp: (80 + playerLevel * 15) * round, healthChange: -Math.floor(100 * 0.2) }
                },
                {
                    buttonText: "🎁 Be om ett föremål",
                    description: "Be altaret om ett magiskt föremål i utbyte mot ditt mod.",
                    outcome: Math.random() > 0.4
                        ? { log: `Altaret belönar ditt mod med ett magiskt föremål!`, items: [generateRandomItem(playerLevel, 'Sällsynt')] }
                        : { log: "Altaret fann dig ovärdig och slog tillbaka!", healthChange: -25 }
                },
                {
                    buttonText: "Lämna altaret",
                    description: "Vissa krafter är bäst att lämna ifred.",
                    outcome: { log: "Du lämnar altaret utan att röra det." }
                }
            ]
        }
    }),
    // Scenario 7: Lost Traveler
    (playerLevel: number, round: number) => ({
        title: "Den vilsna resenären",
        description: "Du möter en sliten och desorienterad resenär på stigen. Han ber desperat om hjälp att hitta vägen ut.",
        payload: {
            options: [
                {
                    buttonText: "Vägled resenären (+XP, dryck)",
                    description: "Visa vägen och ge honom lite av dina förråd.",
                    outcome: {
                        log: "Resenären tackar dig tårögt och räcker dig en dryck han hittat på vägen.",
                        xp: 40 * round,
                        items: [generatePotion(playerLevel)]
                    }
                },
                {
                    buttonText: "Råna resenären (+Guld, risk för skada)",
                    description: "Tvinga till dig hans värdesaker.",
                    outcome: Math.random() > 0.3
                        ? { log: "Du skrämmer resenären och tar hans guldpung!", goldChange: 80 + round * 10 }
                        : { log: "Resenären slår vilt ifrån sig med sin vandringsstav innan han flyr! Du tar skada.", healthChange: -20, goldChange: 30 }
                },
                {
                    buttonText: "Ignorera honom",
                    description: "Du har inte tid för främlingar.",
                    outcome: { log: "Du går förbi och lämnar resenären åt sitt öde." }
                }
            ]
        }
    }),
    // Scenario 8: Wishing Well
    (playerLevel: number, round: number) => ({
        title: "Önskebrunnen",
        description: "En stensatt brunn täckt av murgröna står ensam i skogen. Några blanka guldmynt glittrar på botten under det klara vattnet.",
        payload: {
            options: [
                {
                    buttonText: "Kasta i guld (−30 Guld → chans på relik)",
                    description: "Gör en önskan och offra lite av din rikedom.",
                    outcome: Math.random() > 0.4
                        ? { log: "Brunnen lyser upp! En glittrande relik stiger upp till ytan.", goldChange: -30, items: [generateRelic(playerLevel)] }
                        : { log: "Ditt guld sjunker till botten, men ingenting händer.", goldChange: -30 }
                },
                {
                    buttonText: "Drick av vattnet (+HP)",
                    description: "Det ser uppfriskande och rent ut.",
                    outcome: { log: "Vattnet är svalt och uppiggande. Du känner hur dina sår stängs.", healthChange: 30 + playerLevel * 5 }
                },
                {
                    buttonText: "Titta djupt ner (+XP)",
                    description: "Studera de uråldriga speglingarna och mönstren i vattnet.",
                    outcome: { log: "Du verkar se underliga syner i vattnets djup som ger dig ny insikt.", xp: 50 * round }
                }
            ]
        }
    }),
    // Scenario 9: Obelisk of Elements
    (playerLevel: number, round: number) => ({
        title: "Elementens Obelisk",
        description: "En hög obelisk av mörkt stenmaterial reser sig framför dig. Runor som pulserar i olika elementära färger är inhuggna på dess yta.",
        payload: {
            options: [
                {
                    buttonText: "Kanalisera energi (+Föremål)",
                    description: "Försök koppla din ande till obeliskens elementära kraft.",
                    outcome: Math.random() > 0.3
                        ? { log: "Obelisken svarar på din närvaro och materialiserar ett föremål!", items: [generateRandomItem(playerLevel, 'Magisk')] }
                        : { log: "Energin slår bakut! En elementär chock skadar dig.", healthChange: -25 }
                },
                {
                    buttonText: "Rör vid runorna (Hög risk / Hög belöning)",
                    description: "Låt din hand följa de glödande spåren på stenen.",
                    outcome: Math.random() > 0.5
                        ? { log: "En våg av ren kraft strömmar genom din kropp!", xp: 100 * round, items: [generateRandomItem(playerLevel, 'Sällsynt')] }
                        : { log: "En kraftig explosion kastar dig bakåt!", healthChange: -35 - (round * 5) }
                },
                {
                    buttonText: "Passera försiktigt",
                    description: "Det är bäst och inte störa de elementära krafterna.",
                    outcome: { log: "Du går lugnt förbi den surrande obelisken." }
                }
            ]
        }
    }),
    // Scenario 10: Wandering Alchemist
    (playerLevel: number, round: number) => ({
        title: "Den vandrande alkemisten",
        description: "En mystisk person klädd i kåpa och fylld med skramlande flaskor dyker upp. 'Vill du prova mina senaste kreationer?' frågar hon med ett snett leende.",
        payload: {
            options: [
                {
                    buttonText: "Köp okänd dryck (−25 Guld → slumpmässig dryck)",
                    description: "Köp en billig men omärkt flaska alkemisk brygd.",
                    outcome: { log: "Du köper flaskan. Vem vet vad den innehåller?", goldChange: -25, items: [generatePotion(playerLevel)] }
                },
                {
                    buttonText: "Transmutera föremål (+XP, dryck)",
                    description: "Låt alkemisten smälta ner ett av dina gamla redskap för att destillera fram en ny dryck.",
                    outcome: { log: "Alkemisten utför en snabb transmutation och räcker dig ett kraftfullt elixir.", xp: 30 * round, items: [generatePotion(playerLevel)] }
                },
                {
                    buttonText: "Avböj artigt",
                    description: "Du litar inte riktigt på hennes brygder.",
                    outcome: { log: "Du tackar nej och fortsätter din vandring." }
                }
            ]
        }
    }),
];


// --- New Puzzle Card Scenarios ---
const PUZZLE_SCENARIOS = [
    (playerLevel: number, round: number): PuzzleChallenge => ({
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
    (playerLevel: number, round: number): PuzzleChallenge => ({
        challengeText: `En rasande klyfta spärras av en gammal, svajande hängbro. Repen knakar och brädorna faller sönder under fötterna på dig. Du måste vara snabb för att ta dig över!`,
        statCheck: 'dexterity',
        threshold: 6 + playerLevel + round,
        successOutcome: { log: "Du tar språnget och tar dig smidigt över precis innan bron kollapsar! På andra sidan hittar du en borttappad dryck.", xp: 60 * round, items: [generatePotion(playerLevel)] },
        failureOutcome: { log: "Du halkar på en murken bräda och faller ner i klyftan! Du lyckas klättra upp igen men tar svår fallskada.", healthChange: -25 - (round * 5) },
        options: [
            { buttonText: "Spring snabbt över (Dexteritet)", description: "Lita på din snabbhet och reflexer.", outcome: { log: "Du försöker springa snabbt över." } },
            { buttonText: "Leta efter en säker väg runt", description: "Sök en annan väg, men ta lite skada av trötthet.", outcome: { log: "Du tar en lång omväg och tröttas ut.", healthChange: -10, xp: 20 * round } }
        ]
    }),
    (playerLevel: number, round: number): PuzzleChallenge => ({
        challengeText: `Ett gigantiskt stenblock har rasat ner och blockerar ingången till en glittrande kristallgrotta. Du behöver råstyrka för att flytta blocket.`,
        statCheck: 'strength',
        threshold: 7 + playerLevel + round,
        successOutcome: { log: "Med ett vrål lyfter du blocket åt sidan! Grottan är din att utforska, och inuti hittar du fantastiska skatter.", xp: 80 * round, items: [generateRandomItem(playerLevel, 'Sällsynt')] },
        failureOutcome: { log: "Du tar i så du darrar, men stenblocket rör sig inte. Du sträcker ryggen och tar skada.", healthChange: -20 - (round * 5) },
        options: [
            { buttonText: "Lyft bort blocket (Styrka)", description: "Använd din råa muskelkraft för att röja vägen.", outcome: { log: "Du försöker lyfta bort blocket." } },
            { buttonText: "Slå sönder stenen med magi", description: "Försök spränga bort blocket men riskera splitter.", outcome: { log: "Du försöker spränga blocket med magi.", healthChange: -15, xp: 40 * round } }
        ]
    }),
];

// --- New Merchant Card Scenarios ---
const MERCHANT_SCENARIOS = [
    (playerLevel: number): MerchantOffer => ({
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

const ENEMY_TEMPLATES: Record<Element, { names: string[]; icon: React.FC }[]> = {
    [Element.NEUTRAL]: [
        { names: ["Smygande Goblin", "Goblinskrotare", "Uråldrig Skuggvandrare", "Grottfladdermus", "Stenätare", "Kryptvakt"], icon: Icons.EnemyGoblin },
        { names: ["Geléklump", "Slajmkrälande"], icon: Icons.EnemySlime },
        { names: ["Skugglurk", "Vålnad", "Skuggvarelse"], icon: Icons.EnemyShadow }
    ],
    [Element.FIRE]: [
        { names: ["Eldelemental", "Lågmanifestation", "Helveteshund", "Branddemon", "Asksmältare", "Glödspindel", "Pyroklastisk Jätte"], icon: Icons.EnemyFireElemental },
        { names: ["Eldgnista", "Brandväsande"], icon: Icons.EnemySprite },
        { names: ["Elddrake", "Glöddrak", "Urdrake"], icon: Icons.EnemyDragon }
    ],
    [Element.EARTH]: [
        { names: ["Stengolem", "Skiffervaktare", "Mossalv", "Tektonisk Väktare", "Klippkrossare", "Kristalldruid", "Stenkryptare"], icon: Icons.EnemyGolem },
        { names: ["Jordväktare", "Klipptitan"], icon: Icons.EnemyRockTitan }
    ],
    [Element.WIND]: [
        { names: ["Stormsylf", "Vindsjäl", "Tyfonande", "Vindskugga", "Aeterfalk", "Molnryttare", "Svepande Gast"], icon: Icons.EnemyStormSylph },
        { names: ["Virvelsprite", "Luftgnista"], icon: Icons.EnemySprite }
    ],
    [Element.WATER]: [
        { names: ["Vattenslajm", "Böljodjur", "Havsvålnad", "Tsunamihärjare", "Djupets Fasa", "Fjällbest"], icon: Icons.EnemySlime },
        { names: ["Källsprite", "Droppkristall"], icon: Icons.EnemySprite }
    ],
    [Element.MAGMA]: [
        { names: ["Magmagolem", "Vulkanväktare", "Lavamantel", "Glödande Best", "Basalthärjare"], icon: Icons.EnemyGolem },
        { names: ["Lavaelemental"], icon: Icons.EnemyFireElemental },
        { names: ["Lavadrake", "Magmadrake"], icon: Icons.EnemyDragon }
    ],
    [Element.OBSIDIAN]: [
        { names: ["Obsidiangolem", "Glaspansar", "Kristallvålnad", "Svartglaskrossare"], icon: Icons.EnemyObsidianGolem }
    ],
    [Element.FIRESTORM]: [
        { names: ["Eldstormsylf", "Brännhet Cyklon"], icon: Icons.EnemyStormSylph }
    ],
    [Element.HOT_AIR]: [
        { names: ["Hetluftsvirvel", "Dallrande Haze"], icon: Icons.EnemySprite }
    ],
    [Element.STEAM]: [
        { names: ["Ångelemental", "Skållande Dimma"], icon: Icons.EnemySprite }
    ],
    [Element.HOT_SPRINGS]: [
        { names: ["Källslajm", "Badväktare"], icon: Icons.EnemySlime }
    ],
    [Element.SAND]: [
        { names: ["Sandorm", "Dynhärjare"], icon: Icons.EnemySandWurm }
    ],
    [Element.EROSION]: [
        { names: ["Vindnött Golem", "Grusvaktare"], icon: Icons.EnemyGolem }
    ],
    [Element.MUD]: [
        { names: ["Lerslajm", "Träskkrälar"], icon: Icons.EnemySlime }
    ],
    [Element.GROWTH]: [
        { names: ["Toxic Treant", "Rotspricka"], icon: Icons.EnemyToxicTreant }
    ],
    [Element.ICE]: [
        { names: ["Iselemental", "Rimfrostande", "Frostkristall"], icon: Icons.EnemyIceElemental }
    ],
    [Element.STORM]: [
        { names: ["Blixtsylf", "Tordönsvirvel", "Åskvandrare", "Blixtrande Huggorm"], icon: Icons.EnemyStormSylph },
        { names: ["Elektriskt Slajm", "Spänningsvåg"], icon: Icons.EnemyElectrifiedSlime }
    ],
    [Element.VOLCANIC_STORM]: [
        { names: ["Asksylf", "Vulkanisk Storm"], icon: Icons.EnemyStormSylph },
        { names: ["Askdrake", "Rökdrake"], icon: Icons.EnemyDragon }
    ],
    [Element.ELECTRIFIED_MUD]: [
        { names: ["Blixtlerslajm", "Laddat Träskmonster"], icon: Icons.EnemyElectrifiedSlime }
    ],
    [Element.VITRIFIED_STORM]: [
        { names: ["Vass Glasstorm", "Silikatsylf"], icon: Icons.EnemyStormSylph }
    ],
    [Element.LIGHT]: [
        { names: ["Helig Vålnad", "Ljusmanifestation", "Solstrålekrigare", "Gyllene Fenix"], icon: Icons.EnemyShadow },
        { names: ["Solbrandsprite", "Glittergnista"], icon: Icons.EnemySprite },
    ],
    [Element.DARK]: [
        { names: ["Mörkervålnad", "Skuggdemon", "Nattmara", "Avgrundsbest", "Skuggspindel"], icon: Icons.EnemyShadow },
        { names: ["Dunkelbest", "Nattvarelse"], icon: Icons.EnemyGoblin },
    ],
};

const getRandomEnemyTemplate = (element: Element): { name: string; icon: React.FC } => {
    const templates = ENEMY_TEMPLATES[element] || ENEMY_TEMPLATES[Element.NEUTRAL];
    const chosenTemplate = getRandom(templates);
    const chosenName = getRandom(chosenTemplate.names);
    return { name: chosenName, icon: chosenTemplate.icon };
};

const getEnemyAbilitiesAndBehavior = (element: Element, isBoss: boolean): { abilities: EnemyAbility[], behavior: EnemyBehavior } => {
    const abilities: EnemyAbility[] = [];
    let behavior: EnemyBehavior;

    if (element === Element.FIRE || element === Element.MAGMA || element === Element.FIRESTORM) {
        abilities.push({ ...ENEMY_ABILITIES.fireball });
        behavior = 'ATTACK_LOWEST_HP';
    } else if (element === Element.EARTH || element === Element.OBSIDIAN) {
        abilities.push({ ...ENEMY_ABILITIES.stone_shield });
        behavior = 'BUFF_SELF';
    } else if (element === Element.WATER || element === Element.GROWTH || element === Element.HOT_SPRINGS) {
        abilities.push({ ...ENEMY_ABILITIES.healing_stream });
        behavior = 'BUFF_ALLIES';
    } else if (element === Element.WIND || element === Element.STORM) {
        abilities.push({ ...ENEMY_ABILITIES.lightning_bolt });
        behavior = 'ATTACK_PLAYER';
    } else if (element === Element.MUD || element === Element.SAND) {
        abilities.push({ ...ENEMY_ABILITIES.mud_entangle });
        behavior = 'APPLY_DEBUFF_TO_PLAYER';
    } else {
        if (Math.random() > 0.5) {
            abilities.push({ ...ENEMY_ABILITIES.fireball });
            behavior = 'ATTACK_LOWEST_HP';
        } else {
            abilities.push({ ...ENEMY_ABILITIES.mud_entangle });
            behavior = 'ATTACK_PLAYER';
        }
    }

    if (isBoss) {
        abilities.push({ ...ENEMY_ABILITIES.stone_shield });
    }

    return { abilities, behavior };
};

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
        case 'BOON': {
            const boonRoll = Math.random();
            if (boonRoll > 0.8) {
                payload = { 
                    log: `Du möter en skogsälva. Hon välsignar dig och skänker dig en gammal relik!`, 
                    xp: 30 * round,
                    healthChange: 50,
                    items: [generateRelic(playerLevel)]
                };
                description = "Ett möte med en övernaturlig varelse.";
                title = "Älvans välsignelse";
            } else if (boonRoll > 0.6) {
                payload = { log: `Du hittar en gömd skatt!`, items: [generateRandomItem(playerLevel)] };
                description = "En oväntad belöning.";
                title = "Gömda rikedomar";
            } else if (boonRoll > 0.4) {
                payload = { log: `Du känner en stark upptäckarglädje och hittar några tappade guldmynt.`, goldChange: 40 + round * 10, xp: 40 * round };
                description = "Vandringen ger frukt.";
                title = "Upptäckarglädje";
            } else if (boonRoll > 0.2) {
                payload = { log: `Du hittar en källa av ren ${Element[primaryElement]}-energi. Full hälsa återställd!`, healthChange: 9999, xp: 20 * round };
                description = "En oväntad välsignelse.";
                title = `Källa av ${Element[primaryElement]}`;
            } else {
                payload = { log: `En viskning från ${Element[primaryElement]}-planet ger dig insikt.`, xp: (50 + 10 * playerLevel) * round };
                description = "Du känner dig visare.";
                title = `Uråldrig insikt av ${Element[primaryElement]}`;
            }
            break;
        }
        case 'CURSE': {
            const dmg = -(15 + playerLevel * 2 + round * 5);
            let curseLog = `En fientlig ${Element[primaryElement]}-manifestation dränerar din energi.`;
            let curseDesc = "En plötslig känsla av svaghet.";
            let curseTitle = `${getRandom(flavor.adjs)} förbannelse`;

            if (primaryElement === Element.FIRE || primaryElement === Element.MAGMA || primaryElement === Element.FIRESTORM) {
                curseTitle = "Eldfeber";
                curseLog = "Eldens intensiva värme tränger in i din kropp och ger dig feber!";
                curseDesc = "Du brinner inombords.";
            } else if (primaryElement === Element.EARTH || primaryElement === Element.OBSIDIAN || primaryElement === Element.SAND) {
                curseTitle = "Förstenade fötter";
                curseLog = "Marken under dig stelnar och dina ben känns tunga som sten!";
                curseDesc = "Det är svårt och röra sig.";
            } else if (primaryElement === Element.WIND || primaryElement === Element.STORM) {
                curseTitle = "Elektrisk stöt";
                curseLog = "En plötslig blixt slår ner från klar himmel och skakar om dig!";
                curseDesc = "Håret reser sig på ända.";
            } else if (primaryElement === Element.WATER || primaryElement === Element.ICE || primaryElement === Element.STEAM) {
                curseTitle = "Iskall frost";
                curseLog = "Ett plötsligt skyfall fryser till is runt dina kläder!";
                curseDesc = "Du skakar av köld.";
            }
            
            payload = { log: curseLog, healthChange: dmg, xp: 0 };
            title = curseTitle;
            description = curseDesc;
            break;
        }
        case 'CHOICE': {
            const scenarioGenerator = getRandom(CHOICE_SCENARIOS);
            const scenario = scenarioGenerator(playerLevel, round, primaryElement);
            title = scenario.title;
            description = scenario.description;
            payload = scenario.payload;
            break;
        }
        case 'PUZZLE': { // New Puzzle Card
            const puzzleScenario = getRandom(PUZZLE_SCENARIOS)(playerLevel, round, primaryElement);
            title = `Gåtan av ${Element[primaryElement]}`;
            description = puzzleScenario.challengeText;
            payload = puzzleScenario;
            break;
        }
        case 'MERCHANT': { // New Merchant Card
            const merchantOffer = getRandom(MERCHANT_SCENARIOS)(playerLevel);
            title = `Vandrande Handlare`;
            description = "En mystisk handlare dyker upp med sällsynta varor.";
            payload = merchantOffer;
            break;
        }
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
    const baseHealth = 75 + (playerLevel * 11);
    const baseDamage = 8 + (playerLevel * 3);
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
        const template = getRandomEnemyTemplate(enemyElement);
        const enemyName = `${template.name} ${i + 1}`;
        const enemyIcon = template.icon;

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


        const { abilities: enemyAbilities, behavior: enemyBehavior } = getEnemyAbilitiesAndBehavior(enemyElement, false);

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
            abilities: enemyAbilities,
            behavior: enemyBehavior,
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
    
    let bossName = `Den Uråldriga ${Element[bossElement]} Bossen`;
    let bossIcon = Icons.EnemyGolem;
    
    switch (bossElement) {
        case Element.FIRE:
            bossName = "Ignis, Den Fortfarande Brinnande Urkraften";
            bossIcon = Icons.EnemyFireElemental;
            break;
        case Element.EARTH:
            bossName = "Kromacus, Den Orubblige Klipptitanen";
            bossIcon = Icons.EnemyRockTitan;
            break;
        case Element.WIND:
            bossName = "Zephyrus, Den Vilda Stormhärskaren";
            bossIcon = Icons.EnemyStormSylph;
            break;
        case Element.WATER:
            bossName = "Tenebris, Träskets Uråldriga Djup";
            bossIcon = Icons.EnemyToxicTreant;
            break;
    }

    const baseHealth = 160 + (playerLevel * 35);
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

    const { abilities: bossAbilities, behavior: bossBehavior } = getEnemyAbilitiesAndBehavior(bossElement, true);

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
        abilities: bossAbilities,
        behavior: bossBehavior,
        specialAbility: Math.random() > 0.5 ? 'HASTE_SELF' : undefined, // Boss might have a special ability
        onHitEffect: Math.random() > 0.5 ? { type: 'APPLY_STATUS', status: 'frail', chance: 30, duration: 3, value: 20, isPercentage: true } : undefined, // Example on-hit effect
        // Boss phases for more complex encounters
        phases: [
            {
                name: "Rasande",
                threshold: 0.55, // Below 55% HP
                newBehavior: 'ATTACK_HIGHEST_DAMAGE_PLAYER',
                statusEffectsToApplyToSelf: [{ type: 'hasted', duration: 99 } as StatusEffect],
                description: "Bossen blir rasande och attackerar den starkaste fienden!"
            },
            {
                name: "Försvar",
                threshold: 0.30, // Below 30% HP
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

export const generatePotion = (playerLevel: number): Item => {
    const potionTypes: Array<{ name: string; consumableEffect: NonNullable<Item['consumableEffect']>; rarity: Rarity }> = [
        {
            name: 'Hälsoelixir',
            consumableEffect: { type: 'HEAL', value: 30 + playerLevel * 5, description: `Återställer ${30 + playerLevel * 5} HP.` },
            rarity: 'Vanlig',
        },
        {
            name: 'Stort Hälsoelixir',
            consumableEffect: { type: 'HEAL', value: 70 + playerLevel * 10, description: `Återställer ${70 + playerLevel * 10} HP.` },
            rarity: 'Magisk',
        },
        {
            name: 'Aeterdryck',
            consumableEffect: { type: 'AETHER', value: 25 + playerLevel * 3, description: `Återställer ${25 + playerLevel * 3} Aether.` },
            rarity: 'Vanlig',
        },
        {
            name: 'Stark Aeterdryck',
            consumableEffect: { type: 'AETHER', value: 60 + playerLevel * 5, description: `Återställer ${60 + playerLevel * 5} Aether.` },
            rarity: 'Magisk',
        },
        {
            name: 'Hastighetsdryck',
            consumableEffect: { type: 'BUFF', status: 'hasted', duration: 3, description: 'Ger Haste i 3 rundor.' },
            rarity: 'Magisk',
        },
        {
            name: 'Sköldelixir',
            consumableEffect: { type: 'BUFF', status: 'defending', duration: 2, description: 'Ger Försvar i 2 rundor.' },
            rarity: 'Vanlig',
        },
        {
            name: 'Berserkarblod',
            consumableEffect: { type: 'BUFF', status: 'regenerating', duration: 4, value: 8 + playerLevel, description: `Ger Regenerering (${8 + playerLevel} HP/runda) i 4 rundor.` },
            rarity: 'Sällsynt',
        },
        {
            name: 'Styrkeelixir',
            consumableEffect: { type: 'BUFF', status: 'full_flow', duration: 3, description: 'Ger Fullt Flöde (ökar skada) i 3 rundor.' },
            rarity: 'Sällsynt',
        },
        {
            name: 'Eldskyddsdryck',
            consumableEffect: { type: 'BUFF', status: 'absorbing', duration: 3, value: 30, description: 'Absorberar upp till 30 Eldskada i 3 rundor.' },
            rarity: 'Magisk',
        },
        {
            name: 'Livselixir',
            consumableEffect: { type: 'HEAL', value: 120 + playerLevel * 15, description: `Återställer ${120 + playerLevel * 15} HP och renar kroppsliga åkommor.` },
            rarity: 'Legendarisk',
        }
    ];
    const chosen = potionTypes[Math.floor(Math.random() * potionTypes.length)];
    return {
        id: `potion-${Date.now()}-${Math.random()}`,
        name: chosen.name,
        rarity: chosen.rarity,
        slot: 'Föremål',
        stats: {},
        icon: Icons.Water, // Potion icon
        consumableEffect: chosen.consumableEffect,
    };
};

export const generateRelic = (playerLevel: number): Item => {
    const relicTypes: Array<{ name: string; stats: Item['stats']; description?: string }> = [
        { name: 'Vindens Fjäder', stats: { undvikandechans: 5 + playerLevel } },
        { name: 'Brinnande Aska', stats: { skada: 3 + Math.floor(playerLevel * 0.5), kritiskTräff: 3 } },
        { name: 'Järnhjärtat', stats: { rustning: 4 + playerLevel, constitution: 1 } },
        { name: 'Sagevisdom', stats: { intelligence: 2 + Math.floor(playerLevel * 0.3) } },
        { name: 'Krigarens Hjärta', stats: { strength: 2, skada: 2 + playerLevel } },
        { name: 'Stenskinnet', stats: { rustning: 6 + playerLevel, undvikandechans: 2 } },
        { name: 'Vulkankärna', stats: { strength: 3 + Math.floor(playerLevel * 0.4), skada: 4 + playerLevel } },
        { name: 'Obsidianspegel', stats: { rustning: 8 + playerLevel } },
        { name: 'Stormring', stats: { dexterity: 3 + Math.floor(playerLevel * 0.4), undvikandechans: 4 } },
        { name: 'Gaiablad', stats: { constitution: 4 + Math.floor(playerLevel * 0.5) } },
        { name: 'Aeterkristall', stats: { intelligence: 3, constitution: 2 } }
    ];
    const chosen = relicTypes[Math.floor(Math.random() * relicTypes.length)];
    return {
        id: `relic-${Date.now()}-${Math.random()}`,
        name: chosen.name,
        rarity: 'Sällsynt',
        slot: 'Föremål',
        stats: chosen.stats,
        icon: Icons.Earth, // Relic icon
        isRelic: true,
    };
};

export const generateRandomItem = (playerLevel: number, rarity: Rarity = 'Vanlig'): Item => {
    // 15% chance to generate a potion or relic instead of equipment
    const specialRoll = Math.random();
    if (specialRoll < 0.08) return generatePotion(playerLevel);
    if (specialRoll < 0.15) return generateRelic(playerLevel);

    const itemTypes: { slot: EquipmentSlot | 'Föremål'; name: string[]; icon: React.FC; visual?: React.FC; }[] = [
        { slot: 'Hjälm', name: ['Läderhuva', 'Järnhjälm', 'Magisk Hatt'], icon: Icons.Shield, visual: ItemVisuals.LeatherHelm },
        { slot: 'Vapen 1', name: ['Rostigt Svärd', 'Stålsvärd', 'Magisk Stav'], icon: Icons.Fire, visual: ItemVisuals.RustySword },
        { slot: 'Vapen 2', name: ['Träsköld', 'Järnsköld', 'Elementarsköld', 'Aeterbok', 'Trollformelsbok'], icon: Icons.Fire, visual: ItemVisuals.WoodShield },
        { slot: 'Bröst', name: ['Läderbrynja', 'Järnharnesk'], icon: Icons.Earth, visual: ItemVisuals.LeatherArmor },
        { slot: 'Handskar', name: ['Läderhandskar', 'Stålhandskar', 'Stenkrossarhandskar', 'Runehandskar', 'Elementarhandskar'], icon: Icons.Shield },
        { slot: 'Bälte', name: ['Läderbälte', 'Nitbälte', 'Vulkanbälte', 'Aeterbälte', 'Stormbälte'], icon: Icons.Shield },
        { slot: 'Byxor', name: ['Läderbyxor', 'Järnbyxor', 'Tygbyxor', 'Stormbyxor', 'Runklädda byxor'], icon: Icons.Shield },
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
        case 'Vapen 2':
            if (randomName.includes('sköld')) {
                stats.rustning = baseValue * 1.5 + Math.floor(Math.random() * playerLevel);
                stats.constitution = Math.max(1, Math.floor(baseValue * 0.3));
            } else {
                stats.intelligence = Math.max(1, Math.floor(baseValue * 0.5));
                stats.skada = Math.max(1, Math.floor(baseValue * 0.5));
            }
            break;
        case 'Bröst':
            stats.rustning = baseValue * 2 + Math.floor(Math.random() * playerLevel);
            break;
        case 'Handskar':
            stats.strength = Math.max(1, Math.floor(baseValue * 0.3));
            stats.dexterity = Math.max(1, Math.floor(baseValue * 0.3));
            stats.rustning = Math.max(1, Math.floor(baseValue * 0.5));
            break;
        case 'Bälte':
            stats.constitution = Math.max(1, Math.floor(baseValue * 0.4));
            stats.rustning = Math.max(1, Math.floor(baseValue * 0.5));
            break;
        case 'Byxor':
            stats.constitution = Math.max(1, Math.floor(baseValue * 0.5));
            stats.rustning = baseValue + Math.floor(Math.random() * playerLevel);
            break;
        case 'Stövlar':
            stats.undvikandechans = Math.floor(baseValue * 0.2) + Math.floor(Math.random() * playerLevel * 0.1);
            break;
    }


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