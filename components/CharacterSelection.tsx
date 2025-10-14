import React, { useState } from 'react';
import type { Archetype } from '../types';
import { ARCHETYPES, elementThemes } from '../constants';

// Ny komponent för bara den klickbara ikonen
const ArchetypeIcon: React.FC<{ archetype: Archetype; onSelect: (archetype: Archetype) => void; isSelected: boolean; }> = ({ archetype, onSelect, isSelected }) => {
    const theme = elementThemes[archetype.element];
    const Icon = archetype.icon;
    return (
        <button
            onClick={() => onSelect(archetype)}
            className={`flex flex-col items-center p-2 border-2 transition-all duration-300
                        ${isSelected ? 'border-yellow-400 bg-yellow-500/20' : 'border-gray-700 bg-black/30 hover:border-yellow-400 hover:bg-yellow-500/10'}`}
            title={archetype.name} // Lägger till title-attribut för tillgänglighet
        >
            <div className={`w-10 h-10 flex items-center justify-center mb-1 ${theme}`}>
                <div className="transform scale-125"><Icon /></div>
            </div>
            {/* <span className="text-xs text-yellow-300">{archetype.name}</span> -- Borttagen textetikett */}
        </button>
    );
};

// Den omdöpta och uppdaterade detaljkomponenten för arketypen
const ArchetypeCardDetails: React.FC<{ archetype: Archetype; onSelect: () => void; }> = ({ archetype, onSelect }) => {
    const theme = elementThemes[archetype.element];
    // Ikonen visas inte direkt här, men temat används för bakgrund/kant
    return (
        <div className={`p-4 flex flex-col items-center bg-black/30 pixelated-border text-center transition-all duration-300 ${theme}`}>
            <h3 className="text-xl text-yellow-400 mb-2">{archetype.name}</h3>
            <p className="text-sm text-gray-400 flex-grow mb-4">{archetype.description}</p>
            <div className="text-left text-sm text-green-400 w-full mb-4">
                <h4 className="font-bold text-gray-300 mb-1">Startbonus:</h4>
                {Object.entries(archetype.statBonuses).map(([stat, value]) => (
                    <p key={stat}>+ {value} {stat}</p>
                ))}
            </div>
            <div className="text-left text-sm text-cyan-400 w-full mb-4">
                <h4 className="font-bold text-gray-300 mb-1">Unik Resurs:</h4>
                <p>{archetype.resourceName}</p>
            </div>
            <button onClick={onSelect} className="w-full px-3 py-2 border-2 text-sm bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors">
                Välj denna Arketyp
            </button>
        </div>
    )
}


const CharacterSelection: React.FC<{ onSelectArchetype: (archetype: Archetype) => void; }> = ({ onSelectArchetype }) => {
    const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);

    return (
        <div className="flex-grow w-full h-full p-6 text-white flex flex-col items-center justify-center">
            <h1 className="text-3xl text-yellow-400 mb-4">Välj din Arketyp</h1>
            <p className="text-sm text-gray-400 mb-8 max-w-2xl text-center">
                Ditt val av arketyp definierar din startpunkt, ger dig unika bonusar och låser upp din första elementära färdighet. Välj med omsorg, äventyrare.
            </p>

            {/* Rad med klickbara ikoner */}
            <div className="flex justify-center space-x-4 mb-8">
                {ARCHETYPES.map(archetype => (
                    <ArchetypeIcon
                        key={archetype.name}
                        archetype={archetype}
                        onSelect={setSelectedArchetype}
                        isSelected={selectedArchetype?.name === archetype.name}
                    />
                ))}
            </div>

            {/* Detaljerad kortvisning för den valda arketypen */}
            {selectedArchetype && (
                <div className="max-w-sm w-full">
                    <ArchetypeCardDetails archetype={selectedArchetype} onSelect={() => onSelectArchetype(selectedArchetype)} />
                </div>
            )}
        </div>
    );
};

export default CharacterSelection;