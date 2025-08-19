"use client"

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  frequency: number;
  angle: number;
  drift: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
  glowIntensity: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  // ไม่ต้องระบุ type parameter ให้กับ Uint8Array
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastParticleTimeRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // ป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioRef.current || !mounted) return;

    // Clean up function to properly disconnect and close AudioContext
    const cleanupAudio = () => {
      if (source) {
        source.disconnect();
      }
      if (analyser) {
        analyser.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
      }
    };

    try {
      // Check if we already have an AudioContext before creating a new one
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        setAudioContext(audioContextRef.current);
      }
      
      const context = audioContextRef.current;
      const analyzerNode = context.createAnalyser();
      analyzerNode.fftSize = 512;
      analyzerNode.smoothingTimeConstant = 0.7;
      
      const bufferLength = analyzerNode.frequencyBinCount;
      const dataArr = new Uint8Array(bufferLength);
      
      // Only create a new source node if we don't already have one
      // or if the audio element has changed
      if (!source) {
        const sourceNode = context.createMediaElementSource(audioRef.current);
        sourceNode.connect(analyzerNode);
        analyzerNode.connect(context.destination);
        setSource(sourceNode);
      }
      
      setAnalyser(analyzerNode);
      setDataArray(dataArr);

    } catch (err) {
      console.error("Error initializing audio context:", err);
    }

    return cleanupAudio;
  }, [audioRef, mounted]);

  // Get theme-appropriate colors
  const getThemeColors = () => {
    if (!mounted) return ['147, 51, 234'];
    
    const isDark = theme === 'dark';
    
    return isDark 
      ? [
          '147, 51, 234',   // Purple
          '59, 130, 246',   // Blue  
          '236, 72, 153',   // Pink
          '34, 197, 94',    // Green
          '251, 191, 36',   // Yellow
          '168, 85, 247',   // Violet
          '14, 165, 233',   // Sky
          '248, 113, 113',  // Red
        ]
      : [
          '147, 51, 234',   // Purple
          '59, 130, 246',   // Blue
          '236, 72, 153',   // Pink
          '34, 197, 94',    // Green
          '251, 191, 36',   // Yellow
          '168, 85, 247',   // Violet
          '14, 165, 233',   // Sky
          '248, 113, 113',  // Red
        ];
  };

  // Create a beautiful bubble particle
  const createParticle = (frequencyData: Uint8Array, canvas: HTMLCanvasElement, forcePosition?: {x: number, y: number}) => {
    const colors = getThemeColors();
    
    // สุ่มตำแหน่งเริ่มต้น
    let startX, startY;
    
    if (forcePosition) {
      startX = forcePosition.x;
      startY = forcePosition.y;
    } else {
      const spawnSide = Math.random();
      if (spawnSide < 0.7) {
        startX = Math.random() * canvas.width;
        startY = canvas.height + 20;
      } else if (spawnSide < 0.85) {
        startX = -20;
        startY = Math.random() * canvas.height;
      } else {
        startX = canvas.width + 20;
        startY = Math.random() * canvas.height;
      }
    }
    
    const lowFreq = Math.floor(Math.random() * (frequencyData.length * 0.3));
    const midFreq = Math.floor(Math.random() * (frequencyData.length * 0.4)) + Math.floor(frequencyData.length * 0.3);
    const highFreq = Math.floor(Math.random() * (frequencyData.length * 0.3)) + Math.floor(frequencyData.length * 0.7);
    
    const selectedFreq = Math.random() < 0.5 ? 
      (Math.random() < 0.7 ? midFreq : lowFreq) : highFreq;
    
    const frequencyValue = frequencyData[selectedFreq] || 30;
    
    const baseSize = 8 + (frequencyValue / 255) * 40;
    const sizeVariation = Math.random() * 15;
    const size = baseSize + sizeVariation;
    
    const baseSpeed = 0.5 + (frequencyValue / 255) * 2;
    const speed = baseSpeed + Math.random() * 1;
    
    const baseAngle = -Math.PI/2;
    const angleVariation = (Math.random() - 0.5) * Math.PI/3;
    const angle = baseAngle + angleVariation;
    
    const drift = (Math.random() - 0.5) * 0.3;
    
    return {
      id: particleIdCounter.current++,
      x: startX,
      y: startY,
      size,
      speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0,
      life: 0,
      maxLife: 120 + Math.random() * 200,
      frequency: frequencyValue,
      angle,
      drift,
      scale: 0.1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      glowIntensity: 0.3 + Math.random() * 0.7
    };
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    
    const lifeRatio = particle.life / particle.maxLife;
    let opacity = particle.opacity;
    let scale = particle.scale;
    
    if (lifeRatio < 0.1) {
      opacity = (lifeRatio / 0.1) * 0.8;
      scale = (lifeRatio / 0.1) * 1;
    }
    else if (lifeRatio < 0.8) {
      opacity = 0.6 + Math.sin(particle.pulsePhase + particle.life * 0.1) * 0.2;
      scale = 1 + Math.sin(particle.pulsePhase + particle.life * 0.05) * 0.1;
    }
    else {
      const fadeRatio = (lifeRatio - 0.8) / 0.2;
      opacity = 0.8 * (1 - fadeRatio);
      scale = 1 + fadeRatio * 0.5;
    }
    
    ctx.globalAlpha = Math.max(0, opacity);
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    
    const radius = particle.size / 2;
    
    const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.5);
    outerGlow.addColorStop(0, `rgba(${particle.color}, ${particle.glowIntensity * opacity})`);
    outerGlow.addColorStop(0.4, `rgba(${particle.color}, ${particle.glowIntensity * opacity * 0.3})`);
    outerGlow.addColorStop(1, 'transparent');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    const mainGradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    mainGradient.addColorStop(0, `rgba(${particle.color}, ${opacity * 0.9})`);
    mainGradient.addColorStop(0.7, `rgba(${particle.color}, ${opacity * 0.6})`);
    mainGradient.addColorStop(1, `rgba(${particle.color}, ${opacity * 0.2})`);
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    const highlight = ctx.createRadialGradient(-radius * 0.4, -radius * 0.4, 0, -radius * 0.4, -radius * 0.4, radius * 0.6);
    highlight.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.6})`);
    highlight.addColorStop(1, 'transparent');
    
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = `rgba(${particle.color}, ${opacity * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };

  // Create fallback data array when analyzer is not available
  const createFallbackData = (size: number): Uint8Array => {
    const result = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      // Create some random values for a nice visual effect even without audio
      result[i] = Math.floor(20 + Math.random() * 40);
    }
    return result;
  };

  // Animation function
  const animate = () => {
    if (!canvasRef.current || !mounted) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Use analyzer data if available, otherwise use fallback
      let frequencyData: Uint8Array;
      
      if (analyser && dataArray) {
        try {
          // ใช้ Type Assertion เพื่อแก้ปัญหา Type Error
          analyser.getByteFrequencyData(dataArray as any);
          frequencyData = dataArray;
        } catch (err) {
          console.error("Error getting frequency data:", err);
          frequencyData = createFallbackData(128);
        }
      } else {
        frequencyData = createFallbackData(128);
      }
      
      const now = Date.now();
      
      const sum = Array.from(frequencyData).reduce((acc, val) => acc + val, 0);
      const avg = sum / frequencyData.length;
      
      if (isPlaying) {
        let generationRate = 80;
        
        if (avg > 100) generationRate = 30;
        else if (avg > 60) generationRate = 50;
        else if (avg > 30) generationRate = 70;
        else generationRate = 120;
        
        if (now - lastParticleTimeRef.current > generationRate) {
          const newParticle = createParticle(frequencyData, canvas);
          if (newParticle) {
            particlesRef.current.push(newParticle);
          }
          
          if (avg > 120) {
            for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
              const burstParticle = createParticle(frequencyData, canvas);
              if (burstParticle) {
                particlesRef.current.push(burstParticle);
              }
            }
          }
          
          lastParticleTimeRef.current = now;
        }
      } else {
        if (particlesRef.current.length < 5 && now - lastParticleTimeRef.current > 2000) {
          const ambientData = createFallbackData(128);
          const ambientParticle = createParticle(ambientData, canvas);
          if (ambientParticle) {
            particlesRef.current.push(ambientParticle);
          }
          lastParticleTimeRef.current = now;
        }
      }
      
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        
        particle.x += Math.sin(particle.life * 0.02) * particle.drift;
        
        particle.rotation += particle.rotationSpeed;
        particle.life += 1;
        particle.pulsePhase += 0.1;
        
        drawParticle(ctx, particle);
        
        const isAlive = particle.life < particle.maxLife;
        const inBounds = particle.x > -100 && particle.x < canvas.width + 100 && 
                        particle.y > -100 && particle.y < canvas.height + 100;
        
        return isAlive && inBounds;
      });
      
      if (particlesRef.current.length > 150) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
      
    } catch (err) {
      console.error("Error in animation:", err);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Start animation when mounted
  useEffect(() => {
    if (!mounted) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, mounted]);

  // Handle window resize
  useEffect(() => {
    if (!mounted) return;
    
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  // Click handler to create burst of bubbles
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mounted) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickPos = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
    
    // Use fallback data if analyzer is not available
    const freqData = dataArray || createFallbackData(128);
    
    for (let i = 0; i < 8; i++) {
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;
      const newParticle = createParticle(
        freqData, 
        canvasRef.current!,
        { 
          x: clickPos.x + offsetX, 
          y: clickPos.y + offsetY 
        }
      );
      if (newParticle) {
        particlesRef.current.push(newParticle);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 cursor-default pointer-events-auto"
      onClick={handleCanvasClick}
      style={{ 
        background: 'transparent',
        touchAction: 'none' 
      }}
    />
  );
};

export default AudioVisualizer;