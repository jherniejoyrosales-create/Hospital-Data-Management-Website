import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Cloud, CloudOff, CheckCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function CloudStatusBanner() {
  const [isConnected, setIsConnected] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    setIsConnected(isSupabaseConfigured());
  }, []);

  // Auto-hide banner after migration is complete
  useEffect(() => {
    const migrationComplete = localStorage.getItem('supabaseMigrationComplete');
    const bannerDismissed = localStorage.getItem('cloudStatusBannerDismissed');
    
    if (migrationComplete && bannerDismissed) {
      setShowBanner(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('cloudStatusBannerDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Card className={`mb-4 border-2 ${isConnected ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Cloud Database Connected</p>
                  <p className="text-sm text-green-700">
                    Your patient data is now syncing across all devices in real-time! ☁️
                  </p>
                </div>
              </>
            ) : (
              <>
                <CloudOff className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">Local Storage Mode</p>
                  <p className="text-sm text-yellow-700">
                    Data is saved locally on this device only. Set up Supabase for cross-device sync. See SUPABASE_SETUP.md for instructions.
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Card>
  );
}