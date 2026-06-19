import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

const SIGNALING_SERVER_URL =
  process.env.NEXT_PUBLIC_SIGNALING_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:5000';

type PeerMap = {
  [id: string]: SimplePeer.Instance;
};

interface VideoCallProps {
  roomId: string;
  userId?: string;
  username?: string;
}

export default function VideoCall({ roomId, userId, username }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideosRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);
  const peersRef = useRef<PeerMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const [started, setStarted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const socket = io(SIGNALING_SERVER_URL);
    socketRef.current = socket;

    const startMediaAndJoin = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => {});
        }
        setStarted(true);

        socket.emit('join-room', { roomId, userId, username });
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    socket.on('connect', () => {
      console.log('Connected to signaling server', socket.id);
    });

    socket.on('existing-participants', (participants: { socketId: string }[]) => {
      participants.forEach((participant) => {
        createPeer(participant.socketId, true);
      });
    });

    socket.on('user-joined', ({ socketId }: { socketId: string }) => {
      console.log('User joined:', socketId);
      createPeer(socketId, false);
    });

    socket.on('signal', ({ from, signal }: any) => {
      if (!from || !signal) return;
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      } else {
        createPeer(from, false, signal);
      }
    });

    socket.on('user-left', ({ socketId }: { socketId: string }) => {
      console.log('User left', socketId);
      removePeer(socketId);
    });

    startMediaAndJoin();

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
      Object.keys(peersRef.current).forEach(removePeer);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, username]);

  const createPeer = (socketId: string, initiator = false, incomingSignal?: any) => {
    if (!localStreamRef.current) return;
    if (peersRef.current[socketId]) return;

    const peer = new SimplePeer({ initiator, trickle: true, stream: localStreamRef.current });

    peer.on('signal', (signalData: any) => {
      socketRef.current.emit('signal', {
        recipientSocketId: socketId,
        signal: signalData,
      });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      // add remote video element
      addRemoteStream(socketId, remoteStream);
    });

    peer.on('close', () => {
      removePeer(socketId);
    });

    peer.on('error', (e: any) => {
      console.error('Peer error', e);
    });

    peersRef.current[socketId] = peer;

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }
  };

  const removePeer = (socketId: string) => {
    const peer = peersRef.current[socketId];
    if (peer) {
      try { peer.destroy(); } catch(e){}
      delete peersRef.current[socketId];
    }
    const el = document.getElementById(`remote_${socketId}`);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  const addRemoteStream = (socketId: string, stream: MediaStream) => {
    const container = remoteVideosRef.current;
    if (!container) return;
    let videoEl = document.getElementById(`remote_${socketId}`) as HTMLVideoElement | null;
    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.id = `remote_${socketId}`;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.width = 320;
      videoEl.height = 180;
      container.appendChild(videoEl);
    }
    videoEl.srcObject = stream;
  };

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return;
    try {
      const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      // replace video track in each peer
      const displayTrack = displayStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((peer) => {
        const sender = (peer as any).streams?.[0]?.getVideoTracks && (peer as any).streams[0].getVideoTracks()[0];
        try {
          // simple-peer doesn't expose RTCRtpSender easily; use replaceTrack if available
          const pc: any = (peer as any)._pc;
          if (pc) {
            const senders = pc.getSenders();
            const videoSender = senders.find((s: any) => s.track && s.track.kind === 'video');
            if (videoSender) videoSender.replaceTrack(displayTrack);
          }
        } catch (e) {
          console.warn('Failed to replace track on peer', e);
        }
      });

      // update local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }

      // when user stops sharing, revert to camera
      displayTrack.onended = async () => {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach((peer) => {
          try {
            const pc: any = (peer as any)._pc;
            if (pc) {
              const senders = pc.getSenders();
              const videoSender = senders.find((s: any) => s.track && s.track.kind === 'video');
              if (videoSender) videoSender.replaceTrack(camTrack);
            }
          } catch (e) {}
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
        localStreamRef.current = camStream;
      };
    } catch (err) {
      console.error('Error sharing screen', err);
    }
  };

  const shareYouTubePlayer = async () => {
    // find video element on the page (main player) and capture its stream
    const player: HTMLVideoElement | null = document.querySelector('video');
    if (!player || typeof (player as any).captureStream !== 'function') {
      alert('No video player found or captureStream not supported in this browser');
      return;
    }
    try {
      const stream = (player as any).captureStream();
      const ytTrack = stream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((peer) => {
        try {
          const pc: any = (peer as any)._pc;
          if (pc) {
            const senders = pc.getSenders();
            const videoSender = senders.find((s: any) => s.track && s.track.kind === 'video');
            if (videoSender) videoSender.replaceTrack(ytTrack);
          }
        } catch (e) {}
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (e) {
      console.error('Error sharing YouTube player', e);
    }
  };

  const startRecording = () => {
    // combine local + remote tracks
    const combined = new MediaStream();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => combined.addTrack(t));
    }
    // add remote tracks
    const container = remoteVideosRef.current;
    if (container) {
      const vids = container.querySelectorAll('video');
      vids.forEach((v) => {
        const s = (v as HTMLVideoElement).srcObject as MediaStream;
        if (s) s.getTracks().forEach((t) => combined.addTrack(t));
      });
    }

    try {
      const mr = new MediaRecorder(combined, { mimeType: 'video/webm;codecs=vp9,opus' });
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `call-recording-${roomId}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
      };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) {
      console.error('Recording failed', e);
      alert('Recording not supported in this browser');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const leaveCall = () => {
    socketRef.current.emit('leave-room', roomId);
    socketRef.current.disconnect();
    Object.keys(peersRef.current).forEach(removePeer);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setStarted(false);
  };

  // No invite UI - voicemail features only

  return (
    <div className="p-4">
      <div className="flex gap-4">
        <div>
          <div>Local</div>
          <video ref={localVideoRef} autoPlay playsInline muted width={320} height={180} />
        </div>
        <div>
          <div>Remote</div>
          <div ref={remoteVideosRef} />
        </div>
      </div>
        <div className="mt-4 flex gap-2">
        <button onClick={toggleScreenShare} className="btn">Share Screen</button>
        <button onClick={shareYouTubePlayer} className="btn">Share YouTube</button>
        {!recording ? (
          <button onClick={startRecording} className="btn">Start Recording</button>
        ) : (
          <button onClick={stopRecording} className="btn">Stop Recording</button>
        )}
        <button onClick={leaveCall} className="btn-danger">Leave</button>
      </div>
      
    </div>
  );
}
