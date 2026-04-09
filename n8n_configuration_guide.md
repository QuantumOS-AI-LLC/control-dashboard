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
**Method:** `POST`

### Job Pipeline Stages (GHL):
Send one of these exact strings in the `job_status` field:
- `Scheduled`
- `In Progress`
- `Completed`
- `Invoiced`
- `Paid`

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
  "job_date": "{{$json.body.job_date}}",                   // Format: YYYY-MM-DD (e.g., 2024-04-10)
  "job_time": "{{$json.body.job_time}}",                   // Format: HH:MM AM/PM (e.g., 08:30 AM)
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
  "contact_id": "{{$json.id}}"                // The ID returned by GoHighLevel after creating the contact
}
```

---

## ✅ Summary of Action
- For each workflow in n8n, add an **HTTP Request** node.
- Set the **Method** to `POST`.
- Put the **URL** from above in the URL field.
- Add the **Authorization** header in the "Headers" section.
- Put the **JSON Body** in the "Body Parameters" section.
