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
  updateUser: (updatedUser: User) => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('hospitalUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Check against stored users in localStorage or mock data
    const storedUsers = JSON.parse(localStorage.getItem('hospitalUsers') || JSON.stringify(mockUsers.map(u => ({ ...u, password: 'qwerty12345' }))));
    const foundUser = storedUsers.find((u: any) => u.username === username);
    
    if (foundUser && foundUser.password === password) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('hospitalUser', JSON.stringify(userWithoutPassword));
      
      // Log the login action
      const newLog: AuditLog = {
        id: Date.now().toString(),
        userId: foundUser.id,
        userName: foundUser.name,
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

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('hospitalUser', JSON.stringify(updatedUser));
    
    // Update in users storage
    const storedUsers = JSON.parse(localStorage.getItem('hospitalUsers') || JSON.stringify(mockUsers.map(u => ({ ...u, password: 'qwerty12345' }))));
    const userIndex = storedUsers.findIndex((u: any) => u.id === updatedUser.id);
    if (userIndex !== -1) {
      storedUsers[userIndex] = { ...storedUsers[userIndex], ...updatedUser };
      localStorage.setItem('hospitalUsers', JSON.stringify(storedUsers));
    }
  };

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (!user) return false;
    
    const storedUsers = JSON.parse(localStorage.getItem('hospitalUsers') || JSON.stringify(mockUsers.map(u => ({ ...u, password: 'qwerty12345' }))));
    const userIndex = storedUsers.findIndex((u: any) => u.id === user.id);
    
    if (userIndex === -1) return false;
    
    // Verify old password
    if (storedUsers[userIndex].password !== oldPassword) return false;
    
    // Update password
    storedUsers[userIndex].password = newPassword;
    localStorage.setItem('hospitalUsers', JSON.stringify(storedUsers));
    
    logAction('EDIT', 'Security', 'Password changed');
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
        updateUser,
        changePassword,
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
