# 🚀 n8n to Control Dashboard - Integration Guide

Use this guide to connect your **n8n** HTTP Request nodes to your database. This replaces the need for a Google Sheet.

---

## 🔑 1. Security Header (Required)
Every request to the portal MUST include this header in the "HTTP Request" node:

| Header Name | Value |
| :--- | :--- |
| **Authorization** | `Bearer f3nc1ng_c0ntr0l_p0rtal_s3cr3t_2024` |

---

## 🏗️ 2. Workflow 1: Contact Sync (Step 18)

**URL:** `https://your-portal-url.com/api/v1/sync/contact`  
**Method:** `POST`

### Expected JSON Body:
```json
{
  "contact_id": "{{$json.body.contact_id}}",
  "lead_source": "{{$json.body.lead_source}}",
  "first_name": "{{$json.body.first_name}}",
  "last_name": "{{$json.body.last_name}}",
  "full_name": "{{$json.body.first_name}} {{$json.body.last_name}}",
  "phone": "{{$json.body.phone}}",
  "email": "{{$json.body.email}}",
  "pipeline_stage": "{{$json.body.pipeline_stage}}",
  "opportunity_id": "{{$json.body.opportunity_id}}",
  "tags": "{{$json.body.tags.join(', ')}}",
  "address": "{{$json.body.address1}}",
  "city": "{{$json.body.city}}",
  "state": "{{$json.body.state}}",
  "postal_code": "{{$json.body.postal_code}}",
  "created_at": "{{$json.body.created_at}}"
}
```

---

## 🧱 3. Workflow 2: Job Assignment (Step 19)

**URL:** `https://your-portal-url.com/api/v1/sync/job`  
**Method:** `POST`

### Expected JSON Body:
```json
{
  "job_id": "{{$json.body.job_id}}",
  "contact_id": "{{$json.body.contact_id}}",
  "customer_name": "{{$json.body.customer_name}}",
  "assigned_employee": "{{$json.body.assigned_employee}}",
  "foreman": "{{$json.body.foreman}}",
  "crew_members": "{{$json.body.crew_members}}",
  "job_address": "{{$json.body.job_address}}",
  "city": "{{$json.body.city}}",
  "postal_code": "{{$json.body.postal_code}}",
  "job_date": "{{$json.body.job_date}}",
  "job_time": "{{$json.body.job_time}}",
  "material_list_url": "{{$json.body.material_list_url}}",
  "scope_document_url": "{{$json.body.scope_document_url}}"
}
```

---

## 👤 4. Workflow 3: Employee Onboarding (Step 20)

**URL:** `https://your-portal-url.com/api/v1/sync/employee`  
**Method:** `POST`

### Expected JSON Body:
```json
{
  "email": "{{$json.email}}",
  "first_name": "{{$json.first_name}}",
  "last_name": "{{$json.last_name}}",
  "full_name": "{{$json.first_name}} {{$json.last_name}}",
  "phone": "{{$json.phone}}",
  "role": "{{$json.role}}",
  "pay_rate": "{{$json.pay_rate}}",
  "hire_date": "{{$json.hire_date}}",
  "emergency_contact_name": "{{$json.emergency_contact_name}}",
  "emergency_contact_phone": "{{$json.emergency_contact_phone}}",
  "status": "Active"
}
```

---

## ✅ Summary of Action
- For each workflow in n8n, add an **HTTP Request** node.
- Set the **Method** to `POST`.
- Put the **URL** from above in the URL field.
- Add the **Authorization** header in the "Headers" section.
- Put the **JSON Body** in the "Body Parameters" section.
