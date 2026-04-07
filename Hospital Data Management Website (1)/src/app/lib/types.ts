export interface PatientRecord {
  id: string;
  patientId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  category: 'MM' | 'DD'; // Member or Dependent
  confinementStart: string;
  confinementEnd: string;
  pin: string; // 12-digit PIN
  
  // Medical Codes - Can have multiple
  icd10Code: string; // Primary diagnosis code
  icd10Description: string;
  rvsCode?: string; // Procedure code (optional)
  rvsDescription?: string;
  zBenefitCode?: string; // Z-Benefit package code (optional)
  zBenefitDescription?: string;
  konsultaCode?: string; // Konsulta package code (optional)
  konsultaDescription?: string;
  
  // Billing breakdown
  healthFacilityFee: number;
  professionalFee: number;
  totalCaseRate: number; // Combined case rate from all codes
  totalBilling?: number; // Calculated total
  
  dateFiled: string;
  dateRefiled?: string;
  daysSinceFiled: number;
  daysSinceRefiled?: number;
  status: 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed';
  companionName: string;
  relationship: string;
  contactNumber: string;
  homeAddress: string; // Legacy field for backward compatibility
  street?: string;
  barangay?: string;
  city?: string;
  province?: string;
  zipCode?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'staff';
  name: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  details: string;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  totalRevenue: number;
  pendingPayments: number;
  paidPercentage: number;
  inProcessPercentage: number;
  returnToHospitalPercentage: number;
  deniedPercentage: number;
  memberCount: number;
  dependentCount: number;
}

// ICD-10 Code with standardized rates
export interface ICDCodeRate {
  code: string;
  description: string;
  healthFacilityFee: number;
  professionalFee: number;
  totalCaseRate: number;
}

// RVS (Relative Value Scale) Code with standardized rates
export interface RVSCodeRate {
  code: string;
  description: string;
  healthFacilityFee: number;
  professionalFee: number;
  totalCaseRate: number;
}

// Z Benefit Package
export interface ZBenefitPackage {
  code: string;
  description: string;
  packageRate: number;
}

// PhilHealth Konsulta Package
export interface KonsultaPackage {
  code: string;
  description: string;
  packageRate: number;
}