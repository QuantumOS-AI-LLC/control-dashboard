# 🎯 GoHighLevel (GHL) Fencing System Setup Blueprint

This document outlines the complete setup for GoHighLevel (GHL) to handle the fencing business sales process. This setup uses the exact custom fields, folders, and pipeline stages configured in your GHL account.

---

## 📂 1. Pipeline & Stages Configuration

### Fencing Sales Pipeline
Configure your GHL pipeline with the following exact stages:

1. **New Lead (Stage 1)**
2. **Initial Contact / Follow Up (Stage 2)**
3. **Estimate Scheduled (Stage 3)**
4. **Pending Close / Decision (Stage 4)**
5. **Job Booked - Pending Docs (Stage 6 - Triggers request for Plan & Certificate)**
6. **Ready for Schedule / Scheduled**
7. **Digging in Progress (Stage 7 - Info-excavation required)**
8. **Digging Completed (Stage 8 - Triggers 35% Invoice)**
9. **Installation in Progress**
10. **Completed & Paid**

---

## 📋 2. Custom Fields Specification

Ensure your GHL Custom Fields match the following folder and field configuration:

### Folder: Fence Job Specs
| Field Name | Type | Options / Values | Mapped Portal Field |
| :--- | :--- | :--- | :--- |
| **Type of Fence** | Checkbox | Wood, Ornamental, Frost, Composite, Glass | `fenceTypes` |
| **Installation Base** | Radio | In ground, On concrete, Both | `installationType` |
| **Frost - Height** | Checkbox | 4, 5, 6, Mixed | `frostHeight` |
| **Frost - Privacy Slats** | Radio | Yes, No | `frostPrivacySlats` |
| **Frost - Color** | Dropdown | Black, White, Beige, Brown, Green, Galvanized, Galv structure + Black | `frostColor` |
| **Dirt Removal (Bring back dirt)**| Radio | Yes, No | `bringBackDirt` |
| **Access Limitations** | Dropdown | Skid access, Excavator access, Manual dig only | `accessSkidExcavator` |
| **Target Timeline** | Dropdown | Mid-April, April, Mid-May, Anytime, Next Year, etc. | `timeline` |

### Folder: Sales & Admin (Hidden from Crew)
| Field Name | Type | Options / Values | Mapped Portal Field |
| :--- | :--- | :--- | :--- |
| **Pre-Close Rating** | Dropdown | Good, Medium, Bad | `preCloseStatus` |
| **Additional Decision Makers** | Text | Neighbor, BF/GF, Husband/Wife, etc. | `othersInvolved` |
| **Exact Price** | Monetary | Currency value | `exactPrice` |
| **Deposit Value** | Monetary | Currency value | `depositValue` |
| **Deposit Received** | Checkbox | Checked / Unchecked | `depositReceived` |

### Folder: Production Tracking
| Field Name | Type | Options / Values | Mapped Portal Field |
| :--- | :--- | :--- | :--- |
| **Digging Time** | Text/Number | Hours tracked | `diggingHours` |
| **Hard Digging Holes** | Number | Total hard holes drilled | `hardDiggingHoles` |

---

## ⚡ 3. Native GHL Workflow Automations

Build these workflows inside your GHL account.

---

### Workflow A: New Lead Auto-Response & Assign
* **Trigger:** Contact Created OR Form Submitted (Website/Facebook Ads)
* **Actions:**
  1. **Assign to User:** Fencing Sales Agent.
  2. **Update Opportunity:** Move to Fencing Pipeline -> `New Lead (Stage 1)`.
  3. **Send SMS:**
     > *"Hi {{contact.first_name}}, thanks for reaching out about a new fence! Our team will text or call you from this number shortly to discuss your project."*
  4. **Create Task:** "Call new lead {{contact.name}}" (Due in 1 hour).

---

### Workflow B: Estimate Scheduled Confirmation & Reminders
* **Trigger:** Opportunity Pipeline Stage changed to `Estimate Scheduled (Stage 3)`.
* **Actions:**
  1. **Send SMS (Booking Confirmation):**
     > *"Hi {{contact.first_name}}, your fence estimate is confirmed! Our estimator will meet you on {{opportunity.estimate_date_time}} at {{opportunity.estimate_location}}. Have a great day!"*
  2. **Send Email (To Estimator):**
     > *Subject: New Estimate Assigned - {{contact.name}}*
     > *Body: Date/Time: {{opportunity.estimate_date_time}} | Location: {{opportunity.estimate_location}} | Fence Type: {{contact.type_of_fence}}*
  3. **Wait Action:** Wait until 24 hours before `opportunity.estimate_date_time`.
  4. **Send SMS (24-Hour Reminder):**
     > *"Hi {{contact.first_name}}, just a quick reminder that your estimate is scheduled for tomorrow at {{opportunity.estimate_date_time}} at {{opportunity.estimate_location}}."*
  5. **Wait Action:** Wait until 1 hour before `opportunity.estimate_date_time`.
  6. **Send SMS (1-Hour Reminder):**
     > *"Hi {{contact.first_name}}, our estimator will be arriving in about an hour. See you soon!"*

---

### Workflow C: Booking Document Request & Intake SMS
* **Trigger:** Opportunity Pipeline Stage changed to `Job Booked - Pending Docs (Stage 6)`.
* **Actions:**
  1. **Send SMS (Intake Link):**
     > *"Hi {{contact.first_name}}, thank you for booking with us! Please upload your Fence Plan and Localisation Certificate to our secure client portal here so we can schedule your installation: https://your-portal-url.com/client/{{opportunity.id}}/upload"*
  2. **Create Task:** "Follow up on client docs for {{contact.name}}" (Due in 3 days).

---

### Workflow D: Post-Estimate Feedback & Review Request
* **Trigger:** Opportunity Pipeline Stage changed to `Pending Close / Decision (Stage 4)`.
* **Actions:**
  1. **Wait Action:** Wait 1 day.
  2. **Send SMS (Review Invitation):**
     > *"Hi {{contact.first_name}}, it was great meeting you yesterday! We hope the estimate is to your satisfaction. While you review it, we'd love if you could check out our reviews or share your feedback here: https://g.page/r/YOUR_GOOGLE_BUSINESS_REVIEW_LINK"*

---

### Workflow E: Digging Site Plan Notification
* **Trigger:** Opportunity Pipeline Stage changed to `Digging in Progress (Stage 7)`.
* **Actions:**
  1. **Create Task (Info-Excavation Request):**
     * *Subject:* Info-Excavation Request for {{contact.name}}
     * *Body:* Create/verify Info-Excavation request for address: {{contact.address}}.
     * *Assignee:* Project Coordinator / Estimator.
