import React, { useCallback } from "react";
import type { Container, Engine } from "tsparticles-engine";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";

interface ElementalTitleParticlesProps {
  h1Rect: DOMRect;
}

const ElementalTitleParticles: React.FC<ElementalTitleParticlesProps> = ({ h1Rect }) => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    // console.log("Particles container loaded", container);
  }, []);

  // Calculate emitter positions relative to the h1Rect
  // These are approximate percentages of the h1Rect's width
  const fireX = (h1Rect.width * 0.15) / h1Rect.width * 100; // "ELE"
  const waterX = (h1Rect.width * 0.40) / h1Rect.width * 100; // "MENT"
  const windX = (h1Rect.width * 0.65) / h1Rect.width * 100; // "ARIE"
  const earthX = (h1Rect.width * 0.90) / h1Rect.width * 100; // "RNA"
  
  // Lightning between Fire (ELE) and Wind (ARIE), crossing over Water (MENT)
  const lightningX = (h1Rect.width * 0.45) / h1Rect.width * 100; 

  const emitterY = 50; // Center vertically within the h1Rect

  const options = {
    fullScreen: { enable: false }, // Particles will be confined to the parent div
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: false },
        onHover: { enable: false },
        resize: true,
      },
    },
    particles: {
      number: { value: 0 }, // No default particles, only emitters
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: { min: 1, max: 5 } },
      links: { enable: false },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "destroy" },
      },
    },
    emitters: [
      // Fire for "ELE"
      {
        position: { x: fireX, y: emitterY },
        rate: { quantity: 2, delay: 0.1 },
        size: { width: h1Rect.width * 0.2, height: h1Rect.height * 0.8, mode: "percent" }, // Cover "ELE" section
        particles: {
          color: { value: ["#ff4500", "#ffa500", "#ff6347"] },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 3 } },
          opacity: { value: { min: 0.5, max: 1 }, animation: { enable: true, speed: 1, sync: false, startValue: "random", destroy: "min" } },
          life: { duration: { value: { min: 0.5, max: 1.5 } } },
          move: {
            enable: true,
            speed: 2,
            direction: "top",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
          },
        },
      },
      // Water for "MENT"
      {
        position: { x: waterX, y: emitterY },
        rate: { quantity: 2, delay: 0.1 },
        size: { width: h1Rect.width * 0.25, height: h1Rect.height * 0.8, mode: "percent" }, // Cover "MENT" section
        particles: {
          color: { value: ["#00bfff", "#1e90ff", "#4682b4"] },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 2 } },
          opacity: { value: { min: 0.3, max: 0.8 } },
          life: { duration: { value: { min: 1, max: 2 } } },
          move: {
            enable: true,
            speed: 1,
            direction: "bottom",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            wobble: { enable: true, distance: 5, speed: 5 },
          },
        },
      },
      // Wind for "ARIE"
      {
        position: { x: windX, y: emitterY },
        rate: { quantity: 3, delay: 0.05 },
        size: { width: h1Rect.width * 0.25, height: h1Rect.height * 0.8, mode: "percent" }, // Cover "ARIE" section
        particles: {
          color: { value: ["#e0ffff", "#add8e6", "#87ceeb"] },
          shape: { type: "line" },
          size: { value: { min: 0.5, max: 1.5 } },
          opacity: { value: { min: 0.6, max: 1 } },
          life: { duration: { value: { min: 0.8, max: 1.8 } } },
          move: {
            enable: true,
            speed: 3,
            direction: "right",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            angle: { value: 45, random: true },
          },
        },
      },
      // Earth for "RNA"
      {
        position: { x: earthX, y: emitterY },
        rate: { quantity: 1, delay: 0.2 },
        size: { width: h1Rect.width * 0.2, height: h1Rect.height * 0.8, mode: "percent" }, // Cover "RNA" section
        particles: {
          color: { value: ["#8b4513", "#a0522d", "#556b2f"] },
          shape: { type: "square" },
          size: { value: { min: 2, max: 4 } },
          opacity: { value: { min: 0.4, max: 0.7 } },
          life: { duration: { value: { min: 1.5, max: 3 } } },
          move: {
            enable: true,
            speed: 0.5,
            direction: "bottom",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            gravity: { enable: true, acceleration: 0.5 },
          },
        },
      },
      // Lightning between Fire (ELE) and Wind (ARIE)
      {
        position: { x: lightningX, y: emitterY },
        size: { width: h1Rect.width * 0.3, height: h1Rect.height * 0.8, mode: "percent" }, // Area for lightning
        rate: { quantity: 0.5, delay: 2 }, // Infrequent bursts
        particles: {
          color: { value: ["#ffff00", "#ffffff", "#ffd700"] },
          shape: { type: "line" },
          size: { value: { min: 1, max: 5 } },
          opacity: { value: { min: 0.8, max: 1 } },
          life: { duration: { value: { min: 0.1, max: 0.3 } } },
          move: {
            enable: true,
            speed: 10,
            direction: "right", 
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            trail: { enable: true, length: 5, fill: { color: "#ffff00" } },
          },
        },
      },
    ],
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, // Relative to parent div
        left: 0, // Relative to parent div
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks to pass through
      }}
    >
      <Particles
        id="elemental-title-particles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={options}
      />
    </div>
  );
};

export default ElementalTitleParticles;