import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Element } from '../types';
import { elementThemes } from '../constants';

interface ElementalVFXProps {
  element: Element;
  size?: number;
  intensity?: number;
}

// Helper for generating particles
const generateParticles = (count: number, range: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * range;
  }
  return positions;
};

const ParticleEffect: React.FC<{ color: string; count: number; size: number; speed: number; range: number }> = ({ color, count, size, speed, range }) => {
  const ref = useRef<THREE.Points>(null);
  const positions = useRef(generateParticles(count, range));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * speed;
      ref.current.rotation.x += delta * speed * 0.5;
    }
  });

  return (
    <Points ref={ref} positions={positions.current} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

const ElementalVFX: React.FC<ElementalVFXProps> = ({ element, size = 0.5, intensity = 1 }) => {
  const theme = elementThemes[element] || elementThemes[Element.NEUTRAL];
  const colorMatch = theme.match(/text-([a-z]+-\d+)/);
  let hexColor = '#FFFFFF'; // Default white

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

  const particleCount = 50 * intensity;
  const particleSize = 0.05 * size;
  const particleSpeed = 0.05 * intensity;
  const particleRange = 1 * size;

  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 1.5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <ParticleEffect 
          color={hexColor} 
          count={particleCount} 
          size={particleSize} 
          speed={particleSpeed} 
          range={particleRange} 
        />
        {/* Add specific effects for hybrid elements if desired */}
        {element === Element.MAGMA && (
          <ParticleEffect 
            color="#ff4500" // Orange-red for magma
            count={particleCount / 2} 
            size={particleSize * 1.5} 
            speed={particleSpeed * 0.7} 
            range={particleRange * 0.8} 
          />
        )}
        {element === Element.STEAM && (
          <ParticleEffect 
            color="#e0f2f4" // Light blue for steam
            count={particleCount * 1.5} 
            size={particleSize * 0.8} 
            speed={particleSpeed * 1.2} 
            range={particleRange * 1.2} 
          />
        )}
        {element === Element.STORM && (
          <ParticleEffect 
            color="#60a5fa" // Blue for storm
            count={particleCount} 
            size={particleSize * 1.2} 
            speed={particleSpeed * 1.5} 
            range={particleRange * 1.5} 
          />
        )}
        {element === Element.SAND && (
          <ParticleEffect 
            color="#fcd34d" // Sand color
            count={particleCount * 0.8} 
            size={particleSize * 1.1} 
            speed={particleSpeed * 0.9} 
            range={particleRange * 0.9} 
          />
        )}
        {/* Add more hybrid effects here */}
      </Canvas>
    </div>
  );
};

export default ElementalVFX;