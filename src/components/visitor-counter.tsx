"use client"

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export function VisitorCounter() {
  const [count, setCount] = useState<number>(0);
  const [isNew, setIsNew] = useState<boolean>(false);

  useEffect(() => {
    // Generate a unique visitor ID based on browser fingerprint
    const generateVisitorId = () => {
      const nav = window.navigator;
      const screen = window.screen;
      const browserInfo = 
        nav.userAgent + 
        nav.language + 
        JSON.stringify(nav.plugins?.length || 0);
      const screenInfo = 
        screen.height + 
        'x' + 
        screen.width + 
        'x' + 
        screen.colorDepth;
      
      return btoa(browserInfo + screenInfo).slice(0, 32);
    };

    const visitorId = generateVisitorId();
    const storedVisitors = localStorage.getItem('site_visitors') || '{}';
    let visitors: Record<string, number> = {};
    
    try {
      visitors = JSON.parse(storedVisitors);
    } catch (e) {
      visitors = {};
    }
    
    // Calculate total visitors
    const totalVisitors = Object.keys(visitors).length;
    
    // Check if this is a new visitor
    if (!visitors[visitorId]) {
      visitors[visitorId] = Date.now();
      localStorage.setItem('site_visitors', JSON.stringify(visitors));
      setIsNew(true);
      
      // Update count with new visitor
      setCount(totalVisitors + 1);
      
      // Animation for new visitor
      setTimeout(() => {
        setIsNew(false);
      }, 3000);
    } else {
      // Just update last visit time
      visitors[visitorId] = Date.now();
      localStorage.setItem('site_visitors', JSON.stringify(visitors));
      setCount(totalVisitors);
    }
  }, []);

  return (
    <div className={`flex items-center gap-2 text-sm ${isNew ? 'animate-pulse' : ''}`}>
      <Users size={16} className="text-purple-500" />
      <span>
        {count.toLocaleString()} visitor{count !== 1 ? 's' : ''}
      </span>
      {isNew && (
        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce">
          +1
        </span>
      )}
    </div>
  );
}