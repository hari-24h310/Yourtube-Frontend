import React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const VideoCall = dynamic(() => import('../../components/VideoCall'), { ssr: false });

export default function CallRoom() {
  const router = useRouter();
  const { room } = router.query;
  if (!room || typeof room !== 'string') return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl p-4">Call Room: {room}</h1>
      <VideoCall roomId={room} />
    </div>
  );
}
