import React from 'react';
import ElementalTitleParticles from './ElementalTitleParticles';

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  // Partikelalternativ för Fire
  const elementalFireParticlesOptions = {
    particles: {
      number: { value: 50, density: { enable: true, area: 800 } },
      color: { value: ["#ff4500", "#ffa500", "#ff6347"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.3, max: 0.7 }, animation: { enable: true, speed: 1, sync: false } },
      size: { value: { min: 1, max: 3 }, animation: { enable: true, speed: 4, sync: false, startValue: "random", destroy: "min" } },
      links: { enable: false },
      move: {
        enable: true,
        speed: 1.5,
        direction: "top",
        random: true,
        straight: false,
        outModes: { default: "out" },
        bounce: false,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
    detectRetina: true,
    background: { color: { value: "transparent" } },
  };

  // Partikelalternativ för Water
  const elementalWaterParticlesOptions = {
    particles: {
      number: { value: 60, density: { enable: true, area: 800 } },
      color: { value: ["#00bfff", "#1e90ff", "#4682b4"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.4, max: 0.8 }, animation: { enable: true, speed: 0.8, sync: false } },
      size: { value: { min: 1, max: 4 }, animation: { enable: true, speed: 3, sync: false, startValue: "random", destroy: "min" } },
      links: { enable: false },
      move: {
        enable: true,
        speed: 1,
        direction: "bottom",
        random: true,
        straight: false,
        outModes: { default: "out" },
        bounce: false,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
    detectRetina: true,
    background: { color: { value: "transparent" } },
  };

  // Partikelalternativ för Wind
  const elementalWindParticlesOptions = {
    particles: {
      number: { value: 40, density: { enable: true, area: 800 } },
      color: { value: ["#e0ffff", "#add8e6", "#87ceeb"] },
      shape: { type: "line" }, // Linjer för vindeffekt
      opacity: { value: { min: 0.2, max: 0.6 }, animation: { enable: true, speed: 1.2, sync: false } },
      size: { value: { min: 0.5, max: 2 }, animation: { enable: true, speed: 5, sync: false, startValue: "random", destroy: "min" } },
      links: { enable: false },
      move: {
        enable: true,
        speed: 2.5,
        direction: "right", // Eller "left", kan randomiseras
        random: true,
        straight: false,
        outModes: { default: "out" },
        bounce: false,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
    detectRetina: true,
    background: { color: { value: "transparent" } },
  };

  // Partikelalternativ för Earth
  const elementalEarthParticlesOptions = {
    particles: {
      number: { value: 30, density: { enable: true, area: 800 } },
      color: { value: ["#8b4513", "#a0522d", "#556b2f"] },
      shape: { type: "square" }, // Fyrkanter för jord/sten
      opacity: { value: { min: 0.5, max: 0.9 }, animation: { enable: true, speed: 0.5, sync: false } },
      size: { value: { min: 2, max: 5 }, animation: { enable: true, speed: 2, sync: false, startValue: "random", destroy: "min" } },
      links: { enable: false },
      move: {
        enable: true,
        speed: 0.8,
        direction: "bottom", // Subtil nedåtgående rörelse
        random: true,
        straight: false,
        outModes: { default: "out" },
        bounce: false,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
    detectRetina: true,
    background: { color: { value: "transparent" } },
  };

  return (
    <div className="flex-grow w-full h-full flex flex-col items-center justify-center text-white font-['Press_Start_2P'] relative overflow-hidden">
      {/* En subtil bakgrundsgradient för att ge djup */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-70"></div>

      <div className="relative z-10 text-center">
        <h1 className="text-7xl mb-12 leading-tight relative z-10 flex justify-center">
          <span className="element-text-base element-fire-text relative inline-block">
            <ElementalTitleParticles id="fire-particles" options={elementalFireParticlesOptions} />
            ELE
          </span>
          <span className="element-text-base element-water-text relative inline-block">
            <ElementalTitleParticles id="water-particles" options={elementalWaterParticlesOptions} />
            MENT
          </span>
          <span className="element-text-base element-wind-text relative inline-block">
            <ElementalTitleParticles id="wind-particles" options={elementalWindParticlesOptions} />
            ARIE
          </span>
          <span className="element-text-base element-earth-text relative inline-block">
            <ElementalTitleParticles id="earth-particles" options={elementalEarthParticlesOptions} />
            RNA
          </span>
        </h1>
        <button
          onClick={onStartGame}
          className="px-8 py-4 text-xl bg-yellow-800/50 border-2 border-yellow-600 hover:border-yellow-400 text-yellow-300 transition-colors pixelated-border animate-pulse-glow relative z-10"
        >
          Starta Spel
        </button>
      </div>
    </div>
  );
};

export default MainMenu;