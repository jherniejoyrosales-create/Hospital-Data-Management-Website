// IndexedDB storage for permanent patient data persistence
import { PatientRecord } from './types';

const DB_NAME = 'HospitalDataDB';
const DB_VERSION = 1;
const STORE_NAME = 'patients';

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('patientId', 'patientId', { unique: false });
        store.createIndex('lastName', 'lastName', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

// IndexedDB operations
export const indexedDBStorage = {
  async getAll(): Promise<PatientRecord[]> {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB getAll error:', error);
      return [];
    }
  },

  async add(patient: PatientRecord): Promise<void> {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(patient);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB add error:', error);
      throw error;
    }
  },

  async update(patient: PatientRecord): Promise<void> {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(patient);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      throw error;
    }
  },

  async migrateFromLocalStorage(): Promise<void> {
    try {
      const localData = localStorage.getItem('hospitalPatients');
      if (localData) {
        const patients = JSON.parse(localData);
        if (Array.isArray(patients)) {
          for (const patient of patients) {
            await this.add(patient);
          }
          console.log(`Migrated ${patients.length} patients from localStorage to IndexedDB`);
          // Optionally clear localStorage after migration
          // localStorage.removeItem('hospitalPatients');
        }
      }
    } catch (error) {
      console.error('Migration from localStorage failed:', error);
    }
  }
};