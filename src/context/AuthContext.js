import React, { createContext, useState } from "react";

export const AuthContext = createContext();

const USERS_KEY = "sh_users";
const SESSION_KEY = "sh_session";

const readUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const writeUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }) => {
  // initialize synchronously from localStorage so route guards don't
  // redirect before we restore the session on page refresh
  const [user, setUser] = useState(() => {
    try {
      // Use sessionStorage for ephemeral session state: persists across reloads
      // but is cleared when the browser/tab is closed. This matches the
      // requirement: reload keeps you logged in, fresh browser start goes to login.
      const raw = sessionStorage.getItem(SESSION_KEY);
      const token = sessionStorage.getItem("token");
      if (raw && token) {
        return JSON.parse(raw);
      }
      // If a leftover token exists in localStorage (from older runs), remove it
      // so that stale tokens don't keep the app logged in across fresh starts.
      try {
        if (!token && localStorage.getItem("token")) {
          localStorage.removeItem("token");
        }
        if (!raw && localStorage.getItem(SESSION_KEY)) {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        // ignore storage errors
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  // login checks registered users
  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      if (!email || !password)
        return reject(new Error("Email and password are required"));

      setTimeout(() => {
        const users = readUsers();
        const found = users.find(
          (u) => u.email === email && u.password === password,
        );
        if (!found) return reject(new Error("Invalid email or password"));

        const sessionUser = {
          role: found.role,
          email: found.email,
          name: found.name,
        };
        setUser(sessionUser);
        // Persist session in sessionStorage so it survives reloads but not fresh
        // browser starts (closing the tab/browser clears sessionStorage).
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
          const fakeToken = `token_${Date.now()}`;
          sessionStorage.setItem("token", fakeToken);
        } catch (e) {
          // ignore storage errors
        }
        resolve(sessionUser);
      }, 300);
    });
  };

  const register = (name, email, password, phone, role = "student") => {
    return new Promise((resolve, reject) => {
      if (!name || !email || !password || !phone)
        return reject(new Error("All fields are required"));

      setTimeout(() => {
        const users = readUsers();
        if (users.find((u) => u.email === email)) {
          return reject(new Error("Email already registered"));
        }

        const newUser = { name, email, password, phone, role };
        users.push(newUser);
        writeUsers(users);
        resolve(newUser);
      }, 300);
    });
  };

  const logout = () => {
    setUser(null);
    // clear session and any auth token stored for API requests
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem("token");
    } catch (e) {
      // ignore if storage unavailable
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};