"use client"

/**
 * ไฟล์นี้เก็บคอมโพเนนต์หลักทั้งหมดของเว็บ
 * - MusicPlayer: เครื่องเล่นเพลง
 * - Gallery: แกลเลอรี่รูปภาพและวิดีโอ
 * - Links: ส่วนลิงก์โซเชียลมีเดีย
 */

import { useState, useRef, useEffect } from "react";
import { 
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// นำเข้าคอมโพเนนต์ใหม่ที่เราสร้าง
import { MusicPlayer } from "@/components/music-player";
import { Gallery } from "@/components/gallery";

// --- Interfaces (โครงสร้างข้อมูล) ---
interface Song { 
  title: string; 
  artist: string; 
  src: string; 
}

interface Link { 
  href: string; 
  title: string; 
  icon: React.ReactNode; 
}

interface MediaItem { 
  type: 'image' | 'video'; 
  src: string; 
  thumb: string; 
}

// Re-export คอมโพเนนต์ใหม่เพื่อความเข้ากันได้กับโค้ดเดิม
export { MusicPlayer, Gallery };

// --- Links Component ---
export function Links({ items }: { items: Link[] }) {
  return (
    <div className="grid gap-3 w-full max-w-md">
      <TooltipProvider>
        {items.map((link, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <a 
                href={link.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block transform transition-all duration-300 hover:scale-105"
              >
                <div className="relative overflow-hidden rounded-xl">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Card content */}
                  <Card className="relative z-10 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-gray-800/30 shadow-lg group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-gray-50/90 to-gray-100/90 dark:from-gray-800/90 dark:to-gray-900/90 rounded-xl shadow-inner">
                          {link.icon}
                        </div>
                        <div>
                          <span className="text-lg font-semibold">{link.title}</span>
                          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-100 -z-10 group-hover:-inset-0.5 transition-all duration-300"></div>
                </div>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visit my {link.title}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}