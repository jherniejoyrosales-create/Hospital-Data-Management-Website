import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth';
import { mockPatients } from '../lib/mockData';
import { initializeData } from '../lib/dataVersion';
import { PatientRecord } from '../lib/types';
import { getStorageMode, isSupabaseConfigured, setStorageMode } from '../lib/supabase';
import { 
  fetchPatients, 
  addPatient as addPatientToDB, 
  updatePatient as updatePatientInDB, 
  deletePatient as deletePatientFromDB,
  subscribeToPatients,
  migrateLocalStorageToSupabase,
  initializeDatabase,
  removeDuplicatePatients,
  fetchPatientsFromMode,
  testSupabaseConnection
} from '../lib/database';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Plus, Search, Filter, FileText, Download, Eye, Pencil, Trash2, Calendar, Printer, AlertCircle, X } from 'lucide-react';
import AddPatientDialog from '../components/AddPatientDialog';
import EditPatientDialog from '../components/EditPatientDialog';
import BulkImportButton from '../components/BulkImportButton';
import CloudStatusBanner from '../components/CloudStatusBanner';
import { toast } from 'sonner';

export default function Patients() {
  const { user, logAction } = useAuth();
  const [storageMode, setStorageModeState] = useState<'local' | 'supabase'>(getStorageMode());

  // Track when we last added a patient to prevent subscription override
  const lastAddTimeRef = useRef<number>(0);

  // Initialize database and migrate data on component mount
  useEffect(() => {
    const initDB = async () => {
      await initializeDatabase();

      // Check if migration has already been done
      const migrationComplete = localStorage.getItem('supabaseMigrationComplete');
      if (!migrationComplete) {
        const result = await migrateLocalStorageToSupabase();
        if (result.success && result.message && !result.message.includes('not configured')) {
          toast.success('Data migrated to cloud database successfully!');
        }
      }

      // Test Supabase connection
      if (isSupabaseConfigured()) {
        const testResult = await testSupabaseConnection();
        if (!testResult.success) {
          console.error('Supabase connection failed:', testResult.error);
          toast.error('Supabase connection failed - using local storage only');
        }
      }

      // Always try to load from the current storage mode first
      const patientsData = await fetchPatients();
      if (patientsData.length > 0) {
        setPatients(patientsData);
      } else {
        // If no data in current mode, try the other mode as fallback
        const fallbackMode = getStorageMode() === 'supabase' ? 'local' : 'supabase';
        const fallbackData = await fetchPatientsFromMode(fallbackMode);
        if (fallbackData.length > 0) {
          setPatients(fallbackData);
        }
      }
    };

    initDB();
    initializeData();
  }, []);

  // Get patients from Supabase (initialize with empty array)
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToPatients((updatedPatients) => {
      setPatients(current => {
        // Only update if we have more patients from the database (meaning sync worked)
        // or if enough time has passed since last add (3+ seconds)
        const now = Date.now();
        const timeSinceLastAdd = now - lastAddTimeRef.current;

        if (timeSinceLastAdd >= 3000 || updatedPatients.length > current.length) {
          return updatedPatients;
        }

        // Keep current state if we recently added a patient and database doesn't have more patients
        return current;
      });
    });

    // Also set up a periodic refresh as backup
    const refreshInterval = setInterval(async () => {
      if (isSupabaseConfigured()) {
        try {
          const currentPatients = await fetchPatients();
          setPatients(current => {
            const now = Date.now();
            const timeSinceLastAdd = now - lastAddTimeRef.current;

            if (timeSinceLastAdd >= 3000 || currentPatients.length > current.length) {
              return currentPatients;
            }
            return current;
          });
        } catch (error) {
          console.error('Error in periodic refresh:', error);
        }
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [storageMode]); // Re-subscribe when storage mode changes
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterICD10, setFilterICD10] = useState<string>('');
  const [filterPIN, setFilterPIN] = useState<string>('');
  const [confinementStart, setConfinementStart] = useState<string>('');
  const [confinementEnd, setConfinementEnd] = useState<string>('');

  useEffect(() => {
    logAction('VIEW', 'Patients List', 'Accessed patient records page');
  }, []);

  const handleAddPatient = async (newPatient: Omit<PatientRecord, 'id'>) => {
    lastAddTimeRef.current = Date.now();
    const addedPatient = await addPatientToDB(newPatient);

    if (addedPatient) {
      // Update state immediately with the new patient
      setPatients(current => [addedPatient, ...current]);

      logAction('CREATE', `Patient ${newPatient.patientId}`, `Created new patient record for ${newPatient.firstName} ${newPatient.lastName}`);
      toast.success('Patient added successfully!');
    } else {
      toast.error('Failed to add patient');
    }
  };

  const handleChangeStorageMode = async (mode: 'local' | 'supabase') => {
    setStorageMode(mode);
    setStorageModeState(mode);

    const patientsData = await fetchPatients();
    setPatients(patientsData);

    toast.success(`Storage mode changed to ${mode === 'supabase' ? 'Supabase' : 'Local'}`);
  };

  const handleBulkImport = async (newPatients: Array<Omit<PatientRecord, 'id'>>) => {
    let successCount = 0;
    let failCount = 0;

    for (const patient of newPatients) {
      try {
        const addedPatient = await addPatientToDB(patient);
        if (addedPatient) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    // Refresh patients list
    const updatedPatients = await fetchPatients();
    setPatients(updatedPatients);

    logAction('BULK_IMPORT', 'Patient Records', `Bulk imported ${successCount} patients (${failCount} failed)`);
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} patients!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    } else {
      toast.error('Failed to import patients');
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      const result = await removeDuplicatePatients();
      
      if (result.success) {
        if (result.removedCount === 0) {
          toast.info('No duplicate patients found!');
        } else {
          // Refresh patients list
          const updatedPatients = await fetchPatients();
          setPatients(updatedPatients);

          toast.success(`Successfully removed ${result.removedCount} duplicate patients! Kept ${result.uniqueCount} unique records.`);
          logAction('CLEANUP', 'Patient Records', `Removed ${result.removedCount} duplicate patients from ${result.uniqueCount} duplicate sets`);
        }
      } else {
        const errorMsg = result.error || 'Unknown error occurred';
        toast.error(`Failed to remove duplicates: ${errorMsg}`);
        console.error('Duplicate removal error:', result.error);
      }
    } catch (error) {
      toast.error(`Failed to remove duplicates: ${String(error)}`);
      console.error('Duplicate removal error:', error);
    }
  };

  const handleUpdatePatient = async (updatedPatient: PatientRecord) => {
    const result = await updatePatientInDB(updatedPatient);
    if (result) {
      // Don't manually update state - let real-time subscription handle it
      logAction('UPDATE', `Patient ${updatedPatient.patientId}`, `Updated patient record for ${updatedPatient.firstName} ${updatedPatient.lastName}`);
      toast.success('Patient updated successfully!');
    } else {
      toast.error('Failed to update patient');
    }
  };

  const handleDeletePatient = async (patient: PatientRecord) => {
    const success = await deletePatientFromDB(patient.id);
    if (success) {
      // Don't manually update state - let real-time subscription handle it
      logAction('DELETE', `Patient ${patient.patientId}`, `Deleted patient record for ${patient.firstName} ${patient.lastName}`);
      toast.success(`Patient ${patient.firstName} ${patient.lastName} deleted successfully`);
    } else {
      toast.error('Failed to delete patient');
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.middleName} ${patient.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || patient.category === filterCategory;
      
      const matchesICD10 = !filterICD10 || 
                          patient.icd10Code.toLowerCase().includes(filterICD10.toLowerCase()) ||
                          patient.icd10Description.toLowerCase().includes(filterICD10.toLowerCase());
      
      const matchesPIN = !filterPIN || patient.pin.toLowerCase().includes(filterPIN.toLowerCase());
      
      const matchesConfinementStart = !confinementStart || 
                                     new Date(patient.confinementStart) >= new Date(confinementStart);
      const matchesConfinementEnd = !confinementEnd || 
                                   new Date(patient.confinementEnd) <= new Date(confinementEnd);
      
      return matchesSearch && matchesStatus && matchesCategory && matchesICD10 && matchesPIN && 
             matchesConfinementStart && matchesConfinementEnd;
    });
  }, [patients, searchTerm, filterStatus, filterCategory, filterICD10, filterPIN, confinementStart, confinementEnd]);

  const handleExport = () => {
    logAction('EXPORT', 'Patient Records', `Exported ${filteredPatients.length} patient records to CSV`);
    
    const headers = ['Patient ID', 'Last Name', 'First Name', 'Middle Name', 'Category', 'Confinement Period', 'PIN', 'ICD-10', 'Health Facility Fee', 'Professional Fee', 'Case Rate', 'Status', 'Days Since Filed'];
    const csvData = filteredPatients.map(p => [
      p.patientId,
      p.lastName,
      p.firstName,
      p.middleName,
      p.category,
      `${p.confinementStart} to ${p.confinementEnd}`,
      p.pin,
      `${p.icd10Code} - ${p.icd10Description}`,
      p.healthFacilityFee,
      p.professionalFee,
      p.totalCaseRate,
      p.status,
      p.daysSinceFiled
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Patient records exported successfully');
  };

  const handlePrint = () => {
    logAction('PRINT', 'Patient Records', 'Printed patient records list');
    window.print();
    toast.success('Print dialog opened');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterICD10('');
    setFilterPIN('');
    setConfinementStart('');
    setConfinementEnd('');
    toast.info('Filters cleared');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-[#4CAF50] hover:bg-[#388E3C] text-white">Paid</Badge>;
      case 'in process':
        return <Badge className="bg-[#FF9800] hover:bg-[#F57C00] text-white">In Process</Badge>;
      case 'return to hospital':
        return <Badge className="bg-[#9C27B0] hover:bg-[#7B1FA2] text-white">Return to Hospital</Badge>;
      case 'denied':
        return <Badge className="bg-[#F44336] hover:bg-[#D32F2F] text-white">Denied</Badge>;
      case 'not yet filed':
        return <Badge className="bg-[#9E9E9E] hover:bg-[#757575] text-white">Not Yet Filed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    return category === 'MM' 
      ? <Badge className="bg-[#2196F3] hover:bg-[#1976D2] text-white">Member</Badge>
      : <Badge className="bg-[#0D47A1] hover:bg-[#0A3270] text-white">Dependent</Badge>;
  };

  // Check for overdue cases (more than 30 days since filed)
  const overdueCases = filteredPatients.filter(p => p.daysSinceFiled > 30 && p.status !== 'paid' && p.status !== 'denied');

  return (
    <div className="space-y-6">
      <CloudStatusBanner />
      
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-[#0D47A1]">Patient Case Management</h1>
          <p className="text-gray-500 mt-1">Manage patient records, billing, and case status</p>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'doctor') && (
            <AddPatientDialog onAddPatient={handleAddPatient} />
          )}
          <BulkImportButton onBulkImport={handleBulkImport} />
          {user?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-[#FF9800] text-[#FF9800] hover:bg-[#FFF3E0]">
                  <Trash2 className="h-4 w-4" />
                  Remove Duplicates
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Duplicate Patients</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will identify patients with the same PIN and remove duplicates, keeping only the most recent record for each unique PIN. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveDuplicates} className="bg-[#FF9800] hover:bg-[#F57C00]">
                    Remove Duplicates
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD]">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4 bg-white border border-gray-200 rounded p-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">Choose where patient records are saved</p>
            <p className="text-sm font-semibold text-gray-900">Storage mode</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={storageMode} onValueChange={handleChangeStorageMode}>
              <SelectTrigger className="min-w-[180px] bg-[#F5F7FA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local storage</SelectItem>
                <SelectItem value="supabase">Supabase</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500">
              {storageMode === 'supabase'
                ? 'Shared cloud storage across devices'
                : 'Saved only on this browser/device'}
            </div>
          </div>
        </div>
        {!isSupabaseConfigured() && storageMode === 'supabase' && (
          <div className="text-sm text-orange-700">
            Supabase is not configured. Open Settings and enter your Supabase URL and anon key.
          </div>
        )}
      </div>

      {/* Header for print only */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-[#0D47A1] text-xl font-bold">A. Zarate General Hospital</h1>
        <p className="text-[#0D47A1] text-sm">Patient Case Management Report</p>
        <p className="text-gray-600 text-xs">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Overdue Cases Alert */}
      {overdueCases.length > 0 && (
        <Card className="border-[#FF9800] bg-[#FFF3E0] no-print">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-[#F57C00]">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">
                {overdueCases.length} overdue case{overdueCases.length > 1 ? 's' : ''} (more than 30 days since filed)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-[#2196F3] no-print">
        <CardHeader className="bg-[#E3F2FD]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-[#2196F3] border-[#2196F3]">
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">Search by Name or ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#F5F5F5]"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-[#F5F5F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="in process">In Process</SelectItem>
                  <SelectItem value="return to hospital">Return to Hospital</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="not yet filed">Not Yet Filed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-[#F5F5F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="MM">Member (MM)</SelectItem>
                  <SelectItem value="DD">Dependent (DD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">PIN</label>
              <Input
                placeholder="Filter by PIN"
                value={filterPIN}
                onChange={(e) => setFilterPIN(e.target.value)}
                className="bg-[#F5F5F5]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">ICD-10 Code/Description</label>
              <Input
                placeholder="Filter by ICD-10"
                value={filterICD10}
                onChange={(e) => setFilterICD10(e.target.value)}
                className="bg-[#F5F5F5]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">Confinement Start (From)</label>
              <Input
                type="date"
                value={confinementStart}
                onChange={(e) => setConfinementStart(e.target.value)}
                className="bg-[#F5F5F5]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0D47A1]">Confinement End (To)</label>
              <Input
                type="date"
                value={confinementEnd}
                onChange={(e) => setConfinementEnd(e.target.value)}
                className="bg-[#F5F5F5]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Records Table */}
      <Card className="border-[#2196F3]">
        <CardHeader className="bg-[#E3F2FD]">
          <CardTitle className="text-[#0D47A1]">Patient Records</CardTitle>
          <CardDescription>
            Showing {filteredPatients.length} of {patients.length} patients
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F5F5] hover:bg-[#F5F5F5]">
                  <TableHead className="text-[#0D47A1]">Patient ID</TableHead>
                  <TableHead className="text-[#0D47A1]">Name</TableHead>
                  <TableHead className="text-[#0D47A1]">Category</TableHead>
                  <TableHead className="text-[#0D47A1]">ICD-10</TableHead>
                  <TableHead className="text-[#0D47A1]">Total Billing</TableHead>
                  <TableHead className="text-[#0D47A1]">Status</TableHead>
                  <TableHead className="text-[#0D47A1]">Days Filed</TableHead>
                  <TableHead className="text-[#0D47A1] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No patients found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-[#E3F2FD]">
                      <TableCell className="font-medium text-[#2196F3]">{patient.patientId}</TableCell>
                      <TableCell>
                        <div className="font-medium">{patient.lastName}, {patient.firstName}</div>
                        <div className="text-sm text-gray-500">{patient.middleName}</div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(patient.category)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{patient.icd10Code}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{patient.icd10Description}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-[#0D47A1]">
                        ₱{(patient.totalBilling || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(patient.status)}</TableCell>
                      <TableCell>
                        <div className={patient.daysSinceFiled > 30 && patient.status !== 'paid' && patient.status !== 'denied' ? 'text-[#F44336] font-semibold' : ''}>
                          {patient.daysSinceFiled} days
                        </div>
                        {patient.daysSinceRefiled && (
                          <div className="text-sm text-gray-500">Refiled: {patient.daysSinceRefiled} days</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/patients/${patient.id}`}>
                            <Button variant="outline" size="sm" className="text-[#2196F3] border-[#2196F3] hover:bg-[#E3F2FD]">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          {(user?.role === 'admin' || user?.role === 'doctor') && (
                            <>
                              <EditPatientDialog patient={patient} onUpdatePatient={handleUpdatePatient} />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-[#F44336] border-[#F44336] hover:bg-[#FFEBEE]">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the record for {patient.firstName} {patient.lastName} ({patient.patientId})? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePatient(patient)} className="bg-[#F44336] hover:bg-[#D32F2F]">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}