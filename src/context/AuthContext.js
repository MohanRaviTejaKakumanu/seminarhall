import React, { createContext, useState, useEffect } from "react";

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    // restore session if present
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

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
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        resolve(sessionUser);
      }, 300);
    });
  };

  const register = (name, email, password, role = "student") => {
    return new Promise((resolve, reject) => {
      if (!name || !email || !password)
        return reject(new Error("All fields are required"));

      setTimeout(() => {
        const users = readUsers();
        if (users.find((u) => u.email === email)) {
          return reject(new Error("Email already registered"));
        }

        const newUser = { name, email, password, role };
        users.push(newUser);
        writeUsers(users);
        resolve(newUser);
      }, 300);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
