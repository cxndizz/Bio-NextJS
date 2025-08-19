"use client"

import { useState, useRef, useEffect } from "react";
import { 
  Image as ImageIcon, Video, Play, X, 
  ChevronLeft, ChevronRight, Pause,
  Maximize, Minimize, Download, Heart, Share2,
  Grid3x3, Layers, Eye, ZoomIn, ZoomOut, RotateCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle
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
  const [mounted, setMounted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'carousel'>('grid');
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'sepia' | 'vintage'>('none');
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const galleryImages = items.filter(item => item.type === 'image');
  const galleryVideos = items.filter(item => item.type === 'video');
  const isDark = mounted ? theme === 'dark' : false;

  // Advanced hover effect for gallery items
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  };

  const openMedia = (item: MediaItem, index: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    setSelectedMedia(item);
    setCurrentIndex(index);
    setModalOpen(true);
    setIsLoading(true);
    setZoom(1);
    setRotation(0);
    
    if (item.type === 'video') {
      setTimeout(() => {
        if (videoRef.current) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch(error => {
                console.error("Error auto-playing video:", error);
                setIsPlaying(false);
                setIsLoading(false);
              });
          }
        }
      }, 500);
    }
  };

  const goToNext = () => {
    const mediaList = selectedMedia?.type === 'image' ? galleryImages : galleryVideos;
    const nextIndex = (currentIndex + 1) % mediaList.length;
    
    if (selectedMedia?.type === 'video' && videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    
    setCurrentIndex(nextIndex);
    setSelectedMedia(mediaList[nextIndex]);
    setIsLoading(true);
    setIsPlaying(false);
    setZoom(1);
    setRotation(0);
  };

  const goToPrev = () => {
    const mediaList = selectedMedia?.type === 'image' ? galleryImages : galleryVideos;
    const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    
    if (selectedMedia?.type === 'video' && videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    
    setCurrentIndex(prevIndex);
    setSelectedMedia(mediaList[prevIndex]);
    setIsLoading(true);
    setIsPlaying(false);
    setZoom(1);
    setRotation(0);
  };

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

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    
    try {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
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

  const getFilterClass = () => {
    switch (filter) {
      case 'grayscale': return 'grayscale';
      case 'sepia': return 'sepia';
      case 'vintage': return 'sepia contrast-125 brightness-90';
      default: return '';
    }
  };

  // Gallery Item Component with advanced effects
  const GalleryItem = ({ item, index, type }: { item: MediaItem, index: number, type: 'image' | 'video' }) => (
    <div
      className="gallery-item relative aspect-square group overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-105 hover:z-10"
      onClick={() => openMedia(item, index)}
      onMouseMove={(e) => handleMouseMove(e, index)}
      style={{
        background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(147, 51, 234, 0.15), transparent 50%)`
      }}
    >
      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm"></div>
      
      {/* Thumbnail */}
      <img 
        src={item.thumb} 
        alt={`gallery-${type}-${index}`} 
        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${getFilterClass()}`}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type === 'video' ? (
                <>
                  <Video className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Video {index + 1}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Photo {index + 1}</span>
                </>
              )}
            </div>
            <Eye className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      {/* Play button for videos */}
      {type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 group-hover:scale-110 transition-transform">
            <Play className="text-white w-6 h-6 ml-1" />
          </div>
        </div>
      )}
      
      {/* Glowing effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="w-full max-w-md">
        <div className="h-12 bg-white/10 rounded-2xl mb-4 animate-pulse"></div>
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl p-6">
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-square bg-white/10 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Advanced Tabs with glassmorphism */}
      <Tabs defaultValue="photos" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/10 rounded-2xl p-1">
            <TabsTrigger 
              value="photos" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl transition-all"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="videos"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl transition-all"
            >
              <Video className="mr-2 h-4 w-4" />
              Videos
            </TabsTrigger>
          </TabsList>
          
          {/* View mode switcher */}
          <div className="flex gap-1 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'masonry' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <CardContent className="p-6">
              {galleryImages.length === 0 ? (
                <div className="py-12 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 mb-3 text-gray-400" />
                  <p className="text-gray-400">No photos to display</p>
                </div>
              ) : (
                <div className={`
                  ${viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : ''}
                  ${viewMode === 'masonry' ? 'columns-3 gap-3' : ''}
                  ${viewMode === 'carousel' ? 'flex overflow-x-auto gap-3 snap-x snap-mandatory' : ''}
                `}>
                  {galleryImages.map((item, index) => (
                    <div key={index} className={viewMode === 'masonry' ? 'mb-3' : ''}>
                      <GalleryItem item={item} index={index} type="image" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Videos Tab */}
        <TabsContent value="videos">
          <Card className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <CardContent className="p-6">
              {galleryVideos.length === 0 ? (
                <div className="py-12 text-center">
                  <Video className="mx-auto h-12 w-12 mb-3 text-gray-400" />
                  <p className="text-gray-400">No videos to display</p>
                </div>
              ) : (
                <div className={`
                  ${viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : ''}
                  ${viewMode === 'masonry' ? 'columns-3 gap-3' : ''}
                  ${viewMode === 'carousel' ? 'flex overflow-x-auto gap-3 snap-x snap-mandatory' : ''}
                `}>
                  {galleryVideos.map((item, index) => (
                    <div key={index} className={viewMode === 'masonry' ? 'mb-3' : ''}>
                      <GalleryItem item={item} index={index} type="video" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Media Viewer Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          if (isFullscreen) toggleFullscreen();
          if (selectedMedia?.type === 'video' && videoRef.current) {
            videoRef.current.pause();
          }
          setIsPlaying(false);
        }
      }}>
        <DialogContent 
          className={`bg-black/95 backdrop-blur-3xl border-gray-800 text-white p-0 rounded-3xl ${
            isFullscreen ? 'max-w-none w-screen h-screen rounded-none' : 'max-w-5xl'
          }`}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {selectedMedia?.type === 'image' 
              ? `Photo ${currentIndex + 1} of ${galleryImages.length}` 
              : `Video ${currentIndex + 1} of ${galleryVideos.length}`}
          </DialogTitle>
          
          {/* Fullscreen container */}
          <div 
            ref={galleryContainerRef}
            className={`relative flex flex-col ${isFullscreen ? 'h-screen' : ''}`}
            onMouseMove={() => setShowControls(true)}
          >
            {/* Advanced controls overlay */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              {/* Top control bar */}
              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-white">
                      <p className="text-sm opacity-70">
                        {selectedMedia?.type === 'image' ? 'Photo' : 'Video'}
                      </p>
                      <p className="text-xl font-bold">
                        {currentIndex + 1} / {selectedMedia?.type === 'image' ? galleryImages.length : galleryVideos.length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Advanced image controls */}
                    {selectedMedia?.type === 'image' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
                          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                        >
                          <ZoomIn className="h-5 w-5" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
                          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                        >
                          <ZoomOut className="h-5 w-5" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setRotation(rotation + 90)}
                          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                        >
                          <RotateCw className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsLiked(!isLiked)}
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {}}
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                    
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
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleFullscreen}
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                    >
                      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                    
                    <DialogClose asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </div>
              
              {/* Navigation arrows with magnetic effect */}
              <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToPrev}
                  className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 transition-all pointer-events-auto"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToNext}
                  className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 transition-all pointer-events-auto"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>
              
              {/* Video controls */}
              {selectedMedia?.type === 'video' && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleVideoPlayback}
                      className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:scale-110 transition-all"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Content area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-6">
              {/* Loading animation */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                </div>
              )}
              
              {/* Image display with transforms */}
              {selectedMedia?.type === 'image' && (
                <img 
                  ref={imageRef}
                  src={selectedMedia.src} 
                  className={`max-h-full w-auto object-contain transition-all duration-500 ${
                    isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${getFilterClass()}`}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                  alt="Gallery image"
                  onLoad={() => setIsLoading(false)}
                />
              )}
              
              {/* Video display */}
              {selectedMedia?.type === 'video' && (
                <video 
                  ref={videoRef}
                  src={selectedMedia.src} 
                  className={`max-h-full w-auto object-contain transition-all duration-500 ${
                    isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  preload="auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVideoPlayback();
                  }}
                  playsInline
                  controls={false}
                  onCanPlay={() => {
                    setIsLoading(false);
                    if (videoRef.current && videoRef.current.paused) {
                      videoRef.current.play()
                        .then(() => setIsPlaying(true))
                        .catch(err => console.error("Could not auto-play video:", err));
                    }
                  }}
                />
              )}
            </div>
            
            {/* Advanced thumbnail navigation with 3D effect */}
            {!isFullscreen && (
              <div className="px-6 py-4 bg-black/50 backdrop-blur-xl border-t border-white/10">
                <div className="flex justify-center">
                  <div className="flex gap-2 overflow-x-auto max-w-full py-2 px-4 -mx-4 scrollbar-thin">
                    {(selectedMedia?.type === 'image' ? galleryImages : galleryVideos).map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all transform ${
                          idx === currentIndex 
                            ? 'scale-125 z-10 ring-2 ring-purple-500 shadow-xl shadow-purple-500/50' 
                            : 'opacity-60 hover:opacity-100 hover:scale-110'
                        }`}
                        style={{
                          transform: idx === currentIndex ? 'translateY(-8px)' : 'translateY(0)'
                        }}
                        onClick={() => {
                          if (selectedMedia?.type === 'video' && videoRef.current && isPlaying) {
                            videoRef.current.pause();
                          }
                          
                          setCurrentIndex(idx);
                          setSelectedMedia(item);
                          setIsLoading(true);
                          setIsPlaying(false);
                        }}
                      >
                        <img 
                          src={item.thumb} 
                          alt={`thumbnail-${idx}`} 
                          className="w-full h-full object-cover"
                        />
                        {idx === currentIndex && (
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent"></div>
                        )}
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