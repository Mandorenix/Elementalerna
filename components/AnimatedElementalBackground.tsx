import React from 'react';
import { Element } from '../types';
import { elementThemes } from '../constants';

interface AnimatedElementalBackgroundProps {
  element: Element;
}

const AnimatedElementalBackground: React.FC<AnimatedElementalBackgroundProps> = ({ element }) => {
  const theme = elementThemes[element] || elementThemes[Element.NEUTRAL];
  const colorClass = theme.split(' ').find(cls => cls.startsWith('text-')) || 'text-white';
  const fillColor = `var(--${colorClass.replace('text-', '')})`; // Use CSS variable for dynamic color

  // Define specific colors for elements for SVG fill
  let svgFillColor = '#fff'; // Default white
  switch (element) {
    case Element.FIRE: svgFillColor = '#f97316'; break;
    case Element.EARTH: svgFillColor = '#22c55e'; break;
    case Element.WIND: svgFillColor = '#0ea5e9'; break;
    case Element.WATER: svgFillColor = '#3b82f6'; break;
    case Element.MAGMA: svgFillColor = '#d97706'; break;
    case Element.STORM: svgFillColor = '#0284c7'; break;
    case Element.ICE: svgFillColor = '#7dd3fc'; break;
    case Element.SAND: svgFillColor = '#a16207'; break;
    case Element.MUD: svgFillColor = '#78350f'; break;
    case Element.GROWTH: svgFillColor = '#4d7c0f'; break;
    default: svgFillColor = '#a855f7'; break; // Neutral/Purple
  }

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {/* Subtila elementära former som animeras */}
        <circle cx="20" cy="20" r="5" fill={svgFillColor} className="element-orb element-orb-1" />
        <circle cx="80" cy="30" r="7" fill={svgFillColor} className="element-orb element-orb-2" style={{ animationDelay: '1.5s' }} />
        <circle cx="40" cy="70" r="6" fill={svgFillColor} className="element-orb element-orb-3" style={{ animationDelay: '3s' }} />
        <circle cx="60" cy="85" r="8" fill={svgFillColor} className="element-orb element-orb-4" style={{ animationDelay: '4.5s' }} />
        <circle cx="10" cy="50" r="4" fill={svgFillColor} className="element-orb element-orb-5" style={{ animationDelay: '6s' }} />
      </svg>
    </div>
  );
};

export default AnimatedElementalBackground;