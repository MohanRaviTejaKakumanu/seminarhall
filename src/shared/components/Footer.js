import React, { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import "./Footer.css";

const Footer = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <footer className={`footer ${isDarkMode ? "dark-mode" : ""}`}>
      <p className="footer-text">&copy; 2026 GradXpert. All rights reserved.</p>
    </footer>
  );
};

export default Footer;

