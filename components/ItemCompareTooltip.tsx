import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Item, ItemStats } from '../types';

const rarityColors: Record<string, { text: string; border: string; bg: string }> = {
    'Vanlig': { text: 'text-white', border: 'border-gray-400', bg: 'bg-gray-900/80' },
    'Magisk': { text: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/80' },
    'Sällsynt': { text: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-900/80' },
    'Legendarisk': { text: 'text-orange-500', border: 'border-orange-500', bg: 'bg-orange-900/80' },
};

const statLabels: Record<keyof ItemStats, string> = {
    strength: 'Styrka',
    dexterity: 'Dexteritet',
    intelligence: 'Intelligens',
    constitution: 'Konstitution',
    skada: 'Skada',
    rustning: 'Rustning',
    undvikandechans: 'Undvikande',
    kritiskTräff: 'Kritisk Träff',
};

interface ItemCompareTooltipProps {
    item: Item;
    equippedItem: Item | null;
}

function ItemCompareTooltip({ item, equippedItem }: ItemCompareTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useLayoutEffect(() => {
        if (tooltipRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const parentElement = tooltipRef.current.parentElement;
            if (!parentElement) return;

            const parentRect = parentElement.getBoundingClientRect();
            const margin = 12;

            let finalLeft = parentRect.width + margin;
            let finalTop = (parentRect.height - tooltipRect.height) / 2;

            if (parentRect.right + finalLeft + tooltipRect.width > window.innerWidth) {
                finalLeft = -tooltipRect.width - margin;
            }
            if (parentRect.left + finalLeft < 0) {
                finalLeft = -parentRect.left + margin;
            }
            if (parentRect.top + finalTop + tooltipRect.height > window.innerHeight) {
                finalTop = window.innerHeight - tooltipRect.height - parentRect.top - margin;
            }
            if (parentRect.top + finalTop < 0) {
                finalTop = -parentRect.top + margin;
            }

            setStyle({
                left: `${finalLeft}px`,
                top: `${finalTop}px`,
            });
        }
    }, [item, equippedItem]);

    if (!equippedItem) {
        return null;
    }

    const allStats = new Set<keyof ItemStats>();
    for (const key of Object.keys(item.stats) as Array<keyof ItemStats>) {
        allStats.add(key);
    }
    for (const key of Object.keys(equippedItem.stats) as Array<keyof ItemStats>) {
        allStats.add(key);
    }

    const itemColor = rarityColors[item.rarity];
    const equippedColor = rarityColors[equippedItem.rarity];

    return (
        <div
            ref={tooltipRef}
            className="absolute z-30 w-96 text-left text-xs"
            style={style}
        >
            <div className="grid grid-cols-2 gap-0 bg-black/90 tooltip-pixel-border overflow-hidden">
                {/* Header */}
                <div className={`p-2 border-r border-gray-700 ${itemColor.bg}`}>
                    <h4 className={`font-bold ${itemColor.text} text-sm mb-1`}>{item.name}</h4>
                    <div className="text-gray-400 text-[10px] capitalize">{item.rarity} {item.slot}</div>
                </div>
                <div className={`p-2 ${equippedColor.bg}`}>
                    <h4 className={`font-bold ${equippedColor.text} text-sm mb-1`}>{equippedItem.name}</h4>
                    <div className="text-gray-400 text-[10px] capitalize">{equippedItem.rarity} {equippedItem.slot}</div>
                </div>

                {/* Stats Comparison */}
                {allStats.size > 0 && (
                    <div className="col-span-2 border-t border-gray-700">
                        {Array.from(allStats).map(stat => {
                            const itemVal = item.stats[stat] || 0;
                            const equippedVal = equippedItem.stats[stat] || 0;
                            const diff = itemVal - equippedVal;

                            let diffColor = 'text-gray-500';
                            let diffText = '0';
                            if (diff > 0) {
                                diffColor = 'text-green-400';
                                diffText = `+${diff}`;
                            } else if (diff < 0) {
                                diffColor = 'text-red-400';
                                diffText = `${diff}`;
                            }

                            return (
                                <div key={stat} className="grid grid-cols-2 border-b border-gray-800 last:border-b-0">
                                    <div className="flex items-center justify-between px-2 py-1 border-r border-gray-800">
                                        <span className="text-gray-400">{statLabels[stat]}</span>
                                        <span className="text-white font-bold">{itemVal}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <span className="text-gray-400">{statLabels[stat]}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-white font-bold">{equippedVal}</span>
                                            <span className={`font-bold ${diffColor}`}>({diffText})</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Affix Comparison */}
                {(item.affix || equippedItem.affix) && (
                    <div className="col-span-2 border-t border-gray-700 p-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                {item.affix ? (
                                    <p className="text-cyan-300 text-[10px]">{item.affix.description}</p>
                                ) : (
                                    <p className="text-gray-600 text-[10px] italic">Ingen effekt</p>
                                )}
                            </div>
                            <div>
                                {equippedItem.affix ? (
                                    <p className="text-cyan-300 text-[10px]">{equippedItem.affix.description}</p>
                                ) : (
                                    <p className="text-gray-600 text-[10px] italic">Ingen effekt</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action text */}
                <div className="col-span-2 border-t border-gray-700 pt-1 pb-2 text-center text-yellow-200 text-[10px]">
                    Klicka för att utrusta
                </div>
            </div>
        </div>
    );
}

export default ItemCompareTooltip;
