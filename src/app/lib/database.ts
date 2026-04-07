import { supabase, isSupabaseConfigured, isLocalStorageMode, isIndexedDBMode, getStorageMode } from './supabase';
import { indexedDBStorage } from './indexeddb';
import { PatientRecord } from './types';

const API_BASE_URL = 'http://localhost:3001/api';

// Check if API server is available
export async function isAPIServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

// Use API mode for cross-browser data sharing
export const isAPIMode = () => getStorageMode() === 'api';

// Deduplicate patients by patientId (keep the most recent entry)
export async function deduplicatePatients(): Promise<{ success: boolean; message: string; removedCount: number }> {
  if (!isLocalStorageMode()) {
    return { success: false, message: 'Deduplication only works in local storage mode', removedCount: 0 };
  }

  try {
    const stored = localStorage.getItem('hospitalPatients');
    if (!stored) {
      return { success: true, message: 'No data to deduplicate', removedCount: 0 };
    }

    const patients: PatientRecord[] = JSON.parse(stored);
    if (!Array.isArray(patients)) {
      return { success: false, message: 'Invalid data format', removedCount: 0 };
    }

    const originalCount = patients.length;

    // Create a map to track unique patients by patientId, keeping the most recent (by confinementStart date)
    const uniquePatients = new Map<string, PatientRecord>();

    patients.forEach(patient => {
      const key = patient.patientId;
      const existing = uniquePatients.get(key);

      if (!existing) {
        uniquePatients.set(key, patient);
      } else {
        // Keep the one with the more recent confinementStart date
        const existingDate = new Date(existing.confinementStart);
        const currentDate = new Date(patient.confinementStart);

        if (currentDate > existingDate) {
          uniquePatients.set(key, patient);
        }
      }
    });

    const deduplicatedPatients = Array.from(uniquePatients.values());
    const removedCount = originalCount - deduplicatedPatients.length;

    // Save the deduplicated data
    localStorage.setItem('hospitalPatients', JSON.stringify(deduplicatedPatients));

    return {
      success: true,
      message: `Removed ${removedCount} duplicate patients. Kept ${deduplicatedPatients.length} unique patients.`,
      removedCount
    };
  } catch (error) {
    console.error('Error deduplicating patients:', error);
    return { success: false, message: 'Error during deduplication', removedCount: 0 };
  }
}

// Initialize the database table if it doesn't exist
export async function initializeDatabase() {
  if (isIndexedDBMode()) {
    console.log('IndexedDB mode active - migrating data if needed');
    // Migrate from localStorage to IndexedDB if needed
    const migrationKey = 'indexeddb_migration_complete';
    const alreadyMigrated = localStorage.getItem(migrationKey);

    if (!alreadyMigrated) {
      try {
        await indexedDBStorage.migrateFromLocalStorage();
        localStorage.setItem(migrationKey, 'true');
        console.log('Migration to IndexedDB completed');
      } catch (error) {
        console.error('Migration to IndexedDB failed:', error);
      }
    }
    return;
  }

  if (isLocalStorageMode()) {
    console.log('Local storage mode active');
    return;
  }

  if (isAPIMode()) {
    console.log('API mode active - no Supabase initialization required');
    return;
  }

  try {
    // Check if patients table exists by attempting to fetch
    const { error } = await supabase!.from('patients').select('id').limit(1);
    
    if (error) {
      console.error('Database initialization check:', error.message);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Migrate localStorage data to Supabase (one-time migration)
export async function migrateLocalStorageToSupabase() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const stored = localStorage.getItem('hospitalPatients');
    if (!stored) {
      console.log('No localStorage data to migrate');
      return { success: true, message: 'No data to migrate' };
    }

    const localPatients = JSON.parse(stored);
    
    // Check if we already have data in Supabase
    const { data: existingData, error: checkError } = await supabase!
      .from('patients')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing data:', checkError);
      return { success: false, error: checkError.message };
    }

    // Only migrate if Supabase is empty
    if (!existingData || existingData.length === 0) {
      const { data, error } = await supabase!
        .from('patients')
        .insert(localPatients)
        .select();

      if (error) {
        console.error('Migration error:', error);
        return { success: false, error: error.message };
      }

      console.log(`Migrated ${localPatients.length} patients to Supabase`);
      
      // Mark migration as complete
      localStorage.setItem('supabaseMigrationComplete', 'true');
      
      return { success: true, message: `Migrated ${localPatients.length} patients` };
    } else {
      console.log('Supabase already has data, skipping migration');
      localStorage.setItem('supabaseMigrationComplete', 'true');
      return { success: true, message: 'Data already exists in Supabase' };
    }
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: String(error) };
  }
}

// Fetch all patients
export async function fetchPatients(): Promise<PatientRecord[]> {
  if (isAPIMode()) {
    // Use local API server for cross-browser sync
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error('Error fetching from API:', e);
    }
    return [];
  }

  if (isIndexedDBMode()) {
    // Use IndexedDB for persistent storage
    return await indexedDBStorage.getAll();
  }

  if (isLocalStorageMode()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalPatients');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return [];
    }
  }

  try {
    const { data, error } = await supabase!
      .from('patients')
      .select('*')
      .order('confinementStart', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

// Add a new patient
export async function addPatient(patient: Omit<PatientRecord, 'id'>): Promise<PatientRecord | null> {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const patientWithId = { id, ...patient };

  if (isAPIMode()) {
    // Use local API server for cross-browser sync
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientWithId)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error adding patient via API:', error);
    }
    return null;
  }

  if (isIndexedDBMode()) {
    // Use IndexedDB for persistent storage
    try {
      await indexedDBStorage.add(patientWithId);
      return patientWithId;
    } catch (error) {
      console.error('Error adding patient to IndexedDB:', error);
      return null;
    }
  }

  if (isLocalStorageMode()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalPatients');
      const patients = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(patients)) {
        console.error('Invalid patients data in localStorage');
        return null;
      }
      patients.unshift(patientWithId);
      localStorage.setItem('hospitalPatients', JSON.stringify(patients));
      return patientWithId;
    } catch (error) {
      console.error('Error adding patient to localStorage:', error);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('patients')
      .insert([patientWithId])
      .select()
      .single();

    if (error) {
      console.error('Error adding patient:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error adding patient:', error);
    return null;
  }
}

// Update a patient
export async function updatePatient(patient: PatientRecord): Promise<PatientRecord | null> {
  if (isAPIMode()) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });
      if (response.ok) {
        return await response.json();
      }
      console.error('API updatePatient failed', response.statusText);
      return null;
    } catch (error) {
      console.error('Error updating patient via API:', error);
      return null;
    }
  }

  if (isIndexedDBMode()) {
    // Use IndexedDB for persistent storage
    try {
      await indexedDBStorage.update(patient);
      return patient;
    } catch (error) {
      console.error('Error updating patient in IndexedDB:', error);
      return null;
    }
  }

  if (isLocalStorageMode()) {
    // Use localStorage
    try {
      const stored = localStorage.getItem('hospitalPatients');
      const patients = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(patients)) {
        console.error('Invalid patients data in localStorage');
        return null;
      }
      const updatedPatients = patients.map((p: PatientRecord) =>
        p.id === patient.id ? patient : p
      );
      localStorage.setItem('hospitalPatients', JSON.stringify(updatedPatients));
      return patient;
    } catch (error) {
      console.error('Error updating patient in localStorage:', error);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('patients')
      .update(patient)
      .eq('id', patient.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating patient:', error);
    return null;
  }
}
export async function deletePatient(id: string): Promise<boolean> {
  if (isAPIMode()) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting patient via API:', error);
      return false;
    }
  }

  if (isIndexedDBMode()) {
    // Use IndexedDB for persistent storage
    try {
      await indexedDBStorage.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting patient from IndexedDB:', error);
      return false;
    }
  }

  if (isLocalStorageMode()) {
    // Use localStorage
    try {
      const stored = localStorage.getItem('hospitalPatients');
      const patients = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(patients)) {
        console.error('Invalid patients data in localStorage');
        return false;
      }
      const filteredPatients = patients.filter((p: PatientRecord) => p.id !== id);
      localStorage.setItem('hospitalPatients', JSON.stringify(filteredPatients));
      return true;
    } catch (error) {
      console.error('Error deleting patient from localStorage:', error);
      return false;
    }
  }

  try {
    const { error } = await supabase!
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting patient:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    return false;
  }
}

// Get a single patient by ID
export async function getPatientById(id: string): Promise<PatientRecord | null> {
  if (isAPIMode()) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (!response.ok) {
        console.error('Error fetching patient via API:', response.statusText);
        return null;
      }
      const patients: PatientRecord[] = await response.json();
      return patients.find((p) => p.id === id) || null;
    } catch (error) {
      console.error('Error reading patient via API:', error);
      return null;
    }
  }

  if (isIndexedDBMode()) {
    // Use IndexedDB for persistent storage
    try {
      const patients = await indexedDBStorage.getAll();
      return patients.find((p: PatientRecord) => p.id === id) || null;
    } catch (e) {
      console.error('Error reading patient from IndexedDB:', e);
      return null;
    }
  }

  if (isLocalStorageMode()) {
    // Use localStorage
    try {
      const stored = localStorage.getItem('hospitalPatients');
      if (stored) {
        const patients = JSON.parse(stored);
        if (Array.isArray(patients)) {
          return patients.find((p: PatientRecord) => p.id === id) || null;
        }
      }
      return null;
    } catch (e) {
      console.error('Error reading patient from localStorage:', e);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching patient:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
}

// Subscribe to real-time changes
export function subscribeToPatients(callback: (patients: PatientRecord[]) => void) {
  if (!isSupabaseConfigured() || !supabase) {
    // Return empty unsubscribe function when Supabase is not available
    return () => {};
  }

  const channel = supabase
    .channel('patients_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'patients',
      },
      async () => {
        // Fetch updated data when any change occurs
        const patients = await fetchPatients();
        callback(patients);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ICD CODE MANAGEMENT FUNCTIONS
// ========================================

// Fetch all ICD codes
export async function fetchICDCodes(): Promise<ICDCodeRate[]> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const stored = localStorage.getItem('hospitalICDCodes');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing localStorage ICD codes:', e);
        return [];
      }
    }
    return [];
  }

  try {
    const { data, error } = await supabase!
      .from('icd_codes')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching ICD codes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching ICD codes:', error);
    return [];
  }
}

// Add a new ICD code
export async function addICDCode(icdCode: ICDCodeRate): Promise<ICDCodeRate | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalICDCodes');
      const codes = stored ? JSON.parse(stored) : [];
      codes.push(icdCode);
      localStorage.setItem('hospitalICDCodes', JSON.stringify(codes));
      return icdCode;
    } catch (error) {
      console.error('Error adding ICD code to localStorage:', error);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('icd_codes')
      .insert([icdCode])
      .select()
      .single();

    if (error) {
      console.error('Error adding ICD code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error adding ICD code:', error);
    return null;
  }
}

// Update an ICD code
export async function updateICDCode(icdCode: ICDCodeRate): Promise<ICDCodeRate | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalICDCodes');
      const codes = stored ? JSON.parse(stored) : [];
      const updatedCodes = codes.map((c: ICDCodeRate) => 
        c.code === icdCode.code ? icdCode : c
      );
      localStorage.setItem('hospitalICDCodes', JSON.stringify(updatedCodes));
      return icdCode;
    } catch (error) {
      console.error('Error updating ICD code in localStorage:', error);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('icd_codes')
      .update(icdCode)
      .eq('code', icdCode.code)
      .select()
      .single();

    if (error) {
      console.error('Error updating ICD code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating ICD code:', error);
    return null;
  }
}

// Delete an ICD code
export async function deleteICDCode(code: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalICDCodes');
      const codes = stored ? JSON.parse(stored) : [];
      const filteredCodes = codes.filter((c: ICDCodeRate) => c.code !== code);
      localStorage.setItem('hospitalICDCodes', JSON.stringify(filteredCodes));
      return true;
    } catch (error) {
      console.error('Error deleting ICD code from localStorage:', error);
      return false;
    }
  }

  try {
    const { error } = await supabase!
      .from('icd_codes')
      .delete()
      .eq('code', code);

    if (error) {
      console.error('Error deleting ICD code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting ICD code:', error);
    return false;
  }
}

// Delete all ICD codes
export async function deleteAllICDCodes(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    try {
      localStorage.setItem('hospitalICDCodes', JSON.stringify([]));
      localStorage.removeItem('icdCodesSeeded');
      return true;
    } catch (error) {
      console.error('Error clearing ICD codes from localStorage:', error);
      return false;
    }
  }

  try {
    const { error } = await supabase!
      .from('icd_codes')
      .delete();

    if (error) {
      console.error('Error deleting all ICD codes:', error);
      return false;
    }

    localStorage.removeItem('icdCodesSeeded');
    return true;
  } catch (error) {
    console.error('Error deleting all ICD codes:', error);
    return false;
  }
}

// Get ICD code by code
export async function getICDCodeByCode(code: string): Promise<ICDCodeRate | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const stored = localStorage.getItem('hospitalICDCodes');
    if (stored) {
      try {
        const codes = JSON.parse(stored);
        return codes.find((c: ICDCodeRate) => c.code === code) || null;
      } catch (e) {
        console.error('Error parsing localStorage:', e);
        return null;
      }
    }
    return null;
  }

  try {
    const { data, error } = await supabase!
      .from('icd_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Error fetching ICD code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching ICD code:', error);
    return null;
  }
}

// RVS CODE MANAGEMENT FUNCTIONS
// ========================================

// Fetch all RVS codes
export async function fetchRVSCodes(): Promise<RVSCodeRate[]> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const stored = localStorage.getItem('hospitalRVSCodes');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing localStorage RVS codes:', e);
        return [];
      }
    }
    return [];
  }

  try {
    const { data, error } = await supabase!
      .from('rvs_codes')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching RVS codes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching RVS codes:', error);
    return [];
  }
}

// Add a new RVS code
export async function addRVSCode(rvsCode: RVSCodeRate): Promise<RVSCodeRate | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalRVSCodes');
      const codes = stored ? JSON.parse(stored) : [];
      codes.push(rvsCode);
      localStorage.setItem('hospitalRVSCodes', JSON.stringify(codes));
      return rvsCode;
    } catch (error) {
      console.error('Error adding RVS code to localStorage:', error);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('rvs_codes')
      .insert([rvsCode])
      .select()
      .single();

    if (error) {
      console.error('Error adding RVS code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error adding RVS code:', error);
    return null;
  }
}

// Update an RVS code
export async function updateRVSCode(rvsCode: RVSCodeRate): Promise<RVSCodeRate | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalRVSCodes');
      const codes = stored ? JSON.parse(stored) : [];
      const updatedCodes = codes.map((c: RVSCodeRate) => 
        c.code === rvsCode.code ? rvsCode : c
      );
      localStorage.setItem('hospitalRVSCodes', JSON.stringify(updatedCodes));
      return rvsCode;
    } catch (error) {
      console.error('Error updating RVS code in localStorage:', error);
      return null;
    }
  }

  try {
    const { data, error } = await supabase!
      .from('rvs_codes')
      .update(rvsCode)
      .eq('code', rvsCode.code)
      .select()
      .single();

    if (error) {
      console.error('Error updating RVS code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating RVS code:', error);
    return null;
  }
}

// Delete an RVS code
export async function deleteRVSCode(code: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('hospitalRVSCodes');
      const codes = stored ? JSON.parse(stored) : [];
      const filteredCodes = codes.filter((c: RVSCodeRate) => c.code !== code);
      localStorage.setItem('hospitalRVSCodes', JSON.stringify(filteredCodes));
      return true;
    } catch (error) {
      console.error('Error deleting RVS code from localStorage:', error);
      return false;
    }
  }

  try {
    const { error } = await supabase!
      .from('rvs_codes')
      .delete()
      .eq('code', code);

    if (error) {
      console.error('Error deleting RVS code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting RVS code:', error);
    return false;
  }
}

// Delete all RVS codes
export async function deleteAllRVSCodes(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    try {
      localStorage.setItem('hospitalRVSCodes', JSON.stringify([]));
      localStorage.removeItem('rvsCodesSeeded');
      return true;
    } catch (error) {
      console.error('Error clearing RVS codes from localStorage:', error);
      return false;
    }
  }

  try {
    const { error } = await supabase!
      .from('rvs_codes')
      .delete();

    if (error) {
      console.error('Error deleting all RVS codes:', error);
      return false;
    }

    localStorage.removeItem('rvsCodesSeeded');
    return true;
  } catch (error) {
    console.error('Error deleting all RVS codes:', error);
    return false;
  }
}

// Get RVS code by code
export async function getRVSCodeByCode(code: string): Promise<RVSCodeRate | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const stored = localStorage.getItem('hospitalRVSCodes');
    if (stored) {
      try {
        const codes = JSON.parse(stored);
        return codes.find((c: RVSCodeRate) => c.code === code) || null;
      } catch (e) {
        console.error('Error parsing localStorage:', e);
        return null;
      }
    }
    return null;
  }

  try {
    const { data, error } = await supabase!
      .from('rvs_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Error fetching RVS code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching RVS code:', error);
    return null;
  }
}