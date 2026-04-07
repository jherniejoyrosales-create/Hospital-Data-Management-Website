import { icdCodeRates } from '../lib/icdRates';
import { addICDCode } from '../lib/database';

export async function seedICDCodes() {
  console.log('Starting ICD code seeding...');
  
  let successCount = 0;
  let errorCount = 0;

  for (const code of icdCodeRates) {
    try {
      await addICDCode(code);
      successCount++;
    } catch (error) {
      console.error(`Error seeding ICD code ${code.code}:`, error);
      errorCount++;
    }
  }

  console.log(`ICD Code seeding complete! Success: ${successCount}, Errors: ${errorCount}`);
  return { successCount, errorCount };
}

// Check if ICD codes are already seeded
export function areICDCodesSeeded(): boolean {
  const seeded = localStorage.getItem('icdCodesSeeded');
  return seeded === 'true';
}

// Mark ICD codes as seeded
export function markICDCodesAsSeeded(): void {
  localStorage.setItem('icdCodesSeeded', 'true');
}

// Clear ICD seed marker so full restore can run again
export function clearICDCodesSeeded(): void {
  localStorage.removeItem('icdCodesSeeded');
}
