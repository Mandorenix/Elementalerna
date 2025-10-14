import React from 'react';
import type { Archetype } from '../types';
import { ARCHETYPES, elementThemes } from '../constants';

const ArchetypeCard: React.FC<{ archetype: Archetype; onSelect: () => void; }> = ({ archetype, onSelect }) => {
    const theme = elementThemes[archetype.element];
    const Icon = archetype.icon;
    return (
        <div className={`p-4 flex flex-col items-center bg-black/30 pixelated-border text-center transition-all duration-300 hover:bg-yellow-500/10`}>
            <div className={`w-16 h-16 border-2 flex items-center justify-center mb-4 ${theme}`}>
                <div className="transform scale-150"><Icon /></div>
            </div>
            <h3 className="text-lg text-yellow-400 mb-2">{archetype.name}</h3>
            <p className="text-xs text-gray-400 flex-grow mb-4">{archetype.description}</p>
            <div className="text-left text-xs text-green-400 w-full mb-4">
                <h4 className="font-bold text-gray-300 mb-1">Startbonus:</h4>
                {Object.entries(archetype.statBonuses).map(([stat, value]) => (
                    <p key={stat}>+ {value} {stat}</p>
                ))}
            </div>
            <div className="text-left text-xs text-cyan-400 w-full mb-4">
                <h4 className="font-bold text-gray-300 mb-1">Unik Resurs:</h4>
                <p>{archetype.resourceName}</p>
            </div>
            <button onClick={onSelect} className="w-full px-3 py-2 border-2 text-sm bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors">
                Välj
            </button>
        </div>
    )
}


const CharacterSelection: React.FC<{ onSelectArchetype: (archetype: Archetype) => void; }> = ({ onSelectArchetype }) => {
    return (
        <div className="flex-grow w-full h-full p-6 text-white flex flex-col items-center justify-center">
            <h1 className="text-3xl text-yellow-400 mb-4">Välj din Arketyp</h1>
            <p className="text-sm text-gray-400 mb-8 max-w-2xl text-center">
                Ditt val av arketyp definierar din startpunkt, ger dig unika bonusar och låser upp din första elementära färdighet. Välj med omsorg, äventyrare.
            </p>
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ARCHETYPES.map(archetype => (
                    <ArchetypeCard key={archetype.name} archetype={archetype} onSelect={() => onSelectArchetype(archetype)} />
                ))}
            </div>
        </div>
    );
};

export default CharacterSelection;