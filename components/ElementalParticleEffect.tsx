import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei'; // Korrigerad import
import * as THREE from 'three';
import { Element } from '../types';
import { elementThemes } from '../constants';

interface ElementalParticleEffectProps {
  element: Element;
  position: [number, number, number]; // Ny: position i 3D-rymden
  size?: number;
  intensity?: number;
}

// Hjälpfunktion för att generera partiklar
const generateParticles = (count: number, range: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * range;
  }
  return positions;
};

const ElementalParticleEffect: React.FC<ElementalParticleEffectProps> = ({ element, position, size = 0.5, intensity = 1 }) => {
  const ref = useRef<THREE.Points>(null);
  const positions = useRef(generateParticles(50 * intensity, 1 * size)); // Partikelantal och räckvidd

  const theme = elementThemes[element] || elementThemes[Element.NEUTRAL];
  const colorMatch = theme.match(/text-([a-z]+-\d+)/);
  let hexColor = '#FFFFFF'; // Standard vit

  if (colorMatch) {
    const colorName = colorMatch[1];
    switch (colorName) {
      case 'red-300': hexColor = '#fca5a5'; break;
      case 'green-300': hexColor = '#86efac'; break;
      case 'sky-300': hexColor = '#7dd3fc'; break;
      case 'blue-300': hexColor = '#93c5fd'; break;
      case 'orange-300': hexColor = '#fdba74'; break;
      case 'slate-300': hexColor = '#cbd5e1'; break;
      case 'amber-300': hexColor = '#fcd34d'; break;
      case 'yellow-300': hexColor = '#fde047'; break;
      case 'yellow-200': hexColor = '#fef08a'; break;
      case 'rose-200': hexColor = '#fecdd3'; break;
      case 'yellow-500': hexColor = '#eab308'; break;
      case 'amber-500': hexColor = '#f59e0b'; break;
      case 'stone-400': hexColor = '#a8a29e'; break;
      case 'lime-400': hexColor = '#a3e635'; break;
      case 'cyan-200': hexColor = '#a5f3fc'; break;
      case 'indigo-300': hexColor = '#a5b4fc'; break;
      case 'red-200': hexColor = '#fecaca'; break;
      case 'lime-200': hexColor = '#d9f991'; break;
      case 'teal-200': hexColor = '#99f6e4'; break;
      case 'purple-300': hexColor = '#d8b4fe'; break;
      default: hexColor = '#FFFFFF'; break;
    }
  }

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05 * intensity;
      ref.current.rotation.x += delta * 0.025 * intensity;
    }
  });

  return (
    <group position={position}>
      <Points ref={ref} positions={positions.current} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={hexColor}
          size={0.05 * size}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
      {element === Element.MAGMA && (
        <Points positions={generateParticles(25 * intensity, 0.8 * size)} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#ff4500" // Orange-röd för magma
            size={0.075 * size}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </Points>
      )}
      {element === Element.STEAM && (
        <Points positions={generateParticles(75 * intensity, 1.2 * size)} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#e0f2f4" // Ljusblå för ånga
            size={0.04 * size}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </Points>
      )}
      {element === Element.STORM && (
        <Points positions={generateParticles(50 * intensity, 1.5 * size)} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#60a5fa" // Blå för storm
            size={0.06 * size}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </Points>
      )}
      {element === Element.SAND && (
        <Points positions={generateParticles(40 * intensity, 0.9 * size)} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#fcd34d" // Sandfärg
            size={0.055 * size}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </Points>
      )}
    </group>
  );
};

export default ElementalParticleEffect;