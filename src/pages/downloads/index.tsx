"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadItem {
  _id: string;
  videotitle: string;
  videochanel: string;
  filepath: string;
  filesize: string;
  downloadedAt: string;
}

export default function DownloadsPage() {
  const { user } = useUser();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = user?._id;
    if (!userId) return;

    const fetchDownloads = async () => {
      try {
        const [histRes, statusRes] = await Promise.all([
          axiosInstance.get(`/download/history/${userId}`),
          axiosInstance.get(`/download/status/${userId}`),
        ]);
        setDownloads(histRes.data || []);
        // statusRes.data may be useful for UI updates if needed
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load downloads");
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [user]);

  const handleDelete = async (downloadId: string) => {
    if (!confirm("Remove this download?")) return;

    try {
      await axiosInstance.delete(`/download/${downloadId}`, {
        data: { userId: user?._id },
      });
      setDownloads(downloads.filter((d) => d._id !== downloadId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view downloads.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading downloads...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (downloads.length === 0) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          No Downloads Yet
        </h2>
        <p className="text-gray-600">
          Videos you download will appear here for offline viewing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-6">My Downloads</h1>

      <div className="grid gap-4">
        {downloads.map((download) => (
          <div
            key={download._id}
            className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition"
          >
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_auto] gap-4 items-start">
              <div className="w-full aspect-video bg-black rounded overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  controls
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/${download.filepath}`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {download.videotitle}
                </h3>
                <p className="text-sm text-gray-600">{download.videochanel}</p>
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  <span>Size: {download.filesize}</span>
                  <span>
                    Downloaded: {" "}
                    {new Date(download.downloadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleDelete(download._id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
