import { useEffect, useState } from "react";

/**
 * Theme logic:
 *  - If time is 10:00 AM–12:00 PM IST AND user is from South India → light theme
 *  - All other cases → dark theme
 */

const SOUTH_INDIA_REGIONS = [
  "tamil nadu", "karnataka", "kerala", "andhra pradesh",
  "telangana", "puducherry", "tn", "ka", "kl", "ap", "tg"
];

const getISTHour = (): number => {
  const now = new Date();
  // IST = UTC + 5:30
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600000;
  return new Date(istMs).getHours();
};

const isSouthIndia = (region: string): boolean => {
  const r = region.toLowerCase();
  return SOUTH_INDIA_REGIONS.some((s) => r.includes(s));
};

export type Theme = "light" | "dark";

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const applyTheme = async () => {
      const hour = getISTHour();
      const inMorningWindow = hour >= 10 && hour < 12;

      if (!inMorningWindow) {
        setTheme("dark");
        return;
      }

      // Detect region
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const region = data.region || data.country_name || "";
        setTheme(isSouthIndia(region) ? "light" : "dark");
      } catch {
        setTheme("dark"); // Default to dark on error
      }
    };

    applyTheme();

    // Re-check every minute (in case app stays open across the 10am boundary)
    const interval = setInterval(applyTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "light" ? "#ffffff" : "#0f0f0f";
    document.body.style.color = theme === "light" ? "#0f0f0f" : "#f1f1f1";
  }, [theme]);

  return theme;
}

// Add to your globals.css:
// [data-theme="light"] { --bg: #fff; --text: #0f0f0f; --surface: #f9f9f9; --border: #e0e0e0; }
// [data-theme="dark"]  { --bg: #0f0f0f; --text: #f1f1f1; --surface: #1a1a1a; --border: #333; }
