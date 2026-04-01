import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Cloud, CloudOff, CheckCircle } from 'lucide-react';
import { isLocalStorageMode, isIndexedDBMode, getStorageMode } from '../lib/supabase';

export default function CloudStatusBanner() {
  const [isLocalMode, setIsLocalMode] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [storageMode, setStorageMode] = useState('auto');

  const refreshMode = () => {
    const localMode = isLocalStorageMode();
    const indexedDBMode = isIndexedDBMode();
    const currentMode = getStorageMode();
    setIsLocalMode(localMode || indexedDBMode);
    setStorageMode(currentMode);
  };

  useEffect(() => {
    refreshMode();
  }, []);

  const isConnected = !isLocalStorageMode() && !isIndexedDBMode();


  // Auto-hide banner after migration is complete
  useEffect(() => {
    try {
      const migrationComplete = localStorage.getItem('supabaseMigrationComplete');
      const bannerDismissed = localStorage.getItem('cloudStatusBannerDismissed');

      if (migrationComplete && bannerDismissed) {
        setShowBanner(false);
      }
    } catch (e) {
      // localStorage not available
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('cloudStatusBannerDismissed', 'true');
      setShowBanner(false);
    } catch (e) {
      // localStorage not available
      setShowBanner(false);
    }
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
                    Storage mode: {storageMode}. Your patient data is now syncing across all devices in real-time! ☁️
                  </p>
                </div>
              </>
            ) : (
              <>
                <CloudOff className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">
                    {storageMode === 'supabase' ? 'Supabase Setup Required' : storageMode === 'indexeddb' ? 'Persistent Storage' : 'Local Storage Mode'}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {storageMode === 'supabase'
                      ? 'Cross-device sync needs Supabase setup. Check .env file and SUPABASE_SETUP.md for instructions.'
                      : storageMode === 'indexeddb'
                      ? 'Data persists on this device only. Switch to Supabase for cross-device sync.'
                      : 'Data is saved locally on this device only. Set up Supabase for cross-device sync.'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                try {
                  let newMode = 'supabase'; // Default to Supabase
                  if (storageMode === 'supabase') {
                    newMode = 'indexeddb';
                  } else if (storageMode === 'indexeddb') {
                    newMode = 'local';
                  } // else stay as supabase

                  localStorage.setItem('appStorageMode', newMode);
                  refreshMode();
                  // Small delay to ensure localStorage is set before reload
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                } catch (e) {
                  console.error('Error switching storage mode:', e);
                }
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Switch to {storageMode === 'supabase' ? 'IndexedDB' : storageMode === 'indexeddb' ? 'Local' : 'Supabase'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}