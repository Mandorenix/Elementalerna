import React, { useState } from 'react';
import { Element } from '../types';
import { ELEMENTAL_AFFINITY_BONUSES } from '../constants';
import ElementalAffinityButton from './ElementalAffinityButton'; // Import the new component

interface ElementalAffinitiesProps {
    elementalAffinities: Partial<Record<Element, number>>;
    elementalPoints: number;
    increaseElementalAffinity: (element: Element) => void;
}

const ElementalAffinities: React.FC<ElementalAffinitiesProps> = ({ elementalAffinities, elementalPoints, increaseElementalAffinity }) => {
    const [isExpanded, setIsExpanded] = useState(true); // New state for expand/collapse

    // Get all elements that have defined bonuses, excluding NEUTRAL for display purposes
    const allElementsWithBonuses = Object.keys(ELEMENTAL_AFFINITY_BONUSES)
        .map(key => Number(key) as Element)
        .filter(element => element !== Element.NEUTRAL);

    // Sort elements by their enum value for consistent display order
    const sortedElements = allElementsWithBonuses.sort((a, b) => a - b);

    return (
        <div className="p-4 bg-black/30 pixelated-border flex flex-col">
            <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-lg text-yellow-500">Elementära Affiniteter</h3>
                <div className="flex items-center space-x-2">
                    {elementalPoints > 0 && (
                        <div className="text-xs text-yellow-300 animate-pulse">
                            {elementalPoints} Poäng Tillgängliga
                        </div>
                    )}
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-5 h-5 text-xs bg-gray-700 hover:bg-gray-600 text-white font-bold leading-none pixelated-border flex items-center justify-center"
                        aria-label={isExpanded ? "Fäll ihop" : "Expandera"}
                    >
                        {isExpanded ? '-' : '+'}
                    </button>
                </div>
            </div>
            {isExpanded && ( // Conditionally render content
                <div className="grid grid-cols-2 gap-4">
                    {sortedElements.map(element => {
                        const currentPoints = elementalAffinities[element] || 0;
                        const canIncrease = elementalPoints > 0;

                        return (
                            <ElementalAffinityButton
                                key={element}
                                element={element}
                                currentPoints={currentPoints}
                                canIncrease={canIncrease}
                                onIncrease={increaseElementalAffinity}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ElementalAffinities;