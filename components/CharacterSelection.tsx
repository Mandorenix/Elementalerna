import React, { useState } from 'react';
import type { Archetype } from '../types';
import { ARCHETYPES, elementThemes } from '../constants';
import ElementalVFX from './ElementalVFX';

const ArchetypeCard: React.FC<{
    archetype: Archetype;
    onSelect: (archetype: Archetype) => void;
    isSelected: boolean;
    isCurrentStep: boolean;
    isAnySelected: boolean;
    onConfirm?: () => void;
    step: 'primary' | 'secondary';
}> = ({ archetype, onSelect, isSelected, isCurrentStep, isAnySelected, onConfirm, step }) => {
    const theme = elementThemes[archetype.element];
    const SpriteOrIcon = archetype.sprite || archetype.icon;

    const unselectedStyle = isAnySelected && !isSelected ? 'opacity-40 scale-90 blur-[2px]' : '';
    const selectedStyle = isSelected
        ? 'scale-105 z-20 shadow-2xl shadow-yellow-600/50 event-card-boss border-yellow-500'
        : 'hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20 hover:border-gray-400 event-card-front';

    const borderColor = step === 'primary' ? 'border-l-yellow-500' : 'border-l-purple-500';

    return (
        <div
            onClick={() => onSelect(archetype)}
            className={`relative flex flex-col items-center text-center cursor-pointer transition-all duration-500 ease-out transform-gpu ${unselectedStyle} ${selectedStyle}`}
            style={{ padding: '8px' }}
        >
            <div className={`absolute inset-0 opacity-20 pointer-events-none rounded-lg ${theme}`} />

            <div className="relative z-10 w-full flex flex-col">
                <div
                    className="mx-auto mb-1 border-2 border-gray-700 bg-black/50 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ width: 32, height: 32 }}
                >
                    <div style={{ transform: 'scale(1.3)' }}><SpriteOrIcon /></div>
                </div>

                <h3
                    className={`font-bold mb-1 leading-tight ${isSelected ? 'text-yellow-400' : 'text-gray-200'}`}
                    style={{ fontSize: '0.5rem', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                >
                    {archetype.name}
                </h3>

                <div
                    className="text-left text-green-400 w-full bg-black/40 rounded mb-1"
                    style={{ fontSize: '0.42rem', padding: '3px 4px' }}
                >
                    <span className="font-bold text-gray-300">Bonus: </span>
                    {Object.entries(archetype.statBonuses).map(([stat, value]) => (
                        <span key={stat}>+{value} {stat} </span>
                    ))}
                </div>

                <div
                    className="text-left text-cyan-400 w-full bg-black/40 rounded"
                    style={{ fontSize: '0.42rem', padding: '3px 4px' }}
                >
                    <span className="font-bold text-gray-300">Resurs: </span>
                    {archetype.resourceName}
                </div>

                {isCurrentStep && isSelected && onConfirm && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                        className="mt-2 w-full border-2 bg-yellow-800/80 border-yellow-500 hover:bg-yellow-700 text-yellow-300 font-bold rounded"
                        style={{ fontSize: '0.42rem', padding: '5px 2px' }}
                    >
                        {step === 'primary' ? 'Välj som Huvudarketyp' : 'Börja Äventyret'}
                    </button>
                )}

                {!isCurrentStep && isSelected && (
                    <div
                        className="mt-1 text-center text-[10px] text-gray-500"
                    >
                        {step === 'primary' ? 'Huvudarketyp' : 'Sekundär arketyp'} ✓
                    </div>
                )}
            </div>

            <ElementalVFX element={archetype.element} isActive={isSelected} />
        </div>
    );
};

const CharacterSelection: React.FC<{ onSelectCharacter: (primary: Archetype, secondary?: Archetype) => void }> = ({ onSelectCharacter }) => {
    const [step, setStep] = useState<'primary' | 'secondary'>('primary');
    const [primaryArchetype, setPrimaryArchetype] = useState<Archetype | null>(null);
    const [secondaryArchetype, setSecondaryArchetype] = useState<Archetype | null>(null);

    const handleSelectPrimary = (archetype: Archetype) => {
        setPrimaryArchetype(archetype);
    };

    const handleConfirmPrimary = () => {
        if (primaryArchetype) {
            setStep('secondary');
        }
    };

    const handleSelectSecondary = (archetype: Archetype) => {
        setSecondaryArchetype(archetype);
    };

    const handleConfirmSecondary = () => {
        if (primaryArchetype && secondaryArchetype) {
            onSelectCharacter(primaryArchetype, secondaryArchetype);
        }
    };

    const handleSkipSecondary = () => {
        if (primaryArchetype) {
            onSelectCharacter(primaryArchetype);
        }
    };

    const handleReset = () => {
        setStep('primary');
        setPrimaryArchetype(null);
        setSecondaryArchetype(null);
    };

    const availableForSecondary = primaryArchetype
        ? ARCHETYPES.filter(a => a.name !== primaryArchetype.name)
        : ARCHETYPES;

    return (
        <div
            className="flex-grow w-full h-full text-white flex flex-col items-center overflow-y-auto relative"
            style={{ perspective: '1000px', padding: '10px' }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80 pointer-events-none" />

            <div className="archetype-header relative z-10 text-center mb-3">
                <h1
                    className="archetype-title text-yellow-500 font-bold"
                    style={{ fontSize: 'clamp(0.65rem, 3.5vw, 1.5rem)', textShadow: '0 4px 10px rgba(0,0,0,1)', marginBottom: '2px' }}
                >
                    {step === 'primary' ? 'Välj din Huvudarketyp' : 'Välj din Sekundära Arketyp'}
                </h1>
                <p className="archetype-subtitle text-gray-400" style={{ fontSize: '0.55rem' }}>
                    {step === 'primary'
                        ? 'Din huvudarketyp bestämmer din statbonus och resursmekanik.'
                        : 'Din sekundära arketyp ger halva statbonusen och tillgång till deras färdighetsträd.'}
                </p>
                {step === 'secondary' && (
                    <p className="text-gray-500 mt-1" style={{ fontSize: '0.5rem' }}>
                        Vald huvudarketyp: <span className="text-yellow-400 font-bold">{primaryArchetype?.name}</span>
                    </p>
                )}
            </div>

            <div
                className="archetype-grid relative z-10 w-full"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    maxWidth: '600px',
                }}
            >
                {(step === 'primary' ? ARCHETYPES : availableForSecondary).map(archetype => {
                    const isSelected = step === 'primary'
                        ? primaryArchetype?.name === archetype.name
                        : secondaryArchetype?.name === archetype.name;
                    const selectedAny = (step === 'primary' && primaryArchetype !== null) || (step === 'secondary' && secondaryArchetype !== null);

                    return (
                        <ArchetypeCard
                            key={archetype.name}
                            archetype={archetype}
                            onSelect={step === 'primary' ? handleSelectPrimary : handleSelectSecondary}
                            isSelected={isSelected}
                            isCurrentStep={step === 'primary' ? primaryArchetype?.name === archetype.name : secondaryArchetype?.name === archetype.name}
                            isAnySelected={selectedAny}
                            onConfirm={step === 'primary' ? handleConfirmPrimary : handleConfirmSecondary}
                            step={step}
                        />
                    );
                })}
            </div>

            {/* Selected character summary */}
            {primaryArchetype && step === 'secondary' && (
                <div className="relative z-10 mt-4 flex flex-col items-center gap-2">
                    <div className="text-center bg-black/60 border border-gray-700 rounded-sm p-3" style={{ maxWidth: '400px' }}>
                        <div style={{ fontSize: '0.5rem' }}>
                            <span className="text-yellow-400 font-bold">{primaryArchetype.name}</span>
                            {secondaryArchetype && (
                                <> + <span className="text-purple-400 font-bold">{secondaryArchetype.name}</span></>
                            )}
                        </div>
                        {secondaryArchetype && (
                            <div className="text-green-400 mt-1" style={{ fontSize: '0.42rem' }}>
                                Totala statbonusar:{' '}
                                {Object.entries(primaryArchetype.statBonuses).map(([stat, val]) => {
                                    const secVal = Math.floor((secondaryArchetype.statBonuses[stat as keyof typeof secondaryArchetype.statBonuses] || 0) / 2);
                                    return <span key={stat}>{stat}+{val}{secVal > 0 ? `(${secVal})` : ''} </span>;
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSkipSecondary}
                            className="px-3 py-1 border border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded"
                            style={{ fontSize: '0.42rem' }}
                        >
                            Hoppa över (bara {primaryArchetype.name})
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3 py-1 border border-red-800 bg-red-900/30 hover:bg-red-800/50 text-red-400 font-bold rounded"
                            style={{ fontSize: '0.42rem' }}
                        >
                            Byt Huvudarketyp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterSelection;