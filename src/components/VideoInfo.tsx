import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "success" | "limit-reached" | "error">("idle");
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    // Set current user ID (either authenticated or guest)
    const userId = user?._id;
    if (userId) {
      setCurrentUserId(userId);
    } else {
      // Create a persistent guest ID for this session
      let guestId = sessionStorage.getItem("guestUserId");
      if (!guestId) {
        guestId = "guest-" + Math.random().toString(36).substring(7);
        sessionStorage.setItem("guestUserId", guestId);
      }
      setCurrentUserId(guestId);
    }
  }, [user]);

  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    // Check user's current voting status for this video
    checkUserVoteStatus();
  }, [video, currentUserId]);

  // Function to check if user has already liked or disliked this video
  const checkUserVoteStatus = async () => {
    if (!currentUserId) return;
    
    try {
      // Fetch user's vote status for this video
      const res = await axiosInstance.get(`/like/status/${video._id}/${currentUserId}`);
      if (res.data) {
        setIsLiked(res.data.isLiked || false);
        setIsDisliked(res.data.isDisliked || false);
      }
    } catch (error) {
      // If endpoint doesn't exist, that's okay - user just hasn't voted
      console.log("Could not fetch vote status:", error);
      setIsLiked(false);
      setIsDisliked(false);
    }
  };

  useEffect(() => {
    const handleviews = async () => {
      try {
        if (user) {
          await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } else {
          await axiosInstance.post(`/history/views/${video?._id}`);
        }
      } catch (error) {
        console.log("View tracking error (non-critical):", error);
      }
    };
    if (video?._id) {
      handleviews();
    }
  }, [video?._id, user]);
  // Safe time handling for createdAt
  const createdAtRaw = video?.createdAt;
  let timeAgo = "just now";
  try {
    const createdDate = createdAtRaw ? new Date(createdAtRaw) : null;
    if (createdDate && !isNaN(createdDate.getTime())) {
      timeAgo = formatDistanceToNow(createdDate);
    }
  } catch (err) {
    // fallback to 'just now'
  }
  const handleLike = async () => {
    if (!currentUserId) return;

    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: currentUserId,
      });
      
      if (res.data.liked !== undefined) {
        if (res.data.liked) {
          // Like was added
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          // If was disliked, remove dislike
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        } else {
          // Like was removed (toggled off)
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        }
      }
    } catch (error) {
      console.log("Like error:", error);
    }
  };
  const handleWatchLater = async () => {
    if (!currentUserId) return;
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: currentUserId,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      alert("Please sign in to subscribe");
      return;
    }
    // TODO: Implement subscribe functionality
    alert("Subscribe functionality coming soon!");
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const title = video.videotitle;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        url: shareUrl,
      }).catch((err) => console.log("Share error:", err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Video link copied to clipboard!");
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert("Please sign in to download videos");
      return;
    }

    setDownloadStatus("downloading");
    setDownloadMessage("Downloading...");

    try {
      const res = await axiosInstance.post(`/download/video`, {
        userId: user._id,
        videoId: video._id,
      });

      setDownloadStatus("success");
      setDownloadMessage(`Downloaded! ${res.data.remaining >= 0 ? res.data.remaining + " downloads remaining today" : "Unlimited downloads available"}.`);
      
      // Trigger actual file download using videoUrl from API response
      const link = document.createElement("a");
      link.href = res.data.videoUrl;
      link.download = `${video.videotitle || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloadStatus("idle");
        setDownloadMessage("");
      }, 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Download failed";
      setDownloadStatus(errorMsg.includes("limit") ? "limit-reached" : "error");
      setDownloadMessage(errorMsg);

      setTimeout(() => {
        setDownloadStatus("idle");
        setDownloadMessage("");
      }, 5000);
    }
  };
  const handleDislike = async () => {
    if (!currentUserId) return;

    try {
      const res = await axiosInstance.post(`/like/dislike/${video._id}`, {
        userId: currentUserId,
      });

      if (res.data.disliked !== undefined) {
        if (res.data.disliked) {
          // Dislike was added
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          // If was liked, remove like
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        } else {
          // Dislike was removed (toggled off)
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        }
      }
    } catch (error) {
      console.log("Dislike error:", error);
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{video.videochanel}</h3>
            <p className="text-sm text-gray-600">1.2M subscribers</p>
          </div>
          <Button className="ml-4" onClick={handleSubscribe}>Subscribe</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-black text-black" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-black text-black" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 rounded-full ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 rounded-full"
            onClick={handleShare}
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 rounded-full ${
              downloadStatus === "downloading" ? "opacity-50" : ""
            }`}
            onClick={handleDownload}
            disabled={downloadStatus === "downloading"}
          >
            <Download className="w-5 h-5 mr-2" />
            {downloadStatus === "downloading" ? "Downloading..." : "Download"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{(video?.views || 0).toLocaleString()} views</span>
          <span>{timeAgo} ago</span>
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>

      {downloadMessage && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            downloadStatus === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : downloadStatus === "limit-reached"
              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {downloadMessage}
        </div>
      )}
    </div>
  );
};

export default VideoInfo;
