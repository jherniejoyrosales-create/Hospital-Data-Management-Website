import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PatientRecord } from '../lib/types';
import { getRatesByICDCode } from '../lib/icdRates';
import { PATIENT_RECORDS_CSV } from '../data/patient-records-embedded';

interface BulkImportButtonProps {
  onBulkImport: (patients: Array<Omit<PatientRecord, 'id'>>) => void;
}

export default function BulkImportButton({ onBulkImport }: BulkImportButtonProps) {
  const [importing, setImporting] = useState(false);

  const handleBulkImport = async () => {
    setImporting(true);
    
    try {
      console.log('Starting bulk import with embedded CSV data');
      
      const patients = parseCSV(PATIENT_RECORDS_CSV);
      
      console.log('Parsed patients:', patients.length);
      
      if (patients.length === 0) {
        toast.error('No valid patients found in CSV. Check console for details.');
        return;
      }
      
      onBulkImport(patients);
      toast.success(`Successfully imported ${patients.length} patients!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import patients. Please check the console.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Button
      onClick={handleBulkImport}
      disabled={importing}
      className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
    >
      <Upload className="h-4 w-4 mr-2" />
      {importing ? 'Importing...' : 'Bulk Import CSV'}
    </Button>
  );
}

function parseCSV(csvText: string): Array<Omit<PatientRecord, 'id'>> {
  // Handle both \r\n (Windows) and \n (Unix) line endings
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  
  console.log('Total lines:', lines.length);
  console.log('First line (header):', lines[0]);
  console.log('Second line (first patient):', lines[1]);
  
  if (lines.length < 2) {
    console.error('Not enough lines in CSV');
    return [];
  }

  const patients: Array<Omit<PatientRecord, 'id'>> = [];
  let skipped = 0;

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i];
      const columns = line.split('\t');
      
      if (columns.length < 10) {
        skipped++;
        continue;
      }

      // Extract data
      const patientId = columns[1]?.trim() || `PT-2026-${Math.floor(Math.random() * 90000) + 10000}`;
      const nameRaw = columns[2]?.trim();
      const confinementRaw = columns[3]?.trim();
      const pinRaw = columns[4]?.replace(/\s/g, '').trim();
      const medicalCode = columns[5]?.trim();
      const hf = parseFloat(columns[6]?.replace(/[,]/g, '') || '0');
      const pf = parseFloat(columns[7]?.replace(/[,]/g, '') || '0');
      const total = parseFloat(columns[8]?.replace(/[,]/g, '') || '0');
      const dateFiledRaw = columns[9]?.trim();
      const dateRefiledRaw = columns[10]?.trim();
      const statusRaw = columns[11]?.trim().toLowerCase();
      const companionName = columns[13]?.trim() || '';
      const relationship = columns[14]?.trim() || '';
      const contactNumber = columns[15]?.trim() || '';
      const homeAddress = columns[16]?.trim() || '';

      // Parse name
      if (!nameRaw) {
        console.log(`Line ${i}: No name`);
        skipped++;
        continue;
      }
      const nameParts = nameRaw.split(',').map(p => p.trim());
      if (nameParts.length < 2) {
        console.log(`Line ${i}: Invalid name format: ${nameRaw}`);
        skipped++;
        continue;
      }
      
      const lastName = nameParts[0];
      const firstNameParts = nameParts[1].split(' ');
      const firstName = firstNameParts[0];
      const middleName = firstNameParts.slice(1).join(' ');

      // Parse PIN - be more lenient, handle PINs with "/" or take first 12 digits
      let pin = '';
      if (pinRaw) {
        // If PIN has "/", take the first one
        const pinParts = pinRaw.split('/');
        pin = pinParts[0].trim().slice(0, 12).padEnd(12, '0');
      }
      
      // Skip if we don't have a valid PIN at all
      if (!pin || pin.length !== 12 || !/^\d+$/.test(pin)) {
        console.log(`Line ${i}: Invalid PIN: ${pinRaw} -> ${pin}`);
        skipped++;
        continue;
      }

      // Parse confinement dates
      let confinementStart = '';
      let confinementEnd = '';
      if (confinementRaw) {
        const dateRange = confinementRaw.split('-').map(d => d.trim());
        if (dateRange.length === 2) {
          confinementStart = parseDateString(dateRange[0]);
          confinementEnd = parseDateString(dateRange[1]);
        }
      }
      if (!confinementStart) confinementStart = new Date().toISOString().split('T')[0];
      if (!confinementEnd) confinementEnd = new Date().toISOString().split('T')[0];

      // Parse medical codes
      let icdCode = '';
      let rvsCode = '';
      if (medicalCode) {
        const codes = medicalCode.split(/[\/,;]/).map(c => c.trim());
        codes.forEach(code => {
          if (/[A-Z]/.test(code)) {
            if (!icdCode) icdCode = code;
          } else if (/^\d+$/.test(code)) {
            if (!rvsCode) rvsCode = code;
          }
        });
      }

      // Get ICD description
      let icdDescription = '';
      if (icdCode) {
        const rates = getRatesByICDCode(icdCode);
        if (rates) {
          icdDescription = rates.description;
        }
      }

      // Parse dates
      const dateFiled = parseDateString(dateFiledRaw) || new Date().toISOString().split('T')[0];
      const dateRefiled = parseDateString(dateRefiledRaw);

      // Parse status
      let status: 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed' = 'not yet filed';
      if (statusRaw.includes('paid')) {
        status = 'paid';
      } else if (statusRaw.includes('process')) {
        status = 'in process';
      }

      // Calculate days
      const daysSinceFiled = Math.floor((new Date().getTime() - new Date(dateFiled).getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceRefiled = dateRefiled ? Math.floor((new Date().getTime() - new Date(dateRefiled).getTime()) / (1000 * 60 * 60 * 24)) : undefined;

      const patient: Omit<PatientRecord, 'id'> = {
        patientId,
        lastName,
        firstName,
        middleName,
        category: 'MM',
        confinementStart,
        confinementEnd,
        pin,
        icd10Code: icdCode || 'A00',
        icd10Description: icdDescription || 'Unknown',
        rvsCode: rvsCode || undefined,
        rvsDescription: undefined,
        healthFacilityFee: hf,
        professionalFee: pf,
        totalCaseRate: total,
        totalBilling: total,
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

      patients.push(patient);
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
      skipped++;
      continue;
    }
  }

  console.log(`Successfully parsed ${patients.length} patients, skipped ${skipped}`);
  return patients;
}

function parseDateString(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  try {
    // Handle formats like "September 5, 2025" or "January 13,2026"
    const cleaned = dateStr.replace(/\s+/g, ' ').trim();
    const date = new Date(cleaned);
    
    if (isNaN(date.getTime())) {
      // Try MM/DD/YYYY format
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}