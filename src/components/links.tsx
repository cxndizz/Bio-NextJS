"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Link as LinkIcon, ExternalLink, Sparkles, ArrowRight, TrendingUp, Users, Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Link { 
  href: string; 
  title: string; 
  icon: React.ReactNode; 
}

interface LinksProps {
  items: Link[];
}

export function Links({ items }: LinksProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [stats] = useState(() => 
    items.map(() => ({
      clicks: Math.floor(Math.random() * 1000) + 100,
      trending: Math.random() > 0.7
    }))
  );

  // Magnetic hover effect
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;
    
    card.style.transform = `
      perspective(1000px) 
      rotateX(${deltaY * -5}deg) 
      rotateY(${deltaX * 5}deg)
      translateZ(10px)
      scale(1.02)
    `;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
    setHoveredIndex(null);
  };

  const handleClick = (index: number) => {
    setClickedIndex(index);
    
    // Ripple effect animation
    setTimeout(() => {
      setClickedIndex(null);
    }, 600);
  };

  return (
    <div className="grid gap-4 w-full max-w-md">
      <TooltipProvider>
        {items.map((link, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <a 
                href={link.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block relative transform-gpu transition-all duration-300"
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(index)}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 blur-xl transition-all duration-500 ${
                  hoveredIndex === index ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
                }`}></div>
                
                {/* Glow effect for trending items */}
                {stats[index].trending && (
                  <div className="absolute -top-2 -right-2 z-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-md opacity-75 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        HOT
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Main card */}
                <Card className="relative backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/10 shadow-2xl group overflow-hidden rounded-3xl">
                  {/* Ripple effect on click */}
                  {clickedIndex === index && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, rgba(147, 51, 234, 0.3) 0%, transparent 70%)`,
                        animation: 'ripple 0.6s ease-out'
                      }}
                    />
                  )}
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
                  </div>
                  
                  <CardContent className="p-5 relative z-10">
                    <div className="flex items-center justify-between">
                      {/* Left side - Icon and Title */}
                      <div className="flex items-center gap-4">
                        {/* Animated icon container */}
                        <div className="relative">
                          {/* Icon background with animation */}
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm transition-all duration-300 ${
                            hoveredIndex === index ? 'scale-110 rotate-3' : ''
                          }`}></div>
                          
                          {/* Icon */}
                          <div className={`relative p-3.5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent transition-transform duration-300 ${
                            hoveredIndex === index ? 'scale-110' : ''
                          }`}>
                            {link.icon}
                          </div>
                          
                          {/* Sparkles for hover */}
                          {hoveredIndex === index && (
                            <>
                              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
                              <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-purple-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            </>
                          )}
                        </div>
                        
                        {/* Title and stats */}
                        <div>
                          <span className="text-lg font-bold text-white flex items-center gap-2">
                            {link.title}
                            {/* Animated underline */}
                            <span className={`h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ${
                              hoveredIndex === index ? 'w-full' : 'w-0'
                            }`}></span>
                          </span>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {stats[index].clicks.toLocaleString()} clicks
                            </span>
                            {stats[index].trending && (
                              <span className="text-xs text-yellow-400 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                Trending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Animated arrow */}
                      <div className={`relative transition-all duration-300 ${
                        hoveredIndex === index ? 'translate-x-1' : ''
                      }`}>
                        {/* Arrow background glow */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-lg transition-opacity duration-300 ${
                          hoveredIndex === index ? 'opacity-60' : 'opacity-0'
                        }`}></div>
                        
                        {/* Arrow container */}
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                          <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${
                            hoveredIndex === index ? 'translate-x-0.5' : ''
                          }`} />
                          
                          {/* Secondary icon on hover */}
                          <ExternalLink className={`absolute w-5 h-5 transition-all duration-300 ${
                            hoveredIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                          }`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transform origin-left transition-transform duration-500"
                      style={{
                        transform: hoveredIndex === index ? 'scaleX(1)' : 'scaleX(0)'
                      }}
                    ></div>
                  </CardContent>
                </Card>
              </a>
            </TooltipTrigger>
            
            <TooltipContent className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none">
              <p className="font-medium">Visit my {link.title}</p>
              <p className="text-xs opacity-90">{stats[index].clicks.toLocaleString()} people visited this link</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
      
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}