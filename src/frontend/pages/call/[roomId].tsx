import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";

export default function CallRoom() {
  const router = useRouter();
  const { roomId } = router.query as { roomId: string };
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Get user from localStorage
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  };
  const user = getUser();

  const {
    localStream, peers,
    isScreenSharing, isRecording, isMuted, isCameraOff,
    toggleScreenShare, startRecording, stopRecording,
    toggleMute, toggleCamera, endCall,
  } = useWebRTC({
    roomId: roomId || "default",
    userId: user._id || "anon",
    username: user.username || "Guest",
  });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleEnd = () => {
    endCall();
    router.push("/");
  };

  if (!roomId) return <div style={{ padding: "40px", color: "#fff", background: "#000", minHeight: "100vh" }}>Loading room...</div>;

  const allParticipants = [
    { socketId: "local", username: user.username || "You", stream: localStream, isLocal: true },
    ...peers.map((p) => ({ ...p, isLocal: false })),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px", background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ color: "#fff", fontWeight: 600 }}>
          📞 Room: <span style={{ color: "#6c63ff" }}>{roomId}</span>
        </div>
        <div style={{ fontSize: "13px", color: "#aaa" }}>
          {allParticipants.length} participant{allParticipants.length !== 1 ? "s" : ""}
          {isRecording && <span style={{ color: "#ff4444", marginLeft: "12px" }}>● Recording</span>}
        </div>
      </div>

      {/* Video grid */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: allParticipants.length === 1 ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "12px", padding: "16px"
      }}>
        {allParticipants.map(({ socketId, username, stream, isLocal }) => (
          <VideoTile key={socketId} stream={stream} username={username} isLocal={!!isLocal} isCameraOff={isCameraOff && !!isLocal} />
        ))}
      </div>

      {/* Controls bar */}
      <div style={{
        padding: "16px 20px", background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap"
      }}>
        <ControlBtn
          onClick={toggleMute}
          active={!isMuted}
          icon={isMuted ? "🔇" : "🎙"}
          label={isMuted ? "Unmute" : "Mute"}
        />
        <ControlBtn
          onClick={toggleCamera}
          active={!isCameraOff}
          icon={isCameraOff ? "📷" : "📹"}
          label={isCameraOff ? "Cam on" : "Cam off"}
        />
        <ControlBtn
          onClick={toggleScreenShare}
          active={isScreenSharing}
          icon="🖥"
          label={isScreenSharing ? "Stop share" : "Share screen"}
          accent={isScreenSharing ? "#6c63ff" : undefined}
        />
        <ControlBtn
          onClick={isRecording ? stopRecording : startRecording}
          active={isRecording}
          icon={isRecording ? "⏹" : "⏺"}
          label={isRecording ? "Stop rec" : "Record"}
          accent={isRecording ? "#ff4444" : undefined}
        />
        <ControlBtn
          onClick={handleEnd}
          icon="📵"
          label="End call"
          accent="#ff4444"
          danger
        />
      </div>
    </div>
  );
}

function VideoTile({ stream, username, isLocal, isCameraOff }: {
  stream: MediaStream | null | undefined;
  username: string;
  isLocal: boolean;
  isCameraOff?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      position: "relative", background: "#111",
      borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9",
      border: isLocal ? "2px solid #6c63ff" : "1px solid #333"
    }}>
      {isCameraOff || !stream ? (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#1a1a2e", color: "#fff", fontSize: "48px"
        }}>
          👤
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div style={{
        position: "absolute", bottom: "8px", left: "10px",
        background: "rgba(0,0,0,0.6)", color: "#fff",
        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600
      }}>
        {username} {isLocal && "(You)"}
      </div>
    </div>
  );
}

function ControlBtn({ onClick, icon, label, active = true, accent, danger }: {
  onClick: () => void; icon: string; label: string;
  active?: boolean; accent?: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
        background: danger ? "#ff4444" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${accent || (active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)")}`,
        borderRadius: "12px", padding: "12px 16px", cursor: "pointer",
        color: "#fff", fontSize: "20px", minWidth: "70px"
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: "11px", fontWeight: 500 }}>{label}</span>
    </button>
  );
}
