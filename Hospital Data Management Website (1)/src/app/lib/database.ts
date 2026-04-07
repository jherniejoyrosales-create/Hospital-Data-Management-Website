import { supabase, isSupabaseConfigured, isLocalStorageMode, isSupabaseMode } from './supabase';
import { PatientRecord, ICDCodeRate, RVSCodeRate } from './types';

// Initialize the database table if it doesn't exist
export async function initializeDatabase() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured - using localStorage');
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

const savePatientsToLocalStorage = (patients: PatientRecord[]) => {
  try {
    localStorage.setItem('hospitalPatients', JSON.stringify(patients));
  } catch (error) {
    console.error('Error saving patients to localStorage:', error);
  }
};

const getPatientsFromLocalStorage = (): PatientRecord[] => {
  const stored = localStorage.getItem('hospitalPatients');
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error parsing localStorage patients:', error);
    return [];
  }
};

const isSupabaseAvailable = () => isSupabaseConfigured();

// Fetch all patients
export async function fetchPatients(): Promise<PatientRecord[]> {
  // Always try to fetch from Supabase first if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase!
        .from('patients')
        .select('*')
        .order('confinementStart', { ascending: false });

      if (error) {
        console.error('Error fetching patients from Supabase:', error);
        return getPatientsFromLocalStorage();
      }

      const patients = data || [];
      if (patients.length > 0) {
        savePatientsToLocalStorage(patients);
      }

      return patients;
    } catch (error) {
      console.error('Error fetching patients from Supabase:', error);
      return getPatientsFromLocalStorage();
    }
  }

  return getPatientsFromLocalStorage();
}

// Helper function to fetch patients from a specific mode (for fallback loading)
export async function fetchPatientsFromMode(mode: 'local' | 'supabase'): Promise<PatientRecord[]> {
  if (mode === 'local') {
    return getPatientsFromLocalStorage();
  }

  if (mode === 'supabase' && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase!
        .from('patients')
        .select('*')
        .order('confinementStart', { ascending: false });

      if (error) {
        console.error('Error fetching patients from Supabase:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching patients from Supabase:', error);
      return [];
    }
  }

  return [];
}

// Add a new patient
export async function addPatient(patient: Omit<PatientRecord, 'id'>): Promise<PatientRecord | null> {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const patientWithId = { id, ...patient };

  // Save to localStorage for immediate availability
  try {
    const patients = getPatientsFromLocalStorage();
    patients.unshift(patientWithId);
    savePatientsToLocalStorage(patients);
  } catch (error) {
    console.error('Error saving patient to localStorage:', error);
  }

  // Always try to save to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase!
        .from('patients')
        .insert([patientWithId])
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert failed:', error.message);
      } else {
        return data;
      }
    } catch (error) {
      console.warn('Supabase connection error:', error);
    }
  }

  return patientWithId;
}


// Test Supabase connection
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.log('testSupabaseConnection: Supabase not configured');
    return { success: false, error: 'Not configured' };
  }

  try {
    console.log('testSupabaseConnection: Testing connection...');
    const { data, error } = await supabase!.from('patients').select('count').limit(1);
    
    if (error) {
      console.error('testSupabaseConnection: Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('testSupabaseConnection: Connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('testSupabaseConnection: Exception:', error);
    return { success: false, error: String(error) };
  }
}

// Update a patient
export async function updatePatient(patient: PatientRecord): Promise<PatientRecord | null> {
  try {
    const patients = getPatientsFromLocalStorage();
    const updatedPatients = patients.map((p: PatientRecord) => p.id === patient.id ? patient : p);
    savePatientsToLocalStorage(updatedPatients);
    console.log('Patient updated in localStorage:', patient);
  } catch (error) {
    console.error('Error updating patient in localStorage:', error);
  }

  if (isLocalStorageMode() || !isSupabaseAvailable()) {
    return patient;
  }

  try {
    const { data, error } = await supabase!
      .from('patients')
      .update(patient)
      .eq('id', patient.id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update failed (but saved to localStorage):', error.message);
      return patient;
    }

    if (data) {
      const patients = getPatientsFromLocalStorage();
      const updatedPatients = patients.map((p: PatientRecord) => p.id === data.id ? data : p);
      savePatientsToLocalStorage(updatedPatients);
    }

    console.log('Patient updated in Supabase:', data);
    return data;
  } catch (error) {
    console.warn('Supabase connection error (but saved to localStorage):', error);
    return patient;
  }
}

// Delete a patient
export async function deletePatient(id: string): Promise<boolean> {
  try {
    const patients = getPatientsFromLocalStorage();
    const filteredPatients = patients.filter((p: PatientRecord) => p.id !== id);
    savePatientsToLocalStorage(filteredPatients);
    console.log('Patient deleted from localStorage:', id);
  } catch (error) {
    console.error('Error deleting patient from localStorage:', error);
  }

  if (isLocalStorageMode() || !isSupabaseAvailable()) {
    return true;
  }

  try {
    const { error } = await supabase!
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed (but deleted from localStorage):', error.message);
      return true;
    }

    console.log('Patient deleted from Supabase:', id);
    return true;
  } catch (error) {
    console.warn('Supabase connection error (but deleted from localStorage):', error);
    return true;
  }
}

// Get a single patient by ID
export async function getPatientById(id: string): Promise<PatientRecord | null> {
  if (isLocalStorageMode() || !isSupabaseAvailable()) {
    const patients = getPatientsFromLocalStorage();
    return patients.find((p: PatientRecord) => p.id === id) || null;
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
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  try {
    const channel = supabase!
      .channel('patients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
        },
        async (payload) => {
          try {
            // Always fetch from Supabase when changes occur, regardless of current storage mode
            const patients = await fetchPatientsFromMode('supabase');
            if (patients.length >= 0) { // Allow empty array too
              callback(patients);
            }
          } catch (error) {
            console.error('Error in real-time callback:', error);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Subscription error:', err);
        }
      });

    return () => {
      try {
        supabase!.removeChannel(channel);
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    };
  } catch (error) {
    console.error('Error setting up subscription:', error);
    return () => {};
  }
}

// Remove duplicate patients by PIN
export async function removeDuplicatePatients(): Promise<{ success: boolean; removedCount: number; uniqueCount: number; error?: string }> {
  try {
    // Fetch all patients (works with both Supabase and localStorage)
    const patients = await fetchPatients();
    
    if (patients.length === 0) {
      return { success: true, removedCount: 0, uniqueCount: 0 };
    }

    // Group patients by PIN
    const pinMap = new Map<string, PatientRecord[]>();
    
    patients.forEach(patient => {
      const pin = patient.pin;
      if (!pinMap.has(pin)) {
        pinMap.set(pin, []);
      }
      pinMap.get(pin)!.push(patient);
    });

    // Find duplicates (PINs with more than one patient)
    const duplicates: PatientRecord[][] = [];
    pinMap.forEach((patientList, pin) => {
      if (patientList.length > 1) {
        duplicates.push(patientList);
      }
    });

    if (duplicates.length === 0) {
      return { success: true, removedCount: 0, uniqueCount: patients.length };
    }

    // For each duplicate set, keep the most recent one
    let removedCount = 0;
    const idsToDelete: string[] = [];

    for (const duplicateSet of duplicates) {
      // Sort by dateFiled (most recent first), then by id
      const sorted = duplicateSet.sort((a, b) => {
        const dateA = new Date(a.dateFiled).getTime();
        const dateB = new Date(b.dateFiled).getTime();
        if (dateB !== dateA) {
          return dateB - dateA; // Most recent date first
        }
        // If dates are equal, prefer the one with higher id
        return (b.id || '').localeCompare(a.id || '');
      });

      // Keep the first (most recent), delete the rest
      const toDelete = sorted.slice(1);
      toDelete.forEach(patient => {
        idsToDelete.push(patient.id);
      });
      removedCount += toDelete.length;
    }

    // Delete all duplicate records
    if (idsToDelete.length > 0) {
      if (isSupabaseConfigured()) {
        // Use Supabase batch delete
        const { error } = await supabase!
          .from('patients')
          .delete()
          .in('id', idsToDelete);

        if (error) {
          console.error('Error deleting duplicates:', error);
          return { success: false, removedCount: 0, uniqueCount: 0, error: error.message };
        }
      } else {
        // Use localStorage
        const stored = localStorage.getItem('hospitalPatients');
        if (stored) {
          const allPatients = JSON.parse(stored);
          const filtered = allPatients.filter((p: PatientRecord) => !idsToDelete.includes(p.id));
          localStorage.setItem('hospitalPatients', JSON.stringify(filtered));
        }
      }
    }

    return { 
      success: true, 
      removedCount, 
      uniqueCount: duplicates.length 
    };
  } catch (error) {
    console.error('Error removing duplicates:', error);
    return { success: false, removedCount: 0, uniqueCount: 0, error: String(error) };
  }
}

// ========================================
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

// ========================================
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