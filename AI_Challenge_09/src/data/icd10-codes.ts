/** 20 common ICD-10 codes used for dataset generation and future dashboard reference. */
export const ICD10_CODES = [
  'J06.9', // Acute upper respiratory infection
  'I10', // Essential hypertension
  'E11.9', // Type 2 diabetes mellitus
  'M54.5', // Low back pain
  'K21.0', // GERD with esophagitis
  'J18.9', // Pneumonia
  'N39.0', // UTI
  'S82.001A', // Fracture of right patella
  'H10.9', // Conjunctivitis
  'K35.80', // Acute appendicitis
  'O80', // Single spontaneous delivery (maternity)
  'K02.9', // Dental caries
  'M25.511', // Pain in right shoulder
  'R51', // Headache
  'J45.909', // Asthma
  'Z23', // Immunization encounter
  'F32.9', // Major depressive disorder
  'L30.9', // Dermatitis
  'G43.909', // Migraine
  'B34.9', // Viral infection unspecified
] as const;

export type Icd10Code = (typeof ICD10_CODES)[number];
