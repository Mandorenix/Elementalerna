import React from 'react';
import type { EventCard, ChoiceOption, Outcome } from '../types';
import { elementThemes } from '../constants';
import { Element } from '../types';

const CardBack: React.FC<{ count: number, onClick: () => void }> = ({ count, onClick }) => (
    <div className="flex flex-col items-center">
        <button 
            onClick={onClick}
            disabled={count === 0}
            className="w-48 h-64 bg-black/50 pixelated-border-gold flex flex-col items-center justify-center text-yellow-300 cursor-pointer hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:hover:bg-black/50 disabled:border-gray-600 disabled:text-gray-500 transition-all"
        >
            <div className="text-5xl font-bold">?</div>
            <div className="mt-4 text-xs">Dra ett kort</div>
        </button>
        <div className="mt-2 text-sm text-gray-400">{count} kort kvar</div>
    </div>
);

const DiscardPile: React.FC<{ count: number, onStartNextRound: () => void, canStartNextRound: boolean }> = ({ count, onStartNextRound, canStartNextRound }) => (
    <div className="flex flex-col items-center">
        <div className="w-48 h-64 bg-black/30 pixelated-border flex items-center justify-center text-gray-600">
            Kasthög
        </div>
        <div className="mt-2 text-sm text-gray-400">{count} kort</div>
        {canStartNextRound && (
             <button onClick={onStartNextRound} className="mt-2 px-3 py-1 border-2 text-xs bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors animate-pulse-glow">
                Nästa Omgång
            </button>
        )}
    </div>
);

const DrawnCard: React.FC<{ card: EventCard; onResolve: (outcome?: Outcome) => void; }> = ({ card, onResolve }) => {
    const theme = elementThemes[card.element] || elementThemes[Element.NEUTRAL];
    const Icon = card.icon;
    const isBoss = card.isBoss;

    const renderPayload = () => {
        switch(card.type) {
            case 'COMBAT':
                return (
                    <button onClick={() => onResolve()} className={`w-full mt-auto px-3 py-2 border-2 text-sm ${isBoss ? 'bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300' : 'bg-red-800/50 border-red-600 hover:border-red-400 text-red-300'} transition-colors`}>
                        {isBoss ? 'MÖT BOSSEN' : 'Konfrontera'}
                    </button>
                );
            case 'BOON':
            case 'CURSE':
                const outcome = card.payload as Outcome;
                return (
                    <div className="text-center">
                        <p className="text-sm text-gray-300 mb-4">{outcome.log}</p>
                        <button onClick={() => onResolve()} className="w-full mt-auto px-3 py-2 border-2 text-sm bg-yellow-800/50 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors">
                            Acceptera
                        </button>
                    </div>
                );
            case 'CHOICE':
                const { options } = card.payload as { options: ChoiceOption[] };
                return (
                     <div className="flex flex-col space-y-2 mt-auto">
                        {options.map((opt, i) => (
                             <button key={i} onClick={() => onResolve(opt.outcome)} className="w-full px-2 py-2 border-2 text-xs bg-purple-800/50 border-purple-600 hover:border-purple-400 text-purple-300 transition-colors text-center">
                                 <p className="font-bold">{opt.buttonText}</p>
                                 <p className="text-[10px] text-gray-400">{opt.description}</p>
                             </button>
                        ))}
                     </div>
                );
        }
    }

    return (
        <div className={`w-64 h-96 p-4 flex flex-col ${theme} ${isBoss ? 'pixelated-border-gold' : 'pixelated-border'}`}>
            <div className="text-center mb-2">
                <div className="w-12 h-12 mx-auto mb-2 border-2 flex items-center justify-center "><Icon/></div>
                <h3 className={`text-lg ${isBoss ? 'text-orange-400' : 'text-yellow-300'}`}>{card.title}</h3>
                <p className="text-[10px] text-gray-500 uppercase">{isBoss ? 'BOSS' : card.type}</p>
            </div>
            <p className="text-xs text-gray-300 flex-grow mb-4">{card.description}</p>
            {renderPayload()}
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
    onResolve: (outcome?: Outcome) => void;
}


const DeckView: React.FC<DeckViewProps> = ({ roundLevel, deck, discardPile, drawnCard, onDraw, onStartNextRound, onResolve }) => {
    return (
        <div className="flex-grow w-full h-full p-6 text-white flex flex-col overflow-hidden">
            <div className="text-center mb-8">
                <h1 className="text-2xl text-yellow-400 mb-2">Aether-däcket - Omgång {roundLevel}</h1>
                <p className="text-sm text-gray-400">Dra ett kort från ödets väv och möt dess konsekvenser.</p>
            </div>

            <div className="flex-grow flex items-center justify-center space-x-12">
                <CardBack count={deck.length} onClick={onDraw} />
                
                <div className="w-64 h-96 flex items-center justify-center">
                    {drawnCard 
                        ? <DrawnCard card={drawnCard} onResolve={onResolve} />
                        : <div className="text-gray-600">Dra ett kort...</div>
                    }
                </div>

                <DiscardPile count={discardPile.length} onStartNextRound={onStartNextRound} canStartNextRound={deck.length === 0 && !drawnCard} />
            </div>
        </div>
    );
};

export default DeckView;