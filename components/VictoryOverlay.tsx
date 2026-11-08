import React, { useEffect, useState } from 'react';
import type { GameEvent, Character } from '../types';
import { soundEffects } from '../sound';

interface Props {
  rewards: GameEvent['rewards'];
  character: Character;
  onDismiss: () => void;
}

const rarityColors: Record<string, string> = {
  Vanlig: '#9ca3af',
  Magisk: '#3b82f6',
  Sällsynt: '#a855f7',
  Legendarisk: '#f59e0b',
};

const VictoryOverlay: React.FC<Props> = ({ rewards, character, onDismiss }) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [showContent, setShowContent] = useState(false);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    soundEffects.victory();
    const t1 = setTimeout(() => setPhase('show'), 100);
    const t2 = setTimeout(() => setShowContent(true), 400);
    const t3 = setTimeout(() => setShowItems(true), 800);
    const t4 = setTimeout(() => {
      setPhase('exit');
      setTimeout(onDismiss, 400);
    }, 3000);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onDismiss]);

  const handleClick = () => {
    if (phase === 'exit') return;
    setPhase('exit');
    setTimeout(onDismiss, 400);
  };

  const hasLeveledUp = rewards.xp && rewards.xp > 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${
        phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={handleClick}
    >
      <div className="text-center px-6">
        <h1 className={`victory-title font-bold font-serif mb-4 transition-all duration-700 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          SEGER!
        </h1>

        {showContent && (
          <>
            <div className="victory-divider mb-4" />

            <div className="flex flex-col items-center gap-3 mb-4">
              {rewards.xp && rewards.xp > 0 && (
                <div className="victory-stat victory-stat-xp">
                  <span className="text-blue-400 text-lg">✦</span>
                  <span className="text-white font-bold">+{rewards.xp} XP</span>
                </div>
              )}

              {hasLeveledUp && (
                <div className="victory-stat victory-stat-level" style={{ animationDelay: '0.3s' }}>
                  <span className="text-yellow-400 text-lg">⬆</span>
                  <span className="text-yellow-300 font-bold">LEVEL UP!</span>
                </div>
              )}
            </div>

            {rewards.items && rewards.items.length > 0 && (
              <div className={`flex flex-col items-center gap-2 transition-all duration-500 delay-300 ${showItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-gray-400 text-xs mb-1">Hittade föremål:</p>
                {rewards.items.map((item, i) => {
                  const color = rarityColors[item.rarity] || '#9ca3af';
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="victory-item bounce-in"
                      style={{ borderColor: color, animationDelay: `${i * 0.15}s` }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center" style={{ color }}>
                        <Icon />
                      </div>
                      <span className="text-xs font-bold" style={{ color }}>{item.name}</span>
                      <span className="text-[8px] text-gray-500 ml-1">({item.rarity})</span>
                    </div>
                  );
                })}
              </div>
            )}

            {(!rewards.items || rewards.items.length === 0) && (
              <p className="text-gray-500 text-xs mt-2">Inga föremål hittades.</p>
            )}

            <p className="text-gray-600 text-[8px] mt-6 animate-pulse">Klicka eller vänta för att fortsätta...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VictoryOverlay;
