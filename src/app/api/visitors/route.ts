import { NextRequest, NextResponse } from 'next/server';

// โครงสร้างข้อมูล
interface VisitorData {
  totalCount: number;
  uniqueVisitors: Array<{
    id: string;
    lastVisit: string;
  }>;
}

// ใช้ in-memory storage (จะหายเมื่อ restart server แต่ทำงานได้แน่นอน)
let memoryStorage: VisitorData = {
  totalCount: 0, // ค่าเริ่มต้น
  uniqueVisitors: []
};

// ตัวแปรเก็บว่า memory ได้ถูกเติมข้อมูลจากไฟล์แล้วหรือยัง
let isInitialized = false;

// ฟังก์ชันเริ่มต้นระบบ
const initializeStorage = async () => {
  if (isInitialized) return;
  
  try {
    // พยายามอ่านข้อมูลจากไฟล์ (ถ้ามี)
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'visitors.json');
    
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(fileData);
      
      // ใช้ข้อมูลจากไฟล์ถ้ามีและใหญ่กว่าค่าเริ่มต้น
      if (parsedData.totalCount > memoryStorage.totalCount) {
        memoryStorage = parsedData;
        console.log("📂 Loaded existing visitor data from file:", parsedData.totalCount);
      }
    }
  } catch (error) {
    console.log("ℹ️ Could not read existing file, using default values");
  }
  
  isInitialized = true;
  console.log("🚀 Visitor counter initialized with count:", memoryStorage.totalCount);
};

// GET: อ่านข้อมูลปัจจุบัน
export async function GET() {
  console.log("📊 GET /api/visitors - Reading visitor data");
  
  try {
    // เริ่มต้นระบบถ้ายังไม่ได้เริ่ม
    if (!isInitialized) {
      await initializeStorage();
    }
    
    // ส่งข้อมูลปัจจุบัน
    return NextResponse.json({
      success: true,
      data: memoryStorage
    });
  } catch (error) {
    console.error("❌ Error in GET /api/visitors:", error);
    
    // ส่งข้อมูลฉุกเฉินถ้าเกิดข้อผิดพลาด
    return NextResponse.json({
      success: false,
      data: {
        totalCount: 0,
        uniqueVisitors: []
      }
    });
  }
}

// POST: อัปเดทข้อมูลใหม่
export async function POST(request: NextRequest) {
  console.log("💾 POST /api/visitors - Updating visitor data");
  
  try {
    // เริ่มต้นระบบถ้ายังไม่ได้เริ่ม
    if (!isInitialized) {
      await initializeStorage();
    }
    
    // อ่านข้อมูลจาก request
    const newData: VisitorData = await request.json();
    
    // ตรวจสอบความถูกต้องของข้อมูล
    if (!newData || typeof newData.totalCount !== 'number') {
      throw new Error("Invalid data format");
    }
    
    // อัปเดทข้อมูลใน memory
    const previousCount = memoryStorage.totalCount;
    memoryStorage = {
      totalCount: newData.totalCount,
      uniqueVisitors: newData.uniqueVisitors || []
    };
    
    console.log(`📈 Visitor count updated: ${previousCount} → ${newData.totalCount}`);
    
    // พยายามบันทึกลงไฟล์ (ถ้าทำได้)
    try {
      await saveToFile(memoryStorage);
    } catch (fileError) {
      console.log("⚠️ Could not save to file, but memory updated:", fileError);
      // ไม่ต้อง throw error เพราะข้อมูลบันทึกใน memory แล้ว
    }
    
    return NextResponse.json({
      success: true,
      message: "Visitor count updated successfully",
      data: memoryStorage
    });
    
  } catch (error) {
    console.error("❌ Error in POST /api/visitors:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update visitor data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// ฟังก์ชันบันทึกลงไฟล์ (ถ้าทำได้)
async function saveToFile(data: VisitorData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // สร้างโฟลเดอร์ถ้ายังไม่มี
      const dataDir = path.join(process.cwd(), 'public', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // เขียนไฟล์
      const filePath = path.join(dataDir, 'visitors.json');
      const jsonString = JSON.stringify(data, null, 2);
      
      fs.writeFileSync(filePath, jsonString, 'utf8');
      console.log("💾 Data saved to file successfully");
      resolve();
      
    } catch (error) {
      console.log("⚠️ Could not save to file:", error);
      reject(error);
    }
  });
}

// DELETE: รีเซ็ตข้อมูล (สำหรับการทดสอบ)
export async function DELETE() {
  console.log("🔄 DELETE /api/visitors - Resetting visitor data");
  
  try {
    // รีเซ็ตข้อมูลใน memory
    memoryStorage = {
      totalCount: 0,
      uniqueVisitors: []
    };
    
    console.log("✅ Visitor data reset successfully");
    
    return NextResponse.json({
      success: true,
      message: "Visitor data reset successfully",
      data: memoryStorage
    });
    
  } catch (error) {
    console.error("❌ Error resetting visitor data:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to reset visitor data" 
      },
      { status: 500 }
    );
  }
}

// PUT: เซ็ตค่าเฉพาะ (สำหรับการทดสอบ)
export async function PUT(request: NextRequest) {
  console.log("🔧 PUT /api/visitors - Setting specific visitor count");
  
  try {
    const { count } = await request.json();
    
    if (typeof count !== 'number' || count < 0) {
      throw new Error("Invalid count value");
    }
    
    // เซ็ตค่าใหม่
    memoryStorage.totalCount = count;
    
    console.log(`🎯 Visitor count set to: ${count}`);
    
    return NextResponse.json({
      success: true,
      message: `Visitor count set to ${count}`,
      data: memoryStorage
    });
    
  } catch (error) {
    console.error("❌ Error setting visitor count:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to set visitor count" 
      },
      { status: 500 }
    );
  }
}