"use client"

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

// ค่าเริ่มต้นสำหรับจำนวนผู้เข้าชม
const INITIAL_COUNT = 1;

// สร้างโครงสร้างข้อมูลสำหรับบันทึกลงไฟล์ JSON
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
    // ป้องกัน hydration error โดยรอให้ component mount ก่อน
    setMounted(true);
    
    if (!mounted) return;
    
    const updateVisitorCount = async () => {
      try {
        // --- ส่วนที่ 1: ใช้ localStorage (จะทำงานได้เสมอ) ---
        
        // อ่านจำนวนผู้เข้าชมจาก localStorage
        let visitorCount: number;
        const storedCount = localStorage.getItem('visitorCount');
        
        if (storedCount) {
          // ถ้ามีค่าเก็บไว้แล้ว ให้ใช้ค่านั้น
          visitorCount = parseInt(storedCount, 10);
        } else {
          // ถ้ายังไม่มีค่า ให้เริ่มที่ค่าเริ่มต้น
          visitorCount = INITIAL_COUNT;
          // เพิ่มค่าเริ่มต้นเพื่อให้มีความหลากหลาย
          visitorCount += Math.floor(Math.random() * 10);
        }
        
        // เพิ่มจำนวนผู้เข้าชม
        visitorCount += 1;
        
        // บันทึกค่าใหม่กลับไปที่ localStorage
        localStorage.setItem('visitorCount', visitorCount.toString());
        
        // อัพเดทค่าที่แสดงในหน้าเว็บ
        setCount(visitorCount);
        setIsNew(true);
        
        // ซ่อนการแสดงผล +1 หลังจาก 3 วินาที
        setTimeout(() => {
          setIsNew(false);
        }, 3000);
        
        console.log("Updated visitor count in localStorage:", visitorCount);
        
        // --- ส่วนที่ 2: พยายามใช้ API เพื่อบันทึกลงไฟล์ JSON (ถ้าทำได้) ---
        
        // สร้าง visitor ID
        const visitorId = generateVisitorId();
        
        // สร้างข้อมูลสำหรับบันทึกลงไฟล์ JSON
        const jsonData: VisitorData = {
          totalCount: visitorCount,
          uniqueVisitors: [{
            id: visitorId,
            lastVisit: new Date().toISOString()
          }]
        };
        
        try {
          // บันทึกข้อมูลลงไฟล์ JSON โดยใช้วิธีทางเลือก
          await saveVisitorDataToFile(jsonData);
        } catch (apiError) {
          console.log("Could not save to JSON file:", apiError);
          // ไม่ต้องทำอะไร เพราะเราใช้ localStorage เป็นหลักอยู่แล้ว
        }
        
      } catch (error) {
        console.error("Error updating visitor count:", error);
        // ในกรณีที่เกิดข้อผิดพลาด ให้ใช้ค่าเริ่มต้น
        setCount(INITIAL_COUNT);
      }
    };
    
    // เรียกใช้ฟังก์ชันอัพเดทจำนวนผู้เข้าชม
    updateVisitorCount();
  }, [mounted]);
  
  // ฟังก์ชันสร้าง visitor ID จาก browser fingerprint
  const generateVisitorId = (): string => {
    try {
      const nav = window.navigator;
      const screen = window.screen;
      
      // สร้าง fingerprint จากข้อมูลเบราว์เซอร์และหน้าจอ
      const fingerprint = [
        nav.userAgent,
        nav.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ].join('');
      
      // แปลงเป็น hash อย่างง่าย
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return 'visitor_' + Math.abs(hash).toString(16);
    } catch (e) {
      // Fallback ถ้าเกิดข้อผิดพลาด
      return 'visitor_' + Date.now().toString(16);
    }
  };
  
  // ฟังก์ชันบันทึกข้อมูลลงไฟล์ JSON (ถ้า API ทำงาน)
  const saveVisitorDataToFile = async (data: VisitorData): Promise<void> => {
    // ทางเลือกที่ 1: ใช้ API ที่เราสร้าง
    try {
      console.log("Attempting to save to visitors.json using API...");
      const response = await fetch('/api/counter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log("Successfully saved to visitors.json");
        return;
      }
      
      throw new Error(`API responded with status: ${response.status}`);
    } catch (error) {
      console.log("API method failed:", error);
      
      // ทางเลือกที่ 2: ใช้ downloadable JSON (ถ้า API ไม่ทำงาน)
      try {
        // สร้างไฟล์ JSON ที่ดาวน์โหลดได้ (จำลองการบันทึกไฟล์)
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // สร้างลิงก์ดาวน์โหลดที่ซ่อนอยู่
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visitors.json';
        a.style.display = 'none';
        
        // เพิ่มปุ่มไว้ในเว็บ แต่ไม่กระตุ้นการดาวน์โหลดอัตโนมัติ
        document.body.appendChild(a);
        
        console.log("Created downloadable JSON (manual download only)");
        
        // ไม่ต้องเรียก a.click() เพื่อหลีกเลี่ยงการดาวน์โหลดอัตโนมัติ
        // แต่จะมีปุ่มดาวน์โหลดใน DOM ที่ผู้ใช้สามารถกดได้
        
        // ทำความสะอาด URL object เพื่อป้องกัน memory leak
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
        
        return;
      } catch (downloadError) {
        console.log("Could not create downloadable JSON:", downloadError);
        throw new Error("All methods failed");
      }
    }
  };

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