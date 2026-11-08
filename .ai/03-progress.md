# Projektstatus (Uppdateras löpande)

## Current Game State (2026-11-08)
- Core: React 19 + TS, deck-per-round (CARDS_PER_ROUND=8: 7 random + boss via cardGenerator), ATB combat in EventView (50ms tick @1.5 base +1.5 haste/0.5 slow, threshold 100, set to 0 post-action).
- Elements: 20 (4 base +12 hybrid +3 tier3 +neutral), hybrid combos in cardGenerator HYBRID_ELEMENT_MAP; damage uses per-enemy resistances (pos=resist, neg=weak) + formula (dmg-armor)*mult *0.5 defend.
- Combat: 15+ status effects, player abilities+ultimates+passives, enemy abilities+cooldowns, onhit affixes, env effects, retaliation.
- Progression: 6 archetypes w/ resources (Hetta etc), skill trees (universal/light/dark), elemental affinities (threshold bonuses), equipment 8 slots + inventory + gold, rounds up to MAX_ROUNDS=10.
- Deck/Save/Sound: Round deck/discard/drawn in App+DeckView; save.ts+localStorage persists char+progress+round; sound.ts zzfx now uses singleton AudioContext + auto-resume().
- Gaps: enemy.behavior (e.g. ATTACK_LOWEST_HP) assigned in generator but ignored in handleEnemyAction (always ~player or random ability); boss.phases defined+typed but no evaluate/transition code in EventView; EventView monolithic; partial tests (node --test + e2e cjs, no vitest).

## Pågående uppgift:
- Implementera saknade boss phase transitions + EnemyBehavior logik i EventView handleEnemyAction.

## Slutfört:
- Save-persistens (localStorage + restore), core ATB + status engine, 20-el hybrid gen, skill/affinity/equip, round deck loop, UI views.
- AudioContext singleton + resume i sound.ts (ljudbuggen åtgärdad).
- ATB loop decoupled: useATBEngine hook with useRef + direct DOM bar updates (no more 20/s re-renders on ticks).

