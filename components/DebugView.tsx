import React, { useState } from 'react';
import AISettings from './AISettings';

interface DebugViewProps {
    addDebugXP: () => void;
    addDebugSkillPoint: () => void;
    addDebugAttrPoint: () => void;
    addDebugElementalPoint: () => void;
    addDebugItem: () => void;
    debugHealPlayer: () => void;
    resetCharacter: () => void;
    addDebugGold: () => void;
    aiApiKey: string;
    aiModel: string;
    npcDialogueEnabled: boolean;
    aiEventGenEnabled: boolean;
    onAIConfig: (key: string) => void;
    onAIModelChange: (model: string) => void;
    onNPCToggle: (enabled: boolean) => void;
    onEventGenToggle: (enabled: boolean) => void;
}

const DebugButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-full px-3 py-2 border-2 text-sm bg-gray-800/50 border-gray-600 hover:border-yellow-400 text-white transition-colors">
        {children}
    </button>
);

const DebugView: React.FC<DebugViewProps> = (props) => {
    const [showAISettings, setShowAISettings] = useState(false);

    return (
        <div className="flex-grow w-full h-full p-6 text-white overflow-y-auto">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl text-yellow-400 mb-6 text-center">Debug Panel</h1>
                <div className="p-4 bg-black/30 pixelated-border mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <DebugButton onClick={props.addDebugXP}>+100 XP</DebugButton>
                        <DebugButton onClick={props.addDebugSkillPoint}>+1 Skill Point</DebugButton>
                        <DebugButton onClick={props.addDebugAttrPoint}>+1 Attribute Point</DebugButton>
                        <DebugButton onClick={props.addDebugElementalPoint}>+1 Elemental Point</DebugButton>
                        <DebugButton onClick={props.addDebugItem}>Add Random Item</DebugButton>
                        <DebugButton onClick={props.debugHealPlayer}>Heal Player</DebugButton>
                        <DebugButton onClick={props.resetCharacter}>Reset Character (Hard)</DebugButton>
                        <DebugButton onClick={props.addDebugGold}>+100 Gold</DebugButton>
                    </div>
                </div>
                <div className="mb-4 text-center">
                    <button
                        onClick={() => setShowAISettings(!showAISettings)}
                        className="px-4 py-2 border-2 border-yellow-600 bg-yellow-800/30 text-yellow-300 text-xs font-bold hover:bg-yellow-700/50 transition-colors"
                    >
                        {showAISettings ? 'Dölj AI-inställningar' : 'AI-inställningar'}
                    </button>
                </div>
                {showAISettings && (
                  <AISettings 
                    onApiKeyChange={props.onAIConfig}
                    onModelChange={props.onAIModelChange}
                    onNPCToggle={props.onNPCToggle}
                    onEventGenToggle={props.onEventGenToggle}
                    currentModel={props.aiModel}
                    npcEnabled={props.npcDialogueEnabled}
                    eventGenEnabled={props.aiEventGenEnabled}
                  />
                )}
            </div>
        </div>
    );
};

export default DebugView;