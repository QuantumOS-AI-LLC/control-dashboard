**Version:** 1.5.0 | **Last Updated:** 2026-06-07

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
    - **Approval Dashboard**: Created a premium management interface at `/admin/onboarding` for reviews.
    - **Conditional Webhooks**: Re-engineered registration webhooks to trigger **only upon approval**.
- **Job Tracker & Dispatch Optimizations**:
    - **Standardized Webhooks**: Refactored triggers to use consistent `action_name` and nested `payload`.
    - **Enriched Payloads**: Expanded job webhooks to include detailed Foreman and Crew metadata.
    - **Customer Contact Fix**: Implemented a comprehensive fallback system for customer phone numbers using GHL Contact records.
    - **Foreman Display Fix**: Resolved "Unassigned" display bug in the Job Tracker.
- **GHL Technical Integration**:
    - **Schema Update**: Added `ghlUserId` to the `User` model.
    - **API Upgrades**: Enhanced `/api/v1/sync/employee` to support `ghl_user_id`.
- **Documentation**: Fully updated `n8n_configuration_guide.md` with new sync payload schemas.

### 🗓️ April 18, 2026 - Manual Contact Intake & Global Address Schema
- **Manual Contact Intake System**:
    - **Feature Deployment**: Implemented a professional manual contact entry modal in the Admin portal.
    - **Intelligent Field Features**: 
        - Integrated **Nominatim (OpenStreetMap) Address Autocomplete** for standardized data entry.
        - Implemented **Live Deduplication Search** on the Full Name field for real-time CRM record matching.
    - **Server Action Logic**: Created `createManualContact` with built-in validation and background webhook triggers.
- **Global Address Schema & API Expansion**:
    - **Schema Upgrade**: Added native `country` field support to both `Contact` and `Job` models.
    - **API Enrichment**: Upgraded `/api/v1/sync/contact` and `/api/v1/sync/job` to support granular component mapping (`city`, `state`, `postal_code`, `country`).
    - **Method Support**: Explicitly enabled `PATCH` support on the contact sync route to resolve `405` errors.
- **2-Way Sync & Reconciliation**:
    - Updated **n8n Configuration Guide** with the precise callback syntax (`payload.portal_id`) required to link temporary records.
- **System Stability**: Performed critical database schema pushes to Neon to ensure environment alignment.

### 🗓️ May 29, 2026 - Fencing Business Flow Integration
- **Fencing Schema Ingestion**:
    - Expanded database schema with detailed project specs: `fenceTypes` array, `installationType` selection, logistics flags (`accessSkidExcavator`, `bringBackDirt`), exact financial tracking, and file attachment properties (`planFileUrl`, `localisationCertificateUrl`).
    - Added conditional properties for Frost fence specifications (height, slats, color).
- **Multi-Step Creation Wizard**:
    - Restructured the admin `CreateJobModal` into a wizard layout separating (1) Client identity and secondary contacts, (2) Fencing specs, (3) Budget, deposits, and files, and (4) Team assignments and notes.
- **CRM Webhook Action Triggers**:
    - Added `JobDiggingActions` to the Job Details page, allowing administrators to trigger n8n webhooks for Expectation SMS, Info-Excavation requests, and Digging Invoicing (35%).
- **On-Site Crew Visualizations**:
    - Updated employee shift logging and job completion pages to render full project specs and resource downloads.
- **2-Way Sync Type Protection**:
    - Updated `/api/v1/sync/job` route with floating-point parser helpers to ensure numeric data is parsed safely without runtime errors.

### 🗓️ May 30, 2026 - Custom Client Upload Portal & 2-Way Sync
- **Custom Client Upload Route**:
    - Created a branded client-facing upload portal at `/client/[id]/upload` to collect official **Fence Plans** and **Localisation Certificates**.
    - Configured automatic base64 conversion for direct PostgreSQL storage (`planFileData` and `localisationCertificateData`).
    - Configured a post-upload webhook to notify n8n (`action_name: "documents_uploaded"`) to advance GHL pipeline stages.
- **Secure Document Server API**:
    - Created `/api/jobs/[id]/documents/[type]` to securely fetch and serve base64 documents inline for Admin and Employee dashboard views.
    - Updated Admin Job details and Employee views to point to the secure internal route.
- **Pipeline Stage Mapping**:
    - Enhanced `/api/v1/sync/job` to parse incoming GHL webhook `pipeline_stage` strings and dynamically transition Job status fields (`Scheduled`, `In_Progress`, `Paid`).

### 🗓️ May 31, 2026 - Outbound Webhook Enrichment & 2-Way Sync
- **Webhook Status Enrichment**:
    - Added `ghl_pipeline_stage` to the status update webhook (`job_status_updated`), mapping `JobStatus` directly to GHL Pipeline Stage names.
- **Fencing Specs in Creation**:
    - Enriched manual job creation webhook (`job_created`) with all custom fencing spec fields to populate GHL custom fields via n8n.
- **Outbound Webhook Triggers Added**:
    - Added outbound webhooks for Dispatch Info edits (`job_dispatch_updated`), Digging Metrics updates (`job_digging_metrics_updated`), Digging Photos additions (`job_digging_photos_added`), File URL updates (`job_files_updated`), and Job Lock/Disable toggling (`job_finalized` / `job_reopened`).
- **Documentation Alignment**:
    - Fully updated `n8n_configuration_guide.md` with complete schemas and callback instructions.
- **1-to-1 Pipeline Stage Alignment**:
    - Expanded `JobStatus` database enum to include all GHL stages: `New_Lead`, `Initial_Contact`, `Estimate_Scheduled`, `Pending_Close`, `Booked_Pending_Docs`, `Digging_In_Progress`, and `Digging_Completed`.
    - Updated inbound sync logic at `/api/v1/sync/job` to parse and map all GHL stages into these statuses.
    - Updated outbound webhook status mapping to auto-move opportunity stages in GHL.
    - Protected Employee and Crew dashboards from showing non-operational Sales leads (stages 1 to 6).
    - Updated Admin Job listings page and metric cards to represent the full sales funnel alongside operations.
    - Configured the dashboard status toggle button (`JobStatusToggle`) to advance the pipeline step-by-step through all GHL stages.

### 🗓️ June 7, 2026 - Fencing Estimate System Integration
- **Granular Scheduling Schema**:
    - Added `estimateDate` (`DateTime?`), `estimateTime` (`String?`), `estimateCompleted` (`Boolean?` @default(false)), `estimateCompletionDate` (`DateTime?`), and `estimateCompletionNotes` (`String?` @db.Text) to the `Job` model in [schema.prisma](file:///c:/dashboard/control-dashboard/prisma/schema.prisma) to manage separate estimate scheduling and completion states.
- **Combined GHL Date-Time Parser**:
    - Implemented a robust parser in `/api/v1/sync/job` and `/api/jobs` to process incoming combined date-time strings (e.g. `"Monday, June 8, 2026 7:00 PM"` or `"Wednesday, June 10, 2026 8:00 PM"`).
    - Splits payloads into mid-night `Date` timestamps (no defaults) and formatted time strings (`"7:00 PM"`).
    - Returns `updatedFields` in the JSON response payload.
- **Status & Pipeline Stage Alignment**:
    - Configured all status-changing actions (`createManualJob`, `updateJobStatus`, `completeEstimateVisit`) and the sync route to automatically update the database's `ghlPipelineStage` field to match the portal status, avoiding visual mismatch bugs.
- **Estimate Creation Wizard**:
    - Extended Zustand state management in [jobModalStore.ts](file:///c:/dashboard/control-dashboard/src/store/jobModalStore.ts) and added picker controls under Step 4 in [CreateJobModal.tsx](file:///c:/dashboard/control-dashboard/src/components/admin/CreateJobModal.tsx) to support manual estimate scheduling. Made deployment date/time optional to prevent unintended default values.
- **Admin View Enhancements**:
    - Upgraded [page.tsx](file:///c:/dashboard/control-dashboard/src/app/admin/jobs/[id]/page.tsx) to list both estimate and installation schedules, as well as render a detailed "Estimate Visit Details" card once the estimator completes the visit.
- **Estimator Dashboard & Complete Form**:
    - Included `Estimate_Scheduled` status cards in the Employee Dashboard [page.tsx](file:///c:/dashboard/control-dashboard/src/app/employee/dashboard/page.tsx) with a custom badge and completion action.
    - Designed the [EmployeeEstimateForm.tsx](file:///c:/dashboard/control-dashboard/src/components/EmployeeEstimateForm.tsx) client form to confirm specs (Wood, Ornemental, Frost, Composit, Glass), installation methods, dirt removal, and notes.
    - Created the host page [page.tsx](file:///c:/dashboard/control-dashboard/src/app/employee/estimate/[id]/page.tsx) to submit the estimate visit details, transition status to `Pending_Close` (Stage 4), and trigger GHL sync outbound webhooks.

