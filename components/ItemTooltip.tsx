import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Item } from '../types';

const rarityStyles = {
    'Vanlig': { text: 'text-white' },
    'Magisk': { text: 'text-blue-400' },
    'Sällsynt': { text: 'text-yellow-4400' },
    'Legendarisk': { text: 'text-orange-500' },
};

interface ItemTooltipProps {
    item: Item;
    context: 'equip' | 'unequip' | 'view';
}

function ItemTooltip({ item, context }: ItemTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useLayoutEffect(() => {
        if (tooltipRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const parentElement = tooltipRef.current.parentElement;
            if (!parentElement) return;

            const parentRect = parentElement.getBoundingClientRect();

            const margin = 12; // Spacing around the tooltip

            let finalLeft = parentRect.width + margin; // Default to right of parent
            let finalTop = (parentRect.height - tooltipRect.height) / 2; // Default to vertically centered

            // --- Horizontal positioning ---
            // Check if it goes off the right edge of the viewport
            if (parentRect.right + finalLeft + tooltipRect.width > window.innerWidth) {
                finalLeft = -tooltipRect.width - margin; // Move to left of parent
            }
            // If after moving left, it still goes off the left edge of the viewport
            if (parentRect.left + finalLeft < 0) {
                finalLeft = -parentRect.left + margin; // Clamp to viewport left edge
            }


            // --- Vertical positioning ---
            // Check if it goes off the bottom edge of the viewport
            if (parentRect.top + finalTop + tooltipRect.height > window.innerHeight) {
                finalTop = window.innerHeight - tooltipRect.height - parentRect.top - margin; // Clamp to bottom of viewport
            }
            // Check if it goes off the top edge of the viewport
            if (parentRect.top + finalTop < 0) {
                finalTop = -parentRect.top + margin; // Clamp to top of viewport
            }
            
            setStyle({
                left: `${finalLeft}px`,
                top: `${finalTop}px`,
            });
        }
    }, [item]); // Recalculate when item changes (tooltip content changes)

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
            className={`absolute w-52 p-2 bg-black/80 tooltip-pixel-border z-20 text-left text-xs`}
            style={style} // Apply dynamic style
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
}

export default ItemTooltip;