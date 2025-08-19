"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Music, 
  ChevronUp, ChevronDown, 
  List, X, Volume1, Heart, Share2, Repeat, Shuffle,
  Disc, Waves, Radio
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
  audioRef: React.RefObject<HTMLAudioElement | null>;
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
  const [mounted, setMounted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('all');
  const [shuffle, setShuffle] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'disc'>('bars');
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const currentSong = playlist[currentTrackIndex];
  
  useEffect(() => {
    setMounted(true);
    
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.src = currentSong.src;
      audioRef.current.preload = "auto";
    }
  }, []);
  
  const isDark = mounted ? theme === 'dark' : false;

  // Audio event listeners
  useEffect(() => {
    if (!audioRef.current || !mounted) return;
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === 'all' || shuffle) {
        handleNext();
      } else {
        setIsPlaying(false);
        if (onPlayingChange) onPlayingChange(false);
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlayingChange) onPlayingChange(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (onPlayingChange) onPlayingChange(false);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioRef, mounted, onPlayingChange, repeat, shuffle]);

  // Update track
  useEffect(() => {
    if (!audioRef.current || !mounted) return;
    
    const wasPlaying = isPlaying;
    
    try {
      audioRef.current.pause();
      audioRef.current.src = currentSong.src;
      audioRef.current.autoplay = wasPlaying;
      audioRef.current.load();
      
      if (wasPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing track:", error);
            setIsPlaying(false);
            if (onPlayingChange) onPlayingChange(false);
          });
        }
      }
    } catch (error) {
      console.error("Error changing track:", error);
      setIsPlaying(false);
      if (onPlayingChange) onPlayingChange(false);
    }
  }, [currentSong, mounted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing track:", error);
          setIsPlaying(false);
          if (onPlayingChange) onPlayingChange(false);
        });
      }
    }
  };
  
  const handleNext = () => {
    if (shuffle) {
      const nextIndex = Math.floor(Math.random() * playlist.length);
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
    if (!isPlaying) setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };
  
  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    if (window.innerWidth < 768) {
      setShowPlaylist(false);
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
      
      if (newVolume > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
      if (newVolume === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      }
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
  };

  const toggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    setRepeat(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Advanced Visualizer Component
  const Visualizer = () => {
    if (visualizerMode === 'bars') {
      return (
        <div className="flex items-end gap-1 h-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${
                isPlaying 
                  ? 'bg-gradient-to-t from-purple-500 to-pink-500 animate-[soundBounce_0.8s_ease-in-out_infinite]' 
                  : 'bg-gray-600'
              }`}
              style={{
                height: isPlaying ? `${20 + Math.random() * 60}%` : '20%',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      );
    } else if (visualizerMode === 'wave') {
      return (
        <div className="relative h-8 w-full overflow-hidden">
          <Waves className={`w-full h-full ${isPlaying ? 'text-purple-500 animate-pulse' : 'text-gray-600'}`} />
        </div>
      );
    } else {
      return (
        <div className="relative h-8 w-8">
          <Disc className={`w-full h-full ${isPlaying ? 'text-purple-500 animate-spin' : 'text-gray-600'}`} />
        </div>
      );
    }
  };

  if (!mounted) {
    return (
      <Card className="w-full max-w-md backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6">
          <div className="h-48 bg-gray-300/20 rounded-2xl animate-pulse"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md transition-all duration-500 ease-in-out
      backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/10
      rounded-3xl overflow-hidden relative shadow-2xl hover:shadow-3xl
      ${expanded ? 'scale-105' : ''}`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-blue-600/10 animate-gradient-shift opacity-50"></div>
      
      {/* Main Player */}
      <div className="relative p-6 transition-all duration-300">
        
        
        {/* Track Info */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-1 truncate">
            {currentSong.title}
          </h3>
          <p className="text-gray-400 text-sm">
            {currentSong.artist}
          </p>
        </div>
        
        {/* Progress Bar - Advanced Design */}
        <div className="mb-6">
          <div 
            ref={progressBarRef}
            className="relative h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
            onClick={handleProgressClick}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20"></div>
            
            {/* Progress fill */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            >
              {/* Progress glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-sm"></div>
            </div>
            
            {/* Progress handle */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100 || 0}%`, marginLeft: '-8px' }}
            >
              <div className="absolute inset-0 bg-white rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Advanced Controls */}
        <div className="space-y-4">
          {/* Main controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShuffle(!shuffle)}
              className={`rounded-full transition-all ${
                shuffle 
                  ? 'text-purple-400 bg-purple-400/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shuffle size={18} />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
              >
                <SkipBack size={20} />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
              >
                <SkipForward size={20} />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRepeat}
              className={`rounded-full transition-all ${
                repeat !== 'none' 
                  ? 'text-purple-400 bg-purple-400/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Repeat size={18} />
              {repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-xs bg-purple-500 rounded-full w-4 h-4 flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
          </div>
          
          {/* Secondary controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 rounded-full appearance-none cursor-pointer bg-white/10
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Heart size={18} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {showPlaylist ? <X size={18} /> : <List size={18} />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {}}
                className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Share2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Playlist */}
      <div className={`overflow-hidden transition-all duration-500 ${
        showPlaylist ? 'max-h-[300px]' : 'max-h-0'
      }`}>
        <div className="bg-black/30 backdrop-blur-xl border-t border-white/10">
          <div className="p-4">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Now Playing • {playlist.length} Tracks
            </p>
            <div className="max-h-[240px] overflow-y-auto space-y-1 scrollbar-thin">
              {playlist.map((song, index) => (
                <div
                  key={index}
                  onClick={() => selectTrack(index)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                    ${currentTrackIndex === index
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                    }`}
                >
                  {/* Track number or playing indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    currentTrackIndex === index
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {currentTrackIndex === index && isPlaying ? (
                      <div className="flex items-center gap-px">
                        <span className="w-0.5 h-3 bg-white rounded-full animate-[soundBounce_0.8s_ease-in-out_infinite]"></span>
                        <span className="w-0.5 h-2 bg-white rounded-full animate-[soundBounce_0.8s_ease-in-out_infinite_0.2s]"></span>
                        <span className="w-0.5 h-3.5 bg-white rounded-full animate-[soundBounce_0.8s_ease-in-out_infinite_0.4s]"></span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className={`truncate text-sm font-medium ${
                      currentTrackIndex === index 
                        ? 'text-white' 
                        : 'text-gray-300'
                    }`}>
                      {song.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {song.artist}
                    </p>
                  </div>
                  
                  {/* Duration placeholder */}
                  <span className="text-xs text-gray-500">3:24</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}