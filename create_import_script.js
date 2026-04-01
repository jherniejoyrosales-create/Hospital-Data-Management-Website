import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, 'phic-patients-clean.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');

// Parse CSV
const lines = csvData.split('\n').filter(line => line.trim());
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

console.log(`Found ${lines.length - 1} rows in CSV`);
console.log('Headers:', headers);

// Parse patient data
const patients = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Simple CSV parsing (handles quoted fields)
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.replace(/"/g, '').trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.replace(/"/g, '').trim());

  if (values.length >= headers.length) {
    const patient = {};
    headers.forEach((header, index) => {
      patient[header] = values[index] || '';
    });
    patients.push(patient);
  }
}

console.log(`Parsed ${patients.length} patients`);

// Create a simple import script that can be run in the browser console
const importScript = `
// Patient data to import
const patientsToImport = ${JSON.stringify(patients, null, 2)};

console.log('Starting bulk import of', patientsToImport.length, 'patients...');

let imported = 0;
let failed = 0;

async function importPatients() {
  for (const patientData of patientsToImport) {
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
      const pin = (patientData.PIN || '').replace(/\\s+/g, '');

      // Validate PIN
      if (pin.length !== 12 || !/^\\d+$/.test(pin)) {
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
        patientId: \`PT-\${new Date().getFullYear()}-\${String(imported + 1).padStart(3, '0')}\`,
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

      // Import patient (this will use your existing addPatient function)
      const result = await window.addPatientToDB(patient);
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

  console.log(\`✅ Import complete! Successfully imported \${imported} patients, \${failed} failed\`);
}

// Run the import
importPatients();
`;

fs.writeFileSync('bulk_import_script.js', importScript);
console.log('Created bulk_import_script.js - copy this to browser console to import patients');