import React from 'react';
import type { Outcome, Item } from '../types';

interface Props {
  outcome: Outcome;
  items?: Item[];
}

const rarityColors: Record<string, string> = {
  Vanlig: '#9ca3af',
  Magisk: '#3b82f6',
  Sällsynt: '#a855f7',
  Legendarisk: '#f59e0b',
};

const RewardDisplay: React.FC<Props> = ({ outcome, items }) => {
  const rewards: React.ReactNode[] = [];

  if (outcome.healthChange && outcome.healthChange !== 0) {
    const isHeal = outcome.healthChange > 0;
    rewards.push(
      <div key="hp" className={`reward-item ${isHeal ? 'reward-heal' : 'reward-damage'}`}>
        <span className="reward-icon">{isHeal ? '❤️' : '💔'}</span>
        <span className="reward-value">{isHeal ? '+' : ''}{outcome.healthChange}</span>
      </div>
    );
  }

  if (outcome.xp && outcome.xp > 0) {
    rewards.push(
      <div key="xp" className="reward-item reward-xp">
        <span className="reward-icon">✦</span>
        <span className="reward-value">+{outcome.xp} XP</span>
      </div>
    );
  }

  if (outcome.goldChange && outcome.goldChange !== 0) {
    const isGain = outcome.goldChange > 0;
    rewards.push(
      <div key="gold" className={`reward-item ${isGain ? 'reward-gold' : 'reward-loss'}`}>
        <span className="reward-icon">{isGain ? '🪙' : '💸'}</span>
        <span className="reward-value">{isGain ? '+' : ''}{outcome.goldChange}</span>
      </div>
    );
  }

  const displayItems = items || outcome.items || [];
  displayItems.forEach((item, i) => {
    const color = rarityColors[item.rarity] || '#9ca3af';
    const Icon = item.icon;
    rewards.push(
      <div key={`item-${i}`} className="reward-item reward-item-glow" style={{ '--item-color': color } as React.CSSProperties}>
        <div className="reward-item-icon" style={{ borderColor: color }}>
          <Icon />
        </div>
        <span className="reward-value" style={{ color }}>{item.name}</span>
      </div>
    );
  });

  if (rewards.length === 0) {
    if (outcome.log) {
      rewards.push(
        <div key="log" className="reward-item reward-log">
          <span className="reward-value text-gray-300">{outcome.log}</span>
        </div>
      );
    }
    if (rewards.length === 0) return null;
  }

  return (
    <div className="reward-container">
      {rewards.map((r, i) => (
        <div key={i} className="reward-wrapper" style={{ animationDelay: `${i * 0.12}s` }}>
          {r}
        </div>
      ))}
    </div>
  );
};

export default RewardDisplay;
