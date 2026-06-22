import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function DownloadsPage() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get user from localStorage / your auth context
  const getUserId = () => {
    if (typeof window === "undefined") return null;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user._id || null;
    } catch { return null; }
  };

  const userId = getUserId();

  useEffect(() => {
    if (!userId) { router.push("/login"); return; }

    Promise.all([
      axios.get(`/download/history/${userId}`),
      axios.get(`/download/status/${userId}`),
    ]).then(([histRes, statusRes]) => {
      setDownloads(histRes.data);
      setStatus(statusRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userId]);

 const handleDownload = async (videoId: string, videoUrl: string, title: string) => {
    try {
      const res = await axios.post("/download/video", { userId, videoId });
      if (res.data.videoUrl) {
        const a = document.createElement("a");
        a.href = res.data.videoUrl;
        a.download = title || "video";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // ✅ Fix: build a safe object matching the expected shape
        setDownloads((prev) => [{
          _id: res.data.downloadId,
          videoId: { _id: videoId, title: res.data.videoTitle },
          videoTitle: res.data.videoTitle,
          videoUrl: res.data.videoUrl,
          downloadedAt: new Date().toISOString(),
        }, ...prev]);

        setStatus((s: any) => s ? { ...s, downloadsToday: s.downloadsToday + 1 } : s);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Download failed.";
      if (err.response?.data?.requiresUpgrade) {
        if (confirm(`${msg}\n\nUpgrade now?`)) router.push("/plans");
      } else {
        alert(msg);
      }
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>📥 My Downloads</h1>

      {/* Status bar */}
      {status && (
        <div style={{
          background: status.isPremium ? "#e8f5e9" : "#fff3e0",
          border: `1px solid ${status.isPremium ? "#a5d6a7" : "#ffcc80"}`,
          borderRadius: "10px", padding: "12px 16px", marginBottom: "24px",
          display: "flex", alignItems: "center", gap: "12px"
        }}>
          <span style={{ fontSize: "20px" }}>{status.isPremium ? "⭐" : "📋"}</span>
          <div>
            {status.isPremium ? (
              <p style={{ margin: 0, fontWeight: 600 }}>Premium — Unlimited downloads</p>
            ) : (
              <>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  Free Plan — {status.downloadsToday}/{status.limit} downloads used today
                </p>
                {status.downloadsToday >= status.limit && (
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#e65100" }}>
                    Daily limit reached. <a href="/plans" style={{ color: "#e65100", fontWeight: 600 }}>Upgrade to Premium →</a>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {downloads.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📂</div>
          <p>No downloads yet. Download videos to see them here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {downloads.map((dl: any) => (
            <div key={dl._id} style={{
              display: "flex", alignItems: "center", gap: "14px",
              background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "14px"
            }}>
              {/* Thumbnail */}
              {dl.videoId?.thumbnail ? (
                <img src={dl.videoId.thumbnail} alt="" style={{ width: "100px", height: "56px", objectFit: "cover", borderRadius: "6px" }} />
              ) : (
                <div style={{ width: "100px", height: "56px", background: "#f0f0f0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎬</div>
              )}

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>
                  {dl.videoTitle || dl.videoId?.title || "Unknown Video"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888" }}>
                  Downloaded {new Date(dl.downloadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Re-download button */}
              <button
                onClick={() => handleDownload(dl.videoId?._id, dl.videoUrl, dl.videoTitle)}
                style={{
                  padding: "8px 16px", background: "#065fd4", color: "#fff",
                  border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600
                }}
              >
                ⬇ Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
