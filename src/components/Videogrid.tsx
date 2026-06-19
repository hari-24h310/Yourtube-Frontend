import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";
import { sampleVideos } from "@/lib/sampleVideos";

const Videogrid = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");

        console.log("API RESPONSE:", res.data);

        // Accept either { videos: [...] } or a raw array.
        const data = res.data?.videos ?? res.data;

        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        } else {
          // Fallback to sample videos when the backend has no uploaded videos yet.
          setVideos(sampleVideos);
        }

      } catch (error) {
        console.log(error);
        setVideos(sampleVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchvideo();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading ? (
        <>Loading..</>
      ) : videos.length > 0 ? (
        videos.map((video: any) => (
          <Videocard key={video._id} video={video} />
        ))
      ) : (
        <>No videos found</>
      )}
    </div>
  );
};

export default Videogrid;