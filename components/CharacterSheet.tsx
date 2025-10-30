import React from 'react';
import type { Character, Attribute } from '../types';
import { ATTRIBUTE_DEFINITIONS } from '../constants';

interface CharacterSheetProps {
  character: Character;
  attributePoints: number;
  onIncreaseAttribute: (attribute: Attribute) => void;
  onDecreaseAttribute: (attribute: Attribute) => void;
  onSpendAttributePoints: () => void;
  onResetAttributePoints: () => void;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  attributePoints,
  onIncreaseAttribute,
  onDecreaseAttribute,
  onSpendAttributePoints,
  onResetAttributePoints,
}) => {
  if (!character) {
    return <div className="p-4 text-red-500 bg-gray-900/70 backdrop-blur-sm h-full overflow-y-auto pixelated-border-gold">Laddar karaktärsdata eller data saknas...</div>;
  }

  const { stats = {}, baseAttributes = {}, attributePointsAtLastSpend = 0 } = character;

  return (
    <div className="p-4 bg-gray-900/70 backdrop-blur-sm h-full overflow-y-auto pixelated-border-gold text-white">
      <h2 className="text-2xl font-bold mb-4 text-yellow-400 pixelated-border-gold p-2">Karaktärsblad</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-cyan-400">Attribut</h3>
        <div className="space-y-2">
          {Object.values(ATTRIBUTE_DEFINITIONS).map((attr: { key: Attribute; name: string; description: string }) => (
            <div key={attr.key} className="flex items-center justify-between bg-gray-800/50 p-2 pixelated-border">
              <div className="flex items-center">
                <span className="text-lg font-medium text-white mr-2">{attr.name}:</span>
                <span className="text-xl font-bold text-yellow-300">{stats[attr.key] || 0}</span>
                <span className="text-sm text-gray-400 ml-2">({attr.description})</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onDecreaseAttribute(attr.key)}
                  disabled={(stats[attr.key] || 0) === (baseAttributes[attr.key] || 0)}
                  className="px-3 py-1 bg-red-700/70 text-white font-bold pixelated-border-gold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <button
                  onClick={() => onIncreaseAttribute(attr.key)}
                  disabled={attributePoints === 0}
                  className="px-3 py-1 bg-green-700/70 text-white font-bold pixelated-border-gold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-cyan-400">Poäng att spendera</h3>
        <div className="bg-gray-800/50 p-3 pixelated-border flex items-center justify-between">
          <span className="text-lg text-white">Attributpoäng kvar:</span>
          <span className="text-2xl font-bold text-yellow-300">{attributePoints}</span>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => onResetAttributePoints()}
          className="px-6 py-2 bg-gray-700/70 text-white font-bold pixelated-border-gold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Återställ
        </button>
        <button
          onClick={() => onSpendAttributePoints()}
          disabled={attributePoints === attributePointsAtLastSpend}
          className="px-6 py-2 bg-blue-700/70 text-white font-bold pixelated-border-gold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Spendera poäng
        </button>
      </div>
    </div>
  );
};

export default CharacterSheet;