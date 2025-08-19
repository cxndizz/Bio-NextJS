"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Music, 
  ChevronUp, ChevronDown, 
  List, X, Volume1
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface Song { 
  title: string; 
  artist: string; 
  src: string; 
}

interface MusicPlayerProps {
  playlist: Song[];
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function MusicPlayer({ playlist, audioRef, onPlayingChange }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(true); // เริ่มต้นเป็น muted เพื่อให้ autoplay ทำงาน
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isTrackChanging, setIsTrackChanging] = useState(false);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);
  const playbackPromiseRef = useRef<Promise<void> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const currentSong = playlist[currentTrackIndex];
  
  // ป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = mounted ? theme === 'dark' : false;

  // Autoplay ด้วย muted sound
  useEffect(() => {
    if (!mounted || autoplayAttempted || !audioRef.current) return;
    
    const attemptAutoplay = async () => {
      try {
        // รอให้ DOM พร้อม
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (audioRef.current) {
          // ตั้งค่าเริ่มต้น: muted เพื่อให้ autoplay ทำงานได้
          audioRef.current.muted = true;
          audioRef.current.volume = 0.7;
          
          setAutoplayAttempted(true);
          
          try {
            // พยายามเล่นแบบ muted
            await audioRef.current.play();
            setIsPlaying(true);
            setShowUnmutePrompt(true); // แสดงข้อความให้ผู้ใช้เปิดเสียง
            if (onPlayingChange) onPlayingChange(true);
            
            // ซ่อนข้อความหลังจาก 5 วินาที
            setTimeout(() => {
              setShowUnmutePrompt(false);
            }, 5000);
          } catch (error) {
            console.log("Autoplay prevented:", error);
            setIsPlaying(false);
            if (onPlayingChange) onPlayingChange(false);
          }
        }
      } catch (err) {
        console.log("Autoplay error:", err);
        setAutoplayAttempted(true);
      }
    };
    
    attemptAutoplay();
  }, [mounted, autoplayAttempted, audioRef, onPlayingChange]);

  // Set up audio element event listeners
  useEffect(() => {
    if (!audioRef.current || !mounted) return;
    
    const audio = audioRef.current;
    
    const handleCanPlay = () => {
      setIsAudioReady(true);
      
      if (isPlaying && isTrackChanging && userInteracted) {
        playTrack();
        setIsTrackChanging(false);
      }
    };
    
    const handleLoadStart = () => {
      setIsAudioReady(false);
    };
    
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsAudioReady(false);
      setIsPlaying(false);
      if (onPlayingChange) onPlayingChange(false);
    };
    
    const handleEnded = () => {
      handleNext();
    };
    
    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    audio.preload = "auto";
    
    if (!audio.src) {
      audio.src = currentSong.src;
      audio.load();
    }
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, currentSong, mounted, isPlaying, isTrackChanging, userInteracted, onPlayingChange]);

  // Safe play function
  const playTrack = async () => {
    if (!audioRef.current || !isAudioReady) return false;
    
    try {
      if (playbackPromiseRef.current) {
        await playbackPromiseRef.current.catch(() => {});
        playbackPromiseRef.current = null;
      }
      
      const playPromise = audioRef.current.play();
      playbackPromiseRef.current = playPromise;
      
      await playPromise;
      if (onPlayingChange) onPlayingChange(true);
      return true;
    } catch (error) {
      console.error("Error playing track:", error);
      setIsPlaying(false);
      if (onPlayingChange) onPlayingChange(false);
      return false;
    } finally {
      playbackPromiseRef.current = null;
    }
  };

  // Safely pause playback
  const pauseTrack = () => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.pause();
      if (onPlayingChange) onPlayingChange(false);
    } catch (error) {
      console.error("Error pausing track:", error);
    }
  };

  // Play/pause when state changes
  useEffect(() => {
    if (!mounted || !audioRef.current) return;
    
    if (isPlaying) {
      if (isAudioReady && !isTrackChanging) {
        playTrack();
      }
    } else {
      pauseTrack();
    }
  }, [isPlaying, isAudioReady, isTrackChanging, mounted]);
  
  // Update track when changing songs
  useEffect(() => {
    if (!audioRef.current || !mounted) return;
    
    const changeTrack = async () => {
      setIsTrackChanging(true);
      
      try {
        pauseTrack();
        audioRef.current.src = currentSong.src;
        audioRef.current.load();
      } catch (error) {
        console.error("Error changing track:", error);
        setIsPlaying(false);
        setIsTrackChanging(false);
        if (onPlayingChange) onPlayingChange(false);
      }
    };
    
    changeTrack();
  }, [currentSong, mounted]);

  // Playback control functions
  const handlePlayPause = () => {
    setUserInteracted(true);
    setIsPlaying(!isPlaying);
  };
  
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    if (!isPlaying) setIsPlaying(true);
    setUserInteracted(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    if (!isPlaying) setIsPlaying(true);
    setUserInteracted(true);
  };
  
  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setUserInteracted(true);
    if (window.innerWidth < 768) {
      setShowPlaylist(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    
    setUserInteracted(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setUserInteracted(true);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      // ถ้าปรับ volume > 0 ให้ unmute อัตโนมัติ
      if (newVolume > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
      if (newVolume === 0) {
        setIsMuted(true);
      }
    }
  };

  const toggleMute = () => {
    setUserInteracted(true);
    setShowUnmutePrompt(false);
    
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (expanded) setShowPlaylist(false);
  };

  // Format time as mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Loading state
  if (!mounted) {
    return (
      <Card className="w-full max-w-md backdrop-blur-md bg-white/20 border-white/30 rounded-xl overflow-hidden">
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full flex items-center justify-center bg-gray-700/50">
                <Music className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md transition-all duration-300 ease-in-out backdrop-blur-md
      ${isDark 
        ? 'bg-black/20 border-gray-800/40 shadow-lg shadow-purple-900/10' 
        : 'bg-white/20 border-white/30 shadow-lg shadow-purple-500/5'
      } rounded-xl overflow-hidden relative`}
    >
      {/* Unmute Prompt - แสดงข้อความให้เปิดเสียง */}
      {showUnmutePrompt && isMuted && isPlaying && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs py-1.5 px-3 flex items-center justify-between z-20 animate-pulse">
          <span className="flex items-center gap-1">
            <Volume1 size={14} />
            คลิกที่ไอคอนลำโพงเพื่อเปิดเสียง 🎵
          </span>
          <button 
            onClick={() => setShowUnmutePrompt(false)}
            className="hover:opacity-70"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Minimal Player */}
      <div className="px-3 py-2.5 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`size-7 rounded-full flex items-center justify-center
              ${isPlaying 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse'
                : isDark ? 'bg-gray-700/50' : 'bg-gray-500/30'
              }`}
            >
              <Music className="w-3 h-3 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{currentSong.title}</h3>
              <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentSong.artist}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePlaylist}
              className={`h-7 w-7 ${isDark 
                ? 'text-gray-400 hover:text-purple-400' 
                : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              {showPlaylist ? <X className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleExpanded}
              className={`h-7 w-7 ${isDark 
                ? 'text-gray-400 hover:text-purple-400' 
                : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-2">
          <div 
            ref={progressBarRef}
            className={`h-1.5 w-full rounded-full overflow-hidden cursor-pointer ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-200'
            }`}
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTime(currentTime)}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMute}
            className={`h-8 w-8 rounded-full ${
              isMuted 
                ? 'text-orange-500 hover:text-orange-400 animate-pulse' 
                : isDark 
                  ? 'text-gray-400 hover:text-purple-400' 
                  : 'text-gray-600 hover:text-purple-500'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrev}
              className={`h-8 w-8 rounded-full ${isDark 
                ? 'text-gray-400 hover:text-purple-400' 
                : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              <SkipBack size={16} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePlayPause}
              disabled={isTrackChanging || !isAudioReady}
              className={`h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-none text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all ${
                (isTrackChanging || !isAudioReady) ? 'opacity-60' : ''
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNext}
              className={`h-8 w-8 rounded-full ${isDark 
                ? 'text-gray-400 hover:text-purple-400' 
                : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              <SkipForward size={16} />
            </Button>
          </div>
          
          <div className="w-8 h-8 flex items-center justify-center">
            {/* Visualizer indicators */}
            {isPlaying && isAudioReady && !isTrackChanging && (
              <div className="flex items-end gap-0.5">
                <div className={`w-1 rounded-full animate-[soundBounce_0.8s_ease-in-out_infinite] ${
                  isDark ? 'bg-indigo-400' : 'bg-indigo-500'
                }`} style={{height: '10px'}}></div>
                <div className={`w-1 rounded-full animate-[soundBounce_1s_ease-in-out_infinite_0.2s] ${
                  isDark ? 'bg-purple-400' : 'bg-purple-500'
                }`} style={{height: '16px'}}></div>
                <div className={`w-1 rounded-full animate-[soundBounce_0.6s_ease-in-out_infinite_0.1s] ${
                  isDark ? 'bg-indigo-400' : 'bg-indigo-500'
                }`} style={{height: '12px'}}></div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isTrackChanging && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Expanded Controls */}
        <div className={`overflow-hidden transition-all duration-300 ${
          expanded ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          <div className="flex items-center justify-center pt-1 pb-2">
            <div className="w-full max-w-[180px]">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer
                  ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                  [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-purple-500`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Playlist */}
      <div className={`overflow-hidden transition-all duration-300 ${
        showPlaylist ? 'max-h-[240px]' : 'max-h-0'
      }`}>
        <div className={`${isDark ? 'bg-black/30' : 'bg-white/30'} border-t ${
          isDark ? 'border-gray-800/40' : 'border-white/20'
        }`}>
          <div className="py-2 px-3">
            <p className={`text-xs font-medium mb-1.5 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>PLAYLIST</p>
            <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {playlist.map((song, index) => (
                <div 
                  key={index}
                  onClick={() => selectTrack(index)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    currentTrackIndex === index
                      ? isDark 
                        ? 'bg-indigo-500/10' 
                        : 'bg-indigo-100/50'
                      : isDark 
                        ? 'hover:bg-gray-800/30' 
                        : 'hover:bg-white/40'
                  }`}
                >
                  <div className={`size-6 rounded-full flex items-center justify-center ${
                    currentTrackIndex === index
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : isDark ? 'bg-gray-700/50' : 'bg-white/40'
                  }`}>
                    {currentTrackIndex === index && isPlaying && isAudioReady && !isTrackChanging ? (
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
                        ? isDark ? 'text-indigo-400 font-medium' : 'text-indigo-600 font-medium' 
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {song.title}
                    </p>
                    <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {song.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleTimeUpdate}
        preload="auto"
      />
    </Card>
  );
}