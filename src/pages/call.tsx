import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useWebRTC } from '@/lib/useWebRTC';
import { useUser } from '@/lib/AuthContext';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CallPage() {
  const router = useRouter();
  const { friendId } = router.query;
  const { user } = useUser();

  const [friendInfo, setFriendInfo] = useState<any>(null);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const roomId =
    typeof friendId === 'string' && user?.id
      ? [user.id, friendId].sort().join('-')
      : null;

  const {
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
  } = useWebRTC({
    roomId: roomId || '',
    userId: user?.id || '',
    username: user?.displayName || user?.name || 'You',
    serverUrl:
      process.env.NEXT_PUBLIC_SIGNALING_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:5000',
  });

  useEffect(() => {
    if (friendId && typeof friendId === 'string') {
      const fetchFriendInfo = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/getuser/${friendId}`
          );
          setFriendInfo(response.data);
        } catch (err) {
          console.error('Error fetching friend info:', err);
        }
      };
      fetchFriendInfo();
    }
  }, [friendId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleStartCall = () => {
    if (!roomId || !user?.id) {
      setError('Unable to start the call. Please sign in and select a friend.');
      return;
    }
    setCallActive(true);
    setError('');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleEndCall = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    endCall();
    setCallActive(false);
    setCallDuration(0);

    if (user?.id && typeof friendId === 'string') {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/call-history`,
          {
            callerId: user.id,
            receiverId: friendId,
            callType: isScreenSharing ? 'screen-share' : 'video',
            duration: callDuration,
            status: 'completed',
          }
        );
      } catch (err) {
        console.error('Error saving call history:', err);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!friendId || typeof friendId !== 'string') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Loading call...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <div className="text-sm text-gray-400">Room ID</div>
            <div className="mt-1 inline-flex items-center rounded-full bg-gray-800 px-3 py-2 text-sm text-white ring-1 ring-white/10">
              {roomId}
            </div>
          </div>
          <div className="text-lg font-semibold">Calling {friendInfo?.displayName || friendInfo?.name || 'Friend'}</div>
          {callActive && (
            <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        <div className="relative rounded-lg overflow-hidden bg-gray-800 min-h-[400px] mb-6">
          {callActive && peers.length > 0 ? (
            <div className="w-full h-full">
              <RemoteVideoTile peer={peers[0]} />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center px-6 py-8 text-center text-gray-400">
              <div className="text-2xl font-semibold mb-3">
                {callActive ? 'Waiting for your friend to join' : 'Ready to start your video call'}
              </div>
              <div className="text-sm max-w-xl">
                {callActive
                  ? 'Once they join, their camera will appear here as the main screen.'
                  : 'Press Start Call to join the room and connect with your friend.'}
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 w-44 h-28 rounded-xl overflow-hidden border border-white/10 bg-black shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-white">
              You
            </div>
          </div>

          <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            {friendInfo?.displayName || 'Friend'}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-wrap justify-center gap-4">
            {!callActive ? (
              <>
                <Button
                  onClick={handleStartCall}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Phone size={20} />
                  Start Call
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/friends')}
                  className="text-white"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant={!isMuted ? 'default' : 'destructive'}
                  className="flex items-center gap-2"
                >
                  {!isMuted ? <Mic size={20} /> : <MicOff size={20} />}
                  {!isMuted ? 'Mute' : 'Unmute'}
                </Button>

                <Button
                  onClick={toggleCamera}
                  variant={!isCameraOff ? 'default' : 'destructive'}
                  className="flex items-center gap-2"
                >
                  {!isCameraOff ? <Video size={20} /> : <VideoOff size={20} />}
                  {!isCameraOff ? 'Camera On' : 'Camera Off'}
                </Button>

                <Button
                  onClick={toggleScreenShare}
                  variant={isScreenSharing ? 'destructive' : 'default'}
                  className="flex items-center gap-2"
                >
                  <Share2 size={20} />
                  {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                </Button>

                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? 'destructive' : 'default'}
                  className="flex items-center gap-2"
                >
                  <Square size={20} />
                  {isRecording ? 'Stop Recording' : 'Record Call'}
                </Button>

                <Button
                  onClick={handleEndCall}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <PhoneOff size={20} />
                  End Call
                </Button>
              </>
            )}
          </div>

          {isRecording && (
            <div className="mt-4 text-center text-red-300">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/20 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Recording in progress
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
          <p className="mb-2 font-bold">📱 Call Features:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Join room and display room ID</li>
            <li>2-user responsive grid with local corner preview</li>
            <li>Mute/unmute, camera toggle, screen share, hang up</li>
            <li>Socket.io join/leave, WebRTC offer/answer, reconnect</li>
            <li>Record call and log history to backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RemoteVideoTile({ peer }: { peer: any }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden border border-gray-700 h-[360px]">
      {peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
          Waiting for video…
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-sm text-white">
        {peer.username || 'Participant'}
      </div>
    </div>
  );
}
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="bg-black rounded-lg overflow-hidden border border-gray-700">
      {peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-72 object-cover"
        />
      ) : (
        <div className="w-full h-72 flex items-center justify-center bg-gray-900 text-gray-400">
          Waiting for video…
        </div>
      )}
      <div className="p-3 text-sm text-gray-300 border-t border-gray-800">
        {peer.username || 'Participant'}
      </div>
    </div>
  );
}
