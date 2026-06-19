import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

interface PeerInfo {
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

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export const useWebRTC = ({
  roomId,
  userId,
  username,
  serverUrl = 'http://localhost:5000',
}: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const joinedRef = useRef(false);

  const addOrUpdatePeer = useCallback((peer: PeerInfo) => {
    setPeers((prev) => {
      const existing = prev.find((item) => item.socketId === peer.socketId);
      if (existing) {
        return prev.map((item) =>
          item.socketId === peer.socketId ? { ...item, ...peer } : item
        );
      }
      return [...prev, peer];
    });
  }, []);

  const removePeer = useCallback((socketId: string) => {
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }
    setPeers((prev) => prev.filter((peer) => peer.socketId !== socketId));
  }, []);

  const createPeerConnection = useCallback(
    (socketId: string, stream: MediaStream) => {
      if (peerConnections.current.has(socketId)) {
        return peerConnections.current.get(socketId)!;
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (!remoteStream) return;
        setPeers((prev) =>
          prev.map((peer) =>
            peer.socketId === socketId ? { ...peer, stream: remoteStream } : peer
          )
        );
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('ice-candidate', {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Peer ${socketId} connection state:`, pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          removePeer(socketId);
        }
      };

      peerConnections.current.set(socketId, pc);
      return pc;
    },
    [removePeer]
  );

  const joinRoom = useCallback(async () => {
    if (!roomId || !userId || !username || joinedRef.current) return;

    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (joinedRef.current && localStreamRef.current) {
        socket.emit('join-room', { roomId, userId, username });
      }
    });

    socket.on('existing-participants', async (participants: PeerInfo[]) => {
      if (!localStreamRef.current) return;
      for (const participant of participants) {
        addOrUpdatePeer(participant);
        const pc = createPeerConnection(participant.socketId, localStreamRef.current);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: participant.socketId, offer });
      }
    });

    socket.on('user-joined', (participant: PeerInfo) => {
      addOrUpdatePeer(participant);
      if (localStreamRef.current) {
        createPeerConnection(participant.socketId, localStreamRef.current);
      }
    });

    socket.on('offer', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!localStreamRef.current) return;
      const pc = createPeerConnection(from, localStreamRef.current);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: from, answer });
    });

    socket.on('answer', async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current.get(from);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('user-left', ({ socketId }: { socketId: string }) => {
      removePeer(socketId);
    });

    socket.on('call-ended', ({ socketId }: { socketId: string }) => {
      removePeer(socketId);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connect error:', error);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('Socket reconnect attempt', attempt);
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      joinedRef.current = true;
      socket.emit('join-room', { roomId, userId, username });
    } catch (error) {
      console.error('Unable to access camera or microphone:', error);
    }
  }, [addOrUpdatePeer, createPeerConnection, removePeer, roomId, serverUrl, userId, username]);

  useEffect(() => {
    if (!roomId || !userId || !username) return;
    void joinRoom();

    return () => {
      socketRef.current?.emit('leave-room', { roomId });
      socketRef.current?.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [joinRoom, roomId, userId, username]);

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return;
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) return;
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current.addTrack(screenTrack);
      setLocalStream(localStreamRef.current);
      setIsScreenSharing(true);

      screenTrack.onended = async () => {
        if (!localStreamRef.current) return;
        const cameraStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
        localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
        localStreamRef.current = cameraStream;
        setLocalStream(cameraStream);
        setIsScreenSharing(false);
      };
    } catch (error) {
      console.error('Screen share failed:', error);
    }
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((state) => !state);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((state) => !state);
  };

  const startRecording = () => {
    if (!localStreamRef.current) return;

    const recordingStream = new MediaStream();
    localStreamRef.current.getTracks().forEach((track) => recordingStream.addTrack(track));

    peers.forEach((peer) => {
      peer.stream?.getTracks().forEach((track) => recordingStream.addTrack(track));
    });

    recorderRef.current = new MediaRecorder(recordingStream, { mimeType: 'video/webm;codecs=vp9,opus' });
    recordedChunksRef.current = [];

    recorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    recorderRef.current.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    setIsRecording(false);
  };

  const endCall = () => {
    socketRef.current?.emit('call-ended', { roomId });
    socketRef.current?.emit('leave-room', { roomId });
    socketRef.current?.disconnect();
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setPeers([]);
    setIsScreenSharing(false);
    setIsRecording(false);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  return {
    localStream,
    peers,
    isScreenSharing,
    isRecording,
    isMuted,
    isCameraOff,
    toggleScreenShare,
    startRecording,
    stopRecording,
    toggleMute,
    toggleCamera,
    endCall,
  };
};
