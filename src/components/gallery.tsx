"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Image as ImageIcon, Video, Play, X, 
  ChevronLeft, ChevronRight, Pause,
  Maximize, Minimize, Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface MediaItem { 
  type: 'image' | 'video'; 
  src: string; 
  thumb: string; 
}

interface GalleryProps {
  items: MediaItem[];
}

export function Gallery({ items }: GalleryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // ป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  const galleryImages = items.filter(item => item.type === 'image');
  const galleryVideos = items.filter(item => item.type === 'video');
  const isDark = mounted ? theme === 'dark' : false;

  // Handle opening media
  const openMedia = (item: MediaItem, index: number) => {
    setSelectedMedia(item);
    setCurrentIndex(index);
    setModalOpen(true);
    setIsLoading(true);
    setIsVideoReady(false);
    setIsPlaying(false);
    
    // Reset autoplay state
    setAutoplayEnabled(false);
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }
  };

  // Navigation functions
  const goToNext = () => {
    const mediaList = selectedMedia?.type === 'image' ? galleryImages : galleryVideos;
    const nextIndex = (currentIndex + 1) % mediaList.length;
    
    // Pause current video if playing
    if (selectedMedia?.type === 'video' && videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    
    setCurrentIndex(nextIndex);
    setSelectedMedia(mediaList[nextIndex]);
    setIsLoading(true);
    setIsVideoReady(false);
    setIsPlaying(false);
    
    // Reset autoplay timer when manually navigating
    if (autoplayEnabled && autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      scheduleNextSlide();
    }
  };

  const goToPrev = () => {
    const mediaList = selectedMedia?.type === 'image' ? galleryImages : galleryVideos;
    const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    
    // Pause current video if playing
    if (selectedMedia?.type === 'video' && videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    
    setCurrentIndex(prevIndex);
    setSelectedMedia(mediaList[prevIndex]);
    setIsLoading(true);
    setIsVideoReady(false);
    setIsPlaying(false);
    
    // Reset autoplay timer when manually navigating
    if (autoplayEnabled && autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      scheduleNextSlide();
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (galleryContainerRef.current) {
      if (!isFullscreen) {
        if (galleryContainerRef.current.requestFullscreen) {
          galleryContainerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  // Autoplay functions
  const toggleAutoplay = () => {
    if (autoplayEnabled) {
      setAutoplayEnabled(false);
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    } else {
      setAutoplayEnabled(true);
      scheduleNextSlide();
    }
  };

  const scheduleNextSlide = () => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }
    
    // Set next slide to happen in 3 seconds for images, or after video ends
    if (selectedMedia?.type === 'image') {
      autoplayTimerRef.current = setTimeout(goToNext, 3000);
    }
  };

  // Video control functions with error handling
  const toggleVideoPlayback = () => {
    if (!videoRef.current || !isVideoReady) return;
    
    try {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Error playing video:", error);
              setIsPlaying(false);
            });
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Video playback error:", error);
      setIsPlaying(false);
    }
  };

  // Auto-hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    if (isFullscreen) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    if (!mounted) return;
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowControls(true);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mounted]);

  // Start autoplay timer if enabled
  useEffect(() => {
    if (autoplayEnabled && !isLoading) {
      scheduleNextSlide();
    }
    
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [autoplayEnabled, isLoading, selectedMedia]);

  // Set up video event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const handleVideoEnded = () => {
      setIsPlaying(false);
      if (autoplayEnabled) {
        goToNext();
      }
    };
    
    const handleVideoError = (e: Event) => {
      console.error("Video error:", e);
      setIsPlaying(false);
      setIsLoading(false);
    };
    
    const handleCanPlay = () => {
      setIsVideoReady(true);
      setIsLoading(false);
    };
    
    // Add event listeners
    videoElement.addEventListener('ended', handleVideoEnded);
    videoElement.addEventListener('play', () => setIsPlaying(true));
    videoElement.addEventListener('pause', () => setIsPlaying(false));
    videoElement.addEventListener('error', handleVideoError);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('loadeddata', handleCanPlay);
    
    return () => {
      // Remove event listeners
      videoElement.removeEventListener('ended', handleVideoEnded);
      videoElement.removeEventListener('play', () => setIsPlaying(true));
      videoElement.removeEventListener('pause', () => setIsPlaying(false));
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('loadeddata', handleCanPlay);
    };
  }, [videoRef.current, autoplayEnabled]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!mounted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      
      showControlsTemporarily();
      
      switch (e.key) {
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            setModalOpen(false);
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case ' ': // Space key
          if (selectedMedia?.type === 'video') {
            toggleVideoPlayback();
            e.preventDefault(); // Prevent page scroll
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen, isFullscreen, selectedMedia, mounted, isVideoReady]);

  // Clean up timers when closing modal
  useEffect(() => {
    if (!modalOpen) {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      setAutoplayEnabled(false);
      setIsPlaying(false);
      setIsVideoReady(false);
    }
  }, [modalOpen]);

  // Loading state ขณะรอ mount
  if (!mounted) {
    return (
      <div className="w-full max-w-md">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4 animate-pulse"></div>
        <div className="bg-white/20 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className={`grid w-full grid-cols-2 ${
          isDark 
            ? 'bg-black/30 border-gray-800/40' 
            : 'bg-white/30 border-white/20'
        } border rounded-xl mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <TabsTrigger value="photos" className={`
            ${isDark 
              ? 'data-[state=active]:bg-gray-800 data-[state=active]:text-foreground' 
              : 'data-[state=active]:bg-white data-[state=active]:text-foreground'
            }
          `}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="videos" className={`
            ${isDark 
              ? 'data-[state=active]:bg-gray-800 data-[state=active]:text-foreground' 
              : 'data-[state=active]:bg-white data-[state=active]:text-foreground'
            }
          `}>
            <Video className="mr-2 h-4 w-4" />
            Videos
          </TabsTrigger>
        </TabsList>
        
        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card className={`${
            isDark 
              ? 'bg-black/30 border-gray-800/40 shadow-lg shadow-purple-900/10' 
              : 'bg-white/30 border-white/30 shadow-lg shadow-purple-500/5'
          } backdrop-blur-md rounded-xl`}>
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
                      onClick={() => openMedia(item, index)}
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
        
        {/* Videos Tab */}
        <TabsContent value="videos">
          <Card className={`${
            isDark 
              ? 'bg-black/30 border-gray-800/40 shadow-lg shadow-purple-900/10' 
              : 'bg-white/30 border-white/30 shadow-lg shadow-purple-500/5'
          } backdrop-blur-md rounded-xl`}>
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
                      onClick={() => openMedia(item, index)}
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

      {/* Enhanced Media Viewer Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          if (isFullscreen) toggleFullscreen();
          if (selectedMedia?.type === 'video' && videoRef.current) {
            videoRef.current.pause();
          }
          setAutoplayEnabled(false);
          setIsVideoReady(false);
        }
      }}>
        <DialogContent 
          className={`bg-gray-900/95 border-gray-800 text-white p-0 rounded-xl ${
            isFullscreen ? 'max-w-none w-screen h-screen rounded-none' : 'max-w-4xl'
          }`}
          showCloseButton={false}
        >
          {/* Fullscreen container */}
          <div 
            ref={galleryContainerRef}
            className={`relative flex flex-col ${isFullscreen ? 'h-screen' : ''}`}
            onMouseMove={showControlsTemporarily}
          >
            {/* Controls overlay (conditionally shown) */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              {/* Top control bar */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-white/90">
                    {selectedMedia?.type === 'image' ? 'Photo' : 'Video'} {currentIndex + 1} of {selectedMedia?.type === 'image' ? galleryImages.length : galleryVideos.length}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Autoplay toggle */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleAutoplay}
                      className={`h-8 w-8 rounded-full ${
                        autoplayEnabled 
                          ? 'bg-purple-500/60 text-white hover:bg-purple-500/80' 
                          : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                      }`}
                    >
                      {autoplayEnabled ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                    
                    {/* Download button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (selectedMedia) {
                          const link = document.createElement('a');
                          link.href = selectedMedia.src;
                          link.download = selectedMedia.src.split('/').pop() || 'download';
                          link.click();
                        }
                      }}
                      className="h-8 w-8 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {/* Fullscreen toggle */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleFullscreen}
                      className="h-8 w-8 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                    
                    {/* Close button */}
                    <DialogClose asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </div>
              
              {/* Navigation arrows */}
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToPrev}
                  className="h-10 w-10 rounded-full bg-black/30 text-white/90 hover:bg-black/50 hover:text-white pointer-events-auto"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToNext}
                  className="h-10 w-10 rounded-full bg-black/30 text-white/90 hover:bg-black/50 hover:text-white pointer-events-auto"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              
              {/* Video playback controls - only for video */}
              {selectedMedia?.type === 'video' && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex justify-center items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleVideoPlayback}
                      disabled={!isVideoReady}
                      className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Bottom info bar in fullscreen */}
              {isFullscreen && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                  <p className="text-xs text-white/70 text-center">
                    ← → arrows to navigate • Space to play/pause • F for fullscreen • ESC to exit
                  </p>
                </div>
              )}
            </div>
            
            {/* Content area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={showControlsTemporarily}>
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
              
              {/* Image display */}
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
              
              {/* Video display */}
              {selectedMedia?.type === 'video' && (
                <video 
                  ref={videoRef}
                  src={selectedMedia.src} 
                  className={`max-h-[70vh] ${isFullscreen ? 'max-h-screen' : ''} w-auto object-contain transition-transform duration-500 ${
                    isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  preload="auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isVideoReady) {
                      toggleVideoPlayback();
                    }
                  }}
                  playsInline // Important for mobile
                />
              )}
            </div>
            
            {/* Thumbnail navigation */}
            {!isFullscreen && (
              <div className="px-4 py-3 border-t border-gray-800/50">
                <div className="flex justify-center">
                  <div className="flex gap-2 overflow-x-auto max-w-full py-1 px-3 -mx-3 scrollbar-thin">
                    {(selectedMedia?.type === 'image' ? galleryImages : galleryVideos).map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`w-14 h-14 flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-all border-2 ${
                          idx === currentIndex 
                            ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/30' 
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        onClick={() => {
                          // Pause current video if playing before switching
                          if (selectedMedia?.type === 'video' && videoRef.current && isPlaying) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                          }
                          
                          setCurrentIndex(idx);
                          setSelectedMedia(item);
                          setIsLoading(true);
                          setIsVideoReady(false);
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}