# Optimization Plan (`OPTIMIZATION_PLAN.md`)

*Last updated: 2026-11-08 | Post-audit & Phase 2 ATB refactoring*

This document defines performance targets, identified bottlenecks, and a phased optimization roadmap for the **Elementalerna** project. Goals are derived from profiling, code analysis (EventView.tsx ~2573 LOC, 50ms ATB loop), and platform constraints (Capacitor mobile + Electron desktop).

---

## 1. Performance Targets

| Metric                  | Target (Web)          | Target (Mobile)       | Current State (2026-11-08) |
|-------------------------|-----------------------|-----------------------|----------------------------|
| Sustained Frame Rate    | 60 FPS (16.6ms)       | ≥50 FPS min           | Good outside combat; drops during ATB bursts if not decoupled |
| Memory Footprint        | <100 MB heap          | <150 MB RSS           | Improved after Audio singleton; still risk in long sessions |
| ATB Tick Overhead       | <1 ms per tick        | <2 ms                 | Decoupled via useRef + direct DOM (Phase 2 complete) |
| Component Render Time   | <2 ms per frame       | <6 ms                 | EventView monolithic still high on action changes |
| Bundle Size (dist/)     | <1.2 MB gzipped       | Same                  | Acceptable after Vite build |
| Audio Contexts          | 1 (singleton)         | 1                     | Fixed (sound.ts) |

---

## 2. Identified Hotspots (Current Analysis)

### Hotspot 1: ATB Tick Re-renders (Partially Resolved)
- **Root Cause**: Original `setInterval(..., 50)` in EventView.tsx called `setActors` on every tick, causing full React reconciliation for the entire combat UI (bars, log, menus, VFX).
- **Impact**: 20 updates/sec → high CPU, GC pressure, poor mobile battery/frame time.
- **Mitigation (Phase 2 Complete)**: 
  - Created `hooks/useATBEngine.ts`
  - Internal `useRef<Record<string, number>>` for ATB values.
  - Direct DOM manipulation (`element.style.width`) on `.atb-bar-fg` and player bar ref.
  - React state update only on `>= 100` threshold (via `onTurnReady` callback).
- **Remaining Work**: 
  - Re-renders still occur on status changes, damage, and action execution.
  - Player ATB bar and enemy containers can benefit from further isolation (CSS custom properties or canvas gauges).

### Hotspot 2: Monolithic EventView.tsx
- **Root Cause**: Single 2573-line component handles ATB loop, turn processing, ability resolution, VFX, status timers, logging, and UI state.
- **Impact**: Any state change (even non-ATB) triggers expensive re-renders. Hard to optimize selectively.
- **Current State**: ATB logic extracted, but combat logic remains coupled.

### Hotspot 3: Particle & Background Effects
- `AnimatedElementalBackground.tsx` + `@tsparticles/react`
- Multiple layered SVGs, backdrop-blur, and CSS animations in combat.
- **Impact**: GPU/CPU cost on lower-end devices (especially Android WebView).

### Hotspot 4: Audio (Resolved)
- Previous: `new AudioContext()` on every `zzfx()` call.
- **Fixed**: Singleton `getAudioContext()` + `resume()` on suspended state (sound.ts).

### Hotspot 5: Lack of Selective Updates & Testing
- No memoization around heavy subtrees.
- Partial test coverage makes aggressive refactors risky (see PROJECT_STATUS.md risks).

---

## 3. Phased Optimization Roadmap

### Phase 1: Audio & Quick Wins (COMPLETE)
- AudioContext singleton + auto-resume.
- Remove duplicate script tags in index.html.
- Status: Done (confirmed in .ai/03-progress.md and PROJECT_STATUS.md).

### Phase 2: Decouple ATB from React State (COMPLETE)
- Extract logic to `useATBEngine` hook.
- `useRef` for ATB accumulation.
- Direct DOM updates for visual bars.
- Trigger React updates **only** for turn execution.
- Status: Implemented 2026-11-08. See hooks/useATBEngine.ts and EventView.tsx refactor.

### Phase 3: Component Decomposition of EventView (HIGH PRIORITY)
- Split into:
  - `CombatArena.tsx` (layout + background)
  - `ActorSprite.tsx` (HP/ATB bars + animations + ref attachment)
  - `ActionMenu.tsx` (player controls)
  - `CombatLog.tsx` (message history)
  - `StatusEffectLayer.tsx`
- Use `React.memo` + stable callbacks.
- Keep ATB engine as a separate hook that accepts actor refs.
- Expected win: Reduce re-render scope dramatically.

### Phase 4: Rendering & GPU Optimizations
- Replace CSS transitions on ATB bars with `transform: scaleX()` or CSS variables updated from hook.
- Throttle particle systems during ATB (reduce particle count on mobile).
- Consider canvas-based ATB gauges for zero DOM writes.
- Profile with React DevTools Profiler + Chrome Performance tab on target devices.

### Phase 5: Broader Performance & Memory
- Memoize expensive calculations (damage formulas, affinity bonuses) with `useMemo`.
- Virtualize or limit combat log length.
- Implement object pooling for visual effects and damage popups.
- Add `will-change` and `contain` CSS where appropriate.
- Monitor long-session memory leaks (use `performance.memory` + heap snapshots).

### Phase 6: Testing & Safe Iteration
- Add Vitest + React Testing Library for isolated combat math and hook tests.
- Add performance regression tests (e.g., tick count per second under load).
- This enables confident future refactors.

---

## 4. Current Status (Post Recent Work)

| Phase | Status     | Notes |
|-------|------------|-------|
| 1     | ✅ Complete | Audio singleton done |
| 2     | ✅ Complete | useATBEngine + direct DOM implemented |
| 3     | ⏳ Pending  | EventView still monolithic |
| 4-6   | Planned    | Depends on Phase 3 |

**Immediate Next Steps** (as of .ai/03-progress.md):
- Continue with boss AI & behavior wiring (separate from perf).
- Begin Phase 3 decomposition.
- Validate mobile FPS after ATB changes.

---

## 5. Measurement & Validation

- Use `React.Profiler` around combat subtree.
- Lighthouse + Web Vitals for web build.
- Android Studio Profiler + `adb shell dumpsys gfxinfo` for mobile.
- Manual: 10-round combat session on low-end device, measure frame drops and battery.
- Target: No "Long Tasks" (>50ms) during passive ATB fill.

---

## 6. Non-Goals

- Do not optimize before profiling.
- Avoid premature micro-optimizations in non-hot paths (card generation, menu navigation).
- Keep retro aesthetic — do not sacrifice visual fidelity for minor perf gains.

This plan should be updated after each major phase completion and re-audited against current code. Refer to ARCHITECTURE.md for component details and PROJECT_STATUS.md for risk context.