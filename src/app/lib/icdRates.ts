import { ICDCodeRate } from './types';

// Standardized ICD-10 Code Rates for Philippine Hospital System
export const icdCodeRates: ICDCodeRate[] = [
  {
    code: 'I21.0',
    description: 'ST elevation myocardial infarction of anterior wall',
    healthFacilityFee: 28000,
    professionalFee: 14000,
    totalCaseRate: 56000,
  },
  {
    code: 'I21.1',
    description: 'ST elevation myocardial infarction of inferior wall',
    healthFacilityFee: 28000,
    professionalFee: 14000,
    totalCaseRate: 56000,
  },
  {
    code: 'J18.9',
    description: 'Pneumonia, unspecified organism',
    healthFacilityFee: 15000,
    professionalFee: 8000,
    totalCaseRate: 32000,
  },
  {
    code: 'A09.0',
    description: 'Gastroenteritis and colitis of infectious origin',
    healthFacilityFee: 8000,
    professionalFee: 4000,
    totalCaseRate: 16000,
  },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    healthFacilityFee: 10000,
    professionalFee: 5000,
    totalCaseRate: 20000,
  },
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    healthFacilityFee: 8000,
    professionalFee: 4000,
    totalCaseRate: 16000,
  },
  {
    code: 'O80',
    description: 'Single spontaneous delivery',
    healthFacilityFee: 19000,
    professionalFee: 9500,
    totalCaseRate: 38000,
  },
  {
    code: 'O82.0',
    description: 'Delivery by elective caesarean section',
    healthFacilityFee: 24000,
    professionalFee: 12000,
    totalCaseRate: 48000,
  },
  {
    code: 'K35.8',
    description: 'Acute appendicitis',
    healthFacilityFee: 24000,
    professionalFee: 12000,
    totalCaseRate: 48000,
  },
  {
    code: 'S72.0',
    description: 'Fracture of femur',
    healthFacilityFee: 31000,
    professionalFee: 15500,
    totalCaseRate: 62000,
  },
  {
    code: 'J44.0',
    description: 'Chronic obstructive pulmonary disease',
    healthFacilityFee: 13000,
    professionalFee: 6500,
    totalCaseRate: 26000,
  },
  {
    code: 'N18.9',
    description: 'Chronic kidney disease, unspecified',
    healthFacilityFee: 16000,
    professionalFee: 8000,
    totalCaseRate: 32000,
  },
  {
    code: 'I63.9',
    description: 'Cerebral infarction, unspecified',
    healthFacilityFee: 28000,
    professionalFee: 14000,
    totalCaseRate: 56000,
  },
  {
    code: 'K80.2',
    description: 'Calculus of gallbladder without cholecystitis',
    healthFacilityFee: 32000,
    professionalFee: 16000,
    totalCaseRate: 64000,
  },
  {
    code: 'M16.1',
    description: 'Unilateral primary osteoarthritis of hip',
    healthFacilityFee: 80000,
    professionalFee: 40000,
    totalCaseRate: 160000,
  },
];

// Helper function to get rates by ICD code
export const getRatesByICDCode = (code: string): ICDCodeRate | undefined => {
  return icdCodeRates.find((rate) => rate.code.toLowerCase() === code.toLowerCase());
};

// Helper function to search ICD codes
export const searchICDCodes = (query: string): ICDCodeRate[] => {
  const lowerQuery = query.toLowerCase();
  return icdCodeRates.filter(
    (rate) =>
      rate.code.toLowerCase().includes(lowerQuery) ||
      rate.description.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to calculate days since date
export const calculateDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
