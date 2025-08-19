import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// กำหนดพาธของไฟล์ JSON
const dataFilePath = path.join(process.cwd(), 'public', 'data', 'visitors.json');

// ตรวจสอบว่าโฟลเดอร์ data มีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
const ensureDirectoryExists = () => {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// สร้างไฟล์ JSON ใหม่หากยังไม่มี
const createEmptyJsonFile = () => {
  if (!fs.existsSync(dataFilePath)) {
    const initialData = {
      totalCount: 0,
      uniqueVisitors: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    console.log("Created new visitors JSON file");
  }
};

// GET: อ่านข้อมูลจากไฟล์ JSON
export async function GET() {
  console.log("GET /api/counter called");
  
  try {
    ensureDirectoryExists();
    createEmptyJsonFile();
    
    const data = fs.readFileSync(dataFilePath, 'utf8');
    console.log("Read visitor data:", data);
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading visitor data:', error);
    return NextResponse.json(
      { error: 'Failed to read visitor data' },
      { status: 500 }
    );
  }
}

// POST: อัพเดทข้อมูลในไฟล์ JSON
export async function POST(request: NextRequest) {
  console.log("POST /api/counter called");
  
  try {
    ensureDirectoryExists();
    
    // อ่านข้อมูลจาก request
    const newData = await request.json();
    console.log("Received new data:", newData);
    
    // เขียนข้อมูลลงในไฟล์ JSON
    fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
    console.log("Updated visitors.json successfully");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating visitor data:', error);
    return NextResponse.json(
      { error: 'Failed to update visitor data' },
      { status: 500 }
    );
  }
}