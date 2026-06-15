import type {
  ClaimType,
  Dependent,
  DocumentConfig,
  Icd10Code,
  Member,
  WizardFormValues,
} from '@/types'

/** Primary member — pre-fills Step 2. */
export const mockMember: Member = {
  memberName: 'Somchai Prasert',
  policyNumber: 'POL-2024-789012',
  memberId: 'MEM-00123456',
  dateOfBirth: '1985-03-15',
}

/** Dependents available when "claim for dependent" is selected. */
export const mockDependents: Dependent[] = [
  {
    id: 'DEP-001',
    name: 'Siriporn Prasert',
    relationship: 'Spouse',
    dateOfBirth: '1987-08-22',
  },
  {
    id: 'DEP-002',
    name: 'Nattapong Prasert',
    relationship: 'Child',
    dateOfBirth: '2012-11-05',
  },
  {
    id: 'DEP-003',
    name: 'Malee Prasert',
    relationship: 'Child',
    dateOfBirth: '2016-04-18',
  },
  {
    id: 'DEP-004',
    name: 'Wichai Prasert',
    relationship: 'Parent',
    dateOfBirth: '1958-01-30',
  },
]

/** Hospital / clinic names for provider autocomplete (Step 3). */
export const mockProviders: string[] = [
  'Bumrungrad International Hospital',
  'Bangkok Hospital',
  'Samitivej Sukhumvit Hospital',
  'Ramathibodi Hospital',
  'Siriraj Hospital',
  'Chulalongkorn Hospital',
  'Phyathai 2 Hospital',
  'BNH Hospital',
  'MedPark Hospital',
  'Vejthani Hospital',
]

/** Step 4 document requirements per claim type. */
export const documentConfig: DocumentConfig = {
  OUTPATIENT: [
    { type: 'MEDICAL_RECEIPT', label: 'Medical receipt', requirement: 'required' },
    { type: 'PRESCRIPTION', label: 'Prescription', requirement: 'optional' },
  ],
  INPATIENT: [
    { type: 'DISCHARGE_SUMMARY', label: 'Discharge summary', requirement: 'required' },
    { type: 'ITEMIZED_BILL', label: 'Itemized bill', requirement: 'required' },
    { type: 'MEDICAL_RECEIPT', label: 'Medical receipt', requirement: 'required' },
  ],
  DENTAL: [
    { type: 'DENTAL_RECEIPT', label: 'Dental receipt', requirement: 'required' },
    {
      type: 'TREATMENT_PLAN',
      label: 'Treatment plan',
      requirement: 'optional',
      requiredWhen: 'isMajorDental',
    },
  ],
}

/** ≥100 common ICD-10 codes for autocomplete (Step 3). */
export const mockIcd10Codes: Icd10Code[] = [
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'A15.0', description: 'Tuberculosis of lung' },
  { code: 'A49.9', description: 'Bacterial infection, unspecified' },
  { code: 'B00.9', description: 'Herpesviral infection, unspecified' },
  { code: 'B02.9', description: 'Zoster without complications' },
  { code: 'B34.9', description: 'Viral infection, unspecified' },
  { code: 'B35.9', description: 'Dermatophytosis, unspecified' },
  { code: 'B37.9', description: 'Candidiasis, unspecified' },
  { code: 'C18.9', description: 'Malignant neoplasm of colon, unspecified' },
  { code: 'C50.9', description: 'Malignant neoplasm of breast, unspecified' },
  { code: 'C61', description: 'Malignant neoplasm of prostate' },
  { code: 'D50.9', description: 'Iron deficiency anemia, unspecified' },
  { code: 'D64.9', description: 'Anemia, unspecified' },
  { code: 'E03.9', description: 'Hypothyroidism, unspecified' },
  { code: 'E05.90', description: 'Thyrotoxicosis, unspecified' },
  { code: 'E10.9', description: 'Type 1 diabetes mellitus without complications' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
  { code: 'E66.9', description: 'Obesity, unspecified' },
  { code: 'E78.0', description: 'Pure hypercholesterolemia' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'E87.6', description: 'Hypokalemia' },
  { code: 'F10.20', description: 'Alcohol dependence, uncomplicated' },
  { code: 'F17.210', description: 'Nicotine dependence, cigarettes, uncomplicated' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'F33.1', description: 'Major depressive disorder, recurrent, moderate' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified' },
  { code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable' },
  { code: 'G44.209', description: 'Tension-type headache, unspecified' },
  { code: 'G47.00', description: 'Insomnia, unspecified' },
  { code: 'G47.33', description: 'Obstructive sleep apnea' },
  { code: 'G89.29', description: 'Other chronic pain' },
  { code: 'H10.9', description: 'Conjunctivitis, unspecified' },
  { code: 'H25.9', description: 'Age-related cataract, unspecified' },
  { code: 'H40.9', description: 'Glaucoma, unspecified' },
  { code: 'H52.4', description: 'Presbyopia' },
  { code: 'H66.90', description: 'Otitis media, unspecified' },
  { code: 'H81.10', description: 'Benign paroxysmal vertigo, unspecified ear' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'I11.9', description: 'Hypertensive heart disease without heart failure' },
  { code: 'I20.9', description: 'Angina pectoris, unspecified' },
  { code: 'I21.9', description: 'Acute myocardial infarction, unspecified' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery' },
  { code: 'I48.91', description: 'Unspecified atrial fibrillation' },
  { code: 'I50.9', description: 'Heart failure, unspecified' },
  { code: 'I63.9', description: 'Cerebral infarction, unspecified' },
  { code: 'I73.9', description: 'Peripheral vascular disease, unspecified' },
  { code: 'I83.90', description: 'Asymptomatic varicose veins of unspecified lower extremity' },
  { code: 'I89.0', description: 'Lymphedema, not elsewhere classified' },
  { code: 'J00', description: 'Acute nasopharyngitis (common cold)' },
  { code: 'J02.9', description: 'Acute pharyngitis, unspecified' },
  { code: 'J03.90', description: 'Acute tonsillitis, unspecified' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified' },
  { code: 'J30.9', description: 'Allergic rhinitis, unspecified' },
  { code: 'J40', description: 'Bronchitis, not specified as acute or chronic' },
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'K02.9', description: 'Dental caries, unspecified' },
  { code: 'K04.7', description: 'Periapical abscess without sinus' },
  { code: 'K08.89', description: 'Other specified disorders of teeth and supporting structures' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'K29.70', description: 'Gastritis, unspecified, without bleeding' },
  { code: 'K30', description: 'Functional dyspepsia' },
  { code: 'K35.80', description: 'Unspecified acute appendicitis' },
  { code: 'K40.90', description: 'Unilateral inguinal hernia, without obstruction or gangrene' },
  { code: 'K52.9', description: 'Noninfective gastroenteritis and colitis, unspecified' },
  { code: 'K57.92', description: 'Diverticulitis of intestine, part unspecified, without perforation' },
  { code: 'K59.00', description: 'Constipation, unspecified' },
  { code: 'K76.0', description: 'Fatty (change of) liver, not elsewhere classified' },
  { code: 'K80.20', description: 'Calculus of gallbladder without cholecystitis' },
  { code: 'L03.90', description: 'Cellulitis, unspecified' },
  { code: 'L20.9', description: 'Atopic dermatitis, unspecified' },
  { code: 'L30.9', description: 'Dermatitis, unspecified' },
  { code: 'L50.9', description: 'Urticaria, unspecified' },
  { code: 'L70.0', description: 'Acne vulgaris' },
  { code: 'M06.9', description: 'Rheumatoid arthritis, unspecified' },
  { code: 'M10.9', description: 'Gout, unspecified' },
  { code: 'M17.9', description: 'Osteoarthritis of knee, unspecified' },
  { code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site' },
  { code: 'M25.511', description: 'Pain in right shoulder' },
  { code: 'M25.512', description: 'Pain in left shoulder' },
  { code: 'M47.816', description: 'Spondylosis without myelopathy or radiculopathy, lumbar region' },
  { code: 'M48.06', description: 'Spinal stenosis, lumbar region' },
  { code: 'M54.2', description: 'Cervicalgia' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'M54.50', description: 'Low back pain, unspecified' },
  { code: 'M54.6', description: 'Pain in thoracic spine' },
  { code: 'M62.830', description: 'Muscle spasm of back' },
  { code: 'M79.1', description: 'Myalgia' },
  { code: 'M79.3', description: 'Panniculitis, unspecified' },
  { code: 'M79.89', description: 'Other specified soft tissue disorders' },
  { code: 'N18.9', description: 'Chronic kidney disease, unspecified' },
  { code: 'N20.0', description: 'Calculus of kidney' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'N40.0', description: 'Benign prostatic hyperplasia without lower urinary tract symptoms' },
  { code: 'N76.0', description: 'Acute vaginitis' },
  { code: 'N94.6', description: 'Dysmenorrhea, unspecified' },
  { code: 'O80', description: 'Encounter for full-term uncomplicated delivery' },
  { code: 'O99.89', description: 'Other specified diseases complicating pregnancy' },
  { code: 'R05.9', description: 'Cough, unspecified' },
  { code: 'R06.02', description: 'Shortness of breath' },
  { code: 'R07.9', description: 'Chest pain, unspecified' },
  { code: 'R10.9', description: 'Unspecified abdominal pain' },
  { code: 'R11.0', description: 'Nausea' },
  { code: 'R11.2', description: 'Nausea with vomiting, unspecified' },
  { code: 'R19.7', description: 'Diarrhea, unspecified' },
  { code: 'R21', description: 'Rash and other nonspecific skin eruption' },
  { code: 'R42', description: 'Dizziness and giddiness' },
  { code: 'R50.9', description: 'Fever, unspecified' },
  { code: 'R51.9', description: 'Headache, unspecified' },
  { code: 'R53.83', description: 'Other fatigue' },
  { code: 'R73.03', description: 'Prediabetes' },
  { code: 'S01.81XA', description: 'Laceration without foreign body of other part of head, initial encounter' },
  { code: 'S06.0X0A', description: 'Concussion without loss of consciousness, initial encounter' },
  { code: 'S13.4XXA', description: 'Sprain of ligaments of cervical spine, initial encounter' },
  { code: 'S39.012A', description: 'Strain of muscle, fascia and tendon of lower back, initial encounter' },
  { code: 'S52.501A', description: 'Unspecified fracture of right ulna, initial encounter' },
  { code: 'S60.0XXA', description: 'Contusion of finger without damage to nail, initial encounter' },
  { code: 'S82.001A', description: 'Unspecified fracture of right patella, initial encounter' },
  { code: 'S93.401A', description: 'Sprain of unspecified ligament of right ankle, initial encounter' },
  { code: 'T14.90XA', description: 'Injury, unspecified, initial encounter' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' },
  { code: 'Z01.411', description: 'Encounter for gynecological examination with abnormal findings' },
  { code: 'Z12.11', description: 'Encounter for screening for malignant neoplasm of colon' },
  { code: 'Z12.31', description: 'Encounter for screening mammogram for malignant neoplasm of breast' },
  { code: 'Z23', description: 'Encounter for immunization' },
  { code: 'Z30.09', description: 'Encounter for other general counseling and advice on contraception' },
  { code: 'Z34.90', description: 'Encounter for supervision of normal pregnancy, unspecified trimester' },
  { code: 'Z48.89', description: 'Encounter for other specified postprocedural aftercare' },
  { code: 'Z51.11', description: 'Encounter for antineoplastic chemotherapy' },
  { code: 'Z71.3', description: 'Dietary counseling and surveillance' },
  { code: 'Z79.01', description: 'Long term (current) use of anticoagulants' },
  { code: 'Z79.4', description: 'Long term (current) use of insulin' },
  { code: 'Z87.891', description: 'Personal history of nicotine dependence' },
  { code: 'Z96.1', description: 'Presence of intraocular lens' },
  { code: 'Z96.641', description: 'Presence of right artificial hip joint' },
]

/** Empty form defaults — used when initializing react-hook-form (Phase 2). */
export function createDefaultFormValues(
  member: Member = mockMember,
): WizardFormValues {
  return {
    currentStep: 1,
    claimType: '',

    isClaimForDependent: false,
    dependentId: null,
    memberName: member.memberName,
    policyNumber: member.policyNumber,
    memberId: member.memberId,
    dateOfBirth: member.dateOfBirth,

    diagnosisDescription: '',
    icd10Code: '',
    icd10Description: '',
    providerName: '',

    treatmentDate: '',
    admissionDate: '',
    dischargeDate: '',
    lengthOfStay: null,
    admissionReason: '',

    isMajorDental: false,
    documents: {},
    confirmationChecked: false,
  }
}

/** Look up a dependent by id. */
export function getDependentById(id: string): Dependent | undefined {
  return mockDependents.find((dependent) => dependent.id === id)
}

/** Resolve document list for a claim type (empty array if unset). */
export function getDocumentsForClaimType(claimType: ClaimType) {
  return documentConfig[claimType] ?? []
}

/** Whether a document slot is required given current form flags. */
export function isDocumentRequired(
  entry: DocumentConfig[ClaimType][number],
  isMajorDental: boolean,
): boolean {
  if (entry.requirement === 'required') {
    return true
  }

  if (entry.requiredWhen === 'isMajorDental') {
    return isMajorDental
  }

  return false
}

/** Document entries that must be uploaded before proceeding. */
export function getRequiredDocuments(
  claimType: ClaimType,
  isMajorDental: boolean,
) {
  return getDocumentsForClaimType(claimType).filter((entry) =>
    isDocumentRequired(entry, isMajorDental),
  )
}

/** Document entries visible in Step 4 for the current claim context. */
export function getVisibleDocumentEntries(
  claimType: ClaimType,
  isMajorDental: boolean,
) {
  return getDocumentsForClaimType(claimType).filter((entry) => {
    if (entry.requiredWhen === 'isMajorDental') {
      return isMajorDental
    }

    return true
  })
}

/** Whether every required document slot has a completed upload. */
export function areRequiredDocumentsUploaded(
  claimType: ClaimType,
  isMajorDental: boolean,
  documents: WizardFormValues['documents'],
): boolean {
  return getRequiredDocuments(claimType, isMajorDental).every((entry) =>
    Boolean(documents[entry.type]?.fileName),
  )
}

/** Find ICD-10 entry by exact code match. */
export function getIcd10ByCode(code: string): Icd10Code | undefined {
  return mockIcd10Codes.find(
    (entry) => entry.code.toLowerCase() === code.toLowerCase(),
  )
}

/** Filter ICD-10 codes by code or description substring (case-insensitive). */
export function filterIcd10Codes(query: string, limit = 20): Icd10Code[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return mockIcd10Codes
    .filter(
      (entry) =>
        entry.code.toLowerCase().includes(normalized) ||
        entry.description.toLowerCase().includes(normalized),
    )
    .slice(0, limit)
}

/** Filter provider names by substring (case-insensitive). */
export function filterProviders(query: string, limit = 10): string[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return mockProviders
    .filter((name) => name.toLowerCase().includes(normalized))
    .slice(0, limit)
}
