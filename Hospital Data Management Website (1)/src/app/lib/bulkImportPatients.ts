import { PatientRecord } from './types';
import { calculateDaysSince } from './icdRates';

// Parse date strings like "September 5, 2025" to "2025-09-05"
export function parseDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

// Parse confinement period like "07/08/2025 - 07/09/2025"
export function parseConfinementPeriod(period: string): { start: string; end: string } {
  if (!period || period.trim() === '') {
    return { start: '', end: '' };
  }
  
  const parts = period.split('-').map(p => p.trim());
  if (parts.length !== 2) {
    return { start: '', end: '' };
  }
  
  try {
    const [start, end] = parts;
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { start: '', end: '' };
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  } catch {
    return { start: '', end: '' };
  }
}

// Parse name "LastName, FirstName MiddleName"
export function parseName(fullName: string): { lastName: string; firstName: string; middleName: string } {
  if (!fullName) return { lastName: '', firstName: '', middleName: '' };
  
  const parts = fullName.split(',').map(p => p.trim());
  if (parts.length < 2) {
    return { lastName: fullName, firstName: '', middleName: '' };
  }
  
  const lastName = parts[0];
  const firstParts = parts[1].split(' ');
  
  if (firstParts.length === 1) {
    return { lastName, firstName: firstParts[0], middleName: '' };
  } else if (firstParts.length === 2) {
    return { lastName, firstName: firstParts[0], middleName: firstParts[1] };
  } else {
    // More than 2 parts - first is firstName, rest is middleName
    return {
      lastName,
      firstName: firstParts[0],
      middleName: firstParts.slice(1).join(' ')
    };
  }
}

// Parse ICD/RVS codes (can have multiple like "E29.1 / 54520" or "A09.9 , E86.2")
export function parseMedicalCodes(codeStr: string): {
  icdCodes: string[];
  rvsCodes: string[];
} {
  if (!codeStr) return { icdCodes: [], rvsCodes: [] };
  
  // Split by / or , or ;
  const codes = codeStr.split(/[\/,;]/).map(c => c.trim()).filter(c => c !== '');
  
  const icdCodes: string[] = [];
  const rvsCodes: string[] = [];
  
  codes.forEach(code => {
    // ICD codes typically have letters (like I10.1, A09.9, etc)
    // RVS codes are typically numeric (like 54520, 58120, etc)
    if (/[A-Z]/.test(code)) {
      icdCodes.push(code);
    } else if (/^\d+$/.test(code)) {
      rvsCodes.push(code);
    }
  });
  
  return { icdCodes, rvsCodes };
}

// Parse amount string "9,555.00" to number
export function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[,₱\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Convert CSV row to PatientRecord
export function csvRowToPatient(row: any): Omit<PatientRecord, 'id'> | null {
  try {
    // Parse name
    const { lastName, firstName, middleName } = parseName(row['Name'] || '');
    if (!lastName || !firstName) return null;
    
    // Parse confinement period
    const { start, end } = parseConfinementPeriod(row['Confinement Period'] || '');
    
    // Parse PIN
    const pin = (row['PIN'] || '').replace(/\s/g, '').slice(0, 12);
    if (!pin || pin.length !== 12) return null;
    
    // Parse medical codes
    const { icdCodes, rvsCodes } = parseMedicalCodes(row['ICD-10 Code'] || '');
    
    // Parse amounts
    const healthFacilityFee = parseAmount(row['HF'] || '0');
    const professionalFee = parseAmount(row['PF'] || '0');
    const totalCaseRate = parseAmount(row['TOTAL'] || '0');
    
    // Parse dates
    const dateFiled = parseDate(row['Date Filed'] || '') || new Date().toISOString().split('T')[0];
    const dateRefiled = parseDate(row['Date Refiled'] || '');
    
    // Parse status
    let status: 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed' = 'not yet filed';
    const statusStr = (row['Status'] || '').toLowerCase();
    if (statusStr.includes('paid')) {
      status = 'paid';
    } else if (statusStr.includes('process')) {
      status = 'in process';
    } else if (statusStr.includes('return')) {
      status = 'return to hospital';
    } else if (statusStr.includes('denied')) {
      status = 'denied';
    }
    
    // Generate patient ID
    const patientId = row['Patient ID'] || `PT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
    
    // Calculate days
    const daysSinceFiled = calculateDaysSince(dateFiled);
    const daysSinceRefiled = dateRefiled ? calculateDaysSince(dateRefiled) : undefined;
    
    // Companion info
    const companionName = row['Name'] || ''; // Column after Status
    const relationship = row['Relationship'] || '';
    const contactNumber = row['Contact Number'] || '';
    const homeAddress = row['Home Address'] || '';
    
    const patient: Omit<PatientRecord, 'id'> = {
      patientId,
      lastName,
      firstName,
      middleName,
      category: 'MM', // Default to Member
      confinementStart: start || new Date().toISOString().split('T')[0],
      confinementEnd: end || new Date().toISOString().split('T')[0],
      pin,
      icd10Code: icdCodes[0] || '',
      icd10Description: '',
      rvsCode: rvsCodes[0] || undefined,
      rvsDescription: undefined,
      healthFacilityFee,
      professionalFee,
      totalCaseRate,
      totalBilling: totalCaseRate,
      dateFiled,
      dateRefiled: dateRefiled || undefined,
      daysSinceFiled,
      daysSinceRefiled,
      status,
      companionName,
      relationship,
      contactNumber,
      homeAddress,
      street: '',
      barangay: '',
      city: 'Las Pinas City',
      province: 'Metro Manila',
      zipCode: ''
    };
    
    return patient;
  } catch (error) {
    console.error('Error parsing row:', error);
    return null;
  }
}

// Bulk import from CSV text
export function parseCsvData(csvText: string): Array<Omit<PatientRecord, 'id'>> {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  // Parse header
  const headers = lines[0].split('\t').map(h => h.trim());
  
  const patients: Array<Omit<PatientRecord, 'id'>> = [];
  
  // Parse rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length < headers.length) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : '';
    });
    
    const patient = csvRowToPatient(row);
    if (patient) {
      patients.push(patient);
    }
  }
  
  return patients;
}
