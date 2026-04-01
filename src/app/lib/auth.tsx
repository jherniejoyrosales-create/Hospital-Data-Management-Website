import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuditLog } from './types';
import { mockUsers, mockAuditLogs } from './mockData';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  logAction: (action: string, resource: string, details: string) => void;
  auditLogs: AuditLog[];
  updateUserProfile: (name: string, email: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  userPasswords: { [key: string]: string };
  setUserPasswords: (passwords: { [key: string]: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [userPasswords, setUserPasswords] = useState<{ [key: string]: string }>({
    'admin': 'qwerty12345',
    'doctor': 'doctor123',
    'staff': 'staff123'
  });

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('hospitalUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Validate credentials
    const foundUser = mockUsers.find((u) => u.username === username);
    
    if (foundUser) {
      // Validate password
      if (password !== userPasswords[username]) {
        return false;
      }
      
      // Check if user has saved profile updates
      const savedProfiles = JSON.parse(localStorage.getItem('hospitalUserProfiles') || '{}');
      const userWithUpdates = savedProfiles[username] 
        ? { ...foundUser, ...savedProfiles[username] }
        : foundUser;
      
      setUser(userWithUpdates);
      localStorage.setItem('hospitalUser', JSON.stringify(userWithUpdates));
      
      // Log the login action
      const newLog: AuditLog = {
        id: Date.now().toString(),
        userId: foundUser.id,
        userName: userWithUpdates.name,
        action: 'LOGIN',
        resource: 'System',
        timestamp: new Date().toISOString(),
        details: 'User logged in',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
      const newLog: AuditLog = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        action: 'LOGOUT',
        resource: 'System',
        timestamp: new Date().toISOString(),
        details: 'User logged out',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
    
    setUser(null);
    localStorage.removeItem('hospitalUser');
  };

  const logAction = (action: string, resource: string, details: string) => {
    if (user) {
      const newLog: AuditLog = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        action,
        resource,
        timestamp: new Date().toISOString(),
        details,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  const updateUserProfile = (name: string, email: string) => {
    if (user) {
      const updatedUser = { ...user, name, email };
      setUser(updatedUser);
      localStorage.setItem('hospitalUser', JSON.stringify(updatedUser));
      
      // Also save profile updates to persistent storage for future logins
      const savedProfiles = JSON.parse(localStorage.getItem('hospitalUserProfiles') || '{}');
      savedProfiles[user.username] = { name, email };
      localStorage.setItem('hospitalUserProfiles', JSON.stringify(savedProfiles));
      
      logAction('EDIT', 'Profile', `Updated profile name to ${name}`);
    }
  };

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    if (!user) return false;
    
    // Verify current password
    if (currentPassword !== userPasswords[user.username]) {
      return false;
    }
    
    // Update password
    const updatedPasswords = { ...userPasswords, [user.username]: newPassword };
    setUserPasswords(updatedPasswords);
    logAction('EDIT', 'Security', 'Changed password');
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        logAction,
        auditLogs,
        updateUserProfile,
        changePassword,
        userPasswords,
        setUserPasswords,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
