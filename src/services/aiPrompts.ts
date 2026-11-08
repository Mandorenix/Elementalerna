export const NPC_PERSONALITIES: Record<string, string> = {
  Pyromanten: 'Aggressiv, impulsiv och destruktiv. Omfamnande ligan och låt världen brinna.',
  Stenväktaren: 'Tålig, orubblig och defensiv. Som berget står jag, orubblig inför stormen.',
  Stormdansaren: 'Vild, okontrollerbar och energisk. Förflyttar dig med åska och blixtar.',
  Tidvattenvävaren: 'Mystisk, flytande och förändrande. Strömmarna bär min visdom.',
  Ljusbringaren: 'Vis, helande och upplyftad. Ljuset visar vägen genom mörkret.',
  Skuggvävaren: 'Självgod, hemlighetsfull och farlig. Skuggorna tjänar mig.',
};

export const NPC_ROLES: Record<string, { greeting: string; combatIntro: string; victoryLine: string; defeatLine: string; merchantGreeting: string }> = {
  Pyromanten: {
    greeting: 'Eld brinner i mig. Vad vill du, resenär?',
    combatIntro: 'Ligan äter upp din motståndare! Eldens vrede är obönhörlig.',
    victoryLine: 'Och igen elden segrade. Det var bara en vårvind.',
    defeatLine: 'Elden... svalnar...',
    merchantGreeting: 'Jag säljer eldrelative föremål. Välj med vett.',
  },
  Stenväktaren: {
    greeting: 'Jag har väntat länge. Din tid är kommen.',
    combatIntro: 'Bergen står emot dig. Ingen bryter min fasad.',
    victoryLine: 'Stenhård som alltid. Du hade ingen chans.',
    defeatLine: 'Jag faller... men marken står kvar.',
    merchantGreeting: 'Föremål av berg och sten. Välkommen att handla.',
  },
  Stormdansaren: {
    greeting: 'Åskan kurrar! Vad har du att säga till det?',
    combatIntro: 'Blitz! Du är fast i min storm!',
    victoryLine: 'Den sista åskan klingar ut. Du är för svag.',
    defeatLine: 'Stormen... sveper bort mig...',
    merchantGreeting: 'Stormvarelser är sällsynta. Kolla mina varor.',
  },
  Tidvattenvävaren: {
    greeting: 'Flödet har burit hit dig. Säg din sak.',
    combatIntro: 'Vatten tar allt. Du dras med i strömmen.',
    victoryLine: 'Strömmen löser aldrig sig. Din nederlag var utstakad.',
    defeatLine: 'Vattnet svävar... jag dras med det...',
    merchantGreeting: 'Flödet för med sig varor åt dig. Titta runt.',
  },
  Ljusbringaren: {
    greeting: 'Ljuset lyser din framfart. Hur kan jag hjälpa dig?',
    combatIntro: 'Skuggorna flyr! Ljuset besvärar din motståndare.',
    victoryLine: 'Ljuset segrar igen. Mörkret drar sig tillbaka.',
    defeatLine: 'Skuggarna slukar ljuset...',
    merchantGreeting: 'Heliga föremål finns här. Varmt välkommen.',
  },
  Skuggvävaren: {
    greeting: 'Mörkret rör sig. Din skugga faller i takt med min.',
    combatIntro: 'Skuggorna smyger över dig. Du inser det för sent.',
    victoryLine: 'Mörkret upptar allt. Du var aldrig här.',
    defeatLine: 'Skuggorna släpper taget... för nu...',
    merchantGreeting: 'Saker från skuggorna. Priserna är... förskingrade.',
  },
};

export const ENEMY_PERSONALITIES: Record<string, string> = {
  EldDrake: 'Gallskapt av eld, obeveklig, förgätting intet som står i dess väg.',
  StenGigant: 'Tung, långsam men ödesdigern. Varje steg dödar.',
  StormVakt: 'Vild och oförutsebar. Åskan följer dess every steg.',
  VattenHexa: 'Lurig och kall. Dränker sina motståndare i tystnad.',
  LjusPräst: 'Helig och outtröttlig. Ditt ljus är ditt svärd.',
  SkuggaStänk: 'Osynlig och smygande. Döden kommer leende.',
  MagmaBerg: 'Uråldrig och elak. Smälter allt i dess närvaro.',
  SandDemon: 'Hungrig och rastlös. Öser sand över dess offer.',
};

export const MERCHANT_PERSONALITIES: Record<string, string> = {
  EldHandlare: 'Jag har eldvarelser som ingen kan motstå!',
  StenKrämare: 'Min varor är av berg och sten. Pålitliga och varma.',
  StormTullkarl: 'Åskan har varit emot mig idag... erbjudanden gäller ändå.',
  VattenKoop: 'Kom, kom! Få din andedräkt ur och handla!',
  LjusBokare: 'Heliga skrifter och föremål finns här. Gå försiktigt.',
  SkuggBrokare: 'Jag har saker du aldrig sett... mot rätt pris.',
};

export const AI_MODELS = {
  text: ['openai', 'mistral'],
  image: ['flux', 'turbo'],
  audio: ['openai-tts'],
} as const;

export const DEFAULT_AI_MODEL = 'openai';
export const DEFAULT_IMAGE_MODEL = 'flux';
export const DEFAULT_AUDIO_MODEL = 'openai-tts';