import React, { useRef, useEffect } from 'react';
import { Element } from '../types';

interface Props {
  element: Element;
  isActive: boolean;
  variant?: 'combat' | 'node';
}

const ElementalVFX: React.FC<Props> = ({ element, isActive, variant = 'combat' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNode = variant === 'node';

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || 150;
      height = rect.height || 150;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    // Responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    resize();

    // Particle interfaces
    interface BaseParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      decay: number;
      rotation?: number;
      rotSpeed?: number;
      type?: string;
      seed?: number;
      points?: { x: number; y: number }[];
    }

    interface LightningStrike {
      segments: { x1: number; y1: number; x2: number; y2: number }[];
      alpha: number;
      width: number;
      color: string;
    }

    interface WindRibbon {
      points: { x: number; y: number }[];
      opacity: number;
      width: number;
      color: string;
      speed: number;
      offset: number;
    }

    // State lists
    let particles: BaseParticle[] = [];
    let strikes: LightningStrike[] = [];
    let ribbons: WindRibbon[] = [];
    let nextLightningTime = 0;

    // Helper: Initialize wind ribbons
    const initWindRibbons = () => {
      ribbons = [];
      const count = isNode ? 1 : 3;
      for (let i = 0; i < count; i++) {
        ribbons.push({
          points: [],
          opacity: 0.15 + Math.random() * 0.25,
          width: 1 + Math.random() * 2,
          color: 'rgba(255, 255, 255, 0.4)',
          speed: 1.5 + Math.random() * 2,
          offset: Math.random() * Math.PI * 2,
        });
      }
    };
    if (element === Element.WIND || element === Element.EROSION) {
      initWindRibbons();
    }

    // Main particle generator / update / render loop
    const tick = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // Max particle budget based on context
      const maxParticles = isNode ? 15 : 60;

      // --- SPAWNING & UPDATING PER ELEMENT ---
      if (isActive && particles.length < maxParticles) {
        // Fire Element
        if (element === Element.FIRE || element === Element.FIRESTORM) {
          const spawnCount = isNode ? 0.25 : 1.5;
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < spawnCount) {
              const isSpark = Math.random() < 0.25;
              particles.push({
                x: isNode ? width / 2 + (Math.random() - 0.5) * 15 : width / 2 + (Math.random() - 0.5) * 40,
                y: height - 10,
                vx: (Math.random() - 0.5) * (isSpark ? 2.5 : 1),
                vy: isSpark ? -2 - Math.random() * 3 : -1.5 - Math.random() * 2,
                size: isSpark ? 1.5 + Math.random() * 2 : 6 + Math.random() * 10,
                color: isSpark ? '#fde047' : '#ea580c',
                alpha: 1.0,
                life: 1.0,
                decay: isSpark ? 0.02 + Math.random() * 0.03 : 0.01 + Math.random() * 0.015,
                type: isSpark ? 'spark' : 'flame',
              });
            }
          }
        }

        // Earth / Obsidian Element
        else if (element === Element.EARTH || element === Element.OBSIDIAN) {
          // Rocks spawn rarely
          const rockCount = particles.filter(p => p.type === 'rock').length;
          const maxRocks = isNode ? 1 : 4;
          if (rockCount < maxRocks && Math.random() < 0.02) {
            const size = isNode ? 4 + Math.random() * 4 : 8 + Math.random() * 10;
            // Generate rock polygon points
            const pointsCount = 5 + Math.floor(Math.random() * 3);
            const points = [];
            for (let j = 0; j < pointsCount; j++) {
              const angle = (j / pointsCount) * Math.PI * 2;
              const radius = size * (0.7 + Math.random() * 0.4);
              points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
            }

            particles.push({
              x: width * 0.15 + Math.random() * width * 0.7,
              y: height * 0.3 + Math.random() * height * 0.5,
              vx: 0,
              vy: 0,
              size,
              color: element === Element.OBSIDIAN ? '#1e1b4b' : '#78350f',
              alpha: 0.9,
              life: 1.0,
              decay: 0.0, // Floating rocks don't decay instantly
              type: 'rock',
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.01,
              seed: Math.random() * 100,
              points,
            });
          }

          // Falling dirt/dust particles
          const spawnCount = isNode ? 0.1 : 0.4;
          if (Math.random() < spawnCount) {
            particles.push({
              x: width * 0.15 + Math.random() * width * 0.7,
              y: isNode ? height * 0.3 : height * 0.2 + Math.random() * height * 0.6,
              vx: (Math.random() - 0.5) * 0.5,
              vy: 0.5 + Math.random() * 1.0,
              size: 1.5 + Math.random() * 3,
              color: element === Element.OBSIDIAN ? '#ea580c' : '#a16207',
              alpha: 0.7,
              life: 1.0,
              decay: 0.01 + Math.random() * 0.02,
              type: 'dust',
            });
          }
        }

        // Wind / Erosion Element
        else if (element === Element.WIND || element === Element.EROSION) {
          const spawnCount = isNode ? 0.15 : 0.6;
          if (Math.random() < spawnCount) {
            // Leaf or air swirl
            const isLeaf = element === Element.WIND && Math.random() < 0.4;
            particles.push({
              x: -20,
              y: height * 0.1 + Math.random() * height * 0.8,
              vx: 2 + Math.random() * 4,
              vy: (Math.random() - 0.5) * 1.0,
              size: isLeaf ? 4 + Math.random() * 4 : 2 + Math.random() * 2,
              color: isLeaf ? '#22c55e' : 'rgba(255,255,255,0.7)',
              alpha: 0.8,
              life: 1.0,
              decay: 0.005 + Math.random() * 0.01,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: 0.02 + Math.random() * 0.05,
              type: isLeaf ? 'leaf' : 'swirl',
              seed: Math.random() * Math.PI * 2,
            });
          }
        }

        // Water Element
        else if (element === Element.WATER) {
          const spawnCount = isNode ? 0.25 : 1.2;
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < spawnCount) {
              const isBubble = Math.random() < 0.3;
              particles.push({
                x: width * 0.1 + Math.random() * width * 0.8,
                y: isBubble ? height - 10 : 0,
                vx: isBubble ? (Math.random() - 0.5) * 0.5 : -0.5 - Math.random() * 0.5,
                vy: isBubble ? -0.8 - Math.random() * 0.8 : 3.5 + Math.random() * 2.5,
                size: isBubble ? 2 + Math.random() * 4 : 1.5 + Math.random() * 2,
                color: isBubble ? 'rgba(147, 197, 253, 0.4)' : '#60a5fa',
                alpha: isBubble ? 0.6 : 0.85,
                life: 1.0,
                decay: isBubble ? 0.005 + Math.random() * 0.01 : 0.01 + Math.random() * 0.01,
                type: isBubble ? 'bubble' : 'drop',
                seed: Math.random() * 100,
              });
            }
          }
        }

        // Ice Element
        else if (element === Element.ICE) {
          const spawnCount = isNode ? 0.2 : 0.8;
          if (Math.random() < spawnCount) {
            const isGlint = Math.random() < 0.25;
            particles.push({
              x: width * 0.05 + Math.random() * width * 0.9,
              y: isGlint ? height * 0.1 + Math.random() * height * 0.8 : 0,
              vx: (Math.random() - 0.5) * 0.8,
              vy: isGlint ? 0 : 0.8 + Math.random() * 1.2,
              size: isGlint ? 5 + Math.random() * 5 : 3 + Math.random() * 5,
              color: isGlint ? '#ffffff' : '#93c5fd',
              alpha: 0.9,
              life: 1.0,
              decay: isGlint ? 0.02 + Math.random() * 0.02 : 0.005 + Math.random() * 0.01,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.03,
              type: isGlint ? 'glint' : 'flake',
            });
          }
        }

        // Storm / Volcanic Storm / Vitrified Storm Element
        else if (
          element === Element.STORM ||
          element === Element.VOLCANIC_STORM ||
          element === Element.VITRIFIED_STORM
        ) {
          // Spawn Rain drops
          const rainCount = isNode ? 1 : 4;
          for (let i = 0; i < rainCount; i++) {
            particles.push({
              x: width * 0.05 + Math.random() * width * 1.1, // slant means we can spawn off right edge
              y: 0,
              vx: -1.5 - Math.random() * 1.0,
              vy: 7.0 + Math.random() * 5.0,
              size: 1 + Math.random() * 1.5,
              color: element === Element.VOLCANIC_STORM ? 'rgba(239, 68, 68, 0.4)' : 'rgba(147, 197, 253, 0.5)',
              alpha: 0.6,
              life: 1.0,
              decay: 0.015 + Math.random() * 0.01,
              type: 'rain',
            });
          }

          // Trigger Lightning strike
          if (time >= nextLightningTime) {
            const isTiny = isNode;
            const startX = width * 0.2 + Math.random() * width * 0.6;
            const startY = 0;
            const endX = startX + (Math.random() - 0.5) * (isTiny ? 40 : 120);
            const endY = height;

            const boltSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

            // Generate lightning fractal branches
            const generateBranch = (x1: number, y1: number, x2: number, y2: number, displace: number) => {
              if (displace < (isTiny ? 1.5 : 4)) {
                boltSegments.push({ x1, y1, x2, y2 });
                return;
              }
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ox = (-dy / len) * (Math.random() - 0.5) * displace;
              const oy = (dx / len) * (Math.random() - 0.5) * displace;

              // Generate side branch sometimes
              if (!isTiny && Math.random() < 0.18) {
                const bx = midX + ox;
                const by = midY + oy;
                const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
                const branchLen = len * 0.4;
                const bx2 = bx + Math.cos(branchAngle) * branchLen;
                const by2 = by + Math.sin(branchAngle) * branchLen;
                generateBranch(bx, by, bx2, by2, displace * 0.5);
              }

              generateBranch(x1, y1, midX + ox, midY + oy, displace * 0.5);
              generateBranch(midX + ox, midY + oy, x2, y2, displace * 0.5);
            };

            generateBranch(startX, startY, endX, endY, isTiny ? 15 : 60);

            let color = '#e0ffff';
            if (element === Element.VOLCANIC_STORM) color = '#ef4444';
            else if (element === Element.VITRIFIED_STORM) color = '#f472b6';

            strikes.push({
              segments: boltSegments,
              alpha: 1.0,
              width: isTiny ? 1.2 : 2.5,
              color,
            });

            // Set next trigger time
            nextLightningTime = time + (isTiny ? 250 + Math.random() * 400 : 100 + Math.random() * 200);
          }
        }

        // Growth Element
        else if (element === Element.GROWTH) {
          const spawnCount = isNode ? 0.15 : 0.6;
          if (Math.random() < spawnCount) {
            const isSpore = Math.random() < 0.5;
            particles.push({
              x: width * 0.1 + Math.random() * width * 0.8,
              y: isSpore ? height - 10 : 0,
              vx: (Math.random() - 0.5) * 0.8,
              vy: isSpore ? -1 - Math.random() * 1.2 : 1 + Math.random() * 1.5,
              size: isSpore ? 2.5 + Math.random() * 3 : 5 + Math.random() * 6,
              color: isSpore ? '#84cc16' : '#22c55e',
              alpha: 0.8,
              life: 1.0,
              decay: 0.008 + Math.random() * 0.012,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.05,
              type: isSpore ? 'spore' : 'leaf',
              seed: Math.random() * 10,
            });
          }
        }

        // Steam / Hot Air / Hot Springs Element
        else if (element === Element.STEAM || element === Element.HOT_AIR || element === Element.HOT_SPRINGS) {
          const spawnCount = isNode ? 0.3 : 1.2;
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < spawnCount) {
              particles.push({
                x: width * 0.2 + Math.random() * width * 0.6,
                y: height - 10,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -2 - Math.random() * 2.5,
                size: 8 + Math.random() * 12,
                color: '#e2e8f0',
                alpha: 0.55,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.015,
                type: 'steam',
              });
            }
          }
        }

        // Magma / Volcanic Storm Element
        else if (element === Element.MAGMA) {
          const spawnCount = isNode ? 0.25 : 1.0;
          for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < spawnCount) {
              particles.push({
                x: width * 0.15 + Math.random() * width * 0.7,
                y: height - 5,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -0.6 - Math.random() * 1.2,
                size: 6 + Math.random() * 10,
                color: '#ea580c',
                alpha: 0.95,
                life: 1.0,
                decay: 0.008 + Math.random() * 0.012,
                type: 'magma',
              });
            }
          }
        }

        // Mud / Electrified Mud Element
        else if (element === Element.MUD || element === Element.ELECTRIFIED_MUD) {
          const spawnCount = isNode ? 0.2 : 0.7;
          if (Math.random() < spawnCount) {
            particles.push({
              x: width * 0.15 + Math.random() * width * 0.7,
              y: 0,
              vx: (Math.random() - 0.5) * 0.5,
              vy: 2.0 + Math.random() * 2.0,
              size: 4 + Math.random() * 8,
              color: '#78350f',
              alpha: 0.9,
              life: 1.0,
              decay: 0.01 + Math.random() * 0.015,
              type: 'mud',
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.04,
            });
          }
        }

        // Sand Element
        else if (element === Element.SAND) {
          const spawnCount = isNode ? 1 : 4;
          for (let i = 0; i < spawnCount; i++) {
            particles.push({
              x: 0,
              y: height * 0.1 + Math.random() * height * 0.8,
              vx: 3.5 + Math.random() * 3.0,
              vy: (Math.random() - 0.5) * 0.8,
              size: 1 + Math.random() * 2,
              color: '#ca8a04',
              alpha: 0.85,
              life: 1.0,
              decay: 0.01 + Math.random() * 0.02,
              type: 'sand',
            });
          }
        }

        // Neutral / Default Element fallback
        else {
          if (Math.random() < 0.3) {
            particles.push({
              x: width * 0.1 + Math.random() * width * 0.8,
              y: height * 0.1 + Math.random() * height * 0.8,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.5 - Math.random() * 0.5,
              size: 2 + Math.random() * 4,
              color: '#ffffff',
              alpha: 0.7,
              life: 1.0,
              decay: 0.015 + Math.random() * 0.015,
              type: 'neutral',
            });
          }
        }
      }

      // --- RENDERING ELEMENTS ---

      // Enable additive blending for glowing elements
      const isGlowing = [
        Element.FIRE,
        Element.FIRESTORM,
        Element.STORM,
        Element.VOLCANIC_STORM,
        Element.VITRIFIED_STORM,
        Element.MAGMA,
        Element.STEAM,
        Element.HOT_AIR,
        Element.HOT_SPRINGS,
        Element.ICE,
        Element.GROWTH,
      ].includes(element);

      if (isGlowing) {
        ctx.globalCompositeOperation = 'lighter';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      // Draw background storm overlays
      if (
        (element === Element.STORM ||
          element === Element.VOLCANIC_STORM ||
          element === Element.VITRIFIED_STORM) &&
        !isNode &&
        strikes.length > 0 &&
        strikes[0].alpha > 0.85
      ) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = element === Element.VOLCANIC_STORM ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 1. Draw Wind Ribbons (if WIND / EROSION)
      if (element === Element.WIND || element === Element.EROSION) {
        ctx.save();
        ribbons.forEach(rib => {
          // Dynamic math for waves
          rib.points = [];
          const step = width / 12;
          for (let xCoord = -10; xCoord <= width + 10; xCoord += step) {
            const amplitude = isNode ? 8 : 22;
            const waveY =
              height * 0.5 +
              Math.sin(xCoord * 0.015 - time * 0.05 * rib.speed + rib.offset) * amplitude +
              Math.cos(xCoord * 0.005 + time * 0.02) * (amplitude * 0.4);
            rib.points.push({ x: xCoord, y: waveY });
          }

          // Draw ribbon
          ctx.beginPath();
          ctx.moveTo(rib.points[0].x, rib.points[0].y);
          for (let j = 1; j < rib.points.length - 1; j++) {
            const xc = (rib.points[j].x + rib.points[j + 1].x) / 2;
            const yc = (rib.points[j].y + rib.points[j + 1].y) / 2;
            ctx.quadraticCurveTo(rib.points[j].x, rib.points[j].y, xc, yc);
          }
          ctx.lineTo(rib.points[rib.points.length - 1].x, rib.points[rib.points.length - 1].y);

          ctx.strokeStyle = rib.color;
          ctx.globalAlpha = rib.opacity;
          ctx.lineWidth = rib.width;
          ctx.shadowColor = '#e0f2fe';
          ctx.shadowBlur = isNode ? 2 : 5;
          ctx.stroke();
        });
        ctx.restore();
      }

      // 2. Draw Lightning strikes (if STORM)
      strikes.forEach(strike => {
        ctx.save();
        ctx.shadowColor = strike.color;
        ctx.shadowBlur = isNode ? 6 : 18;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = strike.width;
        ctx.globalAlpha = strike.alpha;

        ctx.beginPath();
        strike.segments.forEach(seg => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();

        // Draw secondary glow stroke
        ctx.strokeStyle = strike.color;
        ctx.lineWidth = strike.width * 2.5;
        ctx.globalAlpha = strike.alpha * 0.4;
        ctx.stroke();

        ctx.restore();

        // Decay lightning strike alpha
        strike.alpha -= 0.12;
      });
      strikes = strikes.filter(s => s.alpha > 0);

      // 3. Draw and Update Particles
      particles.forEach(p => {
        p.life -= p.decay;

        // Apply physics/movement
        if (p.type === 'rock') {
          // Floating behavior
          const amp = isNode ? 1.5 : 4;
          const rockOffset = Math.sin(time * 0.03 + (p.seed || 0)) * amp;
          p.y += (p.vy || 0); // Constant motion if any
          p.rotation = (p.rotation || 0) + (p.rotSpeed || 0);
          
          // Render rock polygon
          ctx.save();
          ctx.translate(p.x, p.y + rockOffset);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = element === Element.OBSIDIAN ? '#f97316' : '#451a03';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          if (p.points && p.points.length > 0) {
            ctx.moveTo(p.points[0].x, p.points[0].y);
            for (let k = 1; k < p.points.length; k++) {
              ctx.lineTo(p.points[k].x, p.points[k].y);
            }
          } else {
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          return;
        }

        // Apply velocities for simple particles
        p.x += p.vx;
        p.y += p.vy;

        // Wind wiggles
        if (element === Element.WIND || element === Element.EROSION) {
          p.vy += Math.sin(time * 0.1 + (p.seed || 0)) * 0.08;
        }
        // Bubble sine float
        if (p.type === 'bubble') {
          p.vx = Math.sin(time * 0.08 + (p.seed || 0)) * 0.4;
        }

        // Draw particle based on type
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha * p.life);

        // --- SPECIFIC PARTICLE RENDERING ---

        // Flame Particle
        if (p.type === 'flame') {
          const size = Math.max(0.001, p.size * p.life);
          const grad = ctx.createRadialGradient(p.x, p.y, size * 0.05, p.x, p.y, size * 0.5);
          
          if (p.life > 0.65) {
            // White hot core
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#fde047');
            grad.addColorStop(0.7, '#f97316');
            grad.addColorStop(1.0, 'rgba(239, 68, 68, 0)');
          } else if (p.life > 0.25) {
            // Orange/red flame
            grad.addColorStop(0, '#f97316');
            grad.addColorStop(0.5, '#ef4444');
            grad.addColorStop(1.0, 'rgba(185, 28, 28, 0)');
          } else {
            // Smoldering ash/smoke
            grad.addColorStop(0, '#4b5563');
            grad.addColorStop(0.6, 'rgba(75, 85, 99, 0.1)');
            grad.addColorStop(1.0, 'rgba(31, 41, 55, 0)');
          }
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Steam Particle (Soft, expanding)
        else if (p.type === 'steam') {
          const currentSize = Math.max(0.001, p.size * (1 + (1 - p.life) * 1.5)); // expands as it rises
          const grad = ctx.createRadialGradient(p.x, p.y, currentSize * 0.05, p.x, p.y, currentSize * 0.5);
          grad.addColorStop(0, `rgba(226, 232, 240, ${p.life * 0.45})`);
          grad.addColorStop(0.5, `rgba(203, 213, 225, ${p.life * 0.2})`);
          grad.addColorStop(1.0, 'rgba(203, 213, 225, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Magma bubble
        else if (p.type === 'magma') {
          const size = Math.max(0.001, p.size * (0.6 + p.life * 0.4));
          const grad = ctx.createRadialGradient(p.x, p.y, size * 0.05, p.x, p.y, size * 0.5);
          grad.addColorStop(0, '#fef08a'); // hot core
          grad.addColorStop(0.4, '#f97316');
          grad.addColorStop(0.8, '#b91c1c'); // cool shell
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rain Drop
        else if (p.type === 'rain') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
          ctx.stroke();
        }

        // Water Drop
        else if (p.type === 'drop') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.8, p.y + p.vy * 1.8);
          ctx.stroke();
        }

        // Ice Flake (Hexagonal crystal shape)
        else if (p.type === 'flake') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#67e8f9';
          ctx.shadowBlur = isNode ? 2 : 5;

          // Draw small diamond flake
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.6, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        }

        // Ice/Light Glint (4-point sparkle star)
        else if (p.type === 'glint') {
          const s = p.size * Math.sin(p.life * Math.PI); // Pulsing size
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.closePath();
          ctx.fill();
        }

        // Green Leaf
        else if (p.type === 'leaf') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = p.color;
          
          // Draw leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(p.size * 0.6, -p.size * 0.5, p.size * 0.2, p.size);
          ctx.quadraticCurveTo(-p.size * 0.6, -p.size * 0.5, 0, -p.size);
          ctx.closePath();
          ctx.fill();
        }

        // Mud Glob
        else if (p.type === 'mud') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = p.color;
          // Mud is wobbly egg shape
          const rx = p.size * (0.8 + Math.sin(time * 0.1) * 0.1);
          const ry = p.size * (1.1 + Math.cos(time * 0.1) * 0.1);
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();

          // Yellow sparks if electrified mud
          if (element === Element.ELECTRIFIED_MUD && Math.random() < 0.12) {
            ctx.fillStyle = '#fde047';
            ctx.fillRect((Math.random() - 0.5) * rx * 2, (Math.random() - 0.5) * ry * 2, 2, 2);
          }
        }

        // General circle particle (dust, spark, spore, water bubble, sand, neutral)
        else {
          ctx.fillStyle = p.color;
          if (p.type === 'spark') {
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 6;
          } else if (p.type === 'spore') {
            ctx.shadowColor = '#84cc16';
            ctx.shadowBlur = 4;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Increment rotations
        if (p.rotation !== undefined && p.rotSpeed !== undefined) {
          p.rotation += p.rotSpeed;
        }
      });

      // Filter out dead particles or out-of-screen particles
      particles = particles.filter(p => {
        if (p.life <= 0) return false;
        if (p.x < -100 || p.x > width + 100) return false;
        if (p.y < -100 || p.y > height + 100) return false;
        return true;
      });

      // Request next frame
      animationId = requestAnimationFrame(tick);
    };

    // Start loop
    animationId = requestAnimationFrame(tick);

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [element, isActive, isNode]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ElementalVFX;
