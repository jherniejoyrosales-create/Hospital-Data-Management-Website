import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth';
import { mockPatients } from '../lib/mockData';
import { PatientRecord } from '../lib/types';
import { 
  fetchPatients, 
  addPatient as addPatientToDB, 
  updatePatient as updatePatientInDB, 
  deletePatient as deletePatientFromDB,
  subscribeToPatients,
  migrateLocalStorageToSupabase,
  initializeDatabase,
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
import CloudStatusBanner from '../components/CloudStatusBanner';
import { toast } from 'sonner';

type PrintSize = 'a4' | 'long' | 'short';

export default function Patients() {
  const { user, logAction } = useAuth();

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
      
      // Load patients from database (Supabase or localStorage)
      const patientsData = await fetchPatients();
      setPatients(patientsData); // Always set patients, even if empty array
    };

    initDB();
  }, []);

  // Get patients from Supabase (initialize with empty array)
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToPatients((updatedPatients) => {
      setPatients(updatedPatients);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
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
    const addedPatient = await addPatientToDB(newPatient);
    if (addedPatient) {
      setPatients([addedPatient, ...patients]);
      logAction('CREATE', `Patient ${newPatient.patientId}`, `Created new patient record for ${newPatient.firstName} ${newPatient.lastName}`);
      toast.success('Patient added successfully!');
    } else {
      toast.error('Failed to add patient');
    }
  };

  const handleUpdatePatient = async (updatedPatient: PatientRecord) => {
    const result = await updatePatientInDB(updatedPatient);
    if (result) {
      setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      logAction('UPDATE', `Patient ${updatedPatient.patientId}`, `Updated patient record for ${updatedPatient.firstName} ${updatedPatient.lastName}`);
      toast.success('Patient updated successfully!');
    } else {
      toast.error('Failed to update patient');
    }
  };

  const handleDeletePatient = async (patient: PatientRecord) => {
    const success = await deletePatientFromDB(patient.id);
    if (success) {
      setPatients(patients.filter(p => p.id !== patient.id));
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

  const injectPrintStyle = (printSize: PrintSize) => {
    const styleId = 'custom-print-size';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const pageRule = printSize === 'long'
      ? '@page { size: 8.5in 13in; margin: 0.4cm; }'
      : printSize === 'short'
        ? '@page { size: 8.5in 11in; margin: 0.4cm; }'
        : '@page { size: A4 portrait; margin: 0.4cm; }';

    styleElement.textContent = `@media print { ${pageRule} }`;
  };

  const removePrintStyle = () => {
    const styleElement = document.getElementById('custom-print-size');
    if (styleElement) {
      styleElement.remove();
    }
  };

  const handlePrint = (paperSize: PrintSize) => {
    injectPrintStyle(paperSize);
    logAction('PRINT', 'Patient Records', `Printed patient records list (${paperSize.toUpperCase()})`);
    window.print();
    setTimeout(removePrintStyle, 1000);
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
            <>
              <AddPatientDialog onAddPatient={handleAddPatient} />
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD]">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Choose paper size</AlertDialogTitle>
                <AlertDialogDescription>
                  Select the paper size before printing: A4, long, or short.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-3 py-4">
                <AlertDialogAction asChild>
                  <Button onClick={() => handlePrint('a4')} className="w-full">
                    A4
                  </Button>
                </AlertDialogAction>
                <AlertDialogAction asChild>
                  <Button onClick={() => handlePrint('long')} className="w-full">
                    Long
                  </Button>
                </AlertDialogAction>
                <AlertDialogAction asChild>
                  <Button onClick={() => handlePrint('short')} className="w-full">
                    Short
                  </Button>
                </AlertDialogAction>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleExport} className="flex items-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
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