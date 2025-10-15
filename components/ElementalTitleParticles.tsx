import React, { useCallback } from "react";
import type { Container, Engine } from "@tsparticles/engine";
import Particles from "@tsparticles/react";
import { loadFull } from "@tsparticles/preset-full";

interface ElementalTitleParticlesProps {
  options: any; // Typen kan specificeras mer exakt om så önskas
  id: string;
}

const ElementalTitleParticles: React.FC<ElementalTitleParticlesProps> = ({ options, id }) => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    // console.log(container); // Kan användas för debugging
  }, []);

  return (
    <Particles
      id={id}
      init={particlesInit}
      loaded={particlesLoaded}
      options={options}
    />
  );
};

export default ElementalTitleParticles;