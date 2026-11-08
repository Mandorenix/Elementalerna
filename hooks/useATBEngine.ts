import React, { useEffect, useRef, useCallback } from 'react';

interface UseATBEngineOptions {
  isActive: boolean;
  actors: any[]; // accepts Actor[] from EventView without import cycle
  onTurnReady: (actorId: string) => void;
  playerAtbBarRef?: React.RefObject<HTMLDivElement>;
}

interface UseATBEngineReturn {
  resetAtb: (id: string) => void;
}

export function useATBEngine({
  isActive,
  actors,
  onTurnReady,
  playerAtbBarRef,
}: UseATBEngineOptions): UseATBEngineReturn {
  const atbMapRef = useRef<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);

  // Sync initial atb values from actors (when actors first set or reset)
  useEffect(() => {
    actors.forEach((actor: any) => {
      if (atbMapRef.current[actor.id] === undefined) {
        atbMapRef.current[actor.id] = actor.atb;
      }
    });
  }, [actors]);

  const updateBarDOM = useCallback((actorId: string, value: number) => {
    const clamped = Math.min(100, Math.max(0, value));

    // Update enemy/player bars inside actor containers
    const actor = actors.find((a) => a.id === actorId);
    if (actor?.ref?.current) {
      const bar = actor.ref.current.querySelector('.atb-bar-fg') as HTMLElement | null;
      if (bar) {
        bar.style.width = `${clamped}%`;
        bar.style.transition = 'none'; // avoid transition during rapid ticks
      }
    }

    // Handle dedicated player ATB bar (outside actor loop)
    if (playerAtbBarRef?.current && actorId === actors.find((a: any) => a.type === 'PLAYER')?.id) {
      playerAtbBarRef.current.style.width = `${clamped}%`;
      playerAtbBarRef.current.style.transition = 'none';
    }
  }, [actors, playerAtbBarRef]);

  // Re-apply current atb values to DOM after potential React re-renders
  const syncAllBars = useCallback(() => {
    Object.keys(atbMapRef.current).forEach((id) => {
      updateBarDOM(id, atbMapRef.current[id]);
    });
  }, [updateBarDOM]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      processingRef.current = false;
      return;
    }

    intervalRef.current = setInterval(() => {
      if (processingRef.current) return;

      let readyActorId: string | null = null;

      let maxEnemy = 0;
      actors.forEach(a => { if(a.isDefeated) return; const v=atbMapRef.current[a.id]??a.atb; if(a.type==='ENEMY') maxEnemy=Math.max(maxEnemy,v); });

      actors.forEach((actor: any) => {
        if (actor.isDefeated) return;

        let currentAtb = atbMapRef.current[actor.id];
        if (currentAtb === undefined) {
          currentAtb = actor.atb;
          atbMapRef.current[actor.id] = currentAtb;
        }

        const isHasted = actor.statusEffects.some((e: any) => e.type === 'hasted');
        const isSlowed = actor.statusEffects.some((e: any) => e.type === 'slowed');

        let atbRate = 1.5;
        if (isHasted) atbRate *= 1.5;
        if (isSlowed) atbRate *= 0.5;
        if (actor.type === 'PLAYER' && maxEnemy > 80 && currentAtb < 40) atbRate *= 1.5;

        const newAtb = currentAtb + atbRate;
        atbMapRef.current[actor.id] = newAtb;

        updateBarDOM(actor.id, newAtb);

        if (!readyActorId && newAtb >= 100) {
          readyActorId = actor.id;
        }
      });

      if (readyActorId && !processingRef.current) {
        processingRef.current = true;
        onTurnReady(readyActorId);
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, actors, onTurnReady, updateBarDOM]);

  // After actors update (e.g. status or atb=0 from action), re-sync DOM bars from internal map
  useEffect(() => {
    if (isActive) {
      syncAllBars();
    }
  }, [actors, isActive, syncAllBars]);

  const resetAtb = useCallback((id: string) => {
    atbMapRef.current[id] = 0;
    updateBarDOM(id, 0);
    processingRef.current = false;
  }, [updateBarDOM]);

  return { resetAtb };
}
