import React, { useMemo } from 'react';
import { Element } from '../types';
import { BACKGROUND_BIOMES } from '../constants';

interface CombatBackgroundProps {
  element: Element;
}

const CombatBackground: React.FC<CombatBackgroundProps> = ({ element }) => {
  const biome = useMemo(() => {
    const possibleBiomes = BACKGROUND_BIOMES[element];
    if (possibleBiomes && possibleBiomes.length > 0) {
      // Select a random biome for the given element
      return possibleBiomes[Math.floor(Math.random() * possibleBiomes.length)];
    }
    // Fallback to a neutral biome if the element has no specific biomes defined
    const neutralBiomes = BACKGROUND_BIOMES[Element.NEUTRAL];
    return neutralBiomes[Math.floor(Math.random() * neutralBiomes.length)];
  }, [element]);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${biome.classes}`}>
      {/* Parallax layers and weather effects can be added here as children or pseudo-elements */}
      <div className="background-layer-1 parallax-layer"></div>
      <div className="background-layer-2 parallax-layer"></div>
      <div className="background-layer-3 parallax-layer"></div>
      <div className="weather-overlay"></div>
    </div>
  );
};

export default CombatBackground;