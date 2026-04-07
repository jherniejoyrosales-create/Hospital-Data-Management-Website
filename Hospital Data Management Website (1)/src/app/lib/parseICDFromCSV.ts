import { ICDCodeRate } from './types';

// Parse ICD codes from the uploaded CSV
export const parsedICDCodes: ICDCodeRate[] = [
  { code: "A00.0", description: "CHOLERA DUE TO VIBRIO CHOLERAE 01, BIOVAR CHOLERAE", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A00.1", description: "CHOLERA DUE TO VIBRIO CHOLERAE 01, BIOVAR ELTOR", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A00.9", description: "CHOLERA, UNSPECIFIED", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A01.0", description: "TYPHOID FEVER", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A01.0+ J17.0*", description: "PNEUMONIA IN TYPHOID FEVER", totalCaseRate: 29250.00, healthFacilityFee: 20475.00, professionalFee: 8775.00 },
  { code: "A01.1", description: "PARATYPHOID FEVER A", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A01.2", description: "PARATYPHOID FEVER B", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A01.3", description: "PARATYPHOID FEVER C", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A01.4", description: "PARATYPHOID FEVER, UNSPECIFIED; INFECTION DUE TO SALMONELLA PARATYPHI NOS", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A02.0", description: "SALMONELLA ENTERITIS; SALMONELLOSIS", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A02.1", description: "SALMONELLA SEPTICAEMIA", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A02.2", description: "LOCALIZED SALMONELLA INFECTIONS", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A02.2+ J17.0*", description: "PNEUMONIA IN SALMONELLA INFECTION", totalCaseRate: 29250.00, healthFacilityFee: 20475.00, professionalFee: 8775.00 },
  { code: "A02.8", description: "OTHER SPECIFIED SALMONELLA INFECTIONS", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A02.9", description: "SALMONELLA INFECTION, UNSPECIFIED", totalCaseRate: 19500.00, healthFacilityFee: 13650.00, professionalFee: 5850.00 },
  { code: "A03.0", description: "SHIGELLOSIS DUE TO SHIGELLA DYSENTERIAE; GROUP A SHIGELLOSIS [SHIGA-KRUSE DYSENTERY]", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A03.1", description: "SHIGELLOSIS DUE TO SHIGELLA FLEXNERI;GROUP B SHIGELLOSIS", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A03.2", description: "SHIGELLOSIS DUE TO SHIGELLA BOYDII; GROUP C SHIGELLOSIS", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A03.3", description: "SHIGELLOSIS DUE TO SHIGELLA SONNEI; GROUP D SHIGELLOSIS", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A03.8", description: "OTHER SHIGELLOSIS", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
  { code: "A03.9", description: "SHIGELLOSIS, UNSPECIFIED; BACILLARY DYSENTERY NOS", totalCaseRate: 11700.00, healthFacilityFee: 8190.00, professionalFee: 3510.00 },
];

// Note: Due to the large CSV size, this is a sample. 
// The full list should be imported from the icdRates.ts file which already contains 200+ codes
