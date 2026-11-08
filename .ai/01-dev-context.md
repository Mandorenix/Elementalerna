# Utvecklingskontext
- **Stack:** React 19, TypeScript, Vite, Tailwind CSS, Capacitor (för mobil).
- **Ljud:** ZzFX (proceduralt 8-bitars ljud) - OBS: fortfarande new AudioContext() per anrop (se aktuell status i 03-progress).
- **Prestanda:** 50ms setInterval i EventView uppdaterar actors state -> full re-renders. Använd useRef/mutable eller isolera ATB-bars. EventView är 2573 LOC.
- **Regler:** Inga externa bildfiler. Använd SVG-komponenter och Tailwind för pixelgrafik.
- **Aktuellt:** Core loop + ATB + 20-el + save fungerar; enemy behavior + boss phases deklarerade men inaktiva i kod.

