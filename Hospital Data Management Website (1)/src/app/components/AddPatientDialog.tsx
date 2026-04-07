import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, Search, X, FileBarChart, Stethoscope, Package, Heart } from 'lucide-react';
import { PatientRecord } from '../lib/types';
import { toast } from 'sonner';
import { getRatesByICDCode, searchICDCodes, calculateDaysSince } from '../lib/icdRates';
import { zBenefitPackages } from '../lib/zBenefitPackages';
import { konsultaPackages } from '../lib/konsultaPackages';

interface AddPatientDialogProps {
  onAddPatient: (patient: Omit<PatientRecord, 'id'>) => void;
}

export default function AddPatientDialog({ onAddPatient }: AddPatientDialogProps) {
  const [open, setOpen] = useState(false);
  
  // ICD Code State
  const [icdSearchQuery, setIcdSearchQuery] = useState('');
  const [showIcdResults, setShowIcdResults] = useState(false);
  const [icdCode, setIcdCode] = useState('');
  const [icdDescription, setIcdDescription] = useState('');
  const [icdHealthFee, setIcdHealthFee] = useState(0);
  const [icdProfFee, setIcdProfFee] = useState(0);
  const [icdCaseRate, setIcdCaseRate] = useState(0);
  
  // RVS Code State
  const [rvsSearchQuery, setRvsSearchQuery] = useState('');
  const [showRvsResults, setShowRvsResults] = useState(false);
  const [rvsCode, setRvsCode] = useState('');
  const [rvsDescription, setRvsDescription] = useState('');
  const [rvsHealthFee, setRvsHealthFee] = useState(0);
  const [rvsProfFee, setRvsProfFee] = useState(0);
  const [rvsCaseRate, setRvsCaseRate] = useState(0);
  
  // Z-Benefit State
  const [zBenefitSearchQuery, setZBenefitSearchQuery] = useState('');
  const [showZBenefitResults, setShowZBenefitResults] = useState(false);
  const [zBenefitCode, setZBenefitCode] = useState('');
  const [zBenefitDescription, setZBenefitDescription] = useState('');
  const [zBenefitRate, setZBenefitRate] = useState(0);
  
  // Konsulta State
  const [konsultaSearchQuery, setKonsultaSearchQuery] = useState('');
  const [showKonsultaResults, setShowKonsultaResults] = useState(false);
  const [konsultaCode, setKonsultaCode] = useState('');
  const [konsultaDescription, setKonsultaDescription] = useState('');
  const [konsultaRate, setKonsultaRate] = useState(0);
  
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    category: 'MM' as 'MM' | 'DD',
    confinementStart: '',
    confinementEnd: '',
    pin: '',
    dateFiled: new Date().toISOString().split('T')[0],
    dateRefiled: '',
    status: 'not yet filed' as 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed',
    companionName: '',
    relationship: '',
    contactNumber: '',
    homeAddress: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ICD Code Handlers
  const handleICDCodeChange = (code: string) => {
    setIcdSearchQuery(code);
    setShowIcdResults(true);
    
    const rates = getRatesByICDCode(code);
    if (rates) {
      setIcdCode(code);
      setIcdDescription(rates.description);
      setIcdHealthFee(rates.healthFacilityFee);
      setIcdProfFee(rates.professionalFee);
      setIcdCaseRate(rates.totalCaseRate);
      setShowIcdResults(false);
    }
  };

  const selectICDCode = (code: string, description: string, healthFee: number, profFee: number, caseRate: number) => {
    setIcdCode(code);
    setIcdDescription(description);
    setIcdHealthFee(healthFee);
    setIcdProfFee(profFee);
    setIcdCaseRate(caseRate);
    setIcdSearchQuery(code);
    setShowIcdResults(false);
  };

  const clearICDCode = () => {
    setIcdCode('');
    setIcdDescription('');
    setIcdSearchQuery('');
    setIcdHealthFee(0);
    setIcdProfFee(0);
    setIcdCaseRate(0);
  };

  const icdSearchResults = icdSearchQuery.length >= 2 ? searchICDCodes(icdSearchQuery) : [];

  // RVS Code Handlers
  const handleRVSCodeChange = (code: string) => {
    setRvsSearchQuery(code);
    setShowRvsResults(true);
    
    const stored = localStorage.getItem('hospitalRVSCodes');
    if (stored) {
      const rvsCodes = JSON.parse(stored);
      const match = rvsCodes.find((c: any) => c.code.toUpperCase() === code.toUpperCase());
      if (match) {
        setRvsCode(code);
        setRvsDescription(match.description);
        setRvsHealthFee(match.healthFacilityFee);
        setRvsProfFee(match.professionalFee);
        setRvsCaseRate(match.totalCaseRate);
        setShowRvsResults(false);
      }
    }
  };

  const selectRVSCode = (code: string, description: string, healthFee: number, profFee: number, caseRate: number) => {
    setRvsCode(code);
    setRvsDescription(description);
    setRvsHealthFee(healthFee);
    setRvsProfFee(profFee);
    setRvsCaseRate(caseRate);
    setRvsSearchQuery(code);
    setShowRvsResults(false);
  };

  const clearRVSCode = () => {
    setRvsCode('');
    setRvsDescription('');
    setRvsSearchQuery('');
    setRvsHealthFee(0);
    setRvsProfFee(0);
    setRvsCaseRate(0);
  };

  const rvsSearchResults = (() => {
    if (rvsSearchQuery.length < 2) return [];
    const stored = localStorage.getItem('hospitalRVSCodes');
    if (stored) {
      const rvsCodes = JSON.parse(stored);
      return rvsCodes
        .filter((code: any) => 
          code.code.toLowerCase().includes(rvsSearchQuery.toLowerCase()) ||
          code.description.toLowerCase().includes(rvsSearchQuery.toLowerCase())
        )
        .slice(0, 10);
    }
    return [];
  })();

  // Z-Benefit Handlers
  const handleZBenefitChange = (code: string) => {
    setZBenefitSearchQuery(code);
    setShowZBenefitResults(true);
    
    const match = zBenefitPackages.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (match) {
      setZBenefitCode(code);
      setZBenefitDescription(match.description);
      setZBenefitRate(match.packageRate);
      setShowZBenefitResults(false);
    }
  };

  const selectZBenefit = (code: string, description: string, rate: number) => {
    setZBenefitCode(code);
    setZBenefitDescription(description);
    setZBenefitRate(rate);
    setZBenefitSearchQuery(code);
    setShowZBenefitResults(false);
  };

  const clearZBenefit = () => {
    setZBenefitCode('');
    setZBenefitDescription('');
    setZBenefitSearchQuery('');
    setZBenefitRate(0);
  };

  const zBenefitSearchResults = zBenefitSearchQuery.length >= 2 
    ? zBenefitPackages
        .filter(pkg => 
          pkg.code.toLowerCase().includes(zBenefitSearchQuery.toLowerCase()) ||
          pkg.description.toLowerCase().includes(zBenefitSearchQuery.toLowerCase())
        )
        .slice(0, 10)
    : [];

  // Konsulta Handlers
  const handleKonsultaChange = (code: string) => {
    setKonsultaSearchQuery(code);
    setShowKonsultaResults(true);
    
    const match = konsultaPackages.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (match) {
      setKonsultaCode(code);
      setKonsultaDescription(match.description);
      setKonsultaRate(match.packageRate);
      setShowKonsultaResults(false);
    }
  };

  const selectKonsulta = (code: string, description: string, rate: number) => {
    setKonsultaCode(code);
    setKonsultaDescription(description);
    setKonsultaRate(rate);
    setKonsultaSearchQuery(code);
    setShowKonsultaResults(false);
  };

  const clearKonsulta = () => {
    setKonsultaCode('');
    setKonsultaDescription('');
    setKonsultaSearchQuery('');
    setKonsultaRate(0);
  };

  const konsultaSearchResults = konsultaSearchQuery.length >= 2 
    ? konsultaPackages
        .filter(pkg => 
          pkg.code.toLowerCase().includes(konsultaSearchQuery.toLowerCase()) ||
          pkg.description.toLowerCase().includes(konsultaSearchQuery.toLowerCase())
        )
        .slice(0, 10)
    : [];

  // Calculate totals
  const totalHealthFee = icdHealthFee + rvsHealthFee;
  const totalProfFee = icdProfFee + rvsProfFee;
  const totalCaseRate = icdCaseRate + rvsCaseRate + zBenefitRate + konsultaRate;
  const totalBilling = totalCaseRate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.confinementStart || !formData.confinementEnd || !formData.pin) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Must have at least one code
    if (!icdCode && !rvsCode && !zBenefitCode && !konsultaCode) {
      toast.error('Please select at least one medical code or package');
      return;
    }

    // Validate PIN is exactly 12 digits
    if (formData.pin.length !== 12) {
      toast.error('PIN must be exactly 12 digits');
      return;
    }

    // Generate patient ID
    const date = new Date();
    const year = date.getFullYear();
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const patientId = `PT-${year}-${randomNum}`;

    const daysSinceFiled = calculateDaysSince(formData.dateFiled);
    const daysSinceRefiled = formData.dateRefiled ? calculateDaysSince(formData.dateRefiled) : undefined;

    const newPatient: Omit<PatientRecord, 'id'> = {
      patientId,
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      category: formData.category,
      confinementStart: formData.confinementStart,
      confinementEnd: formData.confinementEnd,
      pin: formData.pin,
      icd10Code: icdCode || '',
      icd10Description: icdDescription || '',
      rvsCode: rvsCode || undefined,
      rvsDescription: rvsDescription || undefined,
      zBenefitCode: zBenefitCode || undefined,
      zBenefitDescription: zBenefitDescription || undefined,
      konsultaCode: konsultaCode || undefined,
      konsultaDescription: konsultaDescription || undefined,
      healthFacilityFee: totalHealthFee,
      professionalFee: totalProfFee,
      totalCaseRate: totalCaseRate,
      totalBilling,
      dateFiled: formData.dateFiled,
      dateRefiled: formData.dateRefiled || undefined,
      daysSinceFiled,
      daysSinceRefiled,
      status: formData.status,
      companionName: formData.companionName,
      relationship: formData.relationship,
      contactNumber: formData.contactNumber,
      homeAddress: formData.homeAddress,
      street: formData.street,
      barangay: formData.barangay,
      city: formData.city,
      province: formData.province,
      zipCode: formData.zipCode,
    };

    onAddPatient(newPatient);
    
    const codesUsed = [
      icdCode && `ICD: ${icdCode}`,
      rvsCode && `RVS: ${rvsCode}`,
      zBenefitCode && `Z-Benefit: ${zBenefitCode}`,
      konsultaCode && `Konsulta: ${konsultaCode}`
    ].filter(Boolean).join(', ');
    
    toast.success(`Patient ${formData.firstName} ${formData.lastName} added with ${codesUsed}!`);
    
    // Reset all states
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setFormData({
      lastName: '',
      firstName: '',
      middleName: '',
      category: 'MM',
      confinementStart: '',
      confinementEnd: '',
      pin: '',
      dateFiled: new Date().toISOString().split('T')[0],
      dateRefiled: '',
      status: 'not yet filed',
      companionName: '',
      relationship: '',
      contactNumber: '',
      homeAddress: '',
      street: '',
      barangay: '',
      city: '',
      province: '',
      zipCode: '',
    });
    clearICDCode();
    clearRVSCode();
    clearZBenefit();
    clearKonsulta();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#2196F3] hover:bg-[#1976D2]">
          <Plus className="h-4 w-4" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0D47A1]">Add New Patient Record</DialogTitle>
          <DialogDescription>
            Enter complete patient information. You can add multiple codes (ICD + RVS + Z-Benefit + Konsulta). Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="e.g., Dela Cruz"
                  required
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="e.g., Juan"
                  required
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  placeholder="e.g., Santos"
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger id="category" className="bg-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM">Member (MM)</SelectItem>
                    <SelectItem value="DD">Dependent (DD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (12-Digit Patient Identification Number) *</Label>
                <Input
                  id="pin"
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    handleChange('pin', value);
                  }}
                  placeholder="e.g., 123456789012"
                  required
                  maxLength={12}
                  className="bg-[#F5F5F5]"
                />
                <p className="text-xs text-gray-500">Enter exactly 12 digits (current: {formData.pin.length}/12)</p>
              </div>
            </div>
          </div>

          {/* Confinement Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Confinement Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confinementStart">Start Date *</Label>
                <Input
                  id="confinementStart"
                  type="date"
                  value={formData.confinementStart}
                  onChange={(e) => handleChange('confinementStart', e.target.value)}
                  required
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confinementEnd">End Date *</Label>
                <Input
                  id="confinementEnd"
                  type="date"
                  value={formData.confinementEnd}
                  onChange={(e) => handleChange('confinementEnd', e.target.value)}
                  required
                  className="bg-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          {/* Medical Codes - Multiple Sections */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">
              Medical Codes & Packages (Select one or more)
            </h3>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              💡 <strong>Tip:</strong> You can combine codes! For example: Add an ICD diagnosis code + RVS procedure code, or add Z-Benefit package + Konsulta consultation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ICD Code Section */}
              <div className="border-2 border-[#2196F3] rounded-lg p-4 bg-gradient-to-br from-[#E3F2FD] to-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileBarChart className="w-5 h-5 text-[#2196F3]" />
                    <Label className="text-[#0D47A1] font-semibold text-base">ICD-10 Code (Diagnosis)</Label>
                  </div>
                  {icdCode && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearICDCode} className="h-6 w-6 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {icdCode ? (
                  <div className="bg-white p-3 rounded border border-[#2196F3]">
                    <div className="font-semibold text-[#0D47A1]">{icdCode}</div>
                    <div className="text-sm text-gray-600 mt-1">{icdDescription}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      HF: ₱{icdHealthFee.toLocaleString()} | PF: ₱{icdProfFee.toLocaleString()} | CR: ₱{icdCaseRate.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={icdSearchQuery}
                      onChange={(e) => handleICDCodeChange(e.target.value)}
                      onFocus={() => setShowIcdResults(true)}
                      placeholder="Type ICD code or diagnosis..."
                      className="pl-10 bg-white"
                    />
                    {showIcdResults && icdSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-[#2196F3] rounded-md shadow-lg max-h-60 overflow-auto">
                        {icdSearchResults.map((result) => (
                          <button
                            key={result.code}
                            type="button"
                            onClick={() => selectICDCode(result.code, result.description, result.healthFacilityFee, result.professionalFee, result.totalCaseRate)}
                            className="w-full text-left px-4 py-3 hover:bg-[#E3F2FD] border-b border-gray-100 last:border-0"
                          >
                            <div className="font-semibold text-[#0D47A1] text-sm">{result.code}</div>
                            <div className="text-xs text-gray-600">{result.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RVS Code Section */}
              <div className="border-2 border-[#2196F3] rounded-lg p-4 bg-gradient-to-br from-[#E3F2FD] to-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[#2196F3]" />
                    <Label className="text-[#0D47A1] font-semibold text-base">RVS Code (Procedure)</Label>
                  </div>
                  {rvsCode && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearRVSCode} className="h-6 w-6 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {rvsCode ? (
                  <div className="bg-white p-3 rounded border border-[#2196F3]">
                    <div className="font-semibold text-[#0D47A1]">{rvsCode}</div>
                    <div className="text-sm text-gray-600 mt-1">{rvsDescription}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      HF: ₱{rvsHealthFee.toLocaleString()} | PF: ₱{rvsProfFee.toLocaleString()} | CR: ₱{rvsCaseRate.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={rvsSearchQuery}
                      onChange={(e) => handleRVSCodeChange(e.target.value)}
                      onFocus={() => setShowRvsResults(true)}
                      placeholder="Type RVS code or procedure..."
                      className="pl-10 bg-white"
                    />
                    {showRvsResults && rvsSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-[#2196F3] rounded-md shadow-lg max-h-60 overflow-auto">
                        {rvsSearchResults.map((result) => (
                          <button
                            key={result.code}
                            type="button"
                            onClick={() => selectRVSCode(result.code, result.description, result.healthFacilityFee, result.professionalFee, result.totalCaseRate)}
                            className="w-full text-left px-4 py-3 hover:bg-[#E3F2FD] border-b border-gray-100 last:border-0"
                          >
                            <div className="font-semibold text-[#0D47A1] text-sm">{result.code}</div>
                            <div className="text-xs text-gray-600">{result.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Z-Benefit Section */}
              <div className="border-2 border-[#2196F3] rounded-lg p-4 bg-gradient-to-br from-[#E3F2FD] to-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#2196F3]" />
                    <Label className="text-[#0D47A1] font-semibold text-base">Z-Benefit Package</Label>
                  </div>
                  {zBenefitCode && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearZBenefit} className="h-6 w-6 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {zBenefitCode ? (
                  <div className="bg-white p-3 rounded border border-[#2196F3]">
                    <div className="font-semibold text-[#0D47A1]">{zBenefitCode}</div>
                    <div className="text-sm text-gray-600 mt-1">{zBenefitDescription}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Package Rate: ₱{zBenefitRate.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={zBenefitSearchQuery}
                      onChange={(e) => handleZBenefitChange(e.target.value)}
                      onFocus={() => setShowZBenefitResults(true)}
                      placeholder="Type Z-Benefit code..."
                      className="pl-10 bg-white"
                    />
                    {showZBenefitResults && zBenefitSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-[#2196F3] rounded-md shadow-lg max-h-60 overflow-auto">
                        {zBenefitSearchResults.map((result) => (
                          <button
                            key={result.code}
                            type="button"
                            onClick={() => selectZBenefit(result.code, result.description, result.packageRate)}
                            className="w-full text-left px-4 py-3 hover:bg-[#E3F2FD] border-b border-gray-100 last:border-0"
                          >
                            <div className="font-semibold text-[#0D47A1] text-sm">{result.code}</div>
                            <div className="text-xs text-gray-600">{result.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Konsulta Section */}
              <div className="border-2 border-[#2196F3] rounded-lg p-4 bg-gradient-to-br from-[#E3F2FD] to-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#2196F3]" />
                    <Label className="text-[#0D47A1] font-semibold text-base">Konsulta Package</Label>
                  </div>
                  {konsultaCode && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearKonsulta} className="h-6 w-6 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {konsultaCode ? (
                  <div className="bg-white p-3 rounded border border-[#2196F3]">
                    <div className="font-semibold text-[#0D47A1]">{konsultaCode}</div>
                    <div className="text-sm text-gray-600 mt-1">{konsultaDescription}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Package Rate: ₱{konsultaRate.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={konsultaSearchQuery}
                      onChange={(e) => handleKonsultaChange(e.target.value)}
                      onFocus={() => setShowKonsultaResults(true)}
                      placeholder="Type Konsulta code..."
                      className="pl-10 bg-white"
                    />
                    {showKonsultaResults && konsultaSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-[#2196F3] rounded-md shadow-lg max-h-60 overflow-auto">
                        {konsultaSearchResults.map((result) => (
                          <button
                            key={result.code}
                            type="button"
                            onClick={() => selectKonsulta(result.code, result.description, result.packageRate)}
                            className="w-full text-left px-4 py-3 hover:bg-[#E3F2FD] border-b border-gray-100 last:border-0"
                          >
                            <div className="font-semibold text-[#0D47A1] text-sm">{result.code}</div>
                            <div className="text-xs text-gray-600">{result.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing Summary */}
          <div className="space-y-4 bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] p-6 rounded-lg border-2 border-[#2196F3]">
            <h3 className="font-semibold text-lg text-[#0D47A1] flex items-center gap-2">
              💰 Combined Billing Summary
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-[#2196F3] flex items-center justify-between">
                <div className="text-sm text-gray-600">Health Facility Fee</div>
                <div className="text-2xl font-bold text-[#0D47A1]">₱{totalHealthFee.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-[#2196F3] flex items-center justify-between">
                <div className="text-sm text-gray-600">Professional Fee</div>
                <div className="text-2xl font-bold text-[#0D47A1]">₱{totalProfFee.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-[#2196F3] flex items-center justify-between">
                <div className="text-sm text-gray-600">Total Case Rate</div>
                <div className="text-2xl font-bold text-[#2196F3]">₱{totalCaseRate.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
              </div>
              <div className="bg-[#2196F3] p-4 rounded-lg text-white flex items-center justify-between">
                <div className="text-sm">Total Billing</div>
                <div className="text-2xl font-bold">₱{totalBilling.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 bg-white p-3 rounded">
              <strong>Selected Codes:</strong> {[
                icdCode && `ICD: ${icdCode}`,
                rvsCode && `RVS: ${rvsCode}`,
                zBenefitCode && `Z-Benefit: ${zBenefitCode}`,
                konsultaCode && `Konsulta: ${konsultaCode}`
              ].filter(Boolean).join(' | ') || 'None selected'}
            </div>
          </div>

          {/* Case Status */}
          <div className="space-y-4 bg-[#E3F2FD] p-4 rounded-md">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Case Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger id="status" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="in process">In Process</SelectItem>
                    <SelectItem value="return to hospital">Return to Hospital</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="not yet filed">Not Yet Filed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFiled">Date Filed</Label>
                <Input
                  id="dateFiled"
                  type="date"
                  value={formData.dateFiled}
                  onChange={(e) => handleChange('dateFiled', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRefiled">Date Refiled (if applicable)</Label>
                <Input
                  id="dateRefiled"
                  type="date"
                  value={formData.dateRefiled}
                  onChange={(e) => handleChange('dateRefiled', e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Companion/Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Companion / Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companionName">Companion Name</Label>
                <Input
                  id="companionName"
                  value={formData.companionName}
                  onChange={(e) => handleChange('companionName', e.target.value)}
                  placeholder="e.g., Maria Dela Cruz"
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) => handleChange('relationship', e.target.value)}
                  placeholder="e.g., Asawa, Ama, Kapatid"
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  placeholder="e.g., +63-917-123-4567"
                  className="bg-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Address Information</h3>
            <div className="border-2 border-[#2196F3] rounded-lg p-4 bg-[#E3F2FD]/30 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-[#0D47A1] font-semibold">Street *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  placeholder="e.g., 123 Rizal Street"
                  required
                  className="bg-white border-[#2196F3]/30"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barangay" className="text-[#0D47A1] font-semibold">Barangay *</Label>
                  <Input
                    id="barangay"
                    value={formData.barangay}
                    onChange={(e) => handleChange('barangay', e.target.value)}
                    placeholder="e.g., San Roque"
                    required
                    className="bg-white border-[#2196F3]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[#0D47A1] font-semibold">City/Municipality *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g., Manila"
                    required
                    className="bg-white border-[#2196F3]/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province" className="text-[#0D47A1] font-semibold">Province *</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                    placeholder="e.g., Metro Manila"
                    required
                    className="bg-white border-[#2196F3]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-[#0D47A1] font-semibold">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    placeholder="e.g., 1000"
                    required
                    maxLength={4}
                    className="bg-white border-[#2196F3]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => {
              setOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2196F3] hover:bg-[#1976D2]">
              Add Patient
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}