import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function WelcomeBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the welcome banner before
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('welcomeBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-300 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-blue-950 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <span>Mabuhay, {user?.name}! 🇵🇭</span>
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Welcome to A. Zarate General Hospital's Patient Records Management System. 
                You're logged in as <span className="font-medium text-slate-700">{user?.role}</span>.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>View comprehensive patient records and billing information (₱ PHP)</li>
                <li>Search and filter patients by name, PIN, ICD-10, and confinement period</li>
                <li>Export data to CSV and print reports for documentation</li>
                {user?.role === 'admin' && <li>Access audit logs and system settings for security compliance</li>}
                {(user?.role === 'admin' || user?.role === 'doctor') && <li>Edit patient records and billing information</li>}
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                💡 Click the Help button in the top navigation for more information. <span className="italic text-slate-700">"The skill to heal, the spirit to serve"</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}