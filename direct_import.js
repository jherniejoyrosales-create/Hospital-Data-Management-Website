// Direct database import script for bulk patient import
// This script imports patients directly into the database

import { addPatient } from './src/app/lib/database.js';
import { calculateDaysSince } from './src/app/lib/icdRates.js';

const patientsToImport = [
  {
    "Name": "Quilatan, Jaiden Beato",
    "Confinement Period": "07/08/2025 - 07/09/2025",
    "PIN": "190901927387",
    "ICD-10 Code": "R56.0",
    "HF": "9555.0",
    "PF": "4095",
    "TOTAL": "13650.0",
    "Date Filed": "09/05/2025",
    "Date Refiled": "",
    "Status": "paid",
    "Companion Name": "",
    "Relationship": "",
    "Contact Number": "",
    "Home Address": ""
  },
  // ... all other patients would be here
];

async function bulkImportPatients() {
  console.log('Starting bulk import of', patientsToImport.length, 'patients...');

  let imported = 0;
  let failed = 0;

  for (let i = 0; i < patientsToImport.length; i++) {
    const patientData = patientsToImport[i];

    try {
      // Parse name
      const fullName = patientData.Name || '';
      let lastName = '', firstName = '';

      if (fullName.includes(',')) {
        const parts = fullName.split(',');
        lastName = parts[0].trim();
        firstName = parts[1].trim();
      } else {
        const nameParts = fullName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Parse confinement period
      const confinement = patientData['Confinement Period'] || '';
      let startDate = '', endDate = '';
      if (confinement.includes(' - ')) {
        const dates = confinement.split(' - ');
        startDate = dates[0].trim();
        endDate = dates[1] ? dates[1].trim() : startDate;
      }

      // Clean PIN
      const pin = (patientData.PIN || '').replace(/\s+/g, '');

      // Validate PIN
      if (pin.length !== 12 || !/^\d+$/.test(pin)) {
        console.log('Skipping invalid PIN:', pin);
        failed++;
        continue;
      }

      // Parse fees
      const hf = parseFloat((patientData.HF || '0').replace(/,/g, '')) || 0;
      const pf = parseFloat((patientData.PF || '0').replace(/,/g, '')) || 0;
      const total = parseFloat((patientData.TOTAL || '0').replace(/,/g, '')) || 0;

      // Parse status
      const statusStr = (patientData.Status || '').toLowerCase();
      let status = 'not yet filed';
      if (statusStr === 'paid') status = 'paid';
      else if (statusStr.includes('in process')) status = 'in process';
      else if (statusStr.includes('return')) status = 'return to hospital';
      else if (statusStr.includes('denied')) status = 'denied';

      // Create patient record
      const patient = {
        patientId: `PT-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        lastName,
        firstName,
        middleName: '',
        category: 'MM',
        confinementStart: startDate,
        confinementEnd: endDate,
        pin,
        icd10Code: patientData['ICD-10 Code'] || '',
        icd10Description: '',
        healthFacilityFee: hf,
        professionalFee: pf,
        totalCaseRate: total,
        totalBilling: total,
        dateFiled: patientData['Date Filed'] || '',
        dateRefiled: patientData['Date Refiled'] || '',
        status,
        companionName: patientData['Companion Name'] || '',
        relationship: patientData.Relationship || '',
        contactNumber: patientData['Contact Number'] || '',
        homeAddress: patientData['Home Address'] || '',
        street: '',
        barangay: '',
        city: '',
        province: '',
        zipCode: ''
      };

      // Import patient
      const result = await addPatient(patient);
      if (result) {
        imported++;
        if (imported % 50 === 0) {
          console.log('Imported', imported, 'patients...');
        }
      } else {
        console.log('Failed to import:', firstName, lastName);
        failed++;
      }

    } catch (error) {
      console.error('Error importing patient:', error);
      failed++;
    }
  }

  console.log(`✅ Import complete! Successfully imported ${imported} patients, ${failed} failed`);
}

// Run the import
bulkImportPatients();