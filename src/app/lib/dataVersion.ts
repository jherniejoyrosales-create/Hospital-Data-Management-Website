import { mockPatients } from './mockData';

// Increment this version number whenever you want to force a data reset across all devices
const CURRENT_DATA_VERSION = '2.0.0';

export function checkAndUpdateDataVersion(): boolean {
  const storedVersion = localStorage.getItem('hospitalDataVersion');
  
  if (storedVersion !== CURRENT_DATA_VERSION) {
    // Version mismatch or first time - reset data
    console.log('Data version mismatch. Resetting to latest data...');
    localStorage.setItem('hospitalPatients', JSON.stringify(mockPatients));
    localStorage.setItem('hospitalDataVersion', CURRENT_DATA_VERSION);
    return true; // Data was updated
  }
  
  return false; // No update needed
}

export function initializeData(): void {
  const hasPatients = localStorage.getItem('hospitalPatients');
  const hasVersion = localStorage.getItem('hospitalDataVersion');
  
  // If no patients exist or no version, initialize
  if (!hasPatients || !hasVersion) {
    localStorage.setItem('hospitalPatients', JSON.stringify(mockPatients));
    localStorage.setItem('hospitalDataVersion', CURRENT_DATA_VERSION);
  } else {
    // Check if version needs updating
    checkAndUpdateDataVersion();
  }
}
