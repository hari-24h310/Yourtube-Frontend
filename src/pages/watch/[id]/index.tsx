import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { sampleVideos } from "@/lib/sampleVideos";
import { notFound } from "next/navigation";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState, useRef } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const getVideoId = (video: any) => {
    if (!video?._id) return "";
    return typeof video._id === "string" ? video._id : video._id.toString();
  };

  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get("/video/getall");
        const rawVideos = res.data?.videos ?? res.data;
        const allVids = Array.isArray(rawVideos) && rawVideos.length > 0 ? rawVideos : sampleVideos;
        setAllVideos(allVids);

        const foundVideo = allVids.find((vid: any) => {
          if (!vid) return false;
          if (getVideoId(vid) === id) return true;
          if (vid.filename && vid.filename === id) return true;
          return false;
        });

        setSelectedVideo(foundVideo ?? null);
        setCurrentVideoIndex(allVids.findIndex((vid: any) => getVideoId(vid) === id));
      } catch (error) {
        console.log(error);
        const allVids = sampleVideos;
        setAllVideos(allVids);

        const foundVideo = allVids.find((vid: any) => getVideoId(vid) === id);
        setSelectedVideo(foundVideo ?? null);
        setCurrentVideoIndex(allVids.findIndex((vid: any) => getVideoId(vid) === id));
      } finally {
        setLoading(false);
      }
    };
    fetchvideo();
  }, [id]);

  const handleCommentOpen = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNextVideo = () => {
    const activeIndex = currentVideoIndex >= 0 ? currentVideoIndex : allVideos.findIndex((vid: any) => getVideoId(vid) === id);
    if (activeIndex >= 0 && activeIndex < allVideos.length - 1) {
      const nextVideo = allVideos[activeIndex + 1];
      router.push(`/watch/${nextVideo._id}`);
    }
  };

  if (loading) {
    return <div>Loading..</div>;
  }

  if (!selectedVideo) {
    return <div>Video not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Videopplayer 
              video={selectedVideo}
              onCommentOpen={handleCommentOpen}
              videoIndex={currentVideoIndex}
              totalVideos={allVideos.length}
              onNextVideo={handleNextVideo}
            />
            <VideoInfo video={selectedVideo} />
            <div ref={commentsRef}>
              <Comments videoId={id as string} />
            </div>
          </div>
          <div className="space-y-4">
            <RelatedVideos videos={allVideos} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
