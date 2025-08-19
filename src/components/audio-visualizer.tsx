"use client"

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  frequency: number;
  rotate: number;
  rotateSpeed: number;
  shape: 'circle' | 'square' | 'triangle' | 'star';
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastParticleTimeRef = useRef<number>(0);
  const { theme } = useTheme();
  
  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioRef.current) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContext();
      const analyzerNode = context.createAnalyser();
      analyzerNode.fftSize = 256;
      
      const bufferLength = analyzerNode.frequencyBinCount;
      const dataArr = new Uint8Array(bufferLength);
      
      const sourceNode = context.createMediaElementSource(audioRef.current);
      sourceNode.connect(analyzerNode);
      analyzerNode.connect(context.destination);
      
      setAudioContext(context);
      setAnalyser(analyzerNode);
      setDataArray(dataArr);
      setSource(sourceNode);
    } catch (err) {
      console.error("Error initializing audio context:", err);
    }

    return () => {
      if (source) {
        source.disconnect();
      }
      if (analyser) {
        analyser.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef]);

  // Get theme-appropriate colors
  const getThemeColors = () => {
    const isDark = theme === 'dark';
    
    // Neon palette for dark mode, pastel palette for light mode
    return isDark 
      ? [
          '#ff00ff', // Magenta
          '#00ffff', // Cyan
          '#ff00aa', // Pink
          '#aa00ff', // Purple
          '#00ff00', // Green
          '#ffff00', // Yellow
        ]
      : [
          'rgba(186, 104, 200, 0.7)', // Lavender
          'rgba(79, 195, 247, 0.7)',  // Light blue
          'rgba(255, 138, 101, 0.7)', // Coral
          'rgba(129, 199, 132, 0.7)', // Mint
          'rgba(255, 241, 118, 0.7)', // Light yellow
          'rgba(149, 117, 205, 0.7)', // Purple
        ];
  };

  // Create a new particle
  const createParticle = (frequencyData: Uint8Array<ArrayBuffer | ArrayBufferLike>, positionOverride?: {x: number, y: number}) => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const colors = getThemeColors();
    
    // Get a random frequency band, weighted towards the more expressive middle frequencies
    const freqIndex = Math.floor(Math.random() * (frequencyData.length * 0.6)) + Math.floor(frequencyData.length * 0.2);
    const frequencyValue = frequencyData[freqIndex] || 50;
    
    // Make size related to frequency intensity
    const sizeBase = Math.max(3, frequencyValue / 10);
    const sizeVariation = Math.random() * 5;
    const size = sizeBase + sizeVariation;
    
    // Position - either random or overridden (for events like clicks)
    const x = positionOverride?.x || Math.random() * canvas.width;
    const y = positionOverride?.y || Math.random() * canvas.height;
    
    // Random shape
    const shapes: ('circle' | 'square' | 'triangle' | 'star')[] = ['circle', 'square', 'triangle', 'star'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    // Create particle
    return {
      x,
      y,
      size,
      speed: 0.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.7 + Math.random() * 0.3,
      life: 0,
      maxLife: 100 + Math.random() * 500, // Lifespan in animation frames
      frequency: frequencyValue,
      rotate: Math.random() * 360,
      rotateSpeed: (Math.random() - 0.5) * 2,
      shape
    };
  };

  // Draw a single particle
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.opacity;
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotate * Math.PI) / 180);
    
    // Fill style based on particle color
    ctx.fillStyle = particle.color;
    
    // Draw different shapes
    switch (particle.shape) {
      case 'square':
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -particle.size / 2);
        ctx.lineTo(particle.size / 2, particle.size / 2);
        ctx.lineTo(-particle.size / 2, particle.size / 2);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'star':
        const spikes = 5;
        const outerRadius = particle.size / 2;
        const innerRadius = particle.size / 4;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / spikes) * i;
          ctx.lineTo(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          );
        }
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'circle':
      default:
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        glow.addColorStop(0, particle.color);
        glow.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = particle.opacity * 0.5;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  };

  // Animation function
  const animate = () => {
    if (!canvasRef.current || !analyser || !dataArray) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Update canvas dimensions to match window
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Clear canvas with a very subtle background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get frequency data
      try {
        if (dataArray && analyser) {
          // ใช้ double assertion เพื่อแก้ปัญหา TypeScript
          analyser.getByteFrequencyData(dataArray as unknown as Uint8Array<ArrayBuffer>);
        }
      } catch (err) {
        console.error("Error getting frequency data:", err);
      }
      
      const now = Date.now();
      
      // Calculate overall audio energy for thresholds
      let avg = 0;
      
      if (dataArray) {
        const sum = Array.from(dataArray).reduce((acc, val) => acc + val, 0);
        avg = sum / dataArray.length;
      }
      
      // Add new particles based on music playing or not
      if (isPlaying) {
        // Dynamic threshold based on energy levels
        const threshold = avg < 30 ? 300 : avg < 80 ? 150 : 50;
        
        // Add particles based on audio intensity
        if (now - lastParticleTimeRef.current > threshold) {
          // Create particle
          const newParticle = createParticle(dataArray as unknown as Uint8Array<ArrayBuffer>);
          if (newParticle) particlesRef.current.push(newParticle);
          lastParticleTimeRef.current = now;
          
          // For high energy sections, add bursts of particles
          if (avg > 120) {
            const burstCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < burstCount; i++) {
              const burstParticle = createParticle(dataArray as unknown as Uint8Array<ArrayBuffer>);
              if (burstParticle) particlesRef.current.push(burstParticle);
            }
          }
        }
      } else if (particlesRef.current.length < 10 && now - lastParticleTimeRef.current > 1000) {
        // Create ambient particles when not playing
        const ambientData = new Uint8Array(dataArray ? dataArray.length : 128).fill(20);
        const newParticle = createParticle(ambientData);
        if (newParticle) particlesRef.current.push(newParticle);
        lastParticleTimeRef.current = now;
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        // Increase life
        particle.life += 1;
        
        // Move particle
        particle.y -= particle.speed;
        particle.x += Math.sin(particle.life / 20) * 0.5; // Add slight horizontal movement
        
        // Rotate particle
        particle.rotate += particle.rotateSpeed;
        
        // Calculate opacity based on life (fade in and out)
        const lifeRatio = particle.life / particle.maxLife;
        
        if (lifeRatio < 0.1) {
          // Fade in
          particle.opacity = lifeRatio * 10 * particle.opacity;
        } else if (lifeRatio > 0.8) {
          // Fade out
          particle.opacity = particle.opacity * (1 - (lifeRatio - 0.8) / 0.2);
        }
        
        // Draw the particle
        drawParticle(ctx, particle);
        
        // Keep particle if still alive
        return particle.life < particle.maxLife;
      });
      
    } catch (err) {
      console.error("Error in animation:", err);
    }
    
    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  };

  // Start/stop animation
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click handler to create particles on click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dataArray) return;
    
    // Create a burst of particles at click location
    const burstCount = 5 + Math.floor(Math.random() * 5);
    const clickPos = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    
    for (let i = 0; i < burstCount; i++) {
      const newParticle = createParticle(
        dataArray as unknown as Uint8Array<ArrayBuffer>, 
        { 
          x: clickPos.x + (Math.random() - 0.5) * 20, 
          y: clickPos.y + (Math.random() - 0.5) * 20 
        }
      );
      if (newParticle) particlesRef.current.push(newParticle);
    }
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 cursor-default"
      onClick={handleCanvasClick}
    />
  );
};

export default AudioVisualizer;