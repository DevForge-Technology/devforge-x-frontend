# DevForge[x] — Referral Management Platform (Frontend)

DevForge[x] is a multi-tenant referral management platform built to streamline and secure vendor-submitted referrals. This directory contains the frontend client application built with Next.js 14, Tailwind CSS, and shadcn/ui.

---

## Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | Next.js 14 (App Router) | Client application with Tailwind CSS & shadcn/ui components |
| **Auth** | Supabase Auth | Identity provider handling JWT session verification & role metadata |
| **Validation** | react-hook-form + Zod | Client-side schema validation and type-safety verification |

---

## Features

- 🏢 **Multi-Tenant Workspaces**: Companies operate as separate workspaces. Vendors can switch their active company workspace seamlessly.
- 🔐 **Role-Based Access Control (RBAC)**: Next.js middleware intercepts route navigation, parsing user roles from the session cookies to permit or deny access.
- 📊 **Metric Dashboards**: 
  - **Admins** see system-wide stats: total vendors, total companies, and recent referrals.
  - **Vendors** see personal referral statistics specific to their active company workspace.
- 📋 **Referral Management**: Scoped referral lists and forms to submit, update, and delete referrals.

---

## Project Structure

```
frontend/
├── app/
│   ├── dashboard/          # Role-aware dashboard
│   ├── referrals/          # Scoped referrals list/form
│   ├── vendors/            # Admin vendor panel
│   ├── companies/          # Admin company workspace panel
│   ├── profile/            # Password management & settings
│   └── auth/login/         # Access portal
├── components/
│   ├── ui/                 # shadcn components
│   ├── shared/             # Sidebar, layout wrappers, data tables
│   └── workspace/          # Tenant/workspace switcher
└── middleware.ts           # Route guard and RBAC
```

---

## Environment Setup

### 1. File Configuration

Copy environment template file:
```bash
cp .env.example .env.local
```

### 2. Variable Parameters

#### **.env.local**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Installation & Launch

### Step 1: Install Dependencies
Run the installation command:
```bash
npm install
```

### Step 2: Run Development Service
Start the Next.js development server (typically runs on http://localhost:3000):
```bash
npm run dev
```

---

## Package Scripts Reference

| Script Command | Description |
|----------------|-------------|
| `npm run dev` | Launch Next.js dev server |
| `npm run build` | Build frontend production application |
| `npm run start` | Start production server after build |
| `npm run lint` | Run ESLint check |
| `npm run typecheck` | Run TypeScript type checks |
