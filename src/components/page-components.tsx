"use client"

/**
 * ไฟล์นี้เก็บคอมโพเนนต์หลักทั้งหมดของเว็บ
 * - MusicPlayer: เครื่องเล่นเพลง
 * - Gallery: แกลเลอรี่รูปภาพและวิดีโอ
 * - Links: ส่วนลิงก์โซเชียลมีเดีย
 */

import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, 
  Music, Video, Volume2, VolumeX, 
  Image as ImageIcon, Link as LinkIcon,
  X, Heart, Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface MusicPlayerProps {
  playlist: Song[];
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlayingChange?: (isPlaying: boolean) => void;
}

// --- Music Player Component ---
export function MusicPlayer({ playlist, audioRef, onPlayingChange }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const currentSong = playlist[currentTrackIndex];

  // พยายามเล่นเพลงอัตโนมัติเมื่อโหลดหน้า
  useEffect(() => {
    const attemptAutoplay = async () => {
      try {
        // ทำ timeout สั้นๆ เพื่อให้เบราว์เซอร์พร้อม
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (audioRef.current) {
          // ตั้งค่าเสียงให้ต่ำเพื่อเพิ่มโอกาสเล่นอัตโนมัติได้
          audioRef.current.volume = 0.2;
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // เล่นสำเร็จ
                setIsPlaying(true);
                if (onPlayingChange) onPlayingChange(true);
                console.log("Autoplay successful");
              })
              .catch(error => {
                // เล่นไม่ได้ (ปกติในเบราว์เซอร์ส่วนใหญ่)
                console.log("Autoplay prevented:", error);
              });
          }
        }
      } catch (err) {
        console.log("Autoplay error:", err);
      }
    };
    
    attemptAutoplay();
  }, []);

  // เล่น/หยุดเพลงเมื่อสถานะเปลี่ยน
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        if (onPlayingChange) onPlayingChange(true);
      } else {
        audioRef.current.pause();
        if (onPlayingChange) onPlayingChange(false);
      }
    }
  }, [isPlaying, currentTrackIndex, onPlayingChange]);
  
  // อัพเดทเพลงเมื่อเปลี่ยนเพลง
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = currentSong.src;
      if (isPlaying) {
        audio.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [currentSong, isPlaying]);

  // ฟังก์ชันควบคุมการเล่นเพลง
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    if (!isPlaying) setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // ฟอร์แมตเวลาเป็น mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="w-full max-w-md bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-xl shadow-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md shadow-inner">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div className="flex-grow">
            <p className="font-bold truncate">{currentSong.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-gray-600 dark:text-gray-300">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrev}
              className="text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
            >
              <SkipBack size={20} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePlayPause}
              className="bg-gradient-to-br from-purple-500 to-pink-500 border-none text-white hover:opacity-90"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNext}
              className="text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
            >
              <SkipForward size={20} />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400"
          >
            <Heart size={18} />
          </Button>
        </div>
        
        <audio 
          ref={audioRef} 
          onEnded={handleNext}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleTimeUpdate}
        />
      </CardContent>
    </Card>
  );
}

// --- Gallery Component ---
export function Gallery({ items }: { items: MediaItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (item: MediaItem, index: number) => {
    setSelectedMedia(item);
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const handleNext = () => {
    const items = selectedMedia?.type === 'image' ? images : videos;
    const nextIndex = (currentIndex + 1) % items.length;
    setCurrentIndex(nextIndex);
    setSelectedMedia(items[nextIndex]);
  };

  const handlePrev = () => {
    const items = selectedMedia?.type === 'image' ? images : videos;
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    setCurrentIndex(prevIndex);
    setSelectedMedia(items[prevIndex]);
  };

  const images = items.filter(item => item.type === 'image');
  const videos = items.filter(item => item.type === 'video');

  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/30 dark:bg-black/30 border border-white/20 dark:border-gray-800/50 text-gray-600 dark:text-gray-300 rounded-xl mb-4">
          <TabsTrigger value="photos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <ImageIcon className="mr-2 h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <Video className="mr-2 h-4 w-4" />
            Videos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="photos">
          <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-xl shadow-lg">
            <CardContent className="p-4 grid grid-cols-3 gap-2">
              {images.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No photos to display</p>
                </div>
              ) : (
                images.map((item, index) => (
                  <div 
                    key={index} 
                    className="relative group overflow-hidden rounded-lg cursor-pointer"
                    onClick={() => openModal(item, index)}
                  >
                    <img 
                      src={item.thumb} 
                      alt={`gallery-photo-${index}`} 
                      className="aspect-square object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="outline" size="icon" className="border-white/50 text-white bg-black/20">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="videos">
          <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-xl shadow-lg">
            <CardContent className="p-4 grid grid-cols-3 gap-2">
              {videos.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  <Video className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No videos to display</p>
                </div>
              ) : (
                videos.map((item, index) => (
                  <div 
                    key={index} 
                    className="relative group overflow-hidden rounded-lg cursor-pointer" 
                    onClick={() => openModal(item, index)}
                  >
                    <img 
                      src={item.thumb} 
                      alt={`gallery-video-${index}`} 
                      className="aspect-square object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Play className="text-white w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal for viewing photos/videos */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-900/95 border-gray-800 text-white max-w-3xl p-1 sm:p-2 md:p-4 rounded-xl">
          <DialogClose className="absolute right-3 top-3 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/40">
            <X className="h-4 w-4" />
          </DialogClose>
          
          <div className="relative">
            {selectedMedia?.type === 'image' && (
              <img 
                src={selectedMedia.src} 
                className="w-full h-auto rounded-lg object-contain max-h-[70vh]" 
                alt="Gallery image"
              />
            )}
            
            {selectedMedia?.type === 'video' && (
              <video 
                src={selectedMedia.src} 
                controls 
                autoPlay 
                className="w-full h-auto rounded-lg max-h-[70vh]" 
              />
            )}
            
            {/* Navigation buttons for gallery */}
            <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2 px-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrev}
                className="bg-black/20 border-white/30 text-white hover:bg-black/40"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNext}
                className="bg-black/20 border-white/30 text-white hover:bg-black/40"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Footer with info */}
          <div className="flex justify-between items-center mt-2 px-2">
            <p className="text-sm text-gray-300">
              {selectedMedia?.type === 'image' ? 'Photo' : 'Video'} {currentIndex + 1} of {selectedMedia?.type === 'image' ? images.length : videos.length}
            </p>
            
            {selectedMedia && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white"
                onClick={() => window.open(selectedMedia.src, '_blank')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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