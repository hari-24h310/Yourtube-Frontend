"use client";

import { useRef, useEffect, useState } from "react";
import { useGestureDetection } from "@/lib/useGestureDetection";
import { useRouter } from "next/router";
import { ChevronRight, ChevronLeft, Play, Pause, X, MessageCircle } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onCommentOpen?: () => void;
  videoIndex?: number;
  totalVideos?: number;
  onNextVideo?: () => void;
}

export default function VideoPlayer({ 
  video, 
  onCommentOpen,
  videoIndex = 0,
  totalVideos = 1,
  onNextVideo 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [gestureIndicator, setGestureIndicator] = useState<{
    type: string;
    position: string;
    visible: boolean;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const videoUrl = `${backendUrl}/${video?.filepath}`;

    // Try HEAD request to confirm backend file exists; fall back to local sample if not.
    const setSrc = async () => {
      try {
        const resp = await fetch(videoUrl, { method: 'HEAD' });
        if (resp.ok) {
          videoRef.current!.src = videoUrl;
        } else {
          console.warn('Backend video not found, falling back to sample', videoUrl, resp.status);
          videoRef.current!.src = '/video/vdo.mp4';
        }
      } catch (err) {
        console.warn('Error checking backend video, using fallback', err);
          videoRef.current!.src = '/video/vdo.mp4';
      }
      // ensure the element acknowledges the new source
      try { videoRef.current!.load(); } catch (e) {}
    };

    setSrc();

    // Update playing state
    const updatePlayingState = () => {
      setIsPlaying(!videoRef.current?.paused);
    };

    videoRef.current.addEventListener('play', updatePlayingState);
    videoRef.current.addEventListener('pause', updatePlayingState);

    return () => {
      videoRef.current?.removeEventListener('play', updatePlayingState);
      videoRef.current?.removeEventListener('pause', updatePlayingState);
    };
  }, [video]);

  const handleGesture = (gesture: {
    type: 'tap' | 'double-tap' | 'triple-tap';
    position: 'left' | 'center' | 'right';
  }) => {
    const video = videoRef.current;
    if (!video) return;

    // Show gesture indicator
    setGestureIndicator({
      type: gesture.type,
      position: gesture.position,
      visible: true,
    });

    setTimeout(() => {
      setGestureIndicator(null);
    }, 800);

    // Handle gestures
    if (gesture.type === 'double-tap') {
      if (gesture.position === 'right') {
        // Double-tap right: +10s
        video.currentTime = Math.min(video.currentTime + 10, isNaN(video.duration) ? video.currentTime + 10 : video.duration);
      } else if (gesture.position === 'left') {
        // Double-tap left: -10s
        video.currentTime = Math.max(video.currentTime - 10, 0);
      }
      video.play().catch(() => {});
    } else if (gesture.type === 'tap' && gesture.position === 'center') {
      // Single tap center: Play/Pause
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    } else if (gesture.type === 'triple-tap') {
      if (gesture.position === 'center') {
        // Triple tap center: Skip to next video
        if (onNextVideo) {
          onNextVideo();
        }
      } else if (gesture.position === 'right') {
        // Triple tap right: Close website
        window.close();
      } else if (gesture.position === 'left') {
        // Triple tap left: Open comment section
        if (onCommentOpen) {
          onCommentOpen();
        }
      }
    }
  };

  useGestureDetection(containerRef, handleGesture, {
    doubleTapDelay: 350,
    tripleTapDelay: 750,
    tapThreshold: 70,
  });

  const getGestureIcon = () => {
    if (!gestureIndicator || !gestureIndicator.visible) return null;

    if (gestureIndicator.type === 'double-tap') {
      if (gestureIndicator.position === 'right') {
        return <ChevronRight size={48} className="text-white" />;
      } else if (gestureIndicator.position === 'left') {
        return <ChevronLeft size={48} className="text-white" />;
      }
    } else if (gestureIndicator.type === 'tap' && gestureIndicator.position === 'center') {
      return isPlaying ? (
        <Pause size={48} className="text-white" />
      ) : (
        <Play size={48} className="text-white" />
      );
    } else if (gestureIndicator.type === 'triple-tap') {
      if (gestureIndicator.position === 'center') {
        return <ChevronRight size={48} className="text-white" />;
      } else if (gestureIndicator.position === 'right') {
        return <X size={48} className="text-white" />;
      } else if (gestureIndicator.position === 'left') {
        return <MessageCircle size={48} className="text-white" />;
      }
    }
    return null;
  };

  const getGestureLabel = () => {
    if (!gestureIndicator || !gestureIndicator.visible) return null;

    if (gestureIndicator.type === 'double-tap') {
      if (gestureIndicator.position === 'right') {
        return '+10 seconds';
      } else if (gestureIndicator.position === 'left') {
        return '-10 seconds';
      }
    } else if (gestureIndicator.type === 'tap' && gestureIndicator.position === 'center') {
      return isPlaying ? 'Paused' : 'Playing';
    } else if (gestureIndicator.type === 'triple-tap') {
      if (gestureIndicator.position === 'center') {
        return 'Next Video';
      } else if (gestureIndicator.position === 'right') {
        return 'Close';
      } else if (gestureIndicator.position === 'left') {
        return 'Comments';
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative group touch-none"
        style={{ touchAction: 'none' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          controlsList="nodownload"
          muted
          autoPlay
          playsInline
          style={{ touchAction: 'none' }}
          poster={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='854' height='480'%3E%3Crect fill='%23222' width='854' height='480'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3E🎬 Video Player%3C/text%3E%3C/svg%3E`}
        >
          Your browser does not support the video tag.
        </video>

        {/* Gesture Indicator Overlay */}
        {gestureIndicator?.visible && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm">
                {getGestureIcon()}
              </div>
              <p className="text-white text-lg font-semibold bg-black/60 px-4 py-2 rounded">
                {getGestureLabel()}
              </p>
            </div>
          </div>
        )}

        {/* Gesture Help Overlay (appears on first interaction) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-b from-black/40 to-transparent">
          <div className="text-center text-white/80 text-sm space-y-2">
            <p className="font-bold">Tap Gestures Available</p>
            <p>👆 Tap center to play/pause</p>
            <p>👉 Double-tap right for +10s</p>
            <p>👈 Double-tap left for -10s</p>
          </div>
        </div>
      </div>

      {/* Gesture Control Legend */}
      <div className="bg-gray-800 rounded-lg p-4 text-white/80 text-sm">
        <p className="font-bold mb-3">📱 Gesture Controls:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">👆</span>
            <span>Tap center: Play/Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👉</span>
            <span>Double-tap right: +10s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👈</span>
            <span>Double-tap left: -10s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👆👆👆</span>
            <span>Triple center: Next</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👉👉👉</span>
            <span>Triple right: Close</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👈👈👈</span>
            <span>Triple left: Comments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
