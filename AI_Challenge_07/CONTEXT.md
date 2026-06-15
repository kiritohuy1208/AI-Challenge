# CONTEXT.md — Claims Intake Wizard

**Version:** 1.8  
**Last Updated:** 2026-06-13  
**Status:** Deployed — live on Vercel

---

## 1. Project Overview

### Objective
Build a **multi-step claim submission wizard** (web UI) that guides insurance members through submitting outpatient, inpatient, or dental claims with type-specific fields, document uploads, validation, and a final review step.

### Problem Statement
Insurance members submit claims through forms that vary by claim type. Each type requires different documents and information. A poorly designed intake form causes back-and-forth with members and slows claim processing. The application must adapt the form dynamically, validate inputs early, and present a clear summary before submission.

### Solution Approach
A **5-step responsive web wizard** that:
1. Captures claim type and branches conditional logic for all subsequent steps
2. Pre-fills member/policy data from mock JSON (editable) with optional dependent selection
3. Collects diagnosis, ICD-10 code (autocomplete), treatment dates, and provider information
4. Enforces document upload requirements per claim type with file validation and progress feedback
5. Displays a read-only review summary with back-navigation, confirmation checkbox, and mock submit

Form state persists across all steps (forward and back navigation). Submission is mocked (console log or success message).

---

## 2. Tech Stack & Environment

| Category | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Consistency with prior challenges; type-safe form state |
| Framework | React 18+ | Component model fits multi-step wizard |
| Build tool | Vite | Fast dev server, simple SPA setup |
| Styling | Tailwind CSS | Responsive layout, mobile-first utilities |
| Form state | **react-hook-form** (`FormProvider` + single `useForm`) | One form instance persists all step data across Back/Next |
| Validation | **Zod** + `@hookform/resolvers/zod` | Per-step schemas; block Next until step validates |
| UI components | **shadcn/ui** (optional) + **lucide-react** icons | Accessible primitives; faster stepper/form UI |
| Step index | Local `useState` in wizard shell | No router needed; step number drives which step renders |
| File upload | Native `<input type="file">` + `FileReader` / `URL.createObjectURL` | No backend; client-side validation only |
| ICD-10 search | Client-side filter over static JSON list | 100+ codes; debounced substring match |
| Provider suggestions | Client-side filter over mock provider list | Autocomplete on free-text field |
| Testing | Manual / build verification (`npm run build`) | Vitest not required by challenge guidelines; skipped to save time |
| Deployment | Vercel / Netlify / GitHub Pages | Free static hosting (submission requirement) |
| Node | ≥ 18.x | Vite and modern tooling |

**Not in scope:** Real backend API, authentication, persistent database, actual file storage.

---

## 3. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER (Mock Data)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  member.json          — member name, policy #, member ID, DOB           │
│  dependents.json      — list of dependents (id, name, relationship)     │
│  icd10-codes.json     — ≥100 common ICD-10 codes (code + description)   │
│  providers.json       — hospital/clinic names for autocomplete          │
│  document-config.json — required/optional docs per claim type           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                    WIZARD STATE (Single Source of Truth)                  │
├───────────────────────────────────────────────────────────────────────────┤
│  react-hook-form defaultValues + watch/setValue holds:                    │
│  - currentStep (1–5)                                                      │
│  - claimType: OUTPATIENT | INPATIENT | DENTAL                             │
│  - memberInfo (pre-filled, editable)                                      │
│  - dependentId (nullable)                                                 │
│  - diagnosis (text, icd10Code, treatmentDates, provider, inpatient extras)│
│  - documents: Map<docType, UploadedFile metadata>                         │
│  - isMajorDental (boolean — drives dental treatment plan requirement)     │
│  - confirmationChecked (step 5)                                           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                      PROCESSING LAYER (Per Step)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Step 1: ClaimTypeStep     → sets claimType, resets type-specific fields  │
│  Step 2: MemberStep        → validates member fields, dependent selector  │
│  Step 3: DiagnosisStep     → conditional dates, ICD-10 filter, LOS calc   │
│  Step 4: DocumentsStep     → file type/size check, required doc gate      │
│  Step 5: ReviewStep        → aggregate display, confirm + mock submit     │
│                                                                            │
│  Navigation: validateCurrentStep() → advance or show errors               │
│  ProgressBar: visual indicator of steps 1–5                               │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         OUTPUT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Mock submission payload (console.log / success UI):                    │
│  { claimType, member, dependent, diagnosis, documents metadata, ... }   │
│  No server persistence — files held in memory only                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Wizard State Schema

| Field | Type | Step | Notes |
|---|---|---|---|
| `currentStep` | `1 \| 2 \| 3 \| 4 \| 5` | — | Drives which step component renders |
| `claimType` | `OUTPATIENT \| INPATIENT \| DENTAL` | 1 | Drives all conditional logic |
| `memberName` | `string` | 2 | Pre-filled from mock, editable |
| `policyNumber` | `string` | 2 | Pre-filled from mock, editable |
| `memberId` | `string` | 2 | Pre-filled from mock, editable |
| `dateOfBirth` | `string` (ISO date) | 2 | Pre-filled from mock, editable |
| `dependentId` | `string \| null` | 2 | Null = claim for self |
| `diagnosisDescription` | `string` | 3 | Free text, required |
| `icd10Code` | `string` | 3 | Must match a code from list |
| `treatmentDate` | `string` | 3 | Outpatient/Dental: single date |
| `admissionDate` | `string` | 3 | Inpatient only |
| `dischargeDate` | `string` | 3 | Inpatient only |
| `lengthOfStay` | `number` | 3 | Auto: discharge − admission (days) |
| `providerName` | `string` | 3 | Free text + suggestions |
| `admissionReason` | `string` | 3 | Inpatient only |
| `isMajorDental` | `boolean` | 3 or 4 | When true, treatment plan required |
| `documents` | `Record<DocType, FileMeta>` | 4 | Name, size, type; no upload to server |
| `confirmationChecked` | `boolean` | 5 | Must be true to submit |

---

## 4. Glossary & Core Concepts

| Term | Definition |
|---|---|
| **Claim Type** | Category of medical claim: Outpatient, Inpatient, or Dental. Determines required fields and documents. |
| **Member** | Primary policyholder submitting the claim. Data pre-filled from mock JSON. |
| **Dependent** | Family member covered under the policy. Selected via dropdown when claim is not for self. |
| **ICD-10** | International Classification of Diseases, 10th revision. Diagnosis code selected via autocomplete from a provided list. |
| **Length of Stay (LOS)** | Number of days between inpatient admission and discharge dates (inclusive or calendar days — document choice in implementation). |
| **Major Dental** | Dental procedures requiring a treatment plan document (e.g., crowns, implants, orthodontics). Distinguished from routine dental (cleaning, filling). |
| **Required Document** | Upload that must be present before leaving Step 4 or submitting. |
| **Optional Document** | Upload encouraged but not blocking progression. |
| **Wizard Step** | One of five sequential screens; validation runs before advancing forward. |
| **Mock Submission** | No API call; log structured payload to console and show success message in UI. |

### Document Types by Claim Type

| Claim Type | Required | Optional |
|---|---|---|
| Outpatient | Medical receipt | Prescription |
| Inpatient | Discharge summary, Itemized bill, Medical receipt | — |
| Dental | Dental receipt | Treatment plan (required if major dental) |

---

## 5. File Structure

```
AI Challenge 07 — Claims Intake Wizard/
│
├── CONTEXT.md                          # This file — project source of truth
├── README.md                           # Setup, scripts, live URL
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                        # App entry
│   ├── App.tsx                         # Wizard shell + progress bar
│   │
│   ├── types/
│   │   ├── claim.ts                    # ClaimType, DocType enums
│   │   ├── wizard.ts                   # WizardState, step payloads
│   │   └── index.ts
│   │
│   ├── context/
│   │   └── WizardContext.tsx           # State provider + navigation actions
│   │
│   ├── data/
│   │   ├── member.json                 # Mock member/policy pre-fill
│   │   ├── dependents.json             # Mock dependent list
│   │   ├── icd10-codes.json            # ≥100 ICD-10 codes
│   │   ├── providers.json              # Provider/hospital suggestions
│   │   └── document-config.json        # Per-claim-type doc requirements
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── WizardLayout.tsx        # Responsive container
│   │   │   ├── ProgressBar.tsx         # Step indicator (1–5)
│   │   │   └── StepNavigation.tsx      # Back / Next buttons
│   │   ├── steps/
│   │   │   ├── ClaimTypeStep.tsx       # Step 1
│   │   │   ├── MemberStep.tsx          # Step 2
│   │   │   ├── DiagnosisStep.tsx       # Step 3
│   │   │   ├── DocumentsStep.tsx       # Step 4
│   │   │   └── ReviewStep.tsx          # Step 5
│   │   └── ui/
│   │       ├── Autocomplete.tsx        # ICD-10 + provider suggestions
│   │       ├── FileUpload.tsx          # Upload + progress + validation
│   │       ├── DatePicker.tsx          # Single date / date range
│   │       └── FormField.tsx           # Label, error, a11y wrapper
│   │
│   ├── hooks/
│   │   ├── useWizard.ts                # Context consumer hook
│   │   ├── useIcd10Search.ts           # Debounced code filter
│   │   └── useFileValidation.ts        # Type + size checks
│   │
│   ├── utils/
│   │   ├── validation.ts               # Per-step validation rules
│   │   ├── dateUtils.ts                # LOS calculation, date parsing
│   │   └── submitClaim.ts              # Mock submit (console + payload)
│   │
│   └── styles/
│       └── index.css                   # Tailwind directives + globals
│
├── tests/
│   ├── validation.test.ts              # Business rule unit tests
│   ├── dateUtils.test.ts               # LOS calculation tests
│   └── components/
│       └── ClaimTypeStep.test.tsx      # Example component test
│
└── context/
    ├── requirement.md                  # Original challenge requirements
    └── prompts/
        └── init_context_prj.md         # CONTEXT.md generation prompt
```

---

## 6. Business Rules & Logic

### 6.1 Wizard Flow (Order of Operations)

| Order | Action | Gate |
|---|---|---|
| 1 | User selects claim type (Step 1) | Must select one option |
| 2 | User edits member info / dependent (Step 2) | All member fields required; dependent optional |
| 3 | User enters diagnosis & treatment (Step 3) | Conditional fields per claim type |
| 4 | User uploads documents (Step 4) | All required docs present; valid file types |
| 5 | User reviews and confirms (Step 5) | Checkbox checked; mock submit |

**Back navigation:** Allowed from any step; state is never cleared when going backward.

**Forward navigation:** `validateStep(currentStep)` must pass before `currentStep++`.

### 6.2 Step 1 — Claim Type Selection

| Rule | Detail |
|---|---|
| Options | Outpatient, Inpatient, Dental (exactly one) |
| On change | Clear or reset type-specific fields in Steps 3–4 (documents, inpatient dates, major dental flag) |
| UI | Radio cards or buttons; keyboard selectable |

### 6.3 Step 2 — Member & Policy Information

| Field | Validation |
|---|---|
| Member name | Required, non-empty |
| Policy number | Required, non-empty |
| Member ID | Required, non-empty |
| Date of birth | Required, valid date, not in future |
| Dependent | Optional; if selected, must be from mock dependents list |
| Pre-fill | Load from `member.json` on wizard init; user can edit all fields |

### 6.4 Step 3 — Diagnosis & Treatment

| Field | Outpatient | Inpatient | Dental |
|---|---|---|---|
| Diagnosis description | Required | Required | Required |
| ICD-10 code | Required (from list) | Required | Required |
| Treatment date | Single date, required | — | Single date, required |
| Admission date | — | Required | — |
| Discharge date | — | Required, ≥ admission | — |
| Length of stay | — | Auto-calculated, display only | — |
| Provider/hospital | Required | Required | Required |
| Admission reason | — | Required | — |
| Major dental flag | — | — | Required (checkbox or procedure type) |

**ICD-10 autocomplete:**
- Filter `icd10-codes.json` as user types (code or description substring, case-insensitive)
- Debounce ~200–300 ms for performance
- Must select a valid code from list (not free-text only)

**Provider suggestions:**
- Filter mock provider list; user can still enter custom text

**Length of stay:**
- `lengthOfStay = differenceInCalendarDays(dischargeDate, admissionDate)` (or inclusive +1 — pick one and document in code)
- Read-only field updated when dates change

### 6.5 Step 4 — Document Upload

**Allowed file types:** PDF, JPG, JPEG, PNG  
**Max size:** 10 MB per file

| Doc Type | Outpatient | Inpatient | Dental |
|---|---|---|---|
| Medical receipt | Required | Required | — |
| Prescription | Optional | — | — |
| Discharge summary | — | Required | — |
| Itemized bill | — | Required | — |
| Dental receipt | — | — | Required |
| Treatment plan | — | — | Required if `isMajorDental` |

| Rule | Behavior |
|---|---|
| Missing required doc | Block "Next"; show inline error |
| Wrong file type | Reject file; show error; do not add to state |
| File > 10 MB | Reject file; show error |
| Upload progress | Show progress indicator during read/simulated upload |
| Multiple files per slot | Single file per document type (replace on re-upload) |

### 6.6 Step 5 — Review & Submit

| Rule | Behavior |
|---|---|
| Summary | Display all data from Steps 1–4 grouped by section |
| Edit | "Edit" links or Back button to any step without data loss |
| Confirmation | Checkbox: "I confirm this information is accurate" — required |
| Submit | Disabled until confirmation checked and all validations still pass |
| Mock submit | `console.log(payload)` + success message / modal; optional reset wizard |

### 6.7 General UX & Accessibility

| Requirement | Implementation |
|---|---|
| State persistence | Single wizard store; no unmount clearing on step change |
| Responsive | Mobile-first Tailwind; stacked layout on small screens |
| Progress indicator | Visible steps 1–5 with current/completed states |
| Keyboard | Tab order logical; Enter on focused primary action advances when valid |
| Focus management | Move focus to step heading on step change (optional enhancement) |

### 6.8 Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Change claim type after uploading docs | Clear incompatible documents; re-evaluate required list |
| Discharge before admission | Validation error on Step 3 |
| ICD-10 partial match with no selection | Block advance until valid code chosen |
| Remove uploaded required doc | Block advance on Step 4 |
| Submit without confirmation | Submit button disabled |
| Dental non-major | Treatment plan optional, not shown as required |

---

## 7. Current Progress & Next Steps

> **Documentation protocol** (`context/prompts/system_prompt.md`): After every functional milestone, bug fix, or architectural decision, update **this section** and **Section 8** before stopping — include what changed, new files/deps, why the approach was chosen, and the immediate next step.

### Completed
- [x] Requirements analyzed (`context/requirement.md`)
- [x] `CONTEXT.md` v1.0 created (architecture, business rules, file structure)
- [x] `CONTEXT.md` v1.1 — aligned tech stack with implementation plan (`implement_prj.md`); added continuous-documentation protocol
- [x] **Phase 0 — Scaffold & Tech Stack** (Prompt 0)
  - [x] Vite 8 + React 19 + TypeScript 6 scaffold (`npm create vite`, template `react-ts`)
  - [x] Tailwind CSS v4 via `@tailwindcss/vite` plugin
  - [x] Installed: `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`
  - [x] shadcn/ui foundation: `components.json`, `src/lib/utils.ts` (`cn`), `src/components/ui/button.tsx`
  - [x] Path alias `@/*` → `src/*` in `vite.config.ts` + `tsconfig.app.json`
  - [x] Placeholder `App.tsx` confirming stack; `npm run build` passes
- [x] **Phase 1 — Mock Data & Types** (Prompt 1)
  - [x] `src/types/types.ts` — `WizardFormValues`, claim/doc enums, step field picks, submission payload
  - [x] `src/types/index.ts` — re-exports
  - [x] `src/data/mockData.ts` — member, 4 dependents, 10 providers, **141 ICD-10 codes**, `documentConfig`
  - [x] Helpers: `createDefaultFormValues`, `filterIcd10Codes`, `filterProviders`, lookups
  - [x] `src/data/index.ts` — re-exports
  - [x] No UI changes (data layer only)
- [x] **Phase 2 — Wizard Shell** (Prompt 2)
  - [x] `WizardForm` — `FormProvider` + `useForm` with `createDefaultFormValues()`, `shouldUnregister: false`
  - [x] `Stepper` — responsive progress (mobile short labels + desktop full titles), `aria-current="step"`
  - [x] `StepNavigation` — Back (type=button) / Next (type=submit, Enter key), disabled Submit on step 5
  - [x] Placeholder steps 1–5 in `src/components/steps/`
  - [x] `src/constants/wizardSteps.ts` — step metadata
  - [x] Focus moves to step heading on navigation; form state persists across Back/Next
  - [x] `App.tsx` renders `WizardForm`
- [x] **Phase 3 — Steps 1 & 2** (Prompt 3)
  - [x] `Step1ClaimType` — selectable cards (Outpatient / Inpatient / Dental) with icons; resets type-specific fields on change
  - [x] `Step2MemberInfo` — pre-filled editable member fields; dependent yes/no radios; conditional dependent dropdown
  - [x] `src/schemas/wizardSchemas.ts` — Zod `step1Schema`, `step2Schema`, `STEP_SCHEMAS`, `STEP_FIELD_NAMES`
  - [x] `src/utils/validateStep.ts` — per-step `safeParse` + `setError` before Next
  - [x] `src/components/ui/form-field.tsx` — shared label/error wrapper
  - [x] Next blocked until current step validates (Steps 1–2); Steps 3–5 still pass through
- [x] **Phase 4 — Step 3** (Prompt 4)
  - [x] `Step3DiagnosisTreatment` — diagnosis textarea; conditional dates; inpatient admission reason + LOS
  - [x] `Autocomplete` — reusable combobox with keyboard nav (↑/↓, Enter, Escape)
  - [x] ICD-10 search — debounced 250 ms filter over 141 codes via `filterIcd10Codes`
  - [x] Provider search — debounced suggestions from `mockProviders`; free-text allowed
  - [x] `step3Schema` — claim-type-conditional validation (dates, ICD-10 must match list, admission reason)
  - [x] `src/utils/dateUtils.ts` — inclusive LOS calculation
  - [x] `src/hooks/useDebouncedValue.ts`
- [x] **Phase 5 — Step 4** (Prompt 5)
  - [x] `Step4Documents` — dynamic doc list from `documentConfig` + `claimType`
  - [x] Major dental checkbox (dental only); treatment plan required when checked
  - [x] `FileUpload` — drag-and-drop zone, PDF/JPG/PNG + 10 MB validation, mock progress (1–2 s)
  - [x] `step4Schema` — blocks Next if required documents missing
  - [x] `src/utils/fileValidation.ts` — type/size checks + progress simulator
  - [x] `getRequiredDocuments` / `isDocumentRequired` helpers in mockData
  - [x] Nested `documents.{type}` errors in `validateStep.ts`
- [x] **Step validation guard (Steps 1–4)** — `useIsCurrentStepValid` + `isCurrentStepValid()` disables Next until Zod passes; Step 3 reactive future-date errors via `useStep3DateValidation`
- [x] **Phase 6 — Step 5 & Polish** (Prompt 6)
  - [x] `Step5Review` — grouped summary of Steps 1–4 with Edit buttons (jumps to step via `setValue('currentStep')`, no data loss)
  - [x] Confirmation checkbox + `step5Schema`; Submit disabled until checked and Steps 1–4 still valid (`isWizardReadyToSubmit`)
  - [x] `buildClaimSubmissionPayload` / `submitClaim` — `console.log` mock payload; `SubmitSuccess` screen + “Submit another claim” reset
  - [x] `StepNavigation` — Submit (type=submit, Enter key); contextual hint when action disabled
  - [x] Responsive summary layout (stacked mobile, two-column label/value on sm+)
- [x] **Phase 7 — README & build verification** (scoped down — no Vitest)
  - [x] Root `README.md` — install/run instructions, scripts, project overview
  - [x] `npm run build` passes (TypeScript + Vite production build)
  - [x] Deployed to Vercel — **https://ai-challenge-07.vercel.app** (alias); production URL in README

### In Progress
- [ ] Nothing

### To Do

**Submission (optional)**
- [ ] Confirm GitHub repo is pushed and linked in README (if not already)

### Timeline Estimate
| Phase | Estimate |
|---|---|
| Phase 0 | ✅ Done | ~30 min |
| Phase 1 | ✅ Done | ~30 min |
| Phase 2 | ✅ Done | ~45 min |
| Phase 3 | ✅ Done | ~45 min |
| Phase 4 | ✅ Done | ~1 hr |
| Phase 5 | ✅ Done | ~1 hr |
| Phase 6 | ✅ Done | ~45 min |
| Phase 7 | ✅ Done (README only) | ~15 min |
| **Total** | **3.5–5 hrs** |

---

## 8. Key Decisions & Constraints

1. **Five steps, fixed order** — Do not merge or skip steps; evaluation expects all five functional.
2. **Conditional logic is claim-type-driven** — Every branch keys off `OUTPATIENT | INPATIENT | DENTAL`.
3. **Form state: react-hook-form (not Context/reducer)** — Single `useForm` instance wrapped in `FormProvider` keeps all step values in one object; Back/Next only changes `currentStep`, so data never unmounts. Chosen over Zustand/Context because step fields map naturally to form registers and Zod integrates via `@hookform/resolvers`.
4. **Validation: Zod per step** — Separate schemas (or `.pick()` from a master schema) run on Next click; avoids validating future steps prematurely.
5. **Build: Vite + React** (not Next.js) — SPA wizard has no SSR/SEO need; Vite is lighter and matches challenge scope.
6. **No backend** — Mock data only; submission logs to console or shows UI success.
7. **ICD-10 list** — ≥100 codes in `mockData.ts`; client-side debounced filter.
8. **File constraints** — PDF, JPG, PNG only; 10 MB max; enforce before storing in form state.
9. **Required documents block progression** — Step 4 cannot complete without all required uploads.
10. **No data loss on navigation** — react-hook-form values persist; do not remount `FormProvider` on step change.
11. **Responsive + accessible** — Required for evaluation; tab order + Enter to proceed.
12. **Major dental** — Checkbox drives treatment-plan requirement (Step 4/5).
13. **Submission deliverables** — GitHub repo + deployed live URL (per `requirement.md`).
14. **Living doc** — Update Sections 7 & 8 after every milestone (`system_prompt.md`).
15. **Tailwind v4 + Vite plugin** — Uses `@tailwindcss/vite` (no `tailwind.config.js`); theme tokens in `src/index.css` via `@theme inline`.
16. **shadcn/ui v4 (base-nova)** — `components.json` configured; `@base-ui/react` for primitives. On Windows, CLI may write to `@/` folder — install components to `src/components/ui/` manually if needed.
17. **TypeScript 6 paths** — `@/*` alias with `ignoreDeprecations: "6.0"` for transitional `baseUrl`.
18. **Single `types.ts` + `mockData.ts`** — All form fields live in one `WizardFormValues` interface; conditional UI reads `claimType` rather than separate per-type form shapes. Simplifies react-hook-form + Zod in Phase 2.
19. **ICD-10 data** — 141 codes in `mockIcd10Codes`; filter helpers pre-built for Step 3 autocomplete.
20. **`documentConfig` in mockData** — Step 4 requirements encoded as data (`requiredWhen: 'isMajorDental'` for dental treatment plan).
21. **Wizard shell architecture** — Single `<form>` wraps all steps; only `StepContent` swaps by `watch('currentStep')`. `FormProvider` never unmounts. `shouldUnregister: false` keeps field values when step components unmount in later phases.
22. **Navigation** — Back via `setValue('currentStep', n-1)`; Next/Submit via form `onSubmit` (Enter key). `useIsCurrentStepValid` disables primary action until current step passes Zod (+ upload guard on Step 4).
23. **Per-step Zod validation** — `validateWizardStep()` on Next/Submit; `isCurrentStepValid()` for reactive button guard. Schemas steps 1–5 in `wizardSchemas.ts`.
24. **Claim type change reset** — `Step1ClaimType` clears treatment dates, inpatient fields, `isMajorDental`, and `documents` when `claimType` changes.
25. **LOS calculation** — Inclusive calendar days: `floor((discharge − admission) / 1 day) + 1` in `dateUtils.ts`; auto-updates via `useEffect` in Step 3.
26. **ICD-10 autocomplete** — Debounced in-memory filter (250 ms, max 15 results); must select valid code from `mockIcd10Codes` for Step 3 validation.
27. **File upload** — Client-only; mock progress via `requestAnimationFrame` over 1–2 s; `File` stored in form `documents` map keyed by `DocumentType`.
28. **Document requirements** — Driven by `documentConfig` + `isDocumentRequired()`; treatment plan required when `isMajorDental` is true on dental claims.
29. **Step 5 review** — Read-only summary from `watch()`; Edit sets `currentStep` without unmounting `FormProvider`. Submit builds `ClaimSubmissionPayload` in `submitClaim.ts`.
30. **Submit guard** — `isWizardReadyToSubmit()` requires `confirmationChecked` plus re-validation of Steps 1–4 before mock submit.
31. **Phase 7 scope** — README + build verification only; Vitest skipped (not required by official challenge guidelines).

---

## 9. Notes for Future AI Sessions

1. **Read this file first** — Source of truth for business rules and structure.
2. **Follow `context/prompts/system_prompt.md`** — After each milestone, update Sections 7 & 8 *before* waiting for the user's next message. Record: (a) what was implemented, (b) new files/deps, (c) why the approach was chosen, (d) immediate next step.
3. **Follow `context/prompts/implement_prj.md`** — Phased prompts 0–6 map to Sections 7 phases; do not skip ahead unless asked.
4. **Check Section 6 before writing validation** — Per-step rules and document matrix are authoritative.
5. **Do not add a real API** — Mock submission only.
6. **Preserve wizard state** — All fields live in react-hook-form; avoid duplicate local state in step components.
7. **ICD-10 performance** — Debounced in-memory filter over `mockData.ts`.
8. **Changing claim type** — Reset incompatible fields via `setValue` / `resetField` (Section 6.8).
9. **File uploads** — Store `File` + metadata in form state; no server upload.
10. **After deployment** — Update README live URL, bump version/date in this file.
11. **Run locally:** `npm install && npm run dev` (after Phase 0).

---

**Next Step:** None — wizard complete and deployed. Add GitHub repo URL to README when the repository is public.
