# 📑 Project Handoff: Fencing Contractor Portal
**Version:** 1.0.0 | **Last Updated:** 2026-04-12

## 🚀 Overview
A high-performance, SaaS-oriented management portal designed for fencing contractors. The system serves as a bridge between **GoHighLevel (CRM)** and field operations, managing job scheduling, employee dispatch, and real-time labor tracking.

---

## 🛠 Tech Stack
- **Framework:** Next.js 16 (Turbopack)
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** NextAuth.js (JWT Strategy)
- **Styling:** Vanilla CSS + Tailwind-like logic for premium dark-mode aesthetics
- **Integrations:** n8n (Webhooks), GoHighLevel (Inbound/Outbound Sync)

---

## 🔐 Role-Based Access Control (RBAC)
The system uses the `Role` enum in Prisma:
- **ADMIN / MANAGER:** Full control over all modules (Payroll, Onboarding, Dispatch).
- **FOREMAN:** Access to Job Tracker, Contacts, and Team Dispatch. Can issue invoices and assign crews.
- **CREW / EMPLOYEE:** Access to personal dashboard with earnings power, active deployments, and job logging.

---

## 🏗 Core Modules

### 1. Unified GHL Sync Engine (`src/app/api/v1/sync`)
- Supports **Inbound Sync** for Employees, Contacts, and Jobs.
- Uses `ghlJobId` and `ghlContactId` as unique keys to prevent duplicates.
- All endpoints are protected by an `INTERNAL_API_KEY`.

### 2. Job Lifecycle & Dispatch
- **Status Workflow:** `Scheduled` → `In Progress` → `Completed` → `Invoiced` → `Paid`.
- **Team Dispatch:** Supports many-to-many `Crew` relations and a primary `Foreman` lead.
- **Protection Logic:** 
    - Marking a job as **Invoiced** automatically locks all related timesheets.
    - Submitting a **Final Job Completion Report** automatically sets `isDisabled: true` on the `Job`.
    - **DISABLED Status:** Once a job is disabled (manually or via completion), all standard daily logging is strictly blocked in the API and hidden from the crew dashboard.

### 3. Employee Dashboard
- **Earnings Power:** Real-time calculation based on `payRate` and approved hours.
- **Operational Theater:** Embedded Google Maps views for each job site.
- **Logging:** Simple interface for field crew to log tasks and materials.

### 4. Outbound Webhooks
- Automatically triggers a POST request to `ONBOARDING_WEBHOOK_URL` whenever a job assignment or status changes.
- **Payload Schema:** documented in `n8n_configuration_guide.md`.

---

## 📂 Key Files & Locations
- **`prisma/schema.prisma`**: The source of truth for the data model.
- **`src/app/actions/job.ts`**: Core business logic for status shifts and dispatch.
- **`src/lib/webhooks.ts`**: Handles all outbound communication to n8n.
- **`src/components/CrewAssignment.tsx`**: Dynamic many-to-many selection UI.
- **`n8n_configuration_guide.md`**: Step-by-step payloads for CRM integration.

---

## ⚠️ Important Implementation Details
- **Timesheet Locking:** Ensure any future payroll logic respects the `isLocked` flag on the `Timesheet` model.
- **Map Embeds:** Uses an iframe filter `invert(90%) hue-rotate(180deg)` to match the dark theme without requiring an expensive Maps JS API key.
- **Type Safety:** Always run `npm run build` after editing roles or relations; the project uses strict TypeScript for stability.

---

## 🔮 Future Roadmap
1. **Payroll Automation:** Generating final gross/net pay reports from the locked timesheets.
2. **Material Inventory:** Deducting material costs dynamically from project yield.
3. **Photo Verification:** Mandatory site photo uploads for the `Final Close-Out` action.
