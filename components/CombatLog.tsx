import React, { useEffect, useRef } from 'react';

interface CombatLogProps {
  log: string[];
}

const CombatLog: React.FC<CombatLogProps> = ({ log }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll combat log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div 
      ref={logContainerRef}
      className="flex-grow min-w-0 h-16 landscape:h-full overflow-y-auto custom-scrollbar text-[9px] bg-black/30 p-2 font-mono leading-relaxed border-b landscape:border-b-0 landscape:border-r border-gray-700/30"
    >
      {log.map((msg, i) => (
        <p key={i} className={`pb-0.5 mb-0.5 ${i === log.length - 1 ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>
          {i === log.length - 1 && <span className="text-yellow-500 mr-1">▶</span>}{msg}
        </p>
      ))}
    </div>
  );
};

export default CombatLog;
