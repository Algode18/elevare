# Elevare

Elevare is a full-stack job platform connecting candidates and employers, with dedicated dashboards for both sides of the hiring process.

## Features

**Candidate side**
- Multi-step onboarding wizard to build a structured candidate profile
- Job discovery with filtering, saved jobs, and one-click "Easily Apply"
- Application tracking dashboard
- Resume section and account settings

**Employer side**
- Employer dashboard with hiring pipeline funnel and KPIs
- Job posting and management, with job expiration handling
- Applicant tracking per job posting
- Company Workspace — branding, offices, team, hiring/social presence, and analytics tabs

## Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS, Framer Motion, Radix UI / shadcn
- **Auth:** Clerk
- **Backend & Database:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Forms & Validation:** React Hook Form, Zod
- **Build Tool:** Vite
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file with:

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## Build

```bash
npm run build
```