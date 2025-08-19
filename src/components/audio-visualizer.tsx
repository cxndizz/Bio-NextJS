"use client"

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
  lifespan: number;
  currentLife: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const lastBubbleTimeRef = useRef<number>(0);
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
    
    const primaryColor = isDark 
      ? 'rgba(147, 51, 234, 0.7)' // Purple for dark mode
      : 'rgba(168, 85, 247, 0.5)'; // Lighter purple for light mode
      
    const secondaryColor = isDark 
      ? 'rgba(236, 72, 153, 0.7)' // Pink for dark mode
      : 'rgba(244, 114, 182, 0.5)'; // Lighter pink for light mode
      
    const tertiaryColor = isDark 
      ? 'rgba(59, 130, 246, 0.7)' // Blue for dark mode
      : 'rgba(96, 165, 250, 0.5)'; // Lighter blue for light mode
    
    return [primaryColor, secondaryColor, tertiaryColor];
  };

  // Create a new bubble
  const createBubble = (frequencyData: any) => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const colors = getThemeColors();
    
    // Get a random strong frequency for bubble size
    const freqIndex = Math.floor(Math.random() * frequencyData.length * 0.8) + Math.floor(frequencyData.length * 0.2);
    const frequencyValue = frequencyData[freqIndex] || 0;
    
    // Make bubble size related to frequency intensity
    const baseSize = Math.max(10, frequencyValue / 5);
    const sizeVariation = Math.random() * 15;
    const size = baseSize + sizeVariation;
    
    // Create bubble
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + size, // Start from below the screen
      size: size,
      speedY: 0.5 + Math.random() * 1.5, // Upward speed
      opacity: 0.1 + Math.random() * 0.5, // Random opacity
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: 0,
      pulseSpeed: 0.02 + Math.random() * 0.04,
      lifespan: 500 + Math.random() * 5000, // Random lifespan between 0.5-5.5 seconds
      currentLife: 0
    };
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
        // Type assertion to fix TypeScript error
        analyser.getByteFrequencyData(dataArray as any);
      } catch (err) {
        console.error("Error getting frequency data:", err);
      }
      
      const now = Date.now();
      
      // Add new bubbles based on music playing or not
      if (isPlaying) {
        // Calculate average frequency to determine bubble creation rate
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        
        // Create bubbles based on beat detection
        if (now - lastBubbleTimeRef.current > (avg < 50 ? 300 : avg < 100 ? 150 : 50)) {
          const newBubble = createBubble(dataArray);
          if (newBubble) bubblesRef.current.push(newBubble);
          lastBubbleTimeRef.current = now;
        }
      } else if (bubblesRef.current.length < 15 && now - lastBubbleTimeRef.current > 800) {
        // Create ambient bubbles when not playing
        const ambientDataArray = new Uint8Array(dataArray.length).fill(30);
        const newBubble = createBubble(ambientDataArray);
        if (newBubble) bubblesRef.current.push(newBubble);
        lastBubbleTimeRef.current = now;
      }
      
      // Update and draw bubbles
      bubblesRef.current = bubblesRef.current.filter(bubble => {
        // Update position
        bubble.y -= bubble.speedY;
        
        // Update life
        bubble.currentLife += 16; // Approximately 16ms per frame
        
        // Update pulse
        bubble.pulse += bubble.pulseSpeed;
        if (bubble.pulse > 1 || bubble.pulse < 0) bubble.pulseSpeed *= -1;
        
        // Calculate opacity based on lifespan (fade in and out)
        const lifeProgress = bubble.currentLife / bubble.lifespan;
        const fadeInEnd = 0.1;
        const fadeOutStart = 0.7;
        
        let calculatedOpacity;
        if (lifeProgress < fadeInEnd) {
          // Fade in
          calculatedOpacity = (lifeProgress / fadeInEnd) * bubble.opacity;
        } else if (lifeProgress > fadeOutStart) {
          // Fade out
          calculatedOpacity = (1 - ((lifeProgress - fadeOutStart) / (1 - fadeOutStart))) * bubble.opacity;
        } else {
          // Steady state with pulse
          calculatedOpacity = bubble.opacity * (0.7 + 0.3 * Math.sin(bubble.pulse * Math.PI));
        }
        
        // Draw bubble
        ctx.beginPath();
        const radius = bubble.size * (0.8 + 0.2 * Math.sin(bubble.pulse * Math.PI * 2));
        
        // Create gradient for bubble
        const gradient = ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, radius
        );
        
        // Parse the bubble.color which is in rgba format
        const colorMatch = bubble.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (colorMatch) {
          const [_, r, g, b, a] = colorMatch;
          
          // Create gradient with transparency
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${calculatedOpacity * 1.5})`);
          gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${calculatedOpacity})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add subtle highlight
          ctx.beginPath();
          ctx.arc(bubble.x - radius * 0.3, bubble.y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${calculatedOpacity * 0.5})`;
          ctx.fill();
        }
        
        // Keep bubble if it's still alive and on screen
        return bubble.currentLife < bubble.lifespan && bubble.y + bubble.size > 0;
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

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-70"
    />
  );
};

export default AudioVisualizer;