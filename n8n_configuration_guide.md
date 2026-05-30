# 🚀 n8n to Control Dashboard - Integration Guide

Use this guide to connect your **n8n** HTTP Request nodes to your database. This replaces the need for a Google Sheet.

**Live API Base URL:** `https://control-dashboard-opal.vercel.app`

---

## 🔑 1. Security Header (Required)
Every request to the portal MUST include this header in the "HTTP Request" node:

| Header Name | Value |
| :--- | :--- |
| **Authorization** | `Bearer f3nc1ng_c0ntr0l_p0rtal_s3cr3t_2024` |

---

## 🏗️ 2. Workflow 1: Contact Sync (Step 18)

**URL:** `https://control-dashboard-opal.vercel.app/api/v1/sync/contact`  
**Method:** `POST`

### 💡 Partial Update Support
You only need to send the `contact_id` and the fields you want to change. For example, if you only want to update the pipeline stage, just send `contact_id` and `pipeline_stage`.

### Lead Pipeline Stages (GHL):
Send one of these exact strings in the `pipeline_stage` field:
- `New Contact`
- `No Response`
- `Contacted`
- `Contacted Interested`
- `Scheduled Estimate`
- `Estimate Given`
- `Estimate Pending`
- `Won`
- `Lost`
- `Not Interested`

### Expected JSON Body:
```json
{
  "contact_id": "{{$json.body.contact_id}}",
  "pipeline_stage": "{{$json.body.pipeline_stage}}",
  "lead_source": "{{$json.body.lead_source}}",
  "first_name": "{{$json.body.first_name}}",
  "last_name": "{{$json.body.last_name}}",
  "full_name": "{{$json.body.first_name}} {{$json.body.last_name}}",
  "phone": "{{$json.body.phone}}",
  "email": "{{$json.body.email}}",
  "city": "{{$json.body.city}}",
  "tags": "{{ (Array.isArray($json.body.tags) ? $json.body.tags : []).join(', ') }}"
}
```

---

## 🧱 3. Workflow 2: Job Assignment (Step 19)

**URL:** `https://control-dashboard-opal.vercel.app/api/v1/sync/job`  
**Method:** `POST` (Upsert) or `PATCH` (Update)

### 💡 Partial Update Support
You can use `PATCH` if you only want to update a few fields (like `job_status`) without sending the whole job data again. Just ensure you always include the `job_id`.

### Job Pipeline Stages (GHL):
You can send the GHL stage name in the `pipeline_stage` field, or the corresponding enum value in the `job_status` field:
- `New_Lead` (New Lead)
- `Initial_Contact` (Initial Contact / Follow Up)
- `Estimate_Scheduled` (Estimate Scheduled)
- `Pending_Close` (Pending Close / Decision)
- `Booked_Pending_Docs` (Job Booked - Pending Docs)
- `Scheduled` (Ready for Schedule / Scheduled)
- `Digging_In_Progress` (Digging in Progress)
- `Digging_Completed` (Digging Completed)
- `In_Progress` (Installation in Progress)
- `Completed` (Completed & Paid)
- `Invoiced`
- `Paid` (Completed & Paid)

### Expected JSON Body:
```json
{
  "job_id": "{{$json.body.job_id}}",
  "job_status": "{{$json.body.job_status}}",
  "contact_id": "{{$json.body.contact_id}}",
  "customer_name": "{{$json.body.customer_name}}",
  "assigned_employee": "{{$json.body.assigned_employee}}", // Send GHL Contact ID of the employee
  "foreman": "{{$json.body.foreman}}",                     // Send GHL Contact ID of the foreman
  "job_address": "{{$json.body.job_address}}",
  "city": "{{$json.body.city}}",                           // New field
  "postal_code": "{{$json.body.postal_code}}",             // New field
  "job_title": "{{$json.body.job_title}}",                 // New field
  "job_date": "{{$json.body.job_date}}",                   // Format: YYYY-MM-DD
  "job_time": "{{$json.body.job_time}}",                   // Format: HH:MM AM/PM
  "material_list_url": "{{$json.body.material_list_url}}",
  "scope_document_url": "{{$json.body.scope_document_url}}"
}
```

> [!TIP]
> **Smart Linking:** If you send the `ghlContactId` in the `assigned_employee` or `foreman` fields, the portal will automatically link the job to the correct internal user and update their display name. If you send a name instead, it will simply display that name string.

---

## 👤 4. Workflow 3: Employee Onboarding (Step 20)

**URL:** `https://control-dashboard-opal.vercel.app/api/v1/sync/employee`  
**Method:** `POST`

### Expected JSON Body:
```json
{
  "email": "{{$json.email}}",
  "first_name": "{{$json.first_name}}",
  "last_name": "{{$json.last_name}}",
  "role": "{{$json.role}}",
  "pay_rate": "{{$json.pay_rate}}",
  "ghl_user_id": "{{$json.id}}", // The Staff/User ID from GHL
  "status": "Active"
}
```

---

## 🔗 5. Workflow 4: Sync GHL Contact ID to Existing Employee

**URL:** `https://control-dashboard-opal.vercel.app/api/v1/sync/employee`  
**Method:** `PATCH`

### When to use this:
After a new employee submits an onboarding form via your Next.js app, your app will send a webhook containing their internal `userId`. If your n8n workflow then creates a contact in GoHighLevel for this employee, you must pass the newly generated GHL `contact_id` back to the portal so the two systems stay linked.

### Expected JSON Body:
```json
{
  "employee_id": "{{$json.payload.userId}}",  // The ID sent from the portal's onboarding webhook
  "contact_id": "{{$json.id}}",               // The Contact ID returned by GHL
  "ghl_user_id": "{{$json.staffId}}"          // The Staff/User ID returned by GHL (if available)
}
```

---

## 🚀 6. Outbound Webhooks (Portal → n8n)

**Destination URL:** Configure this in your portal `.env` as `ONBOARDING_WEBHOOK_URL` (typically `https://n8n.mcloture.com/webhook/dashboard` or similar).

Every outbound webhook request from the portal contains the following top-level wrapper:
```json
{
  "source": "Control Dashboard",
  "timestamp": "2026-05-30T18:00:00.000Z",
  "action_name": "<action_name>",
  "payload": {
    // Specific event data
  }
}
```

Below is the list of all available `action_name` values and their respective nested `payload` schemas:

---

### a) `job_status_updated`
Triggered when an Admin or Manager changes the status of a job in the portal. Contains the GHL pipeline stage name for direct mapping.

**Payload:**
```json
{
  "job_id": "MANUAL-1713333333333", // The GHL Opportunity ID (or MANUAL-*)
  "portal_id": "cm123456789...",
  "status": "In_Progress",
  "ghl_pipeline_stage": "Installation in Progress", // Mapped stage name
  "customer": "John Doe",
  "foreman": "Foreman Name",
  "foreman_details": {
    "name": "Foreman Name",
    "email": "foreman@example.com",
    "ghlContactId": "ghl_foreman_contact_id",
    "ghlUserId": "ghl_foreman_user_id"
  },
  "crew": [
    {
      "name": "Crew Name",
      "email": "crew@example.com",
      "ghlContactId": "ghl_crew_contact_id",
      "ghlUserId": "ghl_crew_user_id"
    }
  ]
}
```

---

### b) `job_created`
Triggered when a job is created manually in the portal. Includes the full set of fencing specifications to populate GHL custom fields.

**Payload:**
```json
{
  "job_id": "MANUAL-1713333333333",
  "portal_id": "cm123456789...",
  "contact_id": "ghl_contact_id",
  "status": "Scheduled",
  "customer": "John Doe",
  "email": "john@example.com",
  "phone": "+15555551234",
  "address": "123 Main St, Anytown",
  "scheduled_date": "2026-06-01T00:00:00.000Z",
  "scheduled_time": "08:30",
  "foreman": "Foreman Name",
  "foreman_details": { "name": "Foreman Name", "email": "foreman@example.com", "ghlContactId": "...", "ghlUserId": "..." },
  "crew": [{ "name": "Crew Name", "email": "crew@example.com", "ghlContactId": "...", "ghlUserId": "..." }],
  
  // Fencing Custom Specs
  "fence_types": ["Wood", "Ornamental"],
  "installation_type": "in-ground",
  "frost_height": null,
  "frost_privacy_slats": null,
  "frost_color": null,
  "price_range": "3000-5000",
  "detailed_job_description": "Install 50ft of cedar wood fence",
  "others_involved": "Neighbor sharing cost",
  "pre_close_status": "Ready",
  "exact_price": 4200,
  "deposit_value": 1470,
  "deposit_received": true,
  "timeline": "2 days",
  "access_skid_excavator": true,
  "bring_back_dirt": false
}
```

---

### c) `job_dispatch_updated`
Triggered when an Admin updates the customer's phone number or dispatch notes in the dispatch board/job details screen.

**Payload:**
```json
{
  "portal_id": "cm123456789...",
  "job_id": "MANUAL-1713333333333",
  "customer_phone": "+15555551234",
  "dispatch_notes": "Gates must lock outward. Watch for dogs."
}
```

---

### d) `job_digging_metrics_updated`
Triggered when field crew or foreman logs hours and hard digging details.

**Payload:**
```json
{
  "portal_id": "cm123456789...",
  "job_id": "MANUAL-1713333333333",
  "hard_digging_holes": 4,
  "digging_hours": 3.5
}
```

---

### e) `job_digging_photos_added`
Triggered when field crew uploads site verification or completion photos.

**Payload:**
```json
{
  "portal_id": "cm123456789...",
  "job_id": "MANUAL-1713333333333",
  "photos": ["https://s3.amazonaws.com/..."],
  "total_photos": 4
}
```

---

### f) `job_files_updated`
Triggered when external file URLs (Fence Plan or Localisation Certificate) are updated by the Administrator.

**Payload:**
```json
{
  "portal_id": "cm123456789...",
  "job_id": "MANUAL-1713333333333",
  "plan_file_url": "https://...",
  "localisation_certificate_url": "https://..."
}
```

---

### g) `job_finalized` / `job_reopened`
Triggered when a job is closed/disabled (standard crew logs locked) or re-opened for editing.

**Payload:**
```json
{
  "portal_id": "cm123456789...",
  "job_id": "MANUAL-1713333333333",
  "is_disabled": true // true for job_finalized, false for job_reopened
}
```

---

### h) `documents_uploaded`
Triggered when a client successfully uploads their documents (Fence Plan/Certificate) using the public upload portal.

**Payload:**
```json
{
  "job_id": "MANUAL-1713333333333",
  "portal_id": "cm123456789...",
  "action_name": "documents_uploaded"
}
```

---

### i) `contact_created`
Triggered when a contact is manually entered into the portal (fired prior to `job_created` if creating a job for a new contact).

**Payload:**
```json
{
  "contact_id": "MANUAL-1713333333333",
  "portal_id": "cm123456789...",
  "first_name": "Jane",
  "last_name": "Doe",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+15555559876",
  "source": "Control Dashboard (Manual)"
}
```

---

### j) Digging Workflow Actions
Triggered by manually hitting CRM actions on the job detail screen.

- **`job_expectation_text_requested`**: Expectation SMS to be sent to client
- **`info_excavation_requested`**: Request info-excavation checks
- **`digging_bill_requested`**: Trigger 35% digging invoice generation

**Payload:**
```json
{
  "portal_id": "cm123456789...",
  "job_id": "MANUAL-1713333333333",
  "contact_id": "ghl_contact_id",
  "customer_name": "Jane Doe",
  "customer_phone": "+15555559876",
  "customer_email": "jane@example.com",
  "total_price": 5000,
  "address": "123 Main St"
}
```

---

## 🛠️ 7. Workflow 6: GHL Callback (Manual Creations Link-Back)

When a manual creation webhook (`job_created` or `contact_created`) is received by n8n and successfully processed in GHL, you must call the portal back to link GHL's assigned identifiers:

### Contact Callback:
- **URL:** `https://control-dashboard-opal.vercel.app/api/v1/sync/contact`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer f3nc1ng_c0ntr0l_p0rtal_s3cr3t_2024`
- **Body:**
  ```json
  {
    "portal_id": "{{$json.body.portal_id}}",
    "contact_id": "{{$json.id}}" // The new GHL Contact ID
  }
  ```

### Job Callback:
- **URL:** `https://control-dashboard-opal.vercel.app/api/v1/sync/job`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer f3nc1ng_c0ntr0l_p0rtal_s3cr3t_2024`
- **Body:**
  ```json
  {
    "id": "{{$json.body.portal_id}}",
    "job_id": "{{$json.id}}" // The new GHL Opportunity ID
  }
  ```

---

## ✅ Summary of Action
- For each workflow in n8n, add an **HTTP Request** node.
- Set the **Method** to `POST` or `PATCH` as required.
- Put the **URL** from above in the URL field.
- Add the **Authorization** header in the "Headers" section.
- Put the **JSON Body** in the "Body Parameters" section.
