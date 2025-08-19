"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Music, 
  ChevronUp, ChevronDown, 
  List, X
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
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const currentSong = playlist[currentTrackIndex];
  const isDark = theme === 'dark';

  // Autoplay attempt
  useEffect(() => {
    const attemptAutoplay = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (audioRef.current) {
          audioRef.current.volume = 0.2;
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                if (onPlayingChange) onPlayingChange(true);
              })
              .catch(error => {
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

  // Play/pause when state changes
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
  
  // Update track when changing songs
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = currentSong.src;
      if (isPlaying) {
        audio.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [currentSong, isPlaying]);

  // Playback control functions
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

  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Close playlist when collapsing
    if (expanded) setShowPlaylist(false);
  };

  // Format time as mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className={`w-full max-w-md transition-all duration-300 ease-in-out backdrop-blur-md
      ${isDark 
        ? 'bg-black/20 border-gray-800/40 shadow-lg shadow-purple-900/10' 
        : 'bg-white/20 border-white/30 shadow-lg shadow-purple-500/5'
      } rounded-xl overflow-hidden`}
    >
      {/* Minimal Player */}
      <div className="px-3 py-2.5 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`size-7 rounded-full flex items-center justify-center
              ${isPlaying 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse'
                : 'bg-gray-700/50 dark:bg-gray-600/20'
              }`}
            >
              <Music className="w-3 h-3 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{currentSong.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentSong.artist}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePlaylist}
              className="h-7 w-7 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            >
              {showPlaylist ? <X className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleExpanded}
              className="h-7 w-7 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar - Always visible */}
        <div className="mb-2">
          <div 
            ref={progressBarRef}
            className="h-1.5 w-full bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Main Controls - Always visible */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMute}
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 rounded-full"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrev}
              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 rounded-full"
            >
              <SkipBack size={16} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePlayPause}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-none text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNext}
              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 rounded-full"
            >
              <SkipForward size={16} />
            </Button>
          </div>
          
          <div className="w-8 h-8 flex items-center justify-center">
            {/* Visualizer indicators */}
            {isPlaying && (
              <div className="flex items-end gap-0.5">
                <div className="w-1 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-[soundBounce_0.8s_ease-in-out_infinite]" style={{height: '10px'}}></div>
                <div className="w-1 rounded-full bg-purple-500 dark:bg-purple-400 animate-[soundBounce_1s_ease-in-out_infinite_0.2s]" style={{height: '16px'}}></div>
                <div className="w-1 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-[soundBounce_0.6s_ease-in-out_infinite_0.1s]" style={{height: '12px'}}></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Expanded Controls - Show when expanded */}
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
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700/50 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                  [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-purple-500"
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
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">PLAYLIST</p>
            <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              {playlist.map((song, index) => (
                <div 
                  key={index}
                  onClick={() => selectTrack(index)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    currentTrackIndex === index
                      ? isDark 
                        ? 'bg-indigo-500/20 dark:bg-indigo-500/10' 
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
                        ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
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
      </div>
      
      <audio 
        ref={audioRef} 
        onEnded={handleNext}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleTimeUpdate}
      />
    </Card>
  );
}