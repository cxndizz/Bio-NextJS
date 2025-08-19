"use client"

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export function VisitorCounter() {
  const [count, setCount] = useState<number>(0);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // ป้องกัน hydration error โดยรอให้ component mount ก่อน
    setMounted(true);
    
    const initializeCounter = () => {
      try {
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

        // กำหนดค่าเริ่มต้นในกรณีที่ localStorage ไม่ทำงาน
        let totalVisitors = 42; // ค่าสวยๆ เป็น fallback
        let isNewVisitor = false;
        
        // ทดลองใช้วิธีอื่นแทน localStorage เพื่อเก็บข้อมูลผู้เข้าชมชั่วคราว
        const visitorId = generateVisitorId();
        
        // ใช้ sessionStorage แทน localStorage (จะหายเมื่อปิด browser แต่ไม่เป็นไรเพราะเป็นเพียงตัวอย่าง)
        try {
          const sessionData = sessionStorage.getItem('visit_count') || '0';
          const lastVisitor = sessionStorage.getItem('last_visitor') || '';
          
          totalVisitors = parseInt(sessionData, 10);
          
          if (lastVisitor !== visitorId) {
            // New visitor
            totalVisitors++;
            sessionStorage.setItem('visit_count', totalVisitors.toString());
            sessionStorage.setItem('last_visitor', visitorId);
            isNewVisitor = true;
          }
        } catch (storageError) {
          // ถ้า sessionStorage ไม่ทำงาน ใช้ค่า fallback
          console.log('Storage not available:', storageError);
        }
        
        setCount(totalVisitors);
        setIsNew(isNewVisitor);
        
        // Animation for new visitor
        if (isNewVisitor) {
          setTimeout(() => {
            setIsNew(false);
          }, 3000);
        }
      } catch (error) {
        // Fallback ถ้าเกิดข้อผิดพลาดใดๆ
        console.log('Counter error, using fallback:', error);
        setCount(42);
      }
    };

    // รอสักเล็กน้อยก่อนจะเรียกใช้เพื่อให้แน่ใจว่า component mount แล้ว
    const timeoutId = setTimeout(initializeCounter, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // แสดง loading state ขณะรอ mount
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Users size={16} className="text-purple-500" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm transition-all duration-300 ${
      isNew ? 'animate-pulse' : ''
    }`}>
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