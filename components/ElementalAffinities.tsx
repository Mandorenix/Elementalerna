import React, { useState } from 'react';
import { Element, ElementalBonus } from '../types'; // Changed import to value
import { ELEMENT_ICONS, elementThemes, ELEMENTAL_AFFINITY_BONUSES } from '../constants';

interface ElementalAffinitiesProps {
    elementalAffinities: Partial<Record<Element, number>>;
    elementalPoints: number;
    increaseElementalAffinity: (element: Element) => void;
}

const ElementalAffinityTooltip: React.FC<{ element: Element; currentPoints: number; }> = ({ element, currentPoints }) => {
    const bonuses = ELEMENTAL_AFFINITY_BONUSES[element] || [];
    const theme = elementThemes[element] || elementThemes[Element.NEUTRAL];

    return (
        <div className={`absolute left-full ml-3 top-0 w-64 p-2 bg-black/80 tooltip-pixel-border z-20 text-left text-xs ${theme}`}>
            <h4 className="font-bold text-yellow-300 text-sm mb-1">{Element[element].replace('_', ' ')} Affinitet</h4>
            <p className="text-gray-300 text-[10px] leading-tight mb-2">Nuvarande poäng: {currentPoints}</p>
            
            {bonuses.length > 0 && (
                <div className="border-t border-gray-600/50 pt-1 mt-1">
                    <p className="font-bold text-yellow-400 text-[10px] mb-1">Bonusar:</p>
                    {bonuses.map((bonus, i) => (
                        <p key={i} className={`text-green-400 text-[10px] ${currentPoints >= bonus.threshold ? 'font-bold' : 'text-gray-500'}`}>
                            {currentPoints >= bonus.threshold ? '✓' : '○'} {bonus.threshold} poäng: {bonus.description}
                        </p>
                    ))}
                </div>
            )}
            {bonuses.length === 0 && (
                <p className="text-gray-400 text-[10px]">Inga specifika bonusar definierade för detta element ännu.</p>
            )}
        </div>
    );
};

const ElementalAffinities: React.FC<ElementalAffinitiesProps> = ({ elementalAffinities, elementalPoints, increaseElementalAffinity }) => {
    const baseElements = [Element.FIRE, Element.EARTH, Element.WIND, Element.WATER];

    return (
        <div className="p-4 bg-black/30 pixelated-border flex flex-col">
            <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-lg text-yellow-500">Elementära Affiniteter</h3>
                {elementalPoints > 0 && (
                    <div className="text-xs text-yellow-300 animate-pulse">
                        {elementalPoints} Poäng Tillgängliga
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {baseElements.map(element => {
                    const currentPoints = elementalAffinities[element] || 0;
                    const Icon = ELEMENT_ICONS[element];
                    const theme = elementThemes[element];
                    const canIncrease = elementalPoints > 0;
                    const [isHovered, setIsHovered] = useState(false);

                    return (
                        <div 
                            key={element} 
                            className="flex items-center space-x-2 relative"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <button
                                onClick={() => increaseElementalAffinity(element)}
                                disabled={!canIncrease}
                                className={`w-12 h-12 border-2 ${theme} flex items-center justify-center text-2xl 
                                    ${canIncrease ? 'hover:bg-green-500/20 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                aria-label={`Öka ${Element[element]} affinitet`}
                            >
                                <Icon />
                            </button>
                            <div>
                                <div className="text-gray-500 text-[10px]">{Element[element].replace('_', ' ')}</div>
                                <div className="text-white text-xs font-bold">{currentPoints}</div>
                            </div>
                            {isHovered && <ElementalAffinityTooltip element={element} currentPoints={currentPoints} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ElementalAffinities;