import React, { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim'; // Uppdaterad import

interface ElementalTextEffectsProps {
  text: string;
}

const ElementalTextEffects: React.FC<ElementalTextEffectsProps> = ({ text }) => {
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    // Partiklar laddade
  }, []);

  const options = {
    fullScreen: {
      enable: false, // Partiklarna ska vara inom sin föräldradiv
    },
    background: {
      color: {
        value: "transparent", // Bakgrunden för canvasen är transparent
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: {
          enable: false,
          mode: "push",
        },
        onHover: {
          enable: false,
          mode: "repulse",
        },
        resize: true,
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      number: {
        value: 0, // Inga initiala partiklar, endast från emitters
      },
      color: {
        value: "#ffffff", // Standardfärg, åsidosätts av emitters
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: 0.5,
        random: true,
      },
      size: {
        value: 3,
        random: true,
      },
      links: {
        enable: false,
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "destroy", // Partiklar försvinner när de är utanför gränserna
        },
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200,
        },
      },
    },
    detectRetina: true,
    emitters: [
      // Eld-emitter (nere till vänster, stiger)
      {
        position: { x: 20, y: 80 }, // Relativt till föräldradiven (0-100%)
        rate: { quantity: 2, delay: 0.1 },
        life: { duration: 2, count: 0 },
        particles: {
          color: { value: ["#ff4500", "#ffa500", "#ff6347"] },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 5 } },
          opacity: { value: { min: 0.3, max: 0.7 }, animation: { enable: true, speed: 0.5, minimumValue: 0, sync: false } },
          move: {
            enable: true,
            speed: { min: 1, max: 3 },
            direction: "top",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            gravity: { enable: false },
            drift: { min: -0.5, max: 0.5 },
          },
        },
      },
      // Vatten-emitter (uppe i mitten, droppar)
      {
        position: { x: 50, y: 20 },
        rate: { quantity: 1, delay: 0.5 },
        life: { duration: 3, count: 0 },
        particles: {
          color: { value: ["#00bfff", "#1e90ff", "#4682b4"] },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 3 } },
          opacity: { value: { min: 0.5, max: 0.9 }, animation: { enable: true, speed: 0.5, minimumValue: 0, sync: false } },
          move: {
            enable: true,
            speed: { min: 1, max: 2 },
            direction: "bottom",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            gravity: { enable: true, acceleration: 0.5 }, // Minskad gravitation för mer "droppande" känsla
            bounce: { vertical: { enable: true, minimumValue: 0.5 } },
            drift: { min: -0.2, max: 0.2 },
          },
        },
      },
      // Jord/Tillväxt-emitter (nere till höger, växer uppåt)
      {
        position: { x: 80, y: 80 },
        rate: { quantity: 1, delay: 0.8 },
        life: { duration: 2.5, count: 0 },
        particles: {
          color: { value: ["#8b4513", "#a0522d", "#556b2f", "#6b8e23"] },
          shape: { type: "square" },
          size: { value: { min: 2, max: 6 } },
          opacity: { value: { min: 0.6, max: 1 }, animation: { enable: true, speed: 0.5, minimumValue: 0, sync: false } },
          move: {
            enable: true,
            speed: { min: 0.5, max: 1.5 },
            direction: "top",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            gravity: { enable: false },
            drift: { min: -0.3, max: 0.3 },
          },
        },
      },
      // Blixt-emitter (slumpmässig, snabb, gnistrande)
      {
        position: { x: 50, y: 50 }, // Centrerad, kommer att spridas ut
        rate: { quantity: 0.5, delay: 1.5 },
        life: { duration: 0.5, count: 0 },
        particles: {
          color: { value: ["#e0ffff", "#add8e6", "#87ceeb", "#ffffff"] },
          shape: { type: "star", options: { sides: 4 } },
          size: { value: { min: 2, max: 8 } },
          opacity: { value: { min: 0.8, max: 1 }, animation: { enable: true, speed: 1, minimumValue: 0, sync: false } },
          move: {
            enable: true,
            speed: { min: 10, max: 20 },
            direction: "random",
            random: true,
            straight: false,
            outModes: { default: "destroy" },
            gravity: { enable: false },
          },
        },
      },
    ],
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Själva texten, renderad ovanpå partiklarna */}
      <h1 className="relative z-10 text-6xl md:text-7xl lg:text-8xl leading-tight drop-shadow-[0_0_10px_rgba(252,211,77,0.7)] text-yellow-300">
        {text}
      </h1>
      {/* Partikel-canvas */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={options as any}
        className="absolute inset-0 z-0"
      />
    </div>
  );
};

export default ElementalTextEffects;