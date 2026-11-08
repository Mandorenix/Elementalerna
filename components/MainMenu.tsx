import React from 'react';
import ElementalVFX from './ElementalVFX';
import { Element } from '../types';

interface MainMenuProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  hasSave: boolean;
}

// Play / Continue icon
const PlayIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

// New adventure / plus icon
const NewIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onContinueGame, hasSave }) => {
  const [hoverStart, setHoverStart] = React.useState(false);
  const [hoverContinue, setHoverContinue] = React.useState(false);

  return (
    <div
      className="flex-grow w-full h-full flex flex-col items-end justify-end text-white font-['Press_Start_2P'] relative overflow-hidden bg-black main-menu-bg"
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* Subtle bottom gradient for button readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

      {/* Retro pixel overlay */}
      <div
        className="absolute inset-0 z-0 opacity-10 bg-repeat pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C9C9C\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1V1H0V0h5zM0 5h1v1H0z\'/%3E%3C/g%3E%3C/svg%3E")' }}
      />

      {/* Ice VFX in the centre */}
      <div className="absolute top-[45%] left-[50%] w-64 h-48 opacity-70 mix-blend-screen pointer-events-none transform -translate-x-1/2 z-10">
        <ElementalVFX element={Element.ICE} isActive={true} />
      </div>

      {/* Icon buttons — bottom-right corner, adapts to orientation */}
      <div className="relative z-20 flex flex-row items-end gap-4 px-6 pb-10 w-full justify-end landscape:pb-6 landscape:px-8">

        {/* New Adventure button */}
        <div
          className="relative"
          onMouseEnter={() => setHoverStart(true)}
          onMouseLeave={() => setHoverStart(false)}
        >
          {/* Fire VFX on hover */}
          <div className="absolute -inset-4 pointer-events-none opacity-90 mix-blend-screen z-0">
            <ElementalVFX element={Element.FIRE} isActive={hoverStart} />
          </div>

          <button
            onClick={onStartGame}
            title="Nytt Äventyr"
            className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            {/* Icon circle */}
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300
              border-[#ef4444] bg-[#1a0808]/80 text-[#fca5a5]
              group-hover:border-[#ea580c] group-hover:bg-[#2a1010]/90 group-hover:text-[#fffbeb]
              shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:shadow-[0_0_25px_rgba(234,88,12,0.9)]
              group-active:scale-90
              ${hoverStart ? 'scale-110' : 'scale-100'}
            `}>
              <NewIcon className="w-7 h-7" />
            </div>
            {/* Label */}
            <span className="text-[6px] text-[#fca5a5] group-hover:text-white transition-colors tracking-wide uppercase whitespace-nowrap">
              Nytt äventyr
            </span>
          </button>
        </div>

        {/* Continue button — only if save exists */}
        {hasSave && (
          <div
            className="relative"
            onMouseEnter={() => setHoverContinue(true)}
            onMouseLeave={() => setHoverContinue(false)}
          >
            {/* Storm VFX on hover */}
            <div className="absolute -inset-4 pointer-events-none opacity-90 mix-blend-screen z-0">
              <ElementalVFX element={Element.STORM} isActive={hoverContinue} />
            </div>

            <button
              onClick={onContinueGame}
              title="Fortsätt Äventyret"
              className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              {/* Icon circle */}
              <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300
                border-[#f59e0b] bg-[#1a1200]/80 text-[#fde047]
                group-hover:border-[#facc15] group-hover:bg-[#2a1e00]/90 group-hover:text-white
                shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:shadow-[0_0_25px_rgba(250,204,21,0.9)]
                animate-pulse-glow group-active:scale-90
                ${hoverContinue ? 'scale-110' : 'scale-100'}
              `}>
                <PlayIcon className="w-8 h-8 ml-1" />
              </div>
              {/* Label */}
              <span className="text-[6px] text-[#fde047] group-hover:text-white transition-colors tracking-wide uppercase whitespace-nowrap">
                Fortsätt
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainMenu;