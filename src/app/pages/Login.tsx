import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../lib/auth';
import { Hospital, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import SecurityBanner from '../components/SecurityBanner';
import azghLogo from '../../assets/b159d69f766dbff88e66acfe582714a6dffaef22.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(username, password)) {
      toast.success('Login successful');
      navigate('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-2 border-slate-300">
          <CardHeader className="space-y-1 text-center bg-gradient-to-br from-slate-800 to-blue-950 text-white rounded-t-lg pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
                <img src={azghLogo} alt="AZGH Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">A. ZARATE GENERAL HOSPITAL</CardTitle>
            <CardDescription className="text-slate-200 text-base italic">
              "The skill to heal, the spirit to serve"
            </CardDescription>
            <CardDescription className="text-slate-300 text-sm font-medium pt-2">
              Patient Records Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-slate-700 to-blue-950 hover:from-slate-800 hover:to-blue-950">
                Sign In
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-2 font-medium">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p><span className="font-medium text-slate-700">Admin:</span> admin / qwerty12345</p>
                <p><span className="font-medium text-slate-700">Doctor:</span> doctor / doctor123</p>
                <p><span className="font-medium text-slate-700">Staff:</span> staff / staff123</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <SecurityBanner />
        
        <div className="mt-4 text-center text-sm text-gray-700">
          <p className="font-medium text-slate-800">
            🇵🇭 Serving the Filipino Community with Excellence Since 2004
          </p>
        </div>
      </div>
    </div>
  );
}