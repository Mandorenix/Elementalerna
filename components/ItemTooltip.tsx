import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Item } from '../types';

const rarityStyles = {
    'Vanlig': { text: 'text-white' },
    'Magisk': { text: 'text-blue-400' },
    'Sällsynt': { text: 'text-yellow-400' },
    'Legendarisk': { text: 'text-orange-500' },
};

interface ItemTooltipProps {
    item: Item;
    context: 'equip' | 'unequip' | 'view';
}

function ItemTooltip({ item, context }: ItemTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [positionClass, setPositionClass] = useState('bottom-full mb-3');

    useLayoutEffect(() => {
        if (tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            // Check if the tooltip is going off the top edge of the viewport.
            if (rect.top < 0) {
                // If so, switch its position to be below the parent element.
                setPositionClass('top-full mt-3');
            }
        }
    }, [item]); // Re-run this check whenever the tooltip is shown for a new item.
    
    const getContextText = () => {
        switch(context) {
            case 'equip': return 'Klicka för att utrusta';
            case 'unequip': return 'Klicka för att ta av';
            default: return null;
        }
    };

    return (
        <div 
            ref={tooltipRef}
            className={`absolute ${positionClass} w-52 p-2 bg-black/80 tooltip-pixel-border z-20 text-left text-xs`}
        >
            <h4 className={`font-bold ${rarityStyles[item.rarity].text} text-sm mb-1`}>{item.name}</h4>
            <div className="text-gray-400 text-[10px] capitalize">{item.rarity} {item.slot}</div>
            
            {(Object.keys(item.stats).length > 0) && (
              <div className="border-t border-gray-600/50 pt-1 mt-1">
                  {Object.entries(item.stats).map(([stat, value]) => (
                      <div key={stat} className="text-green-400 text-[10px] capitalize">
                          + {value} {stat.replace('undvikandechans', 'Undvikande').replace('kritiskTräff', 'Kritisk Träff')}
                      </div>
                  ))}
              </div>
            )}

            {item.affix && (
                 <div className="border-t border-gray-600/50 pt-1 mt-1">
                    <p className="text-cyan-300 text-[10px]">{item.affix.description}</p>
                 </div>
            )}

            {context !== 'view' && (
                <div className="border-t border-gray-600/50 pt-1 mt-2 text-center text-yellow-200 text-[10px]">
                    {getContextText()}
                </div>
            )}
        </div>
    );
};

export default ItemTooltip;