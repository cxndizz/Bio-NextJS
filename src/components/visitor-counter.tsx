"use client"

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

// ค่าเริ่มต้นสำหรับจำนวนผู้เข้าชม
const INITIAL_COUNT = 0;

// โครงสร้างข้อมูลสำหรับ API
interface VisitorData {
  totalCount: number;
  uniqueVisitors: Array<{
    id: string;
    lastVisit: string;
  }>;
}

export function VisitorCounter() {
  const [count, setCount] = useState<number>(INITIAL_COUNT);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const updateVisitorCount = async () => {
      try {
        // === ขั้นตอนที่ 1: อ่านข้อมูลจาก API ก่อน ===
        let currentData: VisitorData | null = null;
        
        try {
          const response = await fetch('/api/visitors', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            currentData = await response.json();
          } else {
          }
        } catch (error) {
        }

        // === ขั้นตอนที่ 2: คำนวณจำนวนใหม่ ===
        const visitorId = generateVisitorId();
        let newCount: number;
        
        if (currentData && currentData.totalCount) {
          // ถ้ามีข้อมูลจาก API แล้ว ให้เพิ่มจากค่าที่มี
          newCount = currentData.totalCount + 1;
        } else {
          // ถ้าไม่มีข้อมูลจาก API ให้อ่านจาก localStorage
          const storedCount = localStorage.getItem('visitorCount');
          if (storedCount) {
            newCount = parseInt(storedCount, 10) + 1;
          } else {
            // ครั้งแรกที่เข้าเว็บ
            newCount = INITIAL_COUNT + Math.floor(Math.random() * 20) + 1;
          }
        }

        // === ขั้นตอนที่ 3: สร้างข้อมูลใหม่ ===
        const newData: VisitorData = {
          totalCount: newCount,
          uniqueVisitors: [
            {
              id: visitorId,
              lastVisit: new Date().toISOString()
            }
          ]
        };

        // เพิ่มผู้เข้าชมเก่าถ้ามี (เก็บแค่ 10 คนล่าสุด)
        if (currentData && currentData.uniqueVisitors) {
          const existingVisitors = currentData.uniqueVisitors.slice(0, 9); // เก็บแค่ 9 คนเก่า
          newData.uniqueVisitors = [newData.uniqueVisitors[0], ...existingVisitors];
        }

        // === ขั้นตอนที่ 4: บันทึกข้อมูลใหม่ ===
        // บันทึกใน localStorage เสมอ (เป็น backup)
        localStorage.setItem('visitorCount', newCount.toString());
        localStorage.setItem('visitorData', JSON.stringify(newData));
        
        // บันทึกผ่าน API
        try {
          const saveResponse = await fetch('/api/visitors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData)
          });
          
          if (saveResponse.ok) {
          } else {
          }
        } catch (error) {
        }

        // === ขั้นตอนที่ 5: อัปเดท UI ===
        setCount(newCount);
        setIsNew(true);
        
        // แสดงเอฟเฟกต์ +1 เป็นเวลา 3 วินาที
        setTimeout(() => {
          setIsNew(false);
        }, 3000);
        
        
      } catch (error) {
        
        // ในกรณีที่เกิดข้อผิดพลาด ให้ใช้ข้อมูลจาก localStorage
        try {
          const storedCount = localStorage.getItem('visitorCount');
          if (storedCount) {
            setCount(parseInt(storedCount, 10));
          } else {
            setCount(INITIAL_COUNT);
          }
        } catch (storageError) {
          setCount(INITIAL_COUNT);
        }
      }
    };
    
    // เรียกใช้ฟังก์ชันอัปเดท
    updateVisitorCount();
  }, [mounted]);
  
  // ฟังก์ชันสร้าง visitor ID แบบ unique
  const generateVisitorId = (): string => {
    try {
      // ใช้ข้อมูล browser fingerprint
      const nav = window.navigator;
      const screen = window.screen;
      
      const fingerprint = [
        nav.userAgent,
        nav.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        // เพิ่มข้อมูลเพิ่มเติม
        document.documentElement.lang || 'en',
        new Date().getDate() // วันในเดือน เพื่อให้ ID เปลี่ยนไปบ้างในแต่ละวัน
      ].join('|');
      
      // สร้าง hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return 'visitor_' + Math.abs(hash).toString(16);
    } catch (e) {
      // Fallback ถ้าเกิดข้อผิดพลาด
      return 'visitor_' + Date.now().toString(16) + '_' + Math.random().toString(16).substr(2, 8);
    }
  };

  // Loading state ขณะรอ mount
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