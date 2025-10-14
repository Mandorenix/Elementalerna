import React, { useState } from 'react';
import type { Item, Rarity } from '../types';
import ItemTooltip from './ItemTooltip';

const rarityStyles = {
    'Vanlig': { color: 'border-gray-400', text: 'text-white' },
    'Magisk': { color: 'border-blue-500', text: 'text-blue-400' },
    'Sällsynt': { color: 'border-yellow-500', text: 'text-yellow-400' },
    'Legendarisk': { color: 'border-orange-500', text: 'text-orange-500' },
};

const INVENTORY_SLOTS = 40;

const InventoryItem: React.FC<{ item: Item | null; onEquip: (item: Item) => void }> = ({ item, onEquip }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    if (!item) {
        return <div className="w-16 h-16 bg-black/30 border-2 border-gray-800" />;
    }

    const rarityColor = rarityStyles[item.rarity].color;
    const Icon = item.icon;

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={() => onEquip(item)}
                className={`w-16 h-16 bg-black/50 border-2 ${rarityColor} flex items-center justify-center text-gray-500 text-xs hover:bg-green-500/20 cursor-pointer text-2xl`}
                aria-label={`Utrusta ${item.name}`}
            >
                <Icon />
            </button>
            {isHovered && <ItemTooltip item={item} context="equip" />}
        </div>
    );
};

interface InventoryProps {
    items: Item[];
    onEquipItem: (item: Item) => void;
}

const Inventory: React.FC<InventoryProps> = ({ items, onEquipItem }) => {
  const inventoryGrid = Array.from({ length: INVENTORY_SLOTS }).map((_, i) => items[i] || null);

  return (
    <div className="flex-grow w-full h-full p-6 text-white overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl text-yellow-400 mb-6 text-center">Lager</h1>
            <div className="p-4 bg-black/30 pixelated-border">
                <div className="grid grid-cols-8 gap-2">
                    {inventoryGrid.map((item, index) => (
                        <InventoryItem key={item ? item.id : `empty-${index}`} item={item} onEquip={onEquipItem} />
                    ))}
                </div>
            </div>
             <div className="mt-6 flex justify-center space-x-6 text-xs">
                {Object.entries(rarityStyles).map(([name, style]) => (
                    <div key={name} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 border-2 ${style.color}`}></div>
                        <span>{name}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Inventory;