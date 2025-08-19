"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  // วิธีแก้ปัญหาสุดท้าย: แก้ไขประเภทข้อมูลใน state ให้เป็น any
const [dataArray, setDataArray] = useState<any>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

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

  // Animation function
  const animate = useCallback(() => {
    if (!canvasRef.current || !analyser || !dataArray) {
      // If not ready yet, request next frame and return
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
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get frequency data
      try {
        // @ts-ignore - ข้ามการตรวจสอบ TypeScript ในบรรทัดนี้
        analyser.getByteFrequencyData(dataArray);
      } catch (err) {
        console.error("Error getting frequency data:", err);
      }
      
      // Draw visualizer
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.2; // Base circle size
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(149, 76, 233, 0.5)');   // Purple
      gradient.addColorStop(0.5, 'rgba(237, 34, 123, 0.5)');  // Pink
      gradient.addColorStop(1, 'rgba(255, 130, 67, 0.5)');   // Orange
      
      // Draw circular visualizer
      const barCount = 120; // Number of bars
      const barWidth = (Math.PI * 2) / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const barIndex = Math.floor(i * dataArray.length / barCount);
        let barHeight = dataArray[barIndex] * 0.7; // Scale for better visuals
        
        if (!isPlaying) {
          // When not playing, show gentle ambient movement
          barHeight = 20 + Math.sin(Date.now() * 0.001 + i * 0.2) * 10;
        }
        
        const angle = i * barWidth;
        
        // Calculate positions
        const innerRadius = radius;
        const outerRadius = radius + barHeight;
        
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        
        // Draw bar
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = isPlaying ? 3 : 2;
        ctx.strokeStyle = gradient;
        ctx.stroke();
        
        // Add glow effect
        if (isPlaying && barHeight > 40) {
          ctx.beginPath();
          ctx.arc(x2, y2, barHeight * 0.05, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
        }
      }
      
      // Additional ambient particles
      for (let i = 0; i < 50; i++) {
        // Only show particles on higher frequencies when playing
        const particleSize = isPlaying 
          ? (dataArray[i % dataArray.length] / 30)
          : 1 + Math.sin(Date.now() * 0.001 + i) * 0.5;
        
        if (particleSize > 1 || !isPlaying) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * canvas.width * 0.4 + radius;
          
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;
          
          ctx.beginPath();
          ctx.arc(x, y, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
          ctx.fill();
        }
      }
    } catch (err) {
      console.error("Error in animation:", err);
    }
    
    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, analyser, dataArray]);

  // Start/stop animation based on playing state
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
  }, [isPlaying, animate]);

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