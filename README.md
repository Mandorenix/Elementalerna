# Elementalerna

Ett svenskspråkigt elementärt RPG-kortspel byggt med React, TypeScript och Vite. Vite-appen är den gemensamma grunden för Android-versionen via Capacitor och Windows-versionen via Electron.

## Krav

- Node.js 22 eller senare (LTS rekommenderas)
- npm 11.13.0 enligt `package.json` och `package-lock.json`
- Android Studio och Android SDK för Android-byggen
- Windows för att paketera Windows-versionen med Electron Builder

Installera beroenden från projektroten:

```powershell
npm ci
```

Använd npm i det här projektet. `package-lock.json` är den kanoniska lockfilen.

`npm audit --omit=dev` rapporterar fortfarande 9 advisories i produktionsberoendena. Inga beroenden har uppgraderats.

## Utveckling och kvalitetskontroller

```powershell
npm run dev
npm run lint
npm run typecheck
npm run build
npm run preview
```

`npm run build` skapar webbpaketet i `dist/`. Den mappen och beroendena genereras lokalt och ska inte versionshanteras.

`npm run typecheck` passerar. `npm run lint` passerar med 0 fel och 25 varningar, och Vites produktionsbygge (`npm run build`) passerar.
Sparfilens version 1 behålls; laddningen avvisar korrupta eller felaktiga sparningar utan att ta bort dem.

## Android

Installera Android Studio/SDK och konfigurera `ANDROID_HOME` eller `ANDROID_SDK_ROOT` lokalt, alternativt öppna Android-projektet i Android Studio så att den skapar `android/local.properties`. Lägg inte in den maskinspecifika filen i Git.

```powershell
npm run android:sync
npm run android:open
```

`android:sync` bygger webbappen och synkroniserar Capacitor-filerna till Android-projektet. För en lokal debug-APK med Android SDK installerat:

```powershell
npm run android:build
```

Android-debugbygget med `assembleDebug` har verifierats när `ANDROID_HOME` eller `ANDROID_SDK_ROOT` är konfigurerad.

## Windows med Electron

För utveckling, starta Vite i ett terminalfönster och Electron i ett annat:

```powershell
npm run dev
```

```powershell
npm run desktop:dev
```

Paketera Windows-versionen från en Windows-dator:

```powershell
npm run desktop:package
```

Windows-paketeringen med Electron Builder har verifierats.

Installationsfilen hamnar i `release/`, separat från Vites `dist/`. Det paketerade Electron-fönstret laddar den byggda `dist/`-appen. `main.cjs` använder ett separat `app:`-protokoll för att Vites byggfiler, bilder och ljud ska fungera i paketet.

## Tester

Kör kärnflödets regressionstest med:

```powershell
npm run test:core
```

Testet startar Vite och kontrollerar karaktärsval, kortdragning, autosparning och återupptagning efter omladdning. Det verifieras med standardporten 4176; välj en annan ledig port med `TEST_PORT`.

Kör den isolerade gameplay-smoke-testen med:

```powershell
npm run test:gameplay
```

Testet använder en separat webbläsarkontext, verifierar ett deterministiskt stridsutfall och belöning, kontrollerar desktop-/mobil-layout och rapporterar JavaScript-, konsol- och nätverksfel utan att lagra testloggar.

Kör den isolerade kontrollen av spelarens stridsvärden med:

```powershell
npm run test:combat-stats
```

Testet verifierar utrustning, passiva reliker, färdighetsbonusar och fallet utan vald karaktär.

Validera sparfilens version 1-struktur med:

```powershell
npm run test:save-validation
```

Testet täcker giltiga sparningar samt ogiltiga karaktärer, färdigheter, utrustningsföremål och effekter.

Övriga Puppeteer-flöden finns i `tests/manual/`.

- `npm run test:mobile` kräver att Vite redan kör på port 3000. För en annan adress, sätt `TEST_BASE_URL`.
- `npm run test:expansion` startar själv en Vite-server på port 4175. En annan ledig port kan väljas med `TEST_PORT`.

Manuella testskärmbilder sparas under `tests/manual/screenshots/` och ska inte checkas in.

## Projektöversikt

- `App.tsx`: spelets tillstånd och övergripande flöde.
- `components/`: menyer, karaktärer, kort, strid, inventarium, progression och visuella effekter.
- `constants.tsx`, `types.ts`: speldata, regler och domäntyper.
- `utils/cardGenerator.ts`: generering av händelsekort och föremål.
- `utils/playerCombatStats.ts`: beräkning av spelarens stridsvärden från karaktär, utrustning, reliker och färdigheter.
- `save.ts`, `sound.ts`: sparning och ljudeffekter.
- `src/services/`: valfria AI-tjänster och innehållsprompts.
- `public/`: använda bilder och musik.
- `android/`: Android Studio-/Gradle-projektets källfiler.

## Teamarbetsflöde

1. Skapa en liten gren för en avgränsad ändring och håll spelbalans/dataändringar separata från tekniska flyttar.
2. Kör lint, typkontroll och produktionsbygge före granskning.
3. Kontrollera relevanta spelsteg manuellt: karaktärsval, dra och lösa kort, strid, belöning, spara/ladda och ljud.
4. För Android- eller Electron-ändringar: kör respektive synk-/paketeringsflöde innan ändringen granskas.
5. Håll genererade byggen, lokala SDK-sökvägar, skärmbilder och hemligheter utanför commits.
