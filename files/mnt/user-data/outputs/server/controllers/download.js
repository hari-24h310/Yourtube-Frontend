import DownloadLog from "../Modals/DownloadLog.js";
import UserPlan from "../Modals/UserPlan.js";
import Video from "../Modals/Video.js"; // adjust path if needed

// POST /download/video
export const downloadVideo = async (req, res) => {
  try {
    const { userId, videoId } = req.body;
    if (!userId || !videoId) {
      return res.status(400).json({ message: "userId and videoId are required." });
    }

    // 1. Get user's plan
    let plan = await UserPlan.findOne({ userId, isActive: true });
    const isPremium = plan && plan.planType !== "free" && plan.expiryDate > new Date();
    const downloadLimit = isPremium ? -1 : 1; // -1 = unlimited

    // 2. For free users — check today's download count
    if (downloadLimit === 1) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayCount = await DownloadLog.countDocuments({
        userId,
        downloadedAt: { $gte: todayStart },
      });

      if (todayCount >= 1) {
        return res.status(403).json({
          message: "Free plan allows 1 download per day. Upgrade to premium for unlimited downloads.",
          requiresUpgrade: true,
        });
      }
    }

    // 3. Get video info
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found." });

    // 4. Log the download
    const log = new DownloadLog({
      userId,
      videoId,
      videoTitle: video.title || "Unknown",
      videoUrl: video.videoUrl || video.url || "",
    });
    await log.save();

    return res.status(200).json({
      message: "Download recorded.",
      videoUrl: video.videoUrl || video.url,
      videoTitle: video.title,
      downloadId: log._id,
    });
  } catch (err) {
    console.error("downloadVideo error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /download/history/:userId
export const getDownloadHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const downloads = await DownloadLog.find({ userId })
      .sort({ downloadedAt: -1 })
      .populate("videoId", "title thumbnail videoUrl")
      .limit(50);

    res.status(200).json(downloads);
  } catch (err) {
    console.error("getDownloadHistory error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /download/status/:userId  — returns today's usage for free users
export const getDownloadStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const plan = await UserPlan.findOne({ userId, isActive: true });
    const isPremium = plan && plan.planType !== "free" && plan.expiryDate > new Date();

    if (isPremium) {
      return res.json({ isPremium: true, downloadsToday: 0, limit: -1 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const count = await DownloadLog.countDocuments({ userId, downloadedAt: { $gte: todayStart } });

    res.json({ isPremium: false, downloadsToday: count, limit: 1 });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};
