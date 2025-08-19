"use client"

/**
 * หน้าเว็บหลัก Link in Bio
 * ไฟล์นี้เป็นหน้าแรกที่ผู้เข้าชมจะเห็น
 */

import { Github, Twitter, Instagram, Music, Headphones, Youtube } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MusicPlayer, Gallery, Links } from "@/components/page-components";
import { VisitorCounter } from "@/components/visitor-counter";
import AudioVisualizer from "@/components/audio-visualizer";
import { useRef, useState } from "react";

// --- ข้อมูลทั้งหมดของเว็บคุณ (แก้ไขได้ตามต้องการ) ---

// 🎵 เพลง: นำไฟล์ .mp3 ไปไว้ที่ public/music/
const myPlaylist = [
  { 
    title: "ไม่อยากให้เป็นเขา", 
    artist: "Timethai", 
    src: "/music/TIMETHAI.mp3" 
  },
  { 
    title: "รอที่เส้นขอบฟ้า", 
    artist: "PUN",
    src: "/music/SKY.mp3" 
  },
  { 
    title: "Living Death",
    artist: "PUN", 
    src: "/music/night.mp3" 
  }
];

// 🖼️ รูปภาพ & วิดีโอ: นำไฟล์ไปไว้ที่ public/gallery/
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

// 🔗 ลิงก์โซเชียล
const myLinks = [
  { href: "https://github.com", title: "GitHub", icon: <Github className="text-gray-300" /> },
  { href: "https://twitter.com", title: "Twitter", icon: <Twitter className="text-sky-400" /> },
  { href: "https://instagram.com", title: "Instagram", icon: <Instagram className="text-pink-500" /> },
  { href: "https://youtube.com", title: "YouTube", icon: <Youtube className="text-red-500" /> },
  { href: "https://spotify.com", title: "Spotify", icon: <Headphones className="text-green-500" /> },
];

// 👤 ข้อมูลโปรไฟล์
const profile = {
  name: "Your Name",
  bio: "Digital Creator | Photographer | Music Lover ✨",
  avatarUrl: "/profile.jpg", // ใส่รูปโปรไฟล์ที่ public/profile.jpg
};

// --- หน้าเว็บหลัก ---
export default function Home() {
  // หลีกเลี่ยงการใช้ null ในการสร้าง useRef เพื่อให้ตรงกับ MusicPlayerProps
  const audioRef = useRef<HTMLAudioElement>(null!);
  const [isPlaying, setIsPlaying] = useState(false);

  // ส่งค่า state เหล่านี้ให้ MusicPlayer และ AudioVisualizer
  const handlePlayingStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-b from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50 text-gray-800 dark:text-white transition-colors duration-300">
      {/* Audio Visualizer */}
      <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />
      
      {/* ปุ่มสลับ Theme */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-8 w-full max-w-md pt-10 z-10">
        
        {/* ส่วนโปรไฟล์ */}
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-25 animate-pulse"></div>
            <img
              src={profile.avatarUrl}
              alt="profile"
              className="relative w-28 h-28 rounded-full shadow-lg border-2 border-white/70 dark:border-gray-700/70 object-cover mx-auto"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/112x112/7c3aed/ffffff?text=ME'; }}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">{profile.bio}</p>
          
          {/* Visitor Counter */}
          <div className="flex justify-center">
            <VisitorCounter />
          </div>
        </div>

        {/* ส่วน Music Player */}
        <MusicPlayer 
          playlist={myPlaylist} 
          audioRef={audioRef}
          onPlayingChange={handlePlayingStateChange}
        />

        {/* ส่วน Gallery */}
        <Gallery items={myMedia} />
        
        {/* ส่วน Links */}
        <Links items={myLinks} />

        {/* ส่วน Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
          <p>© {new Date().getFullYear()} {profile.name}</p>
          <p className="mt-1">Made with Next.js & Tailwind CSS</p>
        </div>
      </div>
    </main>
  );
}