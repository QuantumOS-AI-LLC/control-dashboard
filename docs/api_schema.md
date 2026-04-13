# 🛠️ Control Dashboard - API Schema Reference

This document outlines the available API endpoints in the Control Dashboard portal, including their request/response schemas.

## 🔑 Authentication
All requests to the `/api/v1/sync/*` endpoints require an **Authorization** header:
- **Header:** `Authorization`
- **Value:** `Bearer f3nc1ng_c0ntr0l_p0rtal_s3cr3t_2024` (Internal API Key)

---

## 🏗️ 1. Job Sync Endpoints

### `POST /api/v1/sync/job` (and `PATCH`)
Used for upserting job data from GoHighLevel (GHL).

**Request Body (JSON):**
| Field | Type | Description |
| :--- | :--- | :--- |
| **job_id** | `string` | **Required.** The GHL Opportunity ID. |
| **id** | `string` | **Optional (New).** Internal Portal ID for 2-way sync linkage. |
| **contact_id** | `string` | The GHL Contact ID associated with the job. |
| **job_status** | `string` | `Scheduled`, `In Progress`, `Completed`, `Invoiced`, `Paid`, `Cancelled`. |
| **customer_name**| `string` | Customer's full name. |
| **assigned_employee**| `string` | GHL Contact ID of the employee. |
| **foreman** | `string` | GHL Contact ID of the foreman. |
| **job_address** | `string` | Physical address of the installation. |
| **city** | `string` | City of the job site. |
| **postal_code** | `string` | Zip/Postal code. |
| **job_title** | `string` | Display title for the job. |
| **job_date** | `string` | `YYYY-MM-DD` |
| **job_time** | `string` | `HH:MM AM/PM` (or `HH:MM`) |
| **phone** | `string` | Customer contact phone. |
| **dispatch_notes**| `string` | Internal notes for the crew. |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Job synced (Partial update supported)",
  "id": "portal_internal_id",
  "status": "Scheduled"
}
```

---

## 👤 2. Contact Sync Endpoints

### `POST /api/v1/sync/contact`
Used for upserting contact data from GHL.

**Request Body (JSON):**
| Field | Type | Description |
| :--- | :--- | :--- |
| **contact_id** | `string` | **Required.** The GHL Contact ID. |
| **id** | `string` | **Optional (New).** Internal Portal ID for 2-way sync linkage. |
| **first_name** | `string` | Contact's first name. |
| **last_name** | `string` | Contact's last name. |
| **full_name** | `string` | Contact's full name. |
| **email** | `string` | Contact email address. |
| **phone** | `string` | Contact phone number. |
| **pipeline_stage**| `string` | e.g., `New Contact`, `Scheduled Estimate`, `Won`, etc. |
| **lead_source** | `string` | e.g., `Facebook`, `Manual`, etc. |
| **address** | `string` | Contact's primary address. |
| **tags** | `array` | Array of strings (e.g., `["Residential", "Urgent"]`). |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact synced (Partial update supported)",
  "id": "portal_internal_id",
  "contact_id": "ghl_contact_id"
}
```

---

## 👮 3. Employee Sync Endpoints

### `POST /api/v1/sync/employee`
Syncs employee data (Internal Users).

**Request Body (JSON):**
| Field | Type | Description |
| :--- | :--- | :--- |
| **contact_id** | `string` | GHL Contact ID for the employee. |
| **email** | `string` | **Required** (if no `contact_id`). |
| **first_name** | `string` | |
| **last_name** | `string` | |
| **role** | `string` | `ADMIN`, `MANAGER`, `FOREMAN`, `CREW`. |
| **pay_rate** | `number` | Hourly pay rate. |
| **status** | `string` | `ACTIVE`, `INACTIVE`. |

### `PATCH /api/v1/sync/employee`
Used specifically to "link" a GHL ID to an existing internal employee record.

**Request Body (JSON):**
| Field | Type | Description |
| :--- | :--- | :--- |
| **contact_id** | `string` | **Required.** GHL Contact ID to link. |
| **employee_id** | `string` | **Required** (if no `email`). Internal Portal ID. |
| **email** | `string` | **Required** (if no `employee_id`). |

---

## 🛠️ 4. Legacy/External Endpoints

### `POST /api/jobs`
Legacy creation endpoint used by older n8n workflows. Maps n8n fields directly to Job database.

---

## 🔄 Two-Way Sync Logic Simplified
1. **Manual Creation**: Portal creates record with `id` (e.g., `cm123`) and temporary `ghlJobId` (e.g., `MANUAL-456`).
2. **Webhook**: Portal sends `portal_id: "cm123"` to n8n.
3. **n8n Link-Back**: n8n sends a request back to the portal containing:
   - `id`: `"cm123"`
   - `job_id`: `"REAL_GHL_ID_789"`
4. **Portal Update**: The portal finds the record by `id` and replaces the temporary ID with the real one.
