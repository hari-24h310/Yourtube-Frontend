import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import "../frontend/styles/theme.css";
import { useTheme } from "../lib/ThemeContext";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { ThemeProvider } from "../lib/ThemeContext";

// Wrapper component to use the hook INSIDE the provider
function AppContent({ Component, pageProps }: AppProps) {
  const { theme, isLoading } = useTheme();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${theme === "light" ? "bg-white text-black" : "bg-black text-white"}`}>
      <title>Your-Tube Clone</title>
      <Header />
      <Toaster />
      <div className="flex">
        <Sidebar />
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        <AppContent {...props} />
      </ThemeProvider>
    </UserProvider>
  );
}