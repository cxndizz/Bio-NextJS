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
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

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
  
  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
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

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (showPlaylist) setShowPlaylist(false);
  };

  // ฟอร์แมตเวลาเป็น mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className={`w-full max-w-md transition-all duration-300 ease-in-out backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-xl shadow-lg overflow-hidden ${
      isMinimized 
        ? 'bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20' 
        : 'bg-white/30 dark:bg-black/30'
    }`}>
      <CardContent className="p-0">
        <div 
          className={`p-3 ${isMinimized ? 'cursor-pointer' : ''}`} 
          onClick={isMinimized ? toggleMinimize : undefined}
        >
          {/* Header area with minimize control */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isPlaying 
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse' 
                  : 'bg-gradient-to-br from-purple-500/70 to-pink-500/70'
              } shadow-lg`}>
                <Music className="w-4 h-4 text-white" />
              </div>
              
              {!isMinimized && (
                <div className="flex-grow">
                  <p className="font-bold truncate text-sm">{currentSong.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{currentSong.artist}</p>
                </div>
              )}
              
              {isMinimized && (
                <div className="flex items-center gap-2">
                  <div className="w-28 md:w-40 truncate">
                    <span className="text-sm font-medium">{currentSong.title}</span>
                  </div>
                  
                  {isPlaying ? (
                    <div className="flex items-center space-x-0.5">
                      <span className="w-0.5 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-[soundBounce_0.9s_ease-in-out_infinite]"></span>
                      <span className="w-0.5 h-3 bg-pink-500 dark:bg-pink-400 rounded-full animate-[soundBounce_0.8s_ease-in-out_infinite_0.2s]"></span>
                      <span className="w-0.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-[soundBounce_1.2s_ease-in-out_infinite_0.6s]"></span>
                      <span className="w-0.5 h-2.5 bg-pink-500 dark:bg-pink-400 rounded-full animate-[soundBounce_0.7s_ease-in-out_infinite_0.4s]"></span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">paused</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={togglePlaylist}
                  className="h-7 w-7 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
                >
                  <Music className="h-3.5 w-3.5" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMinimize}
                className="h-7 w-7 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
              >
                {isMinimized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                    <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                    <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                  </svg>
                )}
              </Button>
            </div>
          </div>
          
          {/* Minimized controls */}
          {isMinimized && (
            <div className="flex items-center justify-between pt-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="h-7 w-7 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500/80 to-pink-500/80 border-none text-white hover:opacity-90"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="h-7 w-7 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Expanded player */}
        {!isMinimized && (
          <>
            {/* Album art & visualization */}
            <div className="relative overflow-hidden w-full aspect-square bg-gradient-to-br from-purple-900/20 to-pink-900/20 dark:from-purple-900/30 dark:to-pink-900/30">
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-80'}`}>
                {/* Animated waveform visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end justify-center gap-1 h-20 w-full max-w-[220px]">
                    {Array.from({length: 18}).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 rounded-full bg-gradient-to-t from-purple-500/80 to-pink-500/80 ${
                          isPlaying 
                            ? `animate-[soundBounce_${0.5 + Math.random() * 1}s_ease-in-out_infinite_${Math.random() * 0.5}s]` 
                            : 'h-1'
                        }`} 
                        style={{
                          height: isPlaying ? `${15 + Math.random() * 60}%` : '4px'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                {/* Album art */}
                <div className={`h-36 w-36 rounded-full border-2 border-white/20 dark:border-gray-800/30 shadow-xl overflow-hidden transition-all duration-500 ${
                  isPlaying ? 'scale-100 rotate-0' : 'scale-95 rotate-[-5deg]'
                }`}>
                  <img 
                    src={`https://picsum.photos/seed/${currentSong.title}/300/300`} 
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="px-4 pt-3">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                  [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500
                  [&::-webkit-slider-thumb]:shadow-md"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-gray-600 dark:text-gray-300">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePrev}
                  className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
                >
                  <SkipBack size={18} />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePlayPause}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 border-none text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNext}
                  className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400"
                >
                  <SkipForward size={18} />
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400"
              >
                <Heart size={16} />
              </Button>
            </div>

            {/* Playlist section */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showPlaylist ? 'max-h-60' : 'max-h-0'
            }`}>
              <div className="bg-white/20 dark:bg-black/20 border-t border-white/10 dark:border-gray-800/30 px-4 py-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">PLAYLIST</p>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {playlist.map((song, index) => (
                    <div 
                      key={index}
                      onClick={() => selectTrack(index)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentTrackIndex === index
                          ? 'bg-purple-500/20 dark:bg-purple-500/30'
                          : 'hover:bg-white/20 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        currentTrackIndex === index
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/20 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                      }`}>
                        {currentTrackIndex === index && isPlaying ? (
                          <div className="flex items-center space-x-px">
                            <span className="w-0.5 h-2 bg-white rounded-full animate-[soundBounce_0.9s_ease-in-out_infinite]"></span>
                            <span className="w-0.5 h-1.5 bg-white rounded-full animate-[soundBounce_0.8s_ease-in-out_infinite_0.2s]"></span>
                            <span className="w-0.5 h-2.5 bg-white rounded-full animate-[soundBounce_1.2s_ease-in-out_infinite_0.6s]"></span>
                          </div>
                        ) : (
                          <Play size={12} className="ml-0.5" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className={`truncate text-sm ${
                          currentTrackIndex === index 
                            ? 'text-purple-600 dark:text-purple-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {song.title}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
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
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const galleryImages = items.filter(item => item.type === 'image');
  const galleryVideos = items.filter(item => item.type === 'video');

  const openModal = (item: MediaItem, index: number) => {
    setSelectedMedia(item);
    setCurrentIndex(index);
    setModalOpen(true);
    setIsLoading(true);
  };

  const handleNext = () => {
    const items = selectedMedia?.type === 'image' ? galleryImages : galleryVideos;
    const nextIndex = (currentIndex + 1) % items.length;
    setCurrentIndex(nextIndex);
    setSelectedMedia(items[nextIndex]);
    setIsLoading(true);
  };

  const handlePrev = () => {
    const items = selectedMedia?.type === 'image' ? galleryImages : galleryVideos;
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    setCurrentIndex(prevIndex);
    setSelectedMedia(items[prevIndex]);
    setIsLoading(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // When exiting fullscreen, pause video if it's playing
    if (isFullscreen && selectedMedia?.type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      
      switch (e.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            setModalOpen(false);
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen, isFullscreen]);

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
            <CardContent className="p-4">
              {galleryImages.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No photos to display</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {galleryImages.map((item, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square group overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10 hover:-translate-y-1"
                      onClick={() => openModal(item, index)}
                    >
                      <img 
                        src={item.thumb} 
                        alt={`gallery-photo-${index}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                        <div className="w-7 h-7 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <ImageIcon className="text-white w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="videos">
          <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-xl shadow-lg">
            <CardContent className="p-4">
              {galleryVideos.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  <Video className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No videos to display</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {galleryVideos.map((item, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square group overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10 hover:-translate-y-1" 
                      onClick={() => openModal(item, index)}
                    >
                      <img 
                        src={item.thumb} 
                        alt={`gallery-video-${index}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 group-hover:opacity-80 transition-opacity flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                          <Play className="text-white w-5 h-5 ml-0.5" />
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <div className="flex items-center gap-1">
                            <Video className="text-white w-3.5 h-3.5" />
                            <span className="text-white text-xs">Video {index + 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced modal for viewing photos/videos */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          setIsFullscreen(false);
          // Pause video when closing modal
          if (selectedMedia?.type === 'video' && videoRef.current) {
            videoRef.current.pause();
          }
        }
      }}>
        <DialogContent className={`bg-gray-900/95 border-gray-800 text-white p-0 rounded-xl ${
          isFullscreen ? 'max-w-none w-screen h-screen rounded-none fixed inset-0 z-50 flex flex-col' : 'max-w-3xl'
        }`}>
          <div className={`relative flex-1 flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
            {/* Control bar */}
            <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-sm text-white">
                {selectedMedia?.type === 'image' ? 'Photo' : 'Video'} {currentIndex + 1} of {selectedMedia?.type === 'image' ? galleryImages.length : galleryVideos.length}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleFullscreen}
                  className="h-8 w-8 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60"
                >
                  {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                      <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                      <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                      <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                      <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                      <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                    </svg>
                  )}
                </Button>
                
                <DialogClose asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
            
            {/* Content area */}
            <div className={`relative flex-1 flex items-center justify-center overflow-hidden ${
              isFullscreen ? 'h-full' : ''
            }`}>
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              
              {selectedMedia?.type === 'image' && (
                <img 
                  src={selectedMedia.src} 
                  className={`max-h-[70vh] ${isFullscreen ? 'max-h-screen' : ''} w-auto object-contain transition-transform duration-500 ${
                    isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  alt="Gallery image"
                  onLoad={() => setIsLoading(false)}
                />
              )}
              
              {selectedMedia?.type === 'video' && (
                <video 
                  ref={videoRef}
                  src={selectedMedia.src} 
                  controls 
                  autoPlay 
                  className={`max-h-[70vh] ${isFullscreen ? 'max-h-screen' : ''} w-auto object-contain transition-transform duration-500 ${
                    isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  onLoadedData={() => setIsLoading(false)}
                />
              )}
              
              {/* Navigation arrows */}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 border-white/30 text-white hover:bg-black/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 border-white/30 text-white hover:bg-black/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Button>
            </div>
            
            {/* Thumbnail navigation */}
            {!isFullscreen && (
              <div className="px-4 py-3 border-t border-gray-800/50">
                <div className="flex justify-center">
                  <div className="flex gap-2 overflow-x-auto max-w-full py-1 px-3 -mx-3">
                    {(selectedMedia?.type === 'image' ? galleryImages : galleryVideos).map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`w-14 h-14 flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-all border-2 ${
                          idx === currentIndex 
                            ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/30' 
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setSelectedMedia(item);
                          setIsLoading(true);
                        }}
                      >
                        <img 
                          src={item.thumb} 
                          alt={`thumbnail-${idx}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Footer info text */}
            {isFullscreen && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-white/90">Use arrow keys to navigate • Press 'F' to toggle fullscreen • ESC to exit</p>
                  </div>
                </div>
              </div>
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