import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme_mode");
      if (savedTheme) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save theme to localStorage
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme_mode", JSON.stringify(newMode));
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
