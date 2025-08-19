import { Github, Twitter } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MusicPlayer, Gallery, Links } from "@/components/page-components";

// --- ข้อมูลทั้งหมดของเว็บคุณ ---

// 🎵 เพลง: นำไฟล์ .mp3 ไปไว้ที่ public/music/
const myPlaylist = [
  { title: "TIMETHAI - ไม่อยากให้เป็นเขา", artist: "TIMETHAI", src: "/music/TIMETHAI.mp3" },
  { title: "Jazzy Frenchy", artist: "Bensound", src: "/music/bensound-jazzyfrenchy.mp3" },
  { title: "Sunny", artist: "Bensound", src: "/music/bensound-sunny.mp3" },
];

// 🖼️ รูปภาพ & วิดีโอ: นำไฟล์ไปไว้ที่ public/gallery/
const myMedia = [
  { type: 'image' as const, src: "/gallery/photo1.jpg", thumb: "/gallery/photo1.jpg" },
  { type: 'image' as const, src: "/gallery/photo2.jpg", thumb: "/gallery/photo2.jpg" },
  { type: 'video' as const, src: "/gallery/video1.mp4", thumb: "/gallery/thumb1.jpg" }, // thumb คือภาพปกวิดีโอ
];

// 🔗 ลิงก์โซเชียล
const myLinks = [
  { href: "https://github.com", title: "GitHub", icon: <Github /> },
  { href: "https://twitter.com", title: "Twitter", icon: <Twitter /> },
];


// --- หน้าเว็บหลัก ---
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      
      {/* ปุ่มสลับ Theme */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-6 w-full">
        
        {/* ส่วนโปรไฟล์ */}
        <div className="text-center">
          <img
            src="/profile.jpg" // <-- อย่าลืมใส่รูปโปรไฟล์ที่ public/profile.jpg
            alt="profile"
            className="w-24 h-24 rounded-full shadow-lg border-2 border-white/50 object-cover mx-auto"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96/7c3aed/ffffff?text=ME'; }}
          />
          <h1 className="mt-4 text-2xl font-bold">That's me</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300">Welcome to my personal space ✨</p>
        </div>

        {/* ส่วน Music Player */}
        <MusicPlayer playlist={myPlaylist} />

        {/* ส่วน Gallery */}
        <Gallery items={myMedia} />
        
        {/* ส่วน Links */}
        <Links items={myLinks} />

      </div>
    </main>
  );
}