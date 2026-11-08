import React, { useState, useEffect } from 'react';
import type { EventCard, ChoiceOption, Outcome, PuzzleChallenge, MerchantOffer, Item } from '../types';
import { elementThemes, MAX_ROUNDS } from '../constants';
import { Element } from '../types';
import ElementalVFX from './ElementalVFX';
import EventScene from './EventScene';
import RewardDisplay from './RewardDisplay';
import { soundEffects } from '../sound';


const CardBack: React.FC<{ count: number, onClick: () => void }> = ({ count, onClick }) => (
    <div className="flex flex-col items-center">
        <button 
            onClick={onClick}
            disabled={count === 0}
            className="event-card-back-bg deck-pile-card flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:shadow-yellow-600/30 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
            <div className="back-emblem">
                <div className="font-bold font-serif text-white/40" style={{ fontSize: 'clamp(0.6rem, 1.8vw, 1.2rem)' }}>A</div>
            </div>
            <div className="font-bold text-gray-400 uppercase tracking-widest text-center" style={{ fontSize: 'clamp(0.35rem, 1vw, 0.65rem)', marginTop: '4px' }}>Dra ett kort</div>
        </button>
        <div className="mt-2 text-gray-400" style={{ fontSize: 'clamp(0.5rem, 2vw, 0.875rem)' }}>{count} kort kvar</div>
    </div>
);

const DiscardPile: React.FC<{ count: number, onStartNextRound: () => void, canStartNextRound: boolean }> = ({ count, onStartNextRound, canStartNextRound }) => (
    <div className="flex flex-col items-center">
        <div
            className="event-card-back-bg deck-pile-card opacity-30 flex items-center justify-center text-gray-600 text-center"
            style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}
        >
            <div className="back-emblem">
                <div style={{ fontSize: 'clamp(0.4rem, 0.8vw, 0.65rem)' }} className="font-bold font-serif text-white/20">K</div>
            </div>
        </div>
        <div className="mt-2 text-gray-400" style={{ fontSize: 'clamp(0.5rem, 2vw, 0.875rem)' }}>{count} kort</div>
        {canStartNextRound && (
             <button onClick={onStartNextRound} className="mt-2 px-3 py-1 border-2 text-xs bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors animate-pulse-glow">
                Nästa Omgång
            </button>
        )}
    </div>
);

const DrawnCard: React.FC<{ card: EventCard; onResolve: (outcome?: Outcome, item?: Item) => void; playerCurrency: number; playerStats: any; elementalAffinities: Partial<Record<Element, number>>; }> = ({ card, onResolve, playerCurrency, playerStats, elementalAffinities }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showGlow, setShowGlow] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [pendingOutcome, setPendingOutcome] = useState<{ outcome: Outcome; item?: Item } | null>(null);

    const handleResolve = (outcome?: Outcome, item?: Item) => {
        if (resolving) return;
        setResolving(true);
        if (outcome) {
            setPendingOutcome({ outcome, item });
            if (outcome.healthChange && outcome.healthChange < 0) {
                soundEffects.trap();
            } else if (outcome.items && outcome.items.length > 0) {
                soundEffects.item();
            } else if (outcome.goldChange && outcome.goldChange > 0) {
                soundEffects.coin();
            } else if (outcome.xp && outcome.xp > 0) {
                soundEffects.xp_sound();
            } else if (outcome.healthChange && outcome.healthChange > 0) {
                soundEffects.heal();
            }
            const cardTitle = (card && card.title) || '';
            const lower = cardTitle.toLowerCase();
            if (lower.includes('kista') && outcome.items && outcome.items.length > 0) {
                soundEffects.chest_open();
            }
            if (lower.includes('spak') || lower.includes('mekanism')) {
                soundEffects.lever_pull();
            }
        }
        setTimeout(() => onResolve(outcome, item), 400);
    };
    
    useEffect(() => {
        setIsFlipped(false);
        setShowGlow(false);
        setResolving(false);
        setPendingOutcome(null);
        const flipTimer = setTimeout(() => {
            setIsFlipped(true);
            setShowGlow(true);
            soundEffects.card_flip();
        }, 50);
        const glowTimer = setTimeout(() => setShowGlow(false), 850);
        return () => {
            clearTimeout(flipTimer);
            clearTimeout(glowTimer);
        };
    }, [card.id]);

    const theme = elementThemes[card.element] || elementThemes[Element.NEUTRAL];
    const Icon = card.icon;
    const isBoss = card.isBoss;

    const elementGlowColors: Record<string, string> = {
      [Element.NEUTRAL]: '147, 51, 234',
      [Element.FIRE]: '239, 68, 68',
      [Element.EARTH]: '34, 197, 94',
      [Element.WIND]: '14, 165, 233',
      [Element.WATER]: '59, 130, 246',
      [Element.MAGMA]: '249, 115, 22',
      [Element.OBSIDIAN]: '100, 116, 139',
      [Element.FIRESTORM]: '245, 158, 11',
      [Element.HOT_AIR]: '234, 179, 8',
      [Element.STEAM]: '250, 204, 21',
      [Element.HOT_SPRINGS]: '251, 113, 133',
      [Element.SAND]: '161, 98, 7',
      [Element.EROSION]: '180, 83, 9',
      [Element.MUD]: '120, 113, 108',
      [Element.GROWTH]: '77, 124, 15',
      [Element.ICE]: '34, 211, 238',
      [Element.STORM]: '99, 102, 241',
      [Element.VOLCANIC_STORM]: '220, 38, 38',
      [Element.ELECTRIFIED_MUD]: '132, 204, 22',
      [Element.VITRIFIED_STORM]: '20, 184, 166',
      [Element.LIGHT]: '253, 224, 71',
      [Element.DARK]: '168, 85, 247',
    };
    const glowColor = elementGlowColors[card.element] || '147, 51, 234';

    const renderPayload = () => {
        switch(card.type) {
            case 'COMBAT':
                return (
                    <button onClick={() => handleResolve()} className={`w-full mt-auto px-3 py-2 border-2 text-sm ${isBoss ? 'bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300' : 'bg-red-800/50 border-red-600 hover:border-red-400 text-red-300'} transition-colors`}>
                        {isBoss ? 'MÖT BOSSEN' : 'Konfrontera'}
                    </button>
                );
            case 'BOON':
            case 'CURSE': {
                const outcome = card.payload as Outcome;
                return (
                    <div className="text-center">
                        <p className="text-sm text-gray-300 mb-4">{outcome.log}</p>
                        <button onClick={() => handleResolve()} className="w-full mt-auto px-3 py-2 border-2 text-sm bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors">
                            Acceptera
                        </button>
                    </div>
                );
            }
            case 'CHOICE': {
                const { options } = card.payload as { options: ChoiceOption[] };
                return (
                     <div className="flex flex-col space-y-2 landscape:space-y-1 mt-auto">
                        {options.map((opt, i) => (
                             <button key={i} onClick={() => handleResolve(opt.outcome)} className="w-full px-2 py-2 landscape:py-1 border-2 text-xs landscape:text-[10px] bg-purple-800/50 border-purple-600 hover:border-purple-400 text-purple-300 transition-colors text-center">
                                 <p className="font-bold">{opt.buttonText}</p>
                                 <p className="text-[10px] landscape:text-[8px] text-gray-400">{opt.description}</p>
                             </button>
                        ))}
                     </div>
                );
            }
            case 'PUZZLE': {
                const puzzle = card.payload as PuzzleChallenge;
                const handlePuzzleOption = (optionIndex: number) => {
                    const option = puzzle.options?.[optionIndex];
                    if (!option) return;

                    let success = false;
                    if (puzzle.statCheck) {
                        success = playerStats.totalStats[puzzle.statCheck] >= puzzle.threshold;
                    } else if (puzzle.elementalCheck) {
                        success = (elementalAffinities[puzzle.elementalCheck] || 0) >= puzzle.threshold;
                    }

                    handleResolve(success ? puzzle.successOutcome : puzzle.failureOutcome);
                };

                return (
                    <div className="flex flex-col space-y-2 landscape:space-y-1 mt-auto">
                        <p className="text-xs landscape:text-[10px] text-gray-300 mb-2 landscape:mb-1">{puzzle.challengeText}</p>
                        {puzzle.options?.map((opt, i) => (
                            <button key={i} onClick={() => handlePuzzleOption(i)} className="w-full px-2 py-2 landscape:py-1 border-2 text-xs landscape:text-[10px] bg-blue-800/50 border-blue-600 hover:border-blue-400 text-blue-300 transition-colors text-center">
                                <p className="font-bold">{opt.buttonText}</p>
                                <p className="text-[10px] landscape:text-[8px] text-gray-400">{opt.description}</p>
                            </button>
                        ))}
                    </div>
                );
            }
            case 'MERCHANT': {
                const merchant = card.payload as MerchantOffer;
                return (
                    <div className="flex flex-col space-y-2 landscape:space-y-1 mt-auto">
                        <p className="text-xs landscape:text-[10px] text-gray-300 mb-2 landscape:mb-1">Välkommen, resenär! Se mina varor:</p>
                        {merchant.itemsForSale.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleResolve(merchant.onPurchase(item), item)} 
                                disabled={playerCurrency < (item.price || 0)}
                                className={`w-full px-2 py-2 landscape:py-1 border-2 text-xs landscape:text-[10px] ${playerCurrency >= (item.price || 0) ? 'bg-green-800/50 border-green-600 hover:border-green-400 text-green-300' : 'bg-gray-800/50 border-gray-600 text-gray-500 cursor-not-allowed'} transition-colors text-center`}
                            >
                                <p className="font-bold">{item.name}</p>
                                <p className="text-[10px] landscape:text-[8px] text-gray-400">{item.price} Guld</p>
                            </button>
                        ))}
                        <button onClick={() => handleResolve(merchant.onLeave)} className="w-full px-2 py-2 landscape:py-1 border-2 text-xs landscape:text-[10px] bg-red-800/50 border-red-600 hover:border-red-400 text-red-300 transition-colors text-center">
                            Lämna
                        </button>
                    </div>
                );
            }
            default:
                return null;
        }
    }

    return (
        <div className="animate-draw-card">
            <div className={`card-scene ${showGlow ? 'is-flipped-glow' : ''}`} data-element={card.element} style={{ '--element-glow': glowColor } as React.CSSProperties}>
                <div className={`card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                    <div className="card-face card-face-back event-card-back-bg flex flex-col items-center justify-center">
                        <div className="back-emblem">
                            <div className="text-xl font-bold font-serif text-white/40">A</div>
                        </div>
                    </div>
                    
                    <div className={`card-face card-face-front flex flex-col event-card-front ${isBoss ? 'event-card-boss' : theme}`}>
                        <div className={`absolute inset-0 opacity-20 pointer-events-none ${theme}`}></div>
                        {isFlipped && (
                            <div className="absolute inset-0 pointer-events-none z-0">
                                <ElementalVFX element={card.element} isActive={isFlipped} variant="node" />
                            </div>
                        )}
                        <EventScene title={card.title} description={card.description} type={card.type} element={card.element} isFlipped={isFlipped} resolving={resolving} />
                        {pendingOutcome && (
                            <RewardDisplay outcome={pendingOutcome.outcome} items={pendingOutcome.item ? [pendingOutcome.item] : undefined} />
                        )}
                        <div className="p-3 landscape:p-2 flex flex-col h-full relative z-10 overflow-y-auto custom-scrollbar">
                            <div className="text-center mb-2 landscape:mb-1 shrink-0">
                                <div className="w-12 h-12 landscape:w-8 landscape:h-8 mx-auto mb-2 landscape:mb-1 border-2 border-gray-700 bg-black/50 rounded-full flex items-center justify-center "><Icon/></div>
                                <h3 className={`text-lg landscape:text-sm font-bold ${isBoss ? 'text-orange-400' : 'text-yellow-300'}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{card.title}</h3>
                                <p className="text-[10px] landscape:text-[8px] text-gray-500 uppercase tracking-widest">{isBoss ? 'BOSS' : card.type}</p>
                            </div>
                            <p className="text-xs landscape:text-[10px] text-gray-300 shrink-0 mb-4 landscape:mb-2 font-serif leading-relaxed px-2 text-center flex items-center justify-center">{card.description}</p>
                            <div className="mt-auto shrink-0 w-full">
                                {renderPayload()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface DeckViewProps {
    roundLevel: number;
    deck: EventCard[];
    discardPile: EventCard[];
    drawnCard: EventCard | null;
    onDraw: () => void;
    onStartNextRound: () => void;
    onResolve: (outcome?: Outcome, item?: Item) => void;
    playerCurrency: number;
    playerStats: any;
    elementalAffinities: Partial<Record<Element, number>>;
}

const DeckView: React.FC<DeckViewProps> = ({ roundLevel, deck, discardPile, drawnCard, onDraw, onStartNextRound, onResolve, playerCurrency, playerStats, elementalAffinities }) => {
    return (
        <div className="flex-grow w-full h-full text-white flex flex-col overflow-hidden" style={{ padding: '12px' }}>

            {/* Header */}
            <div className="deck-header text-center flex-shrink-0" style={{ marginBottom: '12px' }}>
                <h1 className={`deck-title ${roundLevel >= MAX_ROUNDS ? 'text-red-400 animate-pulse-glow' : 'text-yellow-400'}`}
                    style={{ fontSize: '0.85rem', marginBottom: '2px' }}>
                    {roundLevel >= MAX_ROUNDS ? 'Slutbossen!' : 'Aether-däcket'}
                </h1>
                <p className="deck-round text-gray-400" style={{ fontSize: '0.6rem' }}>
                    Omgång {roundLevel} / {MAX_ROUNDS}
                    {roundLevel >= MAX_ROUNDS && ' — Den sista striden!'}
                </p>
                <p className="deck-subtitle text-gray-500" style={{ fontSize: '0.55rem' }}>
                    Dra ett kort från ödets väv och möt dess konsekvenser.
                </p>
            </div>

            {/* Main area: portrait=col, landscape=row via CSS */}
            <div className="deck-main flex-grow flex flex-col min-h-0" style={{ gap: '12px' }}>

                {/* Deck + Discard: portrait=row, landscape=col via CSS */}
                <div className="deck-side flex flex-row items-center justify-center flex-shrink-0" style={{ gap: '12px' }}>
                    <CardBack
                        count={deck.length}
                        onClick={onDraw}
                    />
                    <DiscardPile
                        count={discardPile.length}
                        onStartNextRound={onStartNextRound}
                        canStartNextRound={deck.length === 0 && !drawnCard}
                    />
                </div>

                {/* Drawn card */}
                <div
                    className="drawn-card-slot flex-grow min-h-0 flex items-center justify-center"
                >
                    {drawnCard
                        ? <DrawnCard
                            card={drawnCard}
                            onResolve={onResolve}
                            playerCurrency={playerCurrency}
                            playerStats={playerStats}
                            elementalAffinities={elementalAffinities}
                          />
                        : <div className="text-gray-600" style={{ fontSize: '0.6rem' }}>Dra ett kort...</div>
                    }
                </div>
            </div>
        </div>
    );
};

export default DeckView;