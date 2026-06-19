"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";

export default function VideoCard({ video }: any) {
  const createdAtRaw = video?.createdAt;
  let timeAgo = "just now";
  try {
    const createdDate = createdAtRaw ? new Date(createdAtRaw) : null;
    if (createdDate && !isNaN(createdDate.getTime())) {
      timeAgo = formatDistanceToNow(createdDate);
    }
  } catch (err) {
    // keep fallback
  }

  const watchId = video?._id || video?.filename || "";

  return (
    <Link href={`/watch/${watchId}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
          {/* Video Thumbnail Placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm text-gray-600">{video?.videochanel}</p>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            10:24
          </div>
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel?.[0] || "V"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{video?.videochanel}</p>
            <p className="text-sm text-gray-600">
              {video?.views?.toLocaleString?.() || 0} views •{" "}
              {timeAgo} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
