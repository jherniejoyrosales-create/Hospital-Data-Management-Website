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
  icd10Code: string;
  icd10Description: string;
  healthFacilityFee: number;
  professionalFee: number;
  totalCaseRate: number;
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