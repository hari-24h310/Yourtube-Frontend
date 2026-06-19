import { useEffect, useState } from "react";

export default function useTheme() {
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchTheme = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/user/theme");
        const data = await res.json();
        const t = data?.autoTheme ? "light" : "dark";
        if (mounted) {
          setTheme(t);
          document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
        }
      } catch (e) {
        if (mounted) setTheme("dark");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = (newTheme) => {
    const t = newTheme || (theme === "light" ? "dark" : "light");
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
    try {
      localStorage.setItem("pref-theme", t);
    } catch (e) {}
  };

  return { theme, toggleTheme, loading };
}
