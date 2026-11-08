# AI Handoff — Elementalerna

**Syfte:** Denna fil är utgångspunkten för en ny AI-session. Läs den i sin helhet. Läs därefter endast de filer som specifika steg nedan pekar på.

---

## 0. Absoluta regler (från .ai/00-token-rules.md)

- Kör ALDRIG `npm install`, `npm run dev`, `npm run build`, `npm test` eller liknande själv. Skriv kommandon i kodblock + "Väntar på [OK]".
- Editera filer med verktyg. Minimal output i chatten.
- Inga nya koncept, mekaniker eller filer utan godkännande.
- Kräv plan före edits på filer >500 LOC (särskilt `EventView.tsx`).

---

## 1. Sanningstabell (post-audit 2026-11-08)

| Fråga | Dokumentation påstår | Verkligheten (verifierad i kod) |
|---|---|---|
| AudioContext i `sound.ts` | PROJECT_STATUS: "Ej löst" | ✅ Fixat — singleton + resume |
| ATB-loop | PROJECT_STATUS: "50ms setInterval orsakar re-renders" | ✅ Fixat — `hooks/useATBEngine.ts` med useRef + direkt DOM |
| `enemy.behavior` | Används i combat | ❌ INTE implementerat — `handleEnemyAction` läser aldrig fältet |
| `enemy.phases` (boss) | Används i combat | ❌ INTE implementerat — ingen fas-övergång existerar |
| EventView-storlek | "~2573 LOC, monolitisk" | ✅ Korrekt — rör ej utan plan |
| Tester | "partiella" | ✅ Korrekt — `node --test` + e2e, ingen Vitest |

**Tumregel:** `.ai/03-progress.md` + faktisk kod > `AGENTS.md` §3–4 > `PROJECT_STATUS.md` > allt annat.

---

## 2. Aktuell uppgift: Boss-AI

Detta är en **funktionell skuld**, inte en optimeringsfas. Den listas som "Immediate Next Step" i `OPTIMIZATION_PLAN.md` §4 under rubriken "(separate from perf)" — dvs. ska göras parallellt med, inte istället för, Phase 3 (Component Decomposition). `AGENTS.md` §3–4 är primär källa för fas-data.

`enemy.behavior` och `enemy.phases` är definierade i `types.ts` och genereras i `utils/cardGenerator.ts`, men `handleEnemyAction` (i `EventView.tsx`) ignorerar dem helt. Nuvarande AI: 55% chans att använda slumpad redo ability, annars basic attack mot spelaren. `HASTE_SELF` är hårdkodat.

### Fyra steg (genomför i ordning, ett i taget)

**Steg 1 — Skapa `utils/combatAI.ts` (ny fil, isolerad, testbar)**
- Ren TypeScript, inga React-importer.
- Två rena funktioner:
  ```ts
  export function evaluateBossPhase(
    enemy: Enemy,
    currentHp: number,
    currentPhaseIndex: number
  ): { nextPhaseIndex: number; phase: BossPhase } | null;

  export function resolveBehaviorTarget(
    behavior: EnemyBehavior,
    playerActor: { id: string },
    allActors: Array<{ id: string; type: 'PLAYER' | 'ENEMY'; hp: number }>
  ): { action: 'ATTACK' | 'BUFF_SELF' | 'BUFF_ALLIES' | 'APPLY_DEBUFF'; targetId: string };
  ```
- Importeras INTE någonstans än. `npm run typecheck` ska förbli grönt.

**Steg 2 — Utöka `Actor`-typen i `EventView.tsx`**
- Lägg till `currentBehavior?: EnemyBehavior` och `phaseIndex: number` (0 = basfas).
- Initiera i useEffect som bygger `enemyActors` (rad ~150) från `e.behavior` och `0`.

**Steg 3 — Fas-övergång i `performAttack`**
- Efter `updateActorState(defenderId, { ...defenderUpdates, hp: newHp })`, om `defender.type === 'ENEMY'`: anropa `evaluateBossPhase(...)`, applicera `phase.newBehavior` + `phase.statuses` på aktören, logga fasnamnet.

**Steg 4 — Ersätt target-val i `handleEnemyAction`**
- Nuvarande: `performAttack(enemyId, player.id, ...)` — alltid spelaren.
- Nytt: använd `resolveBehaviorTarget(enemyActor.currentBehavior ?? enemyData.behavior, ...)`.
- `ATTACK_*` → `performAttack` mot `targetId`. `BUFF_SELF` → applicera self-buff, skippa attack. `APPLY_DEBUFF` → behåll ability-flödet men filtrera på behavior.

### Definition of done
- Alla fyra steg genomförda.
- `npm run lint` + `npm run typecheck` grönt.
- Manuellt: boss-strid triggar fas-logg vid 50% och 20% HP.
- 10-rundors strid utan "Long Tasks" >50ms i Chrome DevTools Performance.

---

## 3. Vad som INTE ska göras i denna session

- Dekomponera `EventView.tsx` (Phase 3 i OPTIMIZATION_PLAN).
- Lägga till Vitest (Phase 6).
- Optimera ATB ytterligare (redan löst).
- Röra `sound.ts`, `save.ts`, `useATBEngine.ts`.
- Uppdatera `PROJECT_STATUS.md` (görs EFTER Steg 4).

---

## 4. Filer som får röras

| Steg | Filer |
|---|---|
| 1 | `utils/combatAI.ts` (ny) |
| 2 | `EventView.tsx` (endast `Actor`-typ + useEffect-init) |
| 3 | `EventView.tsx` (`performAttack`) |
| 4 | `EventView.tsx` (`handleEnemyAction`) |

Vill du lägga till enhetstester för Steg 1: `utils/combatAI.test.ts` (node --test-format).

---

## 5. Om något är oklart

Läs endast dessa vid behov — inget annat initialt:
- `types.ts` — `EnemyBehavior`, `BossPhase`, `Enemy`.
- `utils/cardGenerator.ts` — `getEnemyAbilitiesAndBehavior`, `createBossCombatPayload`.
- **`AGENTS.md` §3–4 ENDAST** — exakt fas-data (0.5 → hasted(99), 0.2 → defending(99, value 50)). Läs inte hela filen.
- `.ai/03-progress.md` — om ovanstående inte räcker.

Skriv "Väntar på [OK]" efter varje steg. Fråga om något är oklart INNAN du skriver kod.