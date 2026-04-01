import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, Search } from 'lucide-react';
import { PatientRecord } from '../lib/types';
import { toast } from 'sonner';
import { getRatesByICDCode, searchICDCodes, calculateDaysSince } from '../lib/icdRates';

interface AddPatientDialogProps {
  onAddPatient: (patient: Omit<PatientRecord, 'id'>) => void;
}

export default function AddPatientDialog({ onAddPatient }: AddPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [icdSearchQuery, setIcdSearchQuery] = useState('');
  const [showIcdResults, setShowIcdResults] = useState(false);
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    category: 'MM' as 'MM' | 'DD',
    confinementStart: '',
    confinementEnd: '',
    pin: '',
    icd10Code: '',
    icd10Description: '',
    healthFacilityFee: '',
    professionalFee: '',
    totalCaseRate: '',
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

  const handleICDCodeChange = (code: string) => {
    setIcdSearchQuery(code);
    handleChange('icd10Code', code);
    setShowIcdResults(true);
    
    // Auto-populate fees if exact match found
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
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.confinementStart || !formData.confinementEnd || !formData.pin || !formData.icd10Code) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate PIN is exactly 12 digits
    if (formData.pin.length !== 12) {
      toast.error('PIN must be exactly 12 digits');
      return;
    }

    const healthFee = parseFloat(formData.healthFacilityFee) || 0;
    const profFee = parseFloat(formData.professionalFee) || 0;
    const caseRate = parseFloat(formData.totalCaseRate) || 0;
    const totalBilling = caseRate; // Total billing equals the case rate only

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
    toast.success(`Patient ${formData.firstName} ${formData.lastName} added successfully!`);
    
    // Reset form
    setFormData({
      lastName: '',
      firstName: '',
      middleName: '',
      category: 'MM',
      confinementStart: '',
      confinementEnd: '',
      pin: '',
      icd10Code: '',
      icd10Description: '',
      healthFacilityFee: '',
      professionalFee: '',
      totalCaseRate: '',
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
    setIcdSearchQuery('');
    setOpen(false);
  };

  const totalBilling = parseFloat(formData.totalCaseRate) || 0; // Total billing equals the case rate only

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#2196F3] hover:bg-[#1976D2]">
          <Plus className="h-4 w-4" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0D47A1]">Add New Patient Record</DialogTitle>
          <DialogDescription>
            Enter complete patient information. Fields marked with * are required.
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
                  pattern="[0-9]{12}"
                  title="PIN must be exactly 12 digits"
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

          {/* Medical Information with ICD Lookup */}
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
                    placeholder="Type ICD code or description (e.g., I21.0 or pneumonia)"
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
                placeholder="Auto-filled from ICD code"
                className="bg-[#F5F5F5]"
              />
            </div>
          </div>

          {/* Billing Information - Auto-populated */}
          <div className="space-y-4 bg-[#E3F2FD] p-4 rounded-md">
            <h3 className="font-semibold text-lg border-b border-[#2196F3] pb-2 text-[#0D47A1]">Billing Information (Auto-calculated from ICD Code)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="healthFacilityFee">Health Facility Fee (₱)</Label>
                <Input
                  id="healthFacilityFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.healthFacilityFee}
                  onChange={(e) => handleChange('healthFacilityFee', e.target.value)}
                  placeholder="0.00"
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
                  placeholder="0.00"
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
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
            </div>

            {/* Dates */}
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
                <Label htmlFor="dateRefiled">Date Refiled (if applicable)</Label>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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