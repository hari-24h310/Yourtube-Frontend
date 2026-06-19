'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

const fetchThemeContext = async () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  try {
    const response = await axios.get(`${base}/api/user/theme`);
    // backend returns { autoTheme: boolean }
    const data = response.data || {};
    return {
      theme: data.autoTheme ? "light" : "dark",
      info: data,
    };
  } catch (error) {
    console.error("Error fetching theme context:", error?.message || error);
    throw error;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [themeInfo, setThemeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTheme = async () => {
    try {
      const data = await fetchThemeContext();
      setTheme(data.theme || 'dark');
      setThemeInfo(data);
    } catch (error) {
      console.error('Error fetching theme:', error);
      setTheme('dark');
      setThemeInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      document.documentElement.classList.toggle('dark', theme !== 'light');
    }
  }, [theme, isLoading]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeInfo, setTheme, refreshTheme, isLoading, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};