import { rvsRates } from './rvsRates';
import { addRVSCode, fetchRVSCodes } from './database';

/**
 * Seeds the database/localStorage with official PhilHealth RVS procedure rates
 * Only runs if no RVS codes exist yet
 */
export async function seedRVSCodes(): Promise<void> {
  try {
    // Check if RVS codes already exist
    const existingCodes = await fetchRVSCodes();
    
    if (existingCodes.length > 0) {
      console.log('RVS codes already seeded, skipping...');
      return;
    }

    console.log('Seeding RVS codes...');
    let successCount = 0;
    let failCount = 0;

    // Add all RVS codes
    for (const code of rvsRates) {
      const result = await addRVSCode(code);
      if (result) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to add RVS code: ${code.code}`);
      }
    }

    console.log(`RVS code seeding complete: ${successCount} added, ${failCount} failed`);
  } catch (error) {
    console.error('Error seeding RVS codes:', error);
  }
}
