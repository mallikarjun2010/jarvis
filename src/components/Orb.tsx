'use client';

import React, { useEffect, useRef } from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface OrbProps {
  state: OrbState;
  onClick?: () => void;
  size?: number;
}

export const Orb: React.FC<OrbProps> = ({ state = 'idle', onClick, size = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<OrbState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    // Define colors
    const colors = {
      idle: {
        primary: 'rgba(0, 210, 255, 0.7)',   // Cyan
        secondary: 'rgba(0, 102, 255, 0.4)', // Electric Blue
        accent: 'rgba(124, 58, 237, 0.2)',   // Soft Purple
      },
      thinking: {
        primary: 'rgba(157, 78, 221, 0.8)',  // Purple
        secondary: 'rgba(199, 125, 255, 0.5)',// Magenta
        accent: 'rgba(0, 210, 255, 0.3)',    // Cyan Highlight
      },
      listening: {
        primary: 'rgba(0, 245, 212, 0.8)',   // Glowing Green-Cyan
        secondary: 'rgba(0, 210, 255, 0.5)', // Cyan
        accent: 'rgba(255, 255, 255, 0.3)',  // White
      },
      speaking: {
        primary: 'rgba(0, 210, 255, 0.8)',   // Cyan
        secondary: 'rgba(255, 255, 255, 0.6)',// White
        accent: 'rgba(157, 78, 221, 0.4)',   // Purple
      },
    };

    // Render loop
    const render = () => {
      const currentState = stateRef.current;
      const palette = colors[currentState];

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = (size / 2) * 0.75;

      // Adjust animation speed based on state
      let speed = 0.02;
      let waveCount = 3;
      let amplitudeMultiplier = 1;

      if (currentState === 'thinking') {
        speed = 0.08;
        waveCount = 5;
        amplitudeMultiplier = 0.8;
      } else if (currentState === 'listening') {
        speed = 0.04;
        waveCount = 4;
        // Simulating amplitude fluctuation
        amplitudeMultiplier = 1.2 + Math.sin(phase * 2) * 0.3;
      } else if (currentState === 'speaking') {
        speed = 0.05;
        waveCount = 4;
        amplitudeMultiplier = 1.4 + Math.sin(phase * 4) * 0.4;
      }

      phase += speed;

      // 1. Draw Background Radial Glow
      const glowGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, maxRadius * 1.5
      );
      
      const glowOpacity = currentState === 'thinking' ? 0.25 : currentState === 'listening' ? 0.35 : 0.2;
      glowGrad.addColorStop(0, palette.primary.replace('0.8', String(glowOpacity)).replace('0.7', String(glowOpacity)));
      glowGrad.addColorStop(0.5, palette.secondary.replace('0.6', '0.08').replace('0.5', '0.08').replace('0.4', '0.08'));
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Waves / Organic Concentric Layers
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        const segments = 100;
        const offset = (i * Math.PI) / waveCount;

        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          
          // Wave equation
          let waveOffset = 0;
          if (currentState === 'idle') {
            waveOffset = Math.sin(angle * 3 + phase + offset) * 4;
          } else if (currentState === 'thinking') {
            waveOffset = Math.sin(angle * 6 + phase * 2.5 + offset) * 8 + Math.cos(angle * 2 - phase) * 3;
          } else if (currentState === 'listening') {
            waveOffset = Math.sin(angle * 4 + phase * 1.5 + offset) * 12 * amplitudeMultiplier;
          } else if (currentState === 'speaking') {
            waveOffset = Math.sin(angle * 5 + phase * 2 + offset) * 15 * amplitudeMultiplier;
          }

          const r = maxRadius - (i * 8) + waveOffset;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.lineWidth = 1.5 + (i * 0.5);

        // Gradient Stroke for Wave
        const strokeGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        strokeGrad.addColorStop(0, palette.primary);
        strokeGrad.addColorStop(0.5, palette.secondary);
        strokeGrad.addColorStop(1, palette.accent);

        ctx.strokeStyle = strokeGrad;
        ctx.shadowBlur = currentState === 'speaking' || currentState === 'listening' ? 12 : 6;
        ctx.shadowColor = palette.primary;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow for next draw
      }

      // 3. Central Core Glow
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, maxRadius * 0.3
      );
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.3, palette.primary);
      coreGrad.addColorStop(0.7, palette.secondary);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // 4. Particle Swirl for 'thinking' state
      if (currentState === 'thinking') {
        const pCount = 12;
        for (let i = 0; i < pCount; i++) {
          const angle = phase * 1.5 + (i * (Math.PI * 2)) / pCount;
          const dist = maxRadius * (1.1 + Math.sin(phase + i) * 0.1);
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist;

          ctx.fillStyle = 'rgba(199, 125, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [size]);

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          display: 'block',
          filter: 'drop-shadow(0 0 20px rgba(0, 210, 255, 0.15))',
          animation: state === 'idle' ? 'breath 4s infinite ease-in-out' : 'none',
        }}
      />
    </div>
  );
};
