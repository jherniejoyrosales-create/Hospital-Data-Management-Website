import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { mockPatients } from '../lib/mockData';
import { initializeData } from '../lib/dataVersion';
import { PatientRecord } from '../lib/types';
import { getPatientById, updatePatient as updatePatientInDB, subscribeToPatients } from '../lib/database';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Printer, Edit, User, FileText, CreditCard, Calendar, MapPin, Phone, Users, Clock, Download } from 'lucide-react';
import EditPatientDialog from '../components/EditPatientDialog';
import { toast } from 'sonner';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logAction } = useAuth();
  
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load patient from Supabase
  useEffect(() => {
    const loadPatient = async () => {
      if (id) {
        const patientData = await getPatientById(id);
        if (patientData) {
          setPatient(patientData);
        }
        setLoading(false);
      }
    };

    loadPatient();
    initializeData();
  }, [id]);

  // Subscribe to real-time updates for this patient
  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToPatients((updatedPatients) => {
      const updatedPatient = updatedPatients.find(p => p.id === id);
      if (updatedPatient) {
        setPatient(updatedPatient);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    if (patient) {
      logAction('VIEW', `Patient ${patient.patientId}`, 'Viewed detailed patient record');
    }
  }, [patient]);

  const handleUpdatePatient = async (updatedPatient: PatientRecord) => {
    const result = await updatePatientInDB(updatedPatient);
    if (result) {
      setPatient(result);
      logAction('UPDATE', `Patient ${updatedPatient.patientId}`, `Updated patient record for ${updatedPatient.firstName} ${updatedPatient.lastName}`);
      toast.success('Patient updated successfully!');
    } else {
      toast.error('Failed to update patient');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500">Loading patient record...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-[#0D47A1]">Patient Not Found</h2>
          <p className="text-gray-500 mb-4">The requested patient record could not be found.</p>
          <Button onClick={() => navigate('/patients')} className="bg-[#2196F3] hover:bg-[#1976D2]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    logAction('PRINT', `Patient ${patient.patientId}`, 'Printed patient record');
    window.print();
    toast.success('Print dialog opened');
  };

  const handleExport = () => {
    logAction('EXPORT', `Patient ${patient.patientId}`, 'Exported patient record');
    const data = JSON.stringify(patient, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-${patient.patientId}.json`;
    a.click();
    toast.success('Patient record exported');
  };

  const formatPeso = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₱0.00';
    }
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    return category === 'MM' 
      ? <Badge className="bg-[#2196F3] hover:bg-[#1976D2] text-white">Member (MM)</Badge>
      : <Badge className="bg-[#0D47A1] hover:bg-[#0A3270] text-white">Dependent (DD)</Badge>;
  };

  const canEdit = user?.role === 'admin' || user?.role === 'doctor';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="text-[#2196F3]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-[#0D47A1]">{patient.lastName}, {patient.firstName} {patient.middleName}</h1>
            <p className="text-gray-500 mt-1">Patient ID: {patient.patientId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <EditPatientDialog patient={patient} onUpdatePatient={handleUpdatePatient} />
          )}
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD]">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-[#0D47A1]">A. Zarate General Hospital</h1>
        <p className="text-sm text-gray-600">Patient Case Record</p>
        <p className="text-xs text-gray-500 mt-1">The skill to heal, the spirit to serve</p>
      </div>

      {/* Patient Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-[#2196F3]">
          <CardHeader className="bg-[#E3F2FD]">
            <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-semibold text-[#0D47A1]">{patient.firstName} {patient.middleName} {patient.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="font-medium">{patient.patientId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PIN</p>
              <p className="font-medium">{patient.pin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <div className="mt-1">{getCategoryBadge(patient.category)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2196F3]">
          <CardHeader className="bg-[#E3F2FD]">
            <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
              <Calendar className="h-5 w-5" />
              Confinement Period
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">{new Date(patient.confinementStart).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">{new Date(patient.confinementEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">
                {Math.ceil((new Date(patient.confinementEnd).getTime() - new Date(patient.confinementStart).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2196F3]">
          <CardHeader className="bg-[#E3F2FD]">
            <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
              <Clock className="h-5 w-5" />
              Case Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">{getStatusBadge(patient.status)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date Filed</p>
              <p className="font-medium">{new Date(patient.dateFiled).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Days Since Filed</p>
              <p className={`font-semibold ${patient.daysSinceFiled > 30 && patient.status !== 'paid' && patient.status !== 'denied' ? 'text-[#F44336]' : 'text-[#0D47A1]'}`}>
                {patient.daysSinceFiled} days
              </p>
            </div>
            {patient.dateRefiled && (
              <div>
                <p className="text-sm text-gray-500">Date Refiled</p>
                <p className="font-medium">{new Date(patient.dateRefiled).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-gray-500 mt-1">Days since refiled: {patient.daysSinceRefiled}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Information */}
      <Card className="border-[#2196F3]">
        <CardHeader className="bg-[#E3F2FD]">
          <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
            <FileText className="h-5 w-5" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">ICD-10 Code</p>
              <p className="font-semibold text-lg text-[#2196F3]">{patient.icd10Code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ICD-10 Description</p>
              <p className="font-medium">{patient.icd10Description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card className="border-[#2196F3] bg-[#E3F2FD]">
        <CardHeader className="bg-[#2196F3] text-white">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600">Health Facility Fee</p>
              <p className="font-semibold text-xl text-[#0D47A1]">{formatPeso(patient.healthFacilityFee)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Professional Fee</p>
              <p className="font-semibold text-xl text-[#0D47A1]">{formatPeso(patient.professionalFee)}</p>
            </div>
            <div className="bg-[#2196F3] text-white p-4 rounded-md">
              <p className="text-sm">Case Rate</p>
              <p className="font-semibold text-xl">{formatPeso(patient.totalCaseRate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[#2196F3]">
          <CardHeader className="bg-[#E3F2FD]">
            <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
              <Users className="h-5 w-5" />
              Companion / Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{patient.companionName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Relationship</p>
              <p className="font-medium">{patient.relationship}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Number</p>
              <p className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#2196F3]" />
                {patient.contactNumber}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2196F3]">
          <CardHeader className="bg-[#E3F2FD]">
            <CardTitle className="flex items-center gap-2 text-[#0D47A1]">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {patient.street && (
                <div>
                  <p className="text-sm text-gray-500">Street</p>
                  <p className="font-medium mt-1">{patient.street}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {patient.barangay && (
                  <div>
                    <p className="text-sm text-gray-500">Barangay</p>
                    <p className="font-medium mt-1">{patient.barangay}</p>
                  </div>
                )}
                {patient.city && (
                  <div>
                    <p className="text-sm text-gray-500">City/Municipality</p>
                    <p className="font-medium mt-1">{patient.city}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {patient.province && (
                  <div>
                    <p className="text-sm text-gray-500">Province</p>
                    <p className="font-medium mt-1">{patient.province}</p>
                  </div>
                )}
                {patient.zipCode && (
                  <div>
                    <p className="text-sm text-gray-500">ZIP Code</p>
                    <p className="font-medium mt-1">{patient.zipCode}</p>
                  </div>
                )}
              </div>
              {/* Fallback to homeAddress if structured address is not available */}
              {!patient.street && !patient.barangay && !patient.city && !patient.province && patient.homeAddress && (
                <div>
                  <p className="text-sm text-gray-500">Home Address</p>
                  <p className="font-medium mt-1">{patient.homeAddress}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}