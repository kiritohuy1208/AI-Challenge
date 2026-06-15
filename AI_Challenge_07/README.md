# Claims Intake Wizard

A responsive **5-step insurance claim submission wizard** built for AI Challenge 07. Members can submit outpatient, inpatient, or dental claims with type-specific fields, document uploads, validation, and a final review step.

## Features

- **Step 1 — Claim type:** Outpatient, Inpatient, or Dental (drives all conditional logic)
- **Step 2 — Member & policy:** Pre-filled mock member data, optional dependent selection
- **Step 3 — Diagnosis & treatment:** ICD-10 autocomplete (141 codes), provider search, conditional dates
- **Step 4 — Documents:** Dynamic upload slots by claim type; PDF/JPG/PNG, max 10 MB; mock progress
- **Step 5 — Review & submit:** Full summary with edit links, confirmation checkbox, mock submit

Form state persists across Back/Next navigation. Submit logs the payload to the browser console and shows a success screen.

## Live demo

**https://ai-challenge-07.vercel.app**

Production deployment: https://ai-challenge-07-28ji6563h-tohuykiri-4652s-projects.vercel.app

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Forms | react-hook-form |
| Validation | Zod |
| Icons | lucide-react |

## Prerequisites

- **Node.js** 18 or later
- **npm** (comes with Node)

## Getting started

```bash
# Clone the repository, then from the project root:
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── components/
│   ├── steps/          # Step 1–5 UI
│   ├── ui/             # Shared UI (form fields, autocomplete, file upload)
│   └── wizard/         # Wizard shell, stepper, navigation
├── data/mockData.ts    # Mock member, dependents, ICD-10, providers, document config
├── schemas/            # Zod validation per step
├── hooks/              # Step validation guards, debounce, date validation
├── utils/              # Dates, files, submit payload, step validation
└── types/              # TypeScript interfaces
```

## Mock submission

On Step 5, after checking **“I confirm this information is accurate”** and clicking **Submit**, the full claim payload is written to the browser console (`Claim submission payload:`). No backend is used.

## Documentation

See [`CONTEXT.md`](./CONTEXT.md) for architecture, business rules, and implementation notes.

## License

Private — submission for AI Challenge 07.
