import { supabase, isSupabaseConfigured, isLocalStorageMode, isIndexedDBMode, getStorageMode } from './supabase';
import { indexedDBStorage } from './indexeddb';
import { PatientRecord } from './types';

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