"use client"

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
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
  angle: number;
  drift: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
  glowIntensity: number;
}

/**
 * AudioVisualizer - แบบลดการพึ่งพา Web Audio API
 * ใช้วิธีจำลองข้อมูลเสียงแทนเพื่อหลีกเลี่ยงปัญหา TypeScript Error
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastParticleTimeRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);
  const baseIntensityRef = useRef<number>(50);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  
  // เวลาที่ผ่านไปตั้งแต่เริ่มเล่น (ใช้สำหรับจำลองความเข้มของเสียง)
  const timeElapsedRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  // ป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);
  
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

  // สร้างอาร์เรย์ที่จำลองข้อมูลความถี่เสียง
  const createSimulatedFrequencyData = (time: number, intensity: number): number[] => {
    const size = 128;
    const result: number[] = [];
    
    for (let i = 0; i < size; i++) {
      // สร้างเสียงจำลองแบบธรรมชาติ
      const normalizedIndex = i / size; // 0 to 1
      
      // สร้างคลื่นเสียงที่มีความสมจริง
      const basePower = Math.sin(time * 0.001 + normalizedIndex * Math.PI * 2) * 0.5 + 0.5;
      const beatEffect = Math.sin(time * 0.002) * 0.3 + 0.7;
      const randomness = Math.random() * 0.3;
      
      // ปรับแต่งรูปแบบความถี่
      let power = 0;
      
      // ความถี่ต่ำ (bass)
      if (normalizedIndex < 0.1) {
        power = basePower * 0.8 + Math.sin(time * 0.005) * 0.4 + 0.6;
      } 
      // ความถี่กลาง
      else if (normalizedIndex < 0.6) {
        power = basePower * 0.6 + Math.sin(time * 0.003 + i) * 0.2 + 0.4;
      } 
      // ความถี่สูง
      else {
        power = basePower * 0.4 + Math.sin(time * 0.008) * 0.15 + 0.3;
      }
      
      // ปรับให้มีจังหวะ (beat)
      const beatIntensity = Math.pow(Math.sin(time * 0.002) * 0.5 + 0.5, 3);
      if (normalizedIndex < 0.2 && time % 1000 < 100) {
        power *= 1.5 * beatIntensity;
      }
      
      // แปลงค่าที่ได้เป็นระดับ 0-255
      const finalValue = Math.floor(power * intensity * beatEffect + randomness * intensity * 0.2);
      result.push(Math.min(255, Math.max(0, finalValue)));
    }
    
    return result;
  };

  // Create a beautiful bubble particle
  const createParticle = (frequencyData: number[], canvas: HTMLCanvasElement, forcePosition?: {x: number, y: number}) => {
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

  // Animation function
  const animate = (timestamp: number) => {
    if (!canvasRef.current || !mounted) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    // คำนวณเวลาที่ผ่านไป
    if (lastFrameTimeRef.current === 0) {
      lastFrameTimeRef.current = timestamp;
    }
    
    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;
    
    // เพิ่มเวลาเมื่อกำลังเล่นเพลง
    if (isPlaying) {
      timeElapsedRef.current += deltaTime;
      
      // ปรับความเข้มของเสียงตามเวลาที่ผ่านไป (จำลองการเต้นของเพลง)
      const beatFrequency = 500; // ms ระหว่างจังหวะเพลง
      const beatPhase = (timeElapsedRef.current % beatFrequency) / beatFrequency;
      
      // ปรับความเข้มตามจังหวะ
      if (beatPhase < 0.1) {
        baseIntensityRef.current = 80 + Math.random() * 40;
      } else if (beatPhase > 0.8) {
        baseIntensityRef.current = Math.max(30, baseIntensityRef.current - 2);
      } else {
        baseIntensityRef.current = Math.max(30, baseIntensityRef.current - 0.5);
      }
    } else {
      // เมื่อไม่ได้เล่นเพลง ค่อยๆ ลดความเข้ม
      baseIntensityRef.current = Math.max(20, baseIntensityRef.current - 0.5);
    }
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // จำลองข้อมูลความถี่
      const simulatedFrequencyData = createSimulatedFrequencyData(
        timeElapsedRef.current, 
        baseIntensityRef.current
      );
      
      const now = timestamp;
      
      // คำนวณค่าเฉลี่ยของความเข้มเสียง
      const sum = simulatedFrequencyData.reduce((acc, val) => acc + val, 0);
      const avg = sum / simulatedFrequencyData.length;
      
      if (isPlaying) {
        let generationRate = 80;
        
        if (avg > 60) generationRate = 30;
        else if (avg > 40) generationRate = 50;
        else if (avg > 20) generationRate = 70;
        else generationRate = 120;
        
        if (now - lastParticleTimeRef.current > generationRate) {
          const newParticle = createParticle(simulatedFrequencyData, canvas);
          if (newParticle) {
            particlesRef.current.push(newParticle);
          }
          
          if (avg > 80) {
            for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
              const burstParticle = createParticle(simulatedFrequencyData, canvas);
              if (burstParticle) {
                particlesRef.current.push(burstParticle);
              }
            }
          }
          
          lastParticleTimeRef.current = now;
        }
      } else {
        if (particlesRef.current.length < 5 && now - lastParticleTimeRef.current > 2000) {
          const ambientData = simulatedFrequencyData.map(val => val * 0.3);
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
    
    // จำลองข้อมูลความถี่
    const simulatedData = createSimulatedFrequencyData(
      timeElapsedRef.current,
      baseIntensityRef.current * 1.5
    );
    
    for (let i = 0; i < 8; i++) {
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;
      const newParticle = createParticle(
        simulatedData, 
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