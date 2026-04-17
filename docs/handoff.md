**Version:** 1.3.0 | **Last Updated:** 2026-04-17

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
    - **Invoice Guard:** A job cannot be transitioned to **Invoiced** if any associated timesheets are in `PENDING` or `REJECTED` status.
    - Marking a job as **Invoiced** or **Paid** automatically locks all related timesheets (`isLocked: true`).
    - Submitting a **Final Job Completion Report** automatically sets `isDisabled: true` on the `Job`.
    - **DISABLED Status:** Once a job is disabled (manually or via completion), all standard daily logging is strictly blocked in the API and hidden from the crew dashboard.

### 3. Employee Dashboard
- **Earnings Power:** Real-time calculation based on `payRate` and **APPROVED** hours only.
- **Operational Theater:** Embedded Google Maps views for each job site.
- **Logging:** Simple interface for field crew to log tasks and materials.
- **Feedback Loop:** Employees can view specific rejection reasons for non-approved timesheets directly on their dashboard.

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

---

## 📜 Change Logs (v1.1.0)

### 🗓️ April 14, 2026 - Manual Workflow & 2-Way Sync
- **Major Feature: Manual Installation Workflow**: Integrated a robust `CreateJobModal` in the Admin jobs dashboard for manual tasking.
- **Zustand State Management**: Migrated modal state to `jobModalStore.ts` for cleaner, predictable form handling.
- **GHL Calendar Alignment**:
    - Replaced free-text time with **30-minute interval dropdowns**.
    - Implemented `getBookedSlotsForDate` server action to prevent double-booking in the UI.
- **Contact Search & Autofill**:
    - Integrated debounced database search in the "Full Name" field.
    - Selecting an existing contact now autofills **Email, Phone, and Address**.
    - Implemented automatic deduplication on the backend (Email/Phone matching).
- **Sequential Webhook Triggers**:
    - Manual creations now trigger `contact.created` (with 1.5s delay) followed by `job.created`.
    - Both webhooks are processed in the **background** to keep the UI snappy.
- **2-Way Sync (ID Link-Back)**:
    - Upgraded `/api/v1/sync/contact` and `/api/v1/sync/job` to support the internal `id` key.
    - Allows n8n to link real GHL Opportunity/Contact IDs back to portal records without creating duplicates.
- **Employee Portal visibility**:
    - Added high-visibility **Customer Email** and **Phone** cards to the crew dashboard.
    - Integrated `tel:` and `mailto:` protocol links for one-tap field communication.
- **Address Intelligence**: Integrated Nominatim (OpenStreetMap) for live address autocomplete in the manual job form.
- **Strict Validation**: Enforced `required` constraints on all critical deployment data (Customer Info, Address, Date/Time, Foreman, and Dispatch Notes).
- **System Documentation**: Created `api_schema.md` and updated `n8n_configuration_guide.md` with 2-way sync callback logic.
- **Advanced Job Filtering**: Implemented a multi-modal Schedule filter in `JobTable` supporting date presets (Today, Tomorrow, Week), specific date picking, date ranges, and month-based filtering.

### 🗓️ April 16, 2026 - Advanced Approval System & Lifecycle Integration
- **Enhanced Timesheet Workflow**:
    - Migrated from binary `isApproved` to `TimesheetStatus` (`PENDING`, `APPROVED`, `REJECTED`).
    - Implemented `rejectTimesheet` action with mandatory `rejectionReason`.
    - Added **Bulk Approval** capability in the Admin Dashboard for faster auditing.
- **Job Lifecycle Guards**:
    - Implemented an **Invoice Guard**: prevents transitioning jobs to `Invoiced` if any labor logs are pending or rejected.
    - Expanded locking logic to ensure all timesheets are locked upon both `Invoiced` and `Paid` status shifts.
- **Payroll Validation**: Updated Employee "Earning Power" to calculate gross totals based strictly on `APPROVED` timesheets.
- **Employee Feedback Loop**: Integrated rejection reason visibility on the employee dashboard for transparent communication.
- **Type Safety**: Enforced strict `Job` and `PendingUser` interfaces in the admin dashboards for better runtime stability.

### 🗓️ April 17, 2026 - Onboarding Approval & GHL User ID Integration
- **Employee Onboarding Approval System**:
    - Implemented a secure, role-based approval workflow for new registrations.
    - Added `PENDING_APPROVAL` and `REJECTED` statuses to the `EmployeeStatus` model.
    - **Authentication Guard**: Updated NextAuth middleware to strictly block login for accounts that are not `ACTIVE`.
    - **Approval Dashboard**: Created a premium management interface at `/admin/onboarding` for managers to review, approve, or reject applicants.
    - **Conditional Webhooks**: Re-engineered the registration webhook to trigger **only upon approval**, ensuring the CRM only receives verified employee data.
- **Job Tracker & Dispatch Optimizations**:
    - **Standardized Webhooks**: Refactored all outbound triggers to use a consistent `action_name` and nested `payload` structure for n8n compatibility.
    - **Foreman Display Fix**: Resolved a bug where assigned Foremen appeared as "Unassigned" by integrating correct relational fetches in the Job Tracker.
    - **UI Polish**: Removed hardcoded "Install Window" labels from the job table for a cleaner interface.
- **GHL Technical Integration**:
    - **Schema Update**: Added `ghlUserId` to the `User` model to map internal GHL Staff/User IDs.
    - **API Upgrades**: Enhanced `/api/v1/sync/employee` (`POST` and `PATCH`) to support the new `ghl_user_id` field for automated syncs.
    - **Generic Actions**: Added a flexible `updateUser` server action to support programmatic user updates.
- **Documentation**: Fully updated the `n8n_configuration_guide.md` with new sync payload schemas.

