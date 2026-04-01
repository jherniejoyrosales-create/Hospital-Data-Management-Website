import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Edit, Search } from 'lucide-react';
import { PatientRecord } from '../lib/types';
import { toast } from 'sonner';
import { getRatesByICDCode, searchICDCodes, calculateDaysSince } from '../lib/icdRates';

interface EditPatientDialogProps {
  patient: PatientRecord;
  onUpdatePatient: (updatedPatient: PatientRecord) => void;
}

export default function EditPatientDialog({ patient, onUpdatePatient }: EditPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [icdSearchQuery, setIcdSearchQuery] = useState('');
  const [showIcdResults, setShowIcdResults] = useState(false);
  const [formData, setFormData] = useState({
    lastName: patient.lastName,
    firstName: patient.firstName,
    middleName: patient.middleName,
    category: patient.category,
    confinementStart: patient.confinementStart,
    confinementEnd: patient.confinementEnd,
    pin: patient.pin,
    icd10Code: patient.icd10Code,
    icd10Description: patient.icd10Description,
    healthFacilityFee: (patient.healthFacilityFee || 0).toString(),
    professionalFee: (patient.professionalFee || 0).toString(),
    totalCaseRate: (patient.totalCaseRate || 0).toString(),
    dateFiled: patient.dateFiled,
    dateRefiled: patient.dateRefiled || '',
    status: patient.status,
    companionName: patient.companionName,
    relationship: patient.relationship,
    contactNumber: patient.contactNumber,
    homeAddress: patient.homeAddress,
    street: patient.street || '',
    barangay: patient.barangay || '',
    city: patient.city || '',
    province: patient.province || '',
    zipCode: patient.zipCode || '',
  });

  useEffect(() => {
    setIcdSearchQuery(patient.icd10Code);
  }, [patient.icd10Code]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleICDCodeChange = (code: string) => {
    setIcdSearchQuery(code);
    handleChange('icd10Code', code);
    setShowIcdResults(true);
    
    const rates = getRatesByICDCode(code);
    if (rates) {
      handleChange('icd10Description', rates.description);
      handleChange('healthFacilityFee', rates.healthFacilityFee.toString());
      handleChange('professionalFee', rates.professionalFee.toString());
      handleChange('totalCaseRate', rates.totalCaseRate.toString());
      setShowIcdResults(false);
    }
  };

  const selectICDCode = (code: string, description: string, healthFee: number, profFee: number, caseRate: number) => {
    handleChange('icd10Code', code);
    handleChange('icd10Description', description);
    handleChange('healthFacilityFee', healthFee.toString());
    handleChange('professionalFee', profFee.toString());
    handleChange('totalCaseRate', caseRate.toString());
    setIcdSearchQuery(code);
    setShowIcdResults(false);
  };

  const icdSearchResults = icdSearchQuery.length >= 2 ? searchICDCodes(icdSearchQuery) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const healthFee = parseFloat(formData.healthFacilityFee) || 0;
    const profFee = parseFloat(formData.professionalFee) || 0;
    const caseRate = parseFloat(formData.totalCaseRate) || 0;
    const totalBilling = parseFloat(formData.totalCaseRate) || 0; // Total billing equals the case rate only

    const daysSinceFiled = calculateDaysSince(formData.dateFiled);
    const daysSinceRefiled = formData.dateRefiled ? calculateDaysSince(formData.dateRefiled) : undefined;

    const updatedPatient: PatientRecord = {
      ...patient,
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      category: formData.category as 'MM' | 'DD',
      confinementStart: formData.confinementStart,
      confinementEnd: formData.confinementEnd,
      pin: formData.pin,
      icd10Code: formData.icd10Code,
      icd10Description: formData.icd10Description,
      healthFacilityFee: healthFee,
      professionalFee: profFee,
      totalCaseRate: caseRate,
      totalBilling,
      dateFiled: formData.dateFiled,
      dateRefiled: formData.dateRefiled || undefined,
      daysSinceFiled,
      daysSinceRefiled,
      status: formData.status as 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed',
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

    onUpdatePatient(updatedPatient);
    toast.success(`Patient ${formData.firstName} ${formData.lastName} updated successfully!`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-[#2196F3] border-[#2196F3] hover:bg-[#E3F2FD]">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0D47A1]">Edit Patient Record - {patient.patientId}</DialogTitle>
          <DialogDescription>
            Update patient information. Fields marked with * are required.
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
                <Label htmlFor="pin">PIN *</Label>
                <Input
                  id="pin"
                  value={formData.pin}
                  onChange={(e) => handleChange('pin', e.target.value)}
                  required
                  className="bg-[#F5F5F5]"
                />
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

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Medical Information</h3>
            <div className="space-y-2">
              <Label htmlFor="icd10Code">ICD-10 Code * (Type to search)</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="icd10Code"
                    value={icdSearchQuery}
                    onChange={(e) => handleICDCodeChange(e.target.value)}
                    onFocus={() => setShowIcdResults(true)}
                    required
                    className="pl-10 bg-[#F5F5F5]"
                  />
                </div>
                {showIcdResults && icdSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#2196F3] rounded-md shadow-lg max-h-60 overflow-auto">
                    {icdSearchResults.map((result) => (
                      <button
                        key={result.code}
                        type="button"
                        onClick={() => selectICDCode(result.code, result.description, result.healthFacilityFee, result.professionalFee, result.totalCaseRate)}
                        className="w-full text-left px-4 py-3 hover:bg-[#E3F2FD] border-b border-gray-100 last:border-0"
                      >
                        <div className="font-semibold text-[#0D47A1]">{result.code}</div>
                        <div className="text-sm text-gray-600">{result.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total: ₱{(result.healthFacilityFee + result.professionalFee + result.totalCaseRate).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icd10Description">ICD-10 Description</Label>
              <Input
                id="icd10Description"
                value={formData.icd10Description}
                onChange={(e) => handleChange('icd10Description', e.target.value)}
                className="bg-[#F5F5F5]"
              />
            </div>
          </div>

          {/* Billing Information */}
          <div className="space-y-4 bg-[#E3F2FD] p-4 rounded-md">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Billing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="healthFacilityFee">Health Facility Fee (₱)</Label>
                <Input
                  id="healthFacilityFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.healthFacilityFee}
                  onChange={(e) => handleChange('healthFacilityFee', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalFee">Professional Fee (₱)</Label>
                <Input
                  id="professionalFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.professionalFee}
                  onChange={(e) => handleChange('professionalFee', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCaseRate">
                  <span className="inline-block px-3 py-1 bg-[#2196F3] text-white rounded">Case Rate</span> (₱)
                </Label>
                <Input
                  id="totalCaseRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalCaseRate}
                  onChange={(e) => handleChange('totalCaseRate', e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Case Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Case Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger id="status" className="bg-[#F5F5F5]">
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
                <Label htmlFor="dateFiled">Date Filed {formData.status !== 'not yet filed' && '*'}</Label>
                <Input
                  id="dateFiled"
                  type="date"
                  value={formData.dateFiled}
                  onChange={(e) => handleChange('dateFiled', e.target.value)}
                  required={formData.status !== 'not yet filed'}
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRefiled">Date Refiled</Label>
                <Input
                  id="dateRefiled"
                  type="date"
                  value={formData.dateRefiled}
                  onChange={(e) => handleChange('dateRefiled', e.target.value)}
                  className="bg-[#F5F5F5]"
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
                  className="bg-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) => handleChange('relationship', e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2196F3] hover:bg-[#1976D2]">
              Update Patient
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}