import React from 'react';
import type { Character } from '../types';

interface GameOverScreenProps {
    result: 'victory' | 'defeat';
    character: Character;
    roundLevel: number;
    onNewGame: () => void;
    onMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ result, character, roundLevel, onNewGame, onMainMenu }) => {
    const isVictory = result === 'victory';

    return (
        <div className="flex-grow w-full h-full flex items-center justify-center text-white font-['Press_Start_2P'] relative overflow-hidden">
            {/* Background */}
            <div className={`absolute inset-0 ${isVictory ? 'bg-gradient-to-b from-yellow-900/40 via-purple-900/30 to-black' : 'bg-gradient-to-b from-red-900/40 via-gray-900/50 to-black'}`} />

            {/* Particles/VFX */}
            {isVictory && (
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `orb-float ${3 + Math.random() * 4}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 2}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="relative z-10 text-center max-w-lg">
                {/* Title */}
                <h1 className={`text-4xl mb-4 ${isVictory ? 'text-yellow-400 animate-pulse-glow' : 'text-red-400'}`}>
                    {isVictory ? 'Seger!' : 'Besegrad...'}
                </h1>

                {isVictory ? (
                    <>
                        <p className="text-lg text-gray-300 mb-2">
                            {character.name} har erövrat elementen!
                        </p>
                        <p className="text-sm text-gray-400 mb-6">
                            Alla {roundLevel} rundor är avklarade. Elementalernas kraft är din.
                        </p>
                        <div className="bg-black/40 border border-yellow-700/50 p-4 mb-6 text-left space-y-2">
                            <h3 className="text-yellow-500 text-sm text-center mb-3">Slutstatistik</h3>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Namn</span>
                                <span className="text-white">{character.name}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Nivå</span>
                                <span className="text-white">{character.level}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Archetyp</span>
                                <span className="text-white">{character.archetype}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Rundor klara</span>
                                <span className="text-white">{roundLevel}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Styrka</span>
                                <span className="text-white">{character.stats.strength}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Dexteritet</span>
                                <span className="text-white">{character.stats.dexterity}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Intelligens</span>
                                <span className="text-white">{character.stats.intelligence}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Konstitution</span>
                                <span className="text-white">{character.stats.constitution}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-lg text-gray-300 mb-2">
                            {character.name} har fallit.
                        </p>
                        <p className="text-sm text-gray-400 mb-6">
                            Runda {roundLevel} — elementen var för mäktiga denna gång.
                        </p>
                        <div className="bg-black/40 border border-red-900/50 p-4 mb-6 text-left space-y-2">
                            <h3 className="text-red-400 text-sm text-center mb-3">Sammanfattning</h3>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Nivå</span>
                                <span className="text-white">{character.level}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Rundor överlevda</span>
                                <span className="text-white">{roundLevel}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Archetyp</span>
                                <span className="text-white">{character.archetype}</span>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={onNewGame}
                        className="px-6 py-3 border-2 text-sm bg-gray-800/50 border-gray-600 hover:border-yellow-400 text-white transition-colors"
                    >
                        Spela igen
                    </button>
                    <button
                        onClick={onMainMenu}
                        className="px-6 py-3 border-2 text-xs bg-gray-800/50 border-gray-600 hover:border-gray-400 text-gray-400 transition-colors"
                    >
                        Huvudmeny
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverScreen;
