import React from 'react';
import { Element } from '../types';

interface Props {
  title: string;
  description?: string;
  type: string;
  element: Element;
  isFlipped: boolean;
  resolving?: boolean;
}

const elementColors: Record<string, { primary: string; secondary: string; glow: string; accent: string }> = {
  [Element.FIRE]: { primary: '#ef4444', secondary: '#f97316', glow: 'rgba(239,68,68,0.3)', accent: '#fde047' },
  [Element.EARTH]: { primary: '#22c55e', secondary: '#16a34a', glow: 'rgba(34,197,94,0.3)', accent: '#84cc16' },
  [Element.WIND]: { primary: '#0ea5e9', secondary: '#38bdf8', glow: 'rgba(14,165,233,0.3)', accent: '#f0f9ff' },
  [Element.WATER]: { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(59,130,246,0.3)', accent: '#bfdbfe' },
  [Element.NEUTRAL]: { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168,85,247,0.3)', accent: '#e9d5ff' },
  [Element.MAGMA]: { primary: '#f97316', secondary: '#ea580c', glow: 'rgba(249,115,22,0.3)', accent: '#fed7aa' },
  [Element.LIGHT]: { primary: '#facc15', secondary: '#fde047', glow: 'rgba(250,204,21,0.3)', accent: '#fef08a' },
  [Element.DARK]: { primary: '#a855f7', secondary: '#7e22ce', glow: 'rgba(168,85,247,0.3)', accent: '#d8b4fe' },
  [Element.STORM]: { primary: '#6366f1', secondary: '#818cf8', glow: 'rgba(99,102,241,0.3)', accent: '#c7d2fe' },
  [Element.ICE]: { primary: '#22d3ee', secondary: '#67e8f9', glow: 'rgba(34,211,238,0.3)', accent: '#a5f3fc' },
};

const defaultColor = { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168,85,247,0.3)', accent: '#e9d5ff' };

const ChestScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.1" />
    <g className={resolving ? 'animate-chest-open' : 'animate-chest-idle'}>
      <g>
        <rect x="50" y="130" width="140" height="90" rx="4" fill="#4a3520" />
        <rect x="50" y="130" width="140" height="90" rx="4" fill="none" stroke="#2a1f10" strokeWidth="2" />
        <rect x="52" y="132" width="136" height="2" fill="#2a1f10" />
        <rect x="52" y="152" width="136" height="2" fill="#2a1f10" />
        <rect x="52" y="172" width="136" height="2" fill="#2a1f10" />
        <rect x="52" y="192" width="136" height="2" fill="#2a1f10" />
        <rect x="52" y="210" width="136" height="2" fill="#2a1f10" />
      </g>
      <g className={resolving ? 'chest-lid-open' : ''}>
        <path d="M45 130 Q120 90 195 130 Z" fill="#5c4530" stroke="#2a1f10" strokeWidth="2" />
        <rect x="86" y="135" width="12" height="8" rx="2" fill="#6b5b3a" />
        <rect x="142" y="135" width="12" height="8" rx="2" fill="#6b5b3a" />
      </g>
      <circle cx="120" cy="175" r="14" fill={colors.primary} opacity="0.9" />
      <circle cx="120" cy="175" r="14" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
      <circle cx="120" cy="175" r="4" fill={colors.accent} />
    </g>
    <circle cx="120" cy="175" r="20" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.3" className="animate-pulse-slow" />
  </svg>
);

const AltarScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, _resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.08" />
    <rect x="70" y="200" width="100" height="20" rx="2" fill="#2a2a35" />
    <rect x="55" y="220" width="130" height="15" rx="2" fill="#1a1a25" />
    <rect x="40" y="235" width="160" height="12" rx="2" fill="#151520" />
    <rect x="60" y="140" width="120" height="60" rx="3" fill="#353540" stroke="#4a4a55" strokeWidth="1" />
    <g className="animate-rune-glow" style={{ '--rune-color': colors.primary } as React.CSSProperties}>
      <path d="M90 160 L100 150 L110 160 L100 170 Z" fill={colors.primary} opacity="0.8" />
      <path d="M130 155 L140 145 L150 155 L140 165 Z" fill={colors.primary} opacity="0.6" />
      <path d="M105 175 L115 165 L125 175 L115 185 Z" fill={colors.accent} opacity="0.4" />
      <path d="M100 150 L120 150" stroke={colors.primary} strokeWidth="1" opacity="0.5" />
      <path d="M100 170 L120 170" stroke={colors.primary} strokeWidth="1" opacity="0.5" />
    </g>
    <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at center, ${colors.primary}88 0%, transparent 60%)`, opacity: 0.15 }} />
  </svg>
);

const FountainScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, _resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.08" />
    <rect x="55" y="210" width="130" height="15" rx="3" fill="#2a2a35" />
    <rect x="40" y="225" width="160" height="12" rx="2" fill="#1a1a25" />
    <rect x="110" y="160" width="20" height="50" rx="4" fill="#3a3a45" />
    <rect x="115" y="120" width="10" height="40" rx="5" fill="#4a4a55" />
    <g className="animate-fountain-flow">
      <ellipse cx="120" cy="115" rx="6" ry="12" fill={colors.secondary} opacity="0.6" />
      <circle cx="120" cy="100" r="4" fill={colors.accent} opacity="0.5" />
      <circle cx="112" cy="90" r="2" fill={colors.primary} opacity="0.4" />
      <circle cx="128" cy="95" r="2" fill={colors.secondary} opacity="0.4" />
      <circle cx="120" cy="80" r="1.5" fill={colors.accent} opacity="0.3" />
    </g>
    <ellipse cx="120" cy="215" rx="60" ry="8" fill={colors.primary} opacity="0.08" />
  </svg>
);

const CampfireScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, _resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <g className="animate-fire-glow">
      <ellipse cx="120" cy="230" rx="60" ry="30" fill={colors.primary} opacity="0.15" />
      <ellipse cx="120" cy="230" rx="40" ry="20" fill={colors.secondary} opacity="0.2" />
    </g>
    <rect x="95" y="225" width="50" height="8" rx="3" fill="#3a2510" transform="rotate(-15 120 229)" />
    <rect x="90" y="225" width="50" height="8" rx="3" fill="#2a1a0a" transform="rotate(20 120 229)" />
    <rect x="100" y="225" width="45" height="7" rx="3" fill="#4a3018" transform="rotate(-5 120 229)" />
    <g className="animate-fire-flame">
      <path d="M120 180 Q110 200 105 220 L135 220 Q130 200 120 180 Z" fill={colors.secondary} opacity="0.7" />
      <path d="M120 190 Q113 205 110 218 L130 218 Q127 205 120 190 Z" fill={colors.accent} opacity="0.8" />
      <path d="M120 200 Q115 210 113 218 L127 218 Q125 210 120 200 Z" fill="#ffffff" opacity="0.6" />
    </g>
    <g className="animate-spark-rise">
      <circle cx="115" cy="190" r="1.5" fill={colors.accent} opacity="0.8" />
      <circle cx="125" cy="185" r="1" fill={colors.accent} opacity="0.6" />
      <circle cx="118" cy="175" r="1" fill={colors.primary} opacity="0.5" />
      <circle cx="123" cy="170" r="0.8" fill={colors.accent} opacity="0.4" />
      <circle cx="120" cy="160" r="0.8" fill={colors.primary} opacity="0.3" />
    </g>
  </svg>
);

const RuneScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, _resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.08" />
    <path d="M70 120 Q120 90 170 120 L180 220 Q120 250 60 220 Z" fill="#252535" stroke="#3a3a4a" strokeWidth="2" />
    <g className="animate-rune-glow" style={{ '--rune-color': colors.primary } as React.CSSProperties}>
      <path d="M95 150 L120 130 L145 150 L120 170 Z" fill={colors.primary} opacity="0.7" />
      <path d="M100 175 L120 160 L140 175 L120 190 Z" fill={colors.secondary} opacity="0.5" />
      <text x="120" y="150" textAnchor="middle" fontSize="12" fill={colors.accent} opacity="0.6">ᚠ</text>
      <text x="120" y="180" textAnchor="middle" fontSize="10" fill={colors.primary} opacity="0.4">ᚢ</text>
      <text x="105" y="135" textAnchor="middle" fontSize="8" fill={colors.accent} opacity="0.3">ᚦ</text>
      <text x="135" y="135" textAnchor="middle" fontSize="8" fill={colors.accent} opacity="0.3">ᚨ</text>
    </g>
    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 120px 180px, ${colors.primary}44 0%, transparent 50%)` }} />
  </svg>
);

const BarrierScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <g className={resolving ? 'animate-barrier-break' : 'animate-barrier-pulse'}>
      <rect x="80" y="60" width="80" height="200" rx="4" fill={colors.primary} opacity="0.15" />
      <rect x="85" y="65" width="70" height="190" rx="3" fill="none" stroke={colors.primary} strokeWidth="2" opacity="0.5" />
      <rect x="90" y="70" width="60" height="180" rx="2" fill="none" stroke={colors.secondary} strokeWidth="1" opacity="0.3" />
      <line x1="80" y1="100" x2="160" y2="100" stroke={colors.primary} strokeWidth="1" opacity="0.4" />
      <line x1="80" y1="140" x2="160" y2="140" stroke={colors.primary} strokeWidth="1" opacity="0.4" />
      <line x1="80" y1="180" x2="160" y2="180" stroke={colors.primary} strokeWidth="1" opacity="0.4" />
      <line x1="80" y1="220" x2="160" y2="220" stroke={colors.primary} strokeWidth="1" opacity="0.4" />
    </g>
    <g className="animate-barrier-particles">
      <circle cx="90" cy="120" r="2" fill={colors.accent} opacity="0.6" />
      <circle cx="150" cy="160" r="2" fill={colors.accent} opacity="0.6" />
      <circle cx="100" cy="200" r="1.5" fill={colors.secondary} opacity="0.5" />
      <circle cx="140" cy="100" r="1.5" fill={colors.secondary} opacity="0.5" />
      <circle cx="110" cy="150" r="1" fill={colors.primary} opacity="0.7" />
      <circle cx="130" cy="190" r="1" fill={colors.primary} opacity="0.7" />
    </g>
  </svg>
);

const MerchantScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, _resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.05" />
    <polygon points="40,180 200,180 120,80" fill="#2a1f10" stroke="#4a3520" strokeWidth="2" />
    <rect x="40" y="180" width="160" height="3" fill="#4a3520" />
    <rect x="50" y="185" width="140" height="60" rx="2" fill="#3a2515" stroke="#4a3520" strokeWidth="1" />
    <rect x="55" y="195" width="25" height="15" rx="1" fill={colors.secondary} opacity="0.5" />
    <rect x="85" y="195" width="25" height="15" rx="1" fill={colors.primary} opacity="0.5" />
    <rect x="115" y="195" width="25" height="15" rx="1" fill={colors.accent} opacity="0.5" />
    <rect x="145" y="195" width="25" height="15" rx="1" fill={colors.secondary} opacity="0.4" />
    <circle cx="67" cy="202" r="3" fill={colors.primary} opacity="0.8" />
    <circle cx="97" cy="202" r="3" fill={colors.accent} opacity="0.8" />
    <circle cx="127" cy="202" r="3" fill={colors.primary} opacity="0.8" />
    <circle cx="157" cy="202" r="3" fill={colors.secondary} opacity="0.8" />
    <line x1="55" y1="225" x2="185" y2="225" stroke="#4a3520" strokeWidth="1" />
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center bottom, ${colors.primary}22 0%, transparent 60%)` }} />
  </svg>
);

const LeverScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.08" />
    <rect x="95" y="160" width="50" height="80" rx="3" fill="#2a2a35" stroke="#4a4a55" strokeWidth="1" />
    <rect x="85" y="155" width="70" height="10" rx="2" fill="#353540" />
    <rect x="100" y="235" width="40" height="8" rx="2" fill="#1a1a25" />
    <ellipse cx="120" cy="240" rx="35" ry="6" fill="#151520" />
    <g className={resolving ? 'animate-lever-pull' : 'animate-lever-idle'} style={{ transformOrigin: '120px 160px' }}>
      <rect x="117" y="90" width="6" height="70" rx="3" fill="#6b5b3a" />
      <circle cx="120" cy="90" r="10" fill={colors.primary} opacity="0.8" />
      <circle cx="120" cy="90" r="6" fill={colors.accent} opacity="0.4" />
    </g>
    {resolving && (
      <g className="animate-lever-sparks">
        <circle cx="130" cy="100" r="2" fill={colors.accent} opacity="0.8" />
        <circle cx="110" cy="95" r="1.5" fill={colors.primary} opacity="0.7" />
        <circle cx="135" cy="110" r="1.5" fill={colors.secondary} opacity="0.6" />
        <circle cx="105" cy="105" r="1" fill={colors.accent} opacity="0.5" />
      </g>
    )}
    <rect x="100" y="210" width="40" height="3" rx="1" fill="#3a3a45" />
    <rect x="100" y="218" width="40" height="3" rx="1" fill="#3a3a45" />
    <circle cx="120" cy="170" r="3" fill="#4a4a55" />
    <circle cx="120" cy="185" r="3" fill="#4a4a55" />
    <circle cx="120" cy="200" r="3" fill="#4a4a55" />
  </svg>
);

const SacrificialAltarScene: React.FC<{ colors: typeof defaultColor; resolving?: boolean }> = ({ colors, _resolving }) => (
  <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
    <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.1" />
    <rect x="65" y="180" width="110" height="60" rx="3" fill="#2a2020" stroke="#4a3030" strokeWidth="1" />
    <rect x="50" y="240" width="140" height="15" rx="2" fill="#1a1515" />
    <path d="M65 180 Q120 160 175 180" fill="#3a2525" stroke="#4a3030" strokeWidth="1" />
    <g className="animate-rune-glow" style={{ '--rune-color': colors.primary } as React.CSSProperties}>
      <circle cx="95" cy="195" r="4" fill={colors.primary} opacity="0.6" />
      <circle cx="120" cy="190" r="5" fill={colors.primary} opacity="0.8" />
      <circle cx="145" cy="195" r="4" fill={colors.primary} opacity="0.6" />
      <path d="M120 185 L120 195" stroke={colors.accent} strokeWidth="1.5" opacity="0.7" />
      <path d="M115 190 L125 190" stroke={colors.accent} strokeWidth="1.5" opacity="0.7" />
    </g>
    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 120px 190px, ${colors.primary}66 0%, transparent 50%)` }} />
  </svg>
);

const getSceneColors = (element: Element) => elementColors[element] || defaultColor;

const matchScene = (title: string, type: string, colors: typeof defaultColor, isFlipped: boolean, resolving?: boolean, description?: string): React.ReactNode => {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  if (lowerDesc.includes('barriär')) {
    return <BarrierScene colors={colors} resolving={resolving} />;
  }
  const scenes: { match: string; scene: React.ReactNode }[] = [
    { match: 'kista', scene: <ChestScene colors={colors} resolving={resolving} /> },
    { match: 'uråldrigt altare', scene: <AltarScene colors={colors} resolving={resolving} /> },
    { match: 'offersaltare', scene: <SacrificialAltarScene colors={colors} resolving={resolving} /> },
    { match: 'källa', scene: <FountainScene colors={colors} resolving={resolving} /> },
    { match: 'rastplats', scene: <CampfireScene colors={colors} resolving={resolving} /> },
    { match: 'gåtan', scene: <RuneScene colors={colors} resolving={resolving} /> },
    { match: 'handlare', scene: <MerchantScene colors={colors} resolving={resolving} /> },
    { match: 'mekanism', scene: <LeverScene colors={colors} resolving={resolving} /> },
    { match: 'spak', scene: <LeverScene colors={colors} resolving={resolving} /> },
  ];
  for (const s of scenes) {
    if (lowerTitle.includes(s.match)) return s.scene;
  }
  if (type === 'COMBAT') {
    return (
      <svg viewBox="0 0 240 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="240" height="320" fill="#0a0a14" />
        <rect x="0" y="0" width="240" height="320" fill={`${colors.glow}`} opacity="0.08" />
        <g className="animate-barrier-pulse">
          <line x1="50" y1="80" x2="190" y2="80" stroke={colors.primary} strokeWidth="1" opacity="0.3" />
          <line x1="40" y1="120" x2="200" y2="120" stroke={colors.primary} strokeWidth="1" opacity="0.2" />
          <line x1="30" y1="160" x2="210" y2="160" stroke={colors.primary} strokeWidth="1" opacity="0.15" />
          <line x1="40" y1="200" x2="200" y2="200" stroke={colors.primary} strokeWidth="1" opacity="0.2" />
          <line x1="50" y1="240" x2="190" y2="240" stroke={colors.primary} strokeWidth="1" opacity="0.3" />
        </g>
        <circle cx="120" cy="160" r="30" fill="none" stroke={colors.primary} strokeWidth="2" opacity="0.3" className="animate-ping-slow" />
        <circle cx="120" cy="160" r="20" fill={colors.primary} opacity="0.1" />
      </svg>
    );
  }
  return null;
};

const EventScene: React.FC<Props> = ({ title, description, type, element, isFlipped, resolving }) => {
  if (!isFlipped) return null;
  const colors = getSceneColors(element);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-[1] flex items-center justify-center opacity-40">
      {matchScene(title, type, colors, isFlipped, resolving, description)}
    </div>
  );
};

export default EventScene;
