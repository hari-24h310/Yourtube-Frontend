import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";

interface VideoPlayerProps {
  src: string;
  videoId: string;
  userId: string;
  userPlan?: { planType: string; watchTimeLimit: number }; // watchTimeLimit in minutes, -1 = unlimited
  onNextVideo?: () => void;
  onOpenComments?: () => void;
  onClose?: () => void;
}

type TapZone = "left" | "center" | "right";
type Feedback = { text: string; zone: TapZone } | null;

  const DOUBLE_TAP_MS = 350;
  const TRIPLE_TAP_EXTRA_MS = 750;

export default function VideoPlayer({
  src, videoId, userId, userPlan,
  onNextVideo, onOpenComments, onClose
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [limitHit, setLimitHit] = useState(false);
  const tapRef = useRef<{
    zone: TapZone;
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
    lastTapAt: number;
  }>({
    zone: "center",
    count: 0,
    timer: null,
    lastTapAt: 0,
  });

  const maxSeconds = userPlan
    ? userPlan.watchTimeLimit === -1
      ? Infinity
      : userPlan.watchTimeLimit * 60
    : 5 * 60; // default free = 5 min

  // Watch time tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setWatchSeconds(Math.floor(video.currentTime));
      if (video.currentTime >= maxSeconds && maxSeconds !== Infinity) {
        video.pause();
        setPlaying(false);
        setLimitHit(true);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [maxSeconds]);

  const showFeedback = useCallback((text: string, zone: TapZone) => {
    setFeedback({ text, zone });
    setTimeout(() => setFeedback(null), 800);
  }, []);

  const readTapZone = (event: React.PointerEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const clientX = "clientX" in event ? event.clientX : event.changedTouches[0]?.clientX;

    if (typeof clientX !== "number") {
      return "center" as TapZone;
    }

    const relativeX = (clientX - rect.left) / rect.width;
    if (relativeX < 0.33) return "left";
    if (relativeX > 0.67) return "right";
    return "center";
  };

  const handleTap = (zone: TapZone) => {
    const ref = tapRef.current;
    const now = Date.now();
    const withinSeries = now - ref.lastTapAt <= 500;

    if (ref.timer) clearTimeout(ref.timer);

    if (!withinSeries || ref.zone !== zone) {
      ref.count = 0;
    }
    ref.zone = zone;
    ref.lastTapAt = now;
    ref.count += 1;

    const count = ref.count;

    ref.timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      if (count === 1 && zone === "center") {
        // Play/pause
        if (video.paused) { video.play(); setPlaying(true); showFeedback("▶", "center"); }
        else { video.pause(); setPlaying(false); showFeedback("⏸", "center"); }

      } else if (count === 2 && zone === "right") {
        // Forward 10s
        video.currentTime = Math.min(video.currentTime + 10, video.duration);
        showFeedback("⏩ +10s", "right");

      } else if (count === 2 && zone === "left") {
        // Rewind 10s
        video.currentTime = Math.max(video.currentTime - 10, 0);
        showFeedback("⏪ -10s", "left");

      } else if (count === 3 && zone === "center") {
        // Next video
        showFeedback("⏭ Next", "center");
        onNextVideo?.();

      } else if (count === 3 && zone === "right") {
        // Close
        showFeedback("✕ Closing", "right");
        setTimeout(() => onClose?.(), 400);

      } else if (count === 3 && zone === "left") {
        // Open comments
        showFeedback("💬 Comments", "left");
        onOpenComments?.();
      }

      ref.count = 0;
      ref.timer = null;
    }, count >= 3 ? 0 : DOUBLE_TAP_MS);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ position: "relative", width: "100%", background: "#000", borderRadius: "12px", overflow: "hidden" }}>
      <video
        ref={videoRef}
        src={src}
        style={{ width: "100%", display: "block", maxHeight: "500px" }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Tap zones overlay */}
      <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: limitHit ? "none" : "auto" }}>
        {(["left", "center", "right"] as TapZone[]).map((zone) => (
          <div
            key={zone}
            onPointerUp={() => handleTap(zone)}
            onTouchEnd={() => handleTap(zone)}
            style={{ flex: 1, height: "100%", cursor: "pointer" }}
          />
        ))}
      </div>

      {/* Visual feedback bubble */}
      {feedback && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: feedback.zone === "left" ? "15%" : feedback.zone === "right" ? "75%" : "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "50px",
          fontSize: "18px",
          fontWeight: 700,
          pointerEvents: "none",
          animation: "fadeUp 0.8s ease forwards",
          whiteSpace: "nowrap"
        }}>
          {feedback.text}
        </div>
      )}

      {/* Watch time limit overlay */}
      {limitHit && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          color: "#fff", textAlign: "center", padding: "24px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>⏱</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Watch time limit reached
          </h2>
          <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "24px" }}>
            Your {userPlan?.planType || "free"} plan allows{" "}
            {maxSeconds === Infinity ? "unlimited" : `${maxSeconds / 60} minutes`} per video.
          </p>
          <a
            href="/plans"
            style={{
              padding: "12px 28px", background: "#ff0000", color: "#fff",
              borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "15px"
            }}
          >
            Upgrade Plan →
          </a>
        </div>
      )}

      {/* Gesture hint (bottom-left) */}
      <div style={{
        position: "absolute", bottom: "12px", left: "12px",
        background: "rgba(0,0,0,0.6)", color: "#fff",
        fontSize: "11px", padding: "6px 10px", borderRadius: "8px",
        pointerEvents: "none", lineHeight: 1.8
      }}>
        ← 2× rewind &nbsp;|&nbsp; 1× play/pause &nbsp;|&nbsp; 2× forward →<br />
        3×← comments &nbsp;|&nbsp; 3× next &nbsp;|&nbsp; 3×→ close
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -80%); }
        }
      `}</style>
    </div>
  );
}
