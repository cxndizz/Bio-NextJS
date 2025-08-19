"use client"

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Music, Video, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Interfaces (โครงสร้างข้อมูล) ---
interface Song { title: string; artist: string; src: string; }
interface Link { href: string; title: string; icon: React.ReactNode; }
interface MediaItem { type: 'image' | 'video'; src: string; thumb: string; }

// --- Music Player Component ---
export function MusicPlayer({ playlist }: { playlist: Song[] }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = playlist[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      else audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);
  
  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    if (!isPlaying) setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    if (!isPlaying) setIsPlaying(true);
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
        audio.src = currentSong.src;
        if (isPlaying) {
            audio.play();
        }
    }
  }, [currentSong, isPlaying]);


  return (
    <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white rounded-2xl shadow-lg">
      <CardContent className="p-4 flex items-center gap-4">
        <Music className="w-10 h-10" />
        <div className="flex-grow">
          <p className="font-bold">{currentSong.title}</p>
          <p className="text-sm text-gray-300">{currentSong.artist}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrev}><SkipBack /></Button>
          <Button variant="ghost" size="icon" onClick={handlePlayPause}>
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext}><SkipForward /></Button>
        </div>
        <audio ref={audioRef} src={currentSong.src} onEnded={handleNext} />
      </CardContent>
    </Card>
  );
}

// --- Gallery Component ---
export function Gallery({ items }: { items: MediaItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const openModal = (item: MediaItem) => {
    setSelectedMedia(item);
    setModalOpen(true);
  };

  const images = items.filter(item => item.type === 'image');
  const videos = items.filter(item => item.type === 'video');

  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20 text-white">
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>
        <TabsContent value="photos">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-4 grid grid-cols-3 gap-2">
              {images.map((item, index) => (
                <img key={index} src={item.thumb} alt={`gallery-photo-${index}`} className="rounded-lg cursor-pointer aspect-square object-cover" onClick={() => openModal(item)} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="videos">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-4 grid grid-cols-3 gap-2">
              {videos.map((item, index) => (
                <div key={index} className="relative cursor-pointer" onClick={() => openModal(item)}>
                    <img src={item.thumb} alt={`gallery-video-${index}`} className="rounded-lg aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Video className="text-white w-8 h-8"/>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.type === 'image' ? 'Photo' : 'Video'}</DialogTitle>
          </DialogHeader>
          {selectedMedia?.type === 'image' && <img src={selectedMedia.src} className="w-full h-auto rounded-lg" />}
          {selectedMedia?.type === 'video' && <video src={selectedMedia.src} controls autoPlay className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Links Component ---
export function Links({ items }: { items: Link[] }) {
    return (
        <div className="grid gap-4 w-full max-w-md">
            {items.map((link, index) => (
                <a href={link.href} target="_blank" rel="noopener noreferrer" key={index}>
                    <Card className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg hover:scale-105 hover:bg-white/20 transition-transform duration-200">
                        <CardContent className="p-4 text-center flex items-center justify-center gap-3">
                            {link.icon}
                            <span className="text-lg font-semibold">{link.title}</span>
                        </CardContent>
                    </Card>
                </a>
            ))}
        </div>
    );
}