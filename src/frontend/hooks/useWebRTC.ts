import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Peer {
  socketId: string;
  userId: string;
  username: string;
  stream?: MediaStream;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  username: string;
  serverUrl?: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({ roomId, userId, username, serverUrl = "http://localhost:5000" }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Setup local media
  const startLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // Create peer connection for a remote peer
  const createPeerConnection = useCallback((socketId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === socketId ? { ...p, stream: event.streams[0] } : p
        )
      );
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", { to: socketId, candidate: event.candidate });
      }
    };

    peerConnections.current.set(socketId, pc);
    return pc;
  }, []);

  useEffect(() => {
    const socket = io(serverUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    const init = async () => {
      const stream = await startLocalStream();

      socket.emit("join-room", { roomId, userId, username });

      // New participant joined → we initiate the offer
      socket.on("user-joined", async ({ socketId, userId: uid, username: uname }) => {
        setPeers((prev) => [...prev, { socketId, userId: uid, username: uname }]);
        const pc = createPeerConnection(socketId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: socketId, offer });
      });

      // Receive list of existing participants
      socket.on("existing-participants", async (participants: Peer[]) => {
        setPeers(participants);
      });

      // Receive offer → answer
      socket.on("offer", async ({ from, offer }) => {
        const pc = createPeerConnection(from, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: from, answer });
      });

      // Receive answer
      socket.on("answer", async ({ from, answer }) => {
        const pc = peerConnections.current.get(from);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      // Receive ICE candidate
      socket.on("ice-candidate", async ({ from, candidate }) => {
        const pc = peerConnections.current.get(from);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      // Peer left
      socket.on("user-left", ({ socketId }) => {
        peerConnections.current.get(socketId)?.close();
        peerConnections.current.delete(socketId);
        setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      });
    };

    init().catch(console.error);

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnections.current.forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, [roomId, userId, username, serverUrl]);

  // Screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Restore camera
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = camStream.getVideoTracks()[0];
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(videoTrack);
      });
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      setLocalStream(camStream);
      localStreamRef.current = camStream;
      setIsScreenSharing(false);
      socketRef.current?.emit("screen-share-stop", { roomId });
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => toggleScreenShare();
      setIsScreenSharing(true);
      socketRef.current?.emit("screen-share-start", { roomId });
    }
  };

  // Recording
  const startRecording = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    recordedChunks.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current!.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    setIsRecording(false);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((c) => !c);
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnections.current.forEach((pc) => pc.close());
    socketRef.current?.emit("leave-room", { roomId });
    socketRef.current?.disconnect();
  };

  return {
    localStream, peers,
    isScreenSharing, isRecording, isMuted, isCameraOff,
    toggleScreenShare, startRecording, stopRecording,
    toggleMute, toggleCamera, endCall,
  };
}
