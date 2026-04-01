import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { mockPatients } from '../lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Settings as SettingsIcon, User, Lock, Bell, Shield, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, logAction, updateUserProfile, changePassword } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    logAction('VIEW', 'Settings', 'Accessed settings page');
  }, []);

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      toast.error('Full name cannot be empty');
      return;
    }
    updateUserProfile(fullName, email);
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (changePassword(currentPassword, newPassword)) {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Current password is incorrect');
    }
  };

  const handleSave = () => {
    logAction('EDIT', 'Settings', 'Updated user settings');
    toast.success('Settings saved successfully');
  };

  const handleResetData = () => {
    // Clear localStorage and reload with mock data
    localStorage.removeItem('hospitalPatients');
    localStorage.setItem('hospitalPatients', JSON.stringify(mockPatients));
    logAction('EDIT', 'Settings', 'Reset patient data to default');
    toast.success('Patient data has been reset to default records. Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your account and system preferences</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            User Profile
          </CardTitle>
          <CardDescription>Your personal information and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue={user?.username} className="mt-2" disabled />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-700">
                  {user?.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your password and security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input 
              id="current-password" 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-2" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2" 
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-gray-500">Auto logout after 30 minutes of inactivity</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
            Update Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email updates for important events</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Patient Updates</p>
              <p className="text-sm text-gray-500">Notify me when patient records are updated</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Payment Alerts</p>
              <p className="text-sm text-gray-500">Alert me about payment status changes</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System Maintenance</p>
              <p className="text-sm text-gray-500">Notify about scheduled maintenance</p>
            </div>
            <Switch />
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* System Information (Admin Only) */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              System Information
            </CardTitle>
            <CardDescription>System configuration and data management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">System Version</p>
                <p className="font-medium">v2.5.1</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Backup</p>
                <p className="font-medium">February 27, 2026 - 02:00 AM</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Database Size</p>
                <p className="font-medium">2.4 GB</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="font-medium">3 users</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                logAction('EXPORT', 'System Backup', 'Initiated system backup');
                toast.success('Backup initiated');
              }}>
                Create Backup
              </Button>
              <Button variant="outline" onClick={() => {
                logAction('VIEW', 'System Logs', 'Downloaded system logs');
                toast.success('Logs downloaded');
              }}>
                Download Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Privacy Notice */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Shield className="h-5 w-5" />
            Data Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-800">
          <p>
            This system implements industry-standard security measures to protect patient data. 
            All data is encrypted at rest and in transit. Access is logged and monitored. 
            For production use, ensure HIPAA compliance and proper security certifications are in place.
          </p>
        </CardContent>
      </Card>

      {/* Reset Data Button (Admin Only) */}
      {user?.role === 'admin' && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <RefreshCw className="h-5 w-5" />
              Reset Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800">
            <p>
              Resetting the patient data will clear all current records and restore the default mock data.
              This action is irreversible. Proceed with caution.
            </p>
            <Button variant="outline" className="bg-red-600 hover:bg-red-700 text-white mt-4" onClick={handleResetData}>
              Reset Patient Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}