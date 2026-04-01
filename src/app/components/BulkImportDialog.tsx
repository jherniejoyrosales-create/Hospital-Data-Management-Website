import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { PatientRecord } from '../lib/types';
import { toast } from 'sonner';
import { calculateDaysSince } from '../lib/icdRates';

interface BulkImportDialogProps {
  onImportPatients: (patients: Omit<PatientRecord, 'id'>[]) => void;
}

interface ParsedRow {
  [key: string]: string;
}

export default function BulkImportDialog({ onImportPatients }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [parsedPatients, setParsedPatients] = useState<(Omit<PatientRecord, 'id'> | null)[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Try MM/DD/YYYY format
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const month = String(match[1]).padStart(2, '0');
      const day = String(match[2]).padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    
    // Try YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    return '';
  };

  const parseName = (fullName: string): { lastName: string; firstName: string; middleName: string } => {
    if (!fullName) return { lastName: '', firstName: '', middleName: '' };
    
    const parts = fullName.trim().split(',').map(p => p.trim());
    if (parts.length === 1) {
      // Format: First Middle Last
      const nameParts = parts[0].split(/\s+/);
      return {
        firstName: nameParts[0] || '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        lastName: nameParts[nameParts.length - 1] || ''
      };
    } else if (parts.length >= 2) {
      // Format: Last, First Middle
      return {
        lastName: parts[0] || '',
        firstName: parts[1] || '',
        middleName: parts.length > 2 ? parts.slice(2).join(' ') : ''
      };
    }
    
    return { lastName: '', firstName: '', middleName: '' };
  };

  const parseConfinementPeriod = (periodStr: string): { start: string; end: string } => {
    if (!periodStr) return { start: '', end: '' };
    
    const parts = periodStr.split(/[-–—]/).map(p => p.trim());
    if (parts.length >= 2) {
      return {
        start: parseDate(parts[0]),
        end: parseDate(parts[1])
      };
    }
    
    const singleDate = parseDate(periodStr);
    return {
      start: singleDate,
      end: singleDate
    };
  };

  const parseStatusV = (status: string): 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed' => {
    const statusLower = status.toLowerCase().trim();
    
    if (statusLower.includes('paid')) return 'paid';
    if (statusLower.includes('in process') || statusLower.includes('in-process')) return 'in process';
    if (statusLower.includes('return')) return 'return to hospital';
    if (statusLower.includes('denied')) return 'denied';
    
    return 'not yet filed';
  };

  const parseCompanionInfo = (companionStr: string): { name: string; relationship: string } => {
    if (!companionStr) return { name: '', relationship: '' };
    
    // Try to match "Name, Relationship" format
    const match = companionStr.match(/^([^,]+),\s*(.+)$/);
    if (match) {
      return {
        name: match[1].trim(),
        relationship: match[2].trim()
      };
    }
    
    return { name: companionStr, relationship: '' };
  };

  const parseCSVRow = (row: ParsedRow, rowIndex: number): Omit<PatientRecord, 'id'> | null => {
    try {
      const lastName = row['Name']?.split(',')[0]?.trim() || row['lastName'] || '';
      const firstName = row['Name']?.split(',')[1]?.trim() || row['firstName'] || '';
      const middleName = row['middleName'] || '';
      
      const confinementPeriod = parseConfinementPeriod(row['Confinement Period'] || row['confinement'] || '');
      const pin = (row['PIN'] || '').replace(/\D/g, '');
      const icd10Code = row['ICD-10 Code'] || row['ICD10'] || '';
      
      // Required validation
      if (!firstName || !lastName || !pin || !icd10Code) {
        return null;
      }

      if (pin.length !== 12) {
        return null;
      }

      const healthFee = parseFloat((row['HF'] || row['Health Facility Fee'] || '0').replace(/[^0-9.]/g, '')) || 0;
      const profFee = parseFloat((row['PF'] || row['Professional Fee'] || '0').replace(/[^0-9.]/g, '')) || 0;
      const caseRate = parseFloat((row['TOTAL'] || row['Total Case Rate'] || '0').replace(/[^0-9.]/g, '')) || 0;
      
      const dateFiled = parseDate(row['Date Filed'] || new Date().toISOString().split('T')[0]);
      const dateRefiled = row['Date Refiled'] ? parseDate(row['Date Refiled']) : undefined;
      
      const status = parseStatusV(row['Status'] || 'not yet filed');
      
      const companionInfo = parseCompanionInfo(row['Companion Name'] || '');
      const contactNumber = row['Contact Number'] || '';
      const homeAddress = row['Home Address'] || '';
      
      // Generate patient ID
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 900) + 100;
      const patientId = `PT-${year}-${randomNum}`;

      const daysSinceFiled = calculateDaysSince(dateFiled);
      const daysSinceRefiled = dateRefiled ? calculateDaysSince(dateRefiled) : undefined;

      return {
        patientId,
        lastName,
        firstName,
        middleName,
        category: 'MM',
        confinementStart: confinementPeriod.start,
        confinementEnd: confinementPeriod.end,
        pin,
        icd10Code,
        icd10Description: row['ICD-10 Description'] || '',
        healthFacilityFee: healthFee,
        professionalFee: profFee,
        totalCaseRate: caseRate,
        dateFiled,
        dateRefiled,
        daysSinceFiled,
        daysSinceRefiled,
        status,
        companionName: companionInfo.name,
        relationship: companionInfo.relationship,
        contactNumber,
        homeAddress,
        street: '',
        barangay: '',
        city: '',
        province: '',
        zipCode: '',
      };
    } catch (error) {
      console.error(`Error parsing row ${rowIndex}:`, error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const newErrors: string[] = [];

    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        toast.error('CSV file must contain headers and at least one data row');
        setIsLoading(false);
        return;
      }

      // Parse header
      const headerLine = lines[0];
      const headers = headerLine.split('\t').map(h => h.trim());
      
      // Parse rows
      const parsed: (Omit<PatientRecord, 'id'> | null)[] = [];
      let validCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split('\t');
        const row: ParsedRow = {};

        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });

        const patient = parseCSVRow(row, i);
        
        if (patient) {
          parsed.push(patient);
          validCount++;
        } else {
          newErrors.push(`Row ${i}: Missing or invalid required fields (Name, PIN, ICD-10 Code)`);
        }
      }

      if (validCount === 0) {
        toast.error('No valid patient records found in the CSV file');
        setIsLoading(false);
        return;
      }

      setParsedPatients(parsed);
      setErrors(newErrors);
      setPreviewOpen(true);
      toast.success(`Found ${validCount} valid patient records`);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading CSV file. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    const validPatients = parsedPatients.filter((p): p is Omit<PatientRecord, 'id'> => p !== null);
    
    if (validPatients.length === 0) {
      toast.error('No valid patients to import');
      return;
    }

    onImportPatients(validPatients);
    setParsedPatients([]);
    setErrors([]);
    setPreviewOpen(false);
    setOpen(false);
    toast.success(`${validPatients.length} patients imported successfully!`);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0D47A1]">Bulk Import Patients</DialogTitle>
            <DialogDescription>
              Upload a CSV or TSV file to import multiple patient records at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">CSV/TSV Format Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Tab-separated or comma-separated values</li>
                <li>• Required columns: <code className="bg-white px-2 py-1 rounded">Name</code>, <code className="bg-white px-2 py-1 rounded">PIN</code>, <code className="bg-white px-2 py-1 rounded">ICD-10 Code</code></li>
                <li>• Name format: "Last, First" or "First Middle Last"</li>
                <li>• PIN must be 12 digits</li>
                <li>• Dates format: MM/DD/YYYY or YYYY-MM-DD</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-[#2196F3] rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition"
              onClick={() => document.getElementById('csv-file-input')?.click()}>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-[#2196F3]" />
              <p className="text-sm font-medium text-gray-700">
                {isLoading ? 'Processing...' : 'Click to select CSV/TSV file or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0D47A1]">Import Preview</AlertDialogTitle>
            <AlertDialogDescription>
              {parsedPatients.length} patient records ready to import
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Skipped Rows</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">{parsedPatients.length} Records to Import</h4>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {parsedPatients.map((patient, i) => 
                  patient ? (
                    <div key={i} className="bg-white p-3 rounded border border-green-100 text-sm">
                      <p className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-gray-600">
                        PIN: {patient.pin} | ICD-10: {patient.icd10Code}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmImport}
              className="bg-green-600 hover:bg-green-700"
            >
              Import {parsedPatients.length} Patients
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
