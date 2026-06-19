import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import "../frontend/styles/theme.css";
import useTheme from "../frontend/hooks/useTheme";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { ThemeProvider } from "../lib/ThemeContext";
export default function App({ Component, pageProps }: AppProps) {
  const { theme, toggleTheme, loading } = useTheme();

  return (
    <UserProvider>
      <ThemeProvider>
        <div className={`min-h-screen ${theme === "light" ? "bg-white text-black" : "bg-black text-white"}`}>
          <title>Your-Tube Clone</title>
          <Header />
          <Toaster />
          <div className="flex">
            <Sidebar />
            <Component {...pageProps} />
          </div>
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}
