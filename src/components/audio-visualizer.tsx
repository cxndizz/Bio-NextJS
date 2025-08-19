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
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastParticleTimeRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  
  // ป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioRef.current || !mounted) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContext();
      const analyzerNode = context.createAnalyser();
      analyzerNode.fftSize = 512; // เพิ่มความละเอียด
      analyzerNode.smoothingTimeConstant = 0.7; // ทำให้นุ่มนวลขึ้น
      
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
  }, [audioRef, mounted]);

  // Get theme-appropriate colors
  const getThemeColors = () => {
    if (!mounted) return ['rgba(147, 51, 234, 0.6)']; // default
    
    const isDark = theme === 'dark';
    
    return isDark 
      ? [
          'rgba(147, 51, 234, 0.8)',   // Purple
          'rgba(59, 130, 246, 0.8)',   // Blue  
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(251, 191, 36, 0.8)',   // Yellow
          'rgba(168, 85, 247, 0.8)',   // Violet
          'rgba(14, 165, 233, 0.8)',   // Sky
          'rgba(248, 113, 113, 0.8)',  // Red
        ]
      : [
          'rgba(147, 51, 234, 0.5)',   // Purple
          'rgba(59, 130, 246, 0.5)',   // Blue
          'rgba(236, 72, 153, 0.5)',   // Pink
          'rgba(34, 197, 94, 0.5)',    // Green
          'rgba(251, 191, 36, 0.5)',   // Yellow
          'rgba(168, 85, 247, 0.5)',   // Violet
          'rgba(14, 165, 233, 0.5)',   // Sky
          'rgba(248, 113, 113, 0.5)',  // Red
        ];
  };

  // Create a beautiful bubble particle
  const createParticle = (frequencyData: Uint8Array, canvas: HTMLCanvasElement, forcePosition?: {x: number, y: number}) => {
    const colors = getThemeColors();
    
    // สุ่มตำแหน่งเริ่มต้น - ส่วนใหญ่จากด้านล่าง แต่บางครั้งจากข้าง
    let startX, startY;
    
    if (forcePosition) {
      startX = forcePosition.x;
      startY = forcePosition.y;
    } else {
      const spawnSide = Math.random();
      if (spawnSide < 0.7) {
        // จากด้านล่าง (70%)
        startX = Math.random() * canvas.width;
        startY = canvas.height + 20;
      } else if (spawnSide < 0.85) {
        // จากด้านซ้าย (15%)
        startX = -20;
        startY = Math.random() * canvas.height;
      } else {
        // จากด้านขวา (15%)
        startX = canvas.width + 20;
        startY = Math.random() * canvas.height;
      }
    }
    
    // เลือก frequency band แบบถ่วงน้ำหนัก
    const lowFreq = Math.floor(Math.random() * (frequencyData.length * 0.3));
    const midFreq = Math.floor(Math.random() * (frequencyData.length * 0.4)) + Math.floor(frequencyData.length * 0.3);
    const highFreq = Math.floor(Math.random() * (frequencyData.length * 0.3)) + Math.floor(frequencyData.length * 0.7);
    
    const selectedFreq = Math.random() < 0.5 ? 
      (Math.random() < 0.7 ? midFreq : lowFreq) : highFreq;
    
    const frequencyValue = frequencyData[selectedFreq] || 30;
    
    // ขนาดพื้นฐานขึ้นอยู่กับความแรงของเสียง
    const baseSize = 8 + (frequencyValue / 255) * 40;
    const sizeVariation = Math.random() * 15;
    const size = baseSize + sizeVariation;
    
    // ความเร็วแปรผันตามความถี่
    const baseSpeed = 0.5 + (frequencyValue / 255) * 2;
    const speed = baseSpeed + Math.random() * 1;
    
    // มุมการเคลื่อนที่ - ส่วนใหญ่ขึ้น แต่มีการโยกเยก
    const baseAngle = -Math.PI/2; // ขึ้น
    const angleVariation = (Math.random() - 0.5) * Math.PI/3; // โยกซ้าย-ขวา
    const angle = baseAngle + angleVariation;
    
    // การลอยซ้าย-ขวา
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
      maxLife: 120 + Math.random() * 200, // อายุยืนขึ้น
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

  // Draw a beautiful bubble with glow effect
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    
    // คำนวณ opacity และ scale based on lifecycle
    const lifeRatio = particle.life / particle.maxLife;
    let opacity = particle.opacity;
    let scale = particle.scale;
    
    // Fade in phase (first 10%)
    if (lifeRatio < 0.1) {
      opacity = (lifeRatio / 0.1) * 0.8;
      scale = (lifeRatio / 0.1) * 1;
    }
    // Stable phase (10% - 80%)
    else if (lifeRatio < 0.8) {
      opacity = 0.6 + Math.sin(particle.pulsePhase + particle.life * 0.1) * 0.2;
      scale = 1 + Math.sin(particle.pulsePhase + particle.life * 0.05) * 0.1;
    }
    // Fade out phase (80% - 100%)
    else {
      const fadeRatio = (lifeRatio - 0.8) / 0.2;
      opacity = 0.8 * (1 - fadeRatio);
      scale = 1 + fadeRatio * 0.5; // ขยายตอนจาง
    }
    
    ctx.globalAlpha = Math.max(0, opacity);
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    
    const radius = particle.size / 2;
    
    // วาดเงา/Glow ด้านนอก
    const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.5);
    outerGlow.addColorStop(0, particle.color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${particle.glowIntensity * opacity})`));
    outerGlow.addColorStop(0.4, particle.color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${particle.glowIntensity * opacity * 0.3})`));
    outerGlow.addColorStop(1, 'transparent');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // วาดฟองหลัก
    const mainGradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    mainGradient.addColorStop(0, particle.color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${opacity * 0.9})`));
    mainGradient.addColorStop(0.7, particle.color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${opacity * 0.6})`));
    mainGradient.addColorStop(1, particle.color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${opacity * 0.2})`));
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // เพิ่มแสงสะท้อน (highlight)
    const highlight = ctx.createRadialGradient(-radius * 0.4, -radius * 0.4, 0, -radius * 0.4, -radius * 0.4, radius * 0.6);
    highlight.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.6})`);
    highlight.addColorStop(1, 'transparent');
    
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // เพิ่มขอบบาง ๆ
    ctx.strokeStyle = particle.color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${opacity * 0.8})`);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };

  // Animation function
  const animate = () => {
    if (!canvasRef.current || !analyser || !dataArray || !mounted) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Update canvas dimensions
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get frequency data
      try {
        analyser.getByteFrequencyData(dataArray);
      } catch (err) {
        console.error("Error getting frequency data:", err);
      }
      
      const now = Date.now();
      
      // Calculate average frequency for dynamic particle generation
      const sum = Array.from(dataArray).reduce((acc, val) => acc + val, 0);
      const avg = sum / dataArray.length;
      
      // Generate new particles based on music intensity
      if (isPlaying) {
        // Dynamic generation rate based on music intensity
        let generationRate = 80; // base rate
        
        if (avg > 100) generationRate = 30;      // High energy
        else if (avg > 60) generationRate = 50;  // Medium energy  
        else if (avg > 30) generationRate = 70;  // Low energy
        else generationRate = 120;               // Very quiet
        
        if (now - lastParticleTimeRef.current > generationRate) {
          // สร้างพาร์ทิเคิลใหม่
          const newParticle = createParticle(dataArray, canvas);
          if (newParticle) {
            particlesRef.current.push(newParticle);
          }
          
          // ถ้าเสียงดังมาก สร้างเป็นกลุ่ม
          if (avg > 120) {
            for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
              const burstParticle = createParticle(dataArray, canvas);
              if (burstParticle) {
                particlesRef.current.push(burstParticle);
              }
            }
          }
          
          lastParticleTimeRef.current = now;
        }
      } else {
        // Ambient particles when not playing
        if (particlesRef.current.length < 5 && now - lastParticleTimeRef.current > 2000) {
          const ambientData = new Uint8Array(dataArray.length).fill(20);
          const ambientParticle = createParticle(ambientData, canvas);
          if (ambientParticle) {
            particlesRef.current.push(ambientParticle);
          }
          lastParticleTimeRef.current = now;
        }
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        // Update particle position
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        
        // Add drift effect
        particle.x += Math.sin(particle.life * 0.02) * particle.drift;
        
        // Update rotation
        particle.rotation += particle.rotationSpeed;
        
        // Update life
        particle.life += 1;
        
        // Update pulse phase
        particle.pulsePhase += 0.1;
        
        // Draw the particle
        drawParticle(ctx, particle);
        
        // Remove if dead or out of bounds
        const isAlive = particle.life < particle.maxLife;
        const inBounds = particle.x > -100 && particle.x < canvas.width + 100 && 
                        particle.y > -100 && particle.y < canvas.height + 100;
        
        return isAlive && inBounds;
      });
      
      // Limit particle count for performance
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
    if (!dataArray || !mounted) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickPos = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
    
    // Create burst of beautiful bubbles
    for (let i = 0; i < 8; i++) {
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;
      const newParticle = createParticle(
        dataArray, 
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
    return null; // ป้องกัน hydration error
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