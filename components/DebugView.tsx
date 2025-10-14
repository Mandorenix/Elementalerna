import React from 'react';

interface DebugViewProps {
    addDebugXP: () => void;
    addDebugSkillPoint: () => void;
    addDebugAttrPoint: () => void;
    addDebugItem: () => void;
    debugHealPlayer: () => void;
    resetCharacter: () => void;
}

const DebugButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-full px-3 py-2 border-2 text-sm bg-gray-800/50 border-gray-600 hover:border-yellow-400 text-white transition-colors">
        {children}
    </button>
);

const DebugView: React.FC<DebugViewProps> = (props) => {
    return (
        <div className="flex-grow w-full h-full p-6 text-white overflow-y-auto">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl text-yellow-400 mb-6 text-center">Debug Panel</h1>
                <div className="p-4 bg-black/30 pixelated-border">
                    <div className="grid grid-cols-2 gap-4">
                        <DebugButton onClick={props.addDebugXP}>+100 XP</DebugButton>
                        <DebugButton onClick={props.addDebugSkillPoint}>+1 Skill Point</DebugButton>
                        <DebugButton onClick={props.addDebugAttrPoint}>+1 Attribute Point</DebugButton>
                        <DebugButton onClick={props.addDebugItem}>Add Random Item</DebugButton>
                        <DebugButton onClick={props.debugHealPlayer}>Heal Player</DebugButton>
                        <DebugButton onClick={props.resetCharacter}>Reset Character (Hard)</DebugButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugView;
