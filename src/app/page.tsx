"use client"

/**
 * Advanced UI/UX Version - Ultra Modern Link in Bio
 * Features: Glassmorphism, 3D effects, Magnetic hover, Parallax, Interactive animations
 */

import { Github, Twitter, Instagram, Music, Headphones, Youtube, Sparkles, Star } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MusicPlayer, Gallery, Links } from "@/components/page-components";
import { VisitorCounter } from "@/components/visitor-counter";
import AudioVisualizer from "@/components/audio-visualizer";
import { useRef, useState, useEffect } from "react";

// --- Configuration (Same as before) ---
const myPlaylist = [
  { title: "ไม่อยากให้เป็นเขา", artist: "Timethai", src: "/music/TIMETHAI.mp3" },
  { title: "รอที่เส้นขอบฟ้า", artist: "PUN", src: "/music/SKY.mp3" },
  { title: "Living Death", artist: "PUN", src: "/music/night.mp3" }
];

const myMedia = [
  { type: 'image' as const, src: "/gallery/1.jpg", thumb: "/gallery/1.jpg" },
  { type: 'image' as const, src: "/gallery/2.jpg", thumb: "/gallery/2.jpg" },
  { type: 'image' as const, src: "/gallery/3.jpg", thumb: "/gallery/3.jpg" },
  { type: 'image' as const, src: "/gallery/4.jpg", thumb: "/gallery/4.jpg" },
  { type: 'image' as const, src: "/gallery/5.jpg", thumb: "/gallery/5.jpg" },
  { type: 'image' as const, src: "/gallery/6.jpg", thumb: "/gallery/6.jpg" },
  { type: 'video' as const, src: "/gallery/1.mp4", thumb: "/gallery/8.jpg" },
  { type: 'video' as const, src: "/gallery/2.mp4", thumb: "/gallery/9.jpg" },
  { type: 'video' as const, src: "/gallery/3.mp4", thumb: "/gallery/10.jpg" },
];

const myLinks = [
  { href: "https://github.com/cxndizz", title: "GitHub", icon: <Github className="text-gray-300" /> },
  { href: "https://www.instagram.com/firstisalwayshappy", title: "Instagram", icon: <Instagram className="text-pink-500" /> },
  { href: "https://open.spotify.com/user/31rvu54wd7fjhffnrnzqivwsjolu", title: "Spotify", icon: <Headphones className="text-green-500" /> },
];

const profile = {
  name: "cxndizz",
  bio: "Full Stack Developer | Next.js • Java • Oracle ✨",
  avatarUrl: "/profile.jpg",
};

// --- Advanced UI Components ---
function FloatingOrb({ delay = 0, size = 300 }) {
  return (
    <div 
      className="absolute rounded-full opacity-20 animate-float"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)`,
        filter: 'blur(40px)',
        animationDelay: `${delay}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }}
    />
  );
}

function ParallaxCard({ children, className = "", depth = 1 }: any) {
  const [transform, setTransform] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      const rotateX = (mouseY / (rect.height / 2)) * -10 * depth;
      const rotateY = (mouseX / (rect.width / 2)) * 10 * depth;
      
      setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    };

    const handleMouseLeave = () => {
      setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [depth]);

  return (
    <div 
      ref={cardRef}
      className={`transition-all duration-300 ease-out ${className}`}
      style={{ transform, transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

function MagneticButton({ children, className = "", onClick }: any) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    const magnetStrength = 0.3;
    setPosition({
      x: distanceX * magnetStrength,
      y: distanceY * magnetStrength
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={buttonRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.2s ease-out'
      }}
    >
      {children}
    </div>
  );
}

// --- Main Component ---
export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    
    if (!audioRef.current) {
      audioRef.current = document.createElement('audio');
      audioRef.current.preload = "auto";
      
      setTimeout(() => {
        if (audioRef.current) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch(() => console.log("Auto-play prevented"));
          }
        }
      }, 1000);
    }

    // Parallax scroll effect
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Mouse tracking for interactive background
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handlePlayingStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <p className="text-white/60 animate-pulse">Loading amazing experience...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 dark:from-black dark:via-purple-950 dark:to-black">
      
      {/* Advanced Interactive Background */}
      <div className="fixed inset-0 -z-20">
        {/* Animated gradient mesh */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`,
            transition: 'background 0.3s ease'
          }}
        />
        
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingOrb delay={0} size={400} />
          <FloatingOrb delay={5} size={300} />
          <FloatingOrb delay={10} size={350} />
        </div>
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
      </div>

      {/* Audio Visualizer */}
      <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />
      
      {/* Advanced Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <MagneticButton>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/30 rounded-full p-1 border border-white/20">
              <ThemeToggle />
            </div>
          </div>
        </MagneticButton>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-12 p-6 pt-20 max-w-md mx-auto">
        
        {/* Advanced Profile Section */}
        <ParallaxCard depth={1.5} className="w-full">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            
            {/* Glass card */}
            <div className="relative backdrop-blur-2xl bg-white/5 dark:bg-black/20 rounded-3xl p-8 border border-white/10 shadow-2xl">
              
              {/* Animated corner decorations */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-purple-500 rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-pink-500 rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-blue-500 rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-green-500 rounded-br-3xl"></div>
              
              {/* Profile content */}
              <div className="text-center relative">
                {/* Avatar with advanced effects */}
                <div className="relative inline-block mb-6">
                  {/* Rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                  
                  {/* Pulsing glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  
                  {/* Avatar image */}
                  <img
                    src={profile.avatarUrl}
                    alt="profile"
                    className="relative w-32 h-32 rounded-full border-4 border-white/20 shadow-2xl object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/128x128/7c3aed/ffffff?text=ME'; }}
                  />
                  
                  {/* Status indicator */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
                </div>
                
                {/* Name with gradient text */}
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent animate-gradient-shift">
                  {profile.name}
                </h1>
                
                {/* Bio with typewriter effect */}
                <p className="text-gray-300 dark:text-gray-400 mb-4 text-lg">
                  {profile.bio}
                </p>
                
                {/* Animated sparkles */}
                <div className="flex justify-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <Star className="w-4 h-4 text-yellow-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                
                {/* Visitor Counter with glass effect */}
                <div className="inline-flex backdrop-blur-md bg-white/5 dark:bg-black/20 rounded-full px-4 py-2 border border-white/10">
                  <VisitorCounter />
                </div>
              </div>
            </div>
          </div>
        </ParallaxCard>

        {/* Advanced Music Player */}
        <ParallaxCard depth={1.2} className="w-full">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative">
              <MusicPlayer 
                playlist={myPlaylist} 
                audioRef={audioRef}
                onPlayingChange={handlePlayingStateChange}
              />
            </div>
          </div>
        </ParallaxCard>

        {/* Advanced Gallery */}
        <ParallaxCard depth={1.3} className="w-full">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative">
              <Gallery items={myMedia} />
            </div>
          </div>
        </ParallaxCard>
        
        {/* Advanced Links */}
        <div className="w-full">
          <Links items={myLinks} />
        </div>

        {/* Advanced Footer */}
        <footer className="text-center mt-12 mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-30"></div>
            <div className="relative backdrop-blur-md bg-white/5 dark:bg-black/20 rounded-full px-6 py-3 border border-white/10">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} {profile.name}
              </p>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </main>
  );
}