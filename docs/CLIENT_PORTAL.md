# Client Portal Specification

**Project:** SB Pvt. Ltd. — Enterprise Task & Workspace Management  
**Target Audience:** External Clients, Customers, and Auditing Stakeholders

---

## 1. Overview & Purpose

The **SB Pvt. Ltd. Client Portal** is a purpose-built, security-isolated interface allowing external stakeholders to view published project progress, inspect approved deliverables, download release documents, and execute formal digital acceptances or revision requests.

External clients access the platform through a lightweight, distraction-free layout (`ClientLayout`) completely separated from the internal enterprise workspace.

---

## 2. Navigation & Interface Architecture

```
/client/projects                        Approved Projects Catalog
/client/projects/:projectId             Project Overview & Approved Deliverables
/client/projects/:projectId/documents   Client-Visible Release Documents & Downloads
```

### Key UI Capabilities
- **Approved Projects Grid:** Displays only published projects where explicit access has been granted to the authenticated client user.
- **Deliverables List:** Details approved release deliverables with download links and current acceptance status (`PENDING_REVIEW`, `ACCEPTED`, `REVISION_REQUESTED`).
- **Digital Sign-Off Dialog:** An accessible modal for signing off on a deliverable, capturing the sign-off person's full name, acceptance notes, and legal acknowledgment.
- **Revision Request Dialog:** Allows clients to request corrections on a deliverable by specifying issues that must be addressed.

---

## 3. Data Masking & Information Quarantine

The Client Portal enforces strict data minimization to safeguard internal operational privacy:

| Entity / Property | Exposed to Client? | Rationale |
| :--- | :---: | :--- |
| **Project Name & Description** | **YES** | Required for project context |
| **Project Code & Category** | **YES** | Official release reference |
| **Approved Deliverable Documents** | **YES** | Core client output |
| **Internal Workstreams** | **NO** | Internal team organization |
| **Internal Tasks & Assignees** | **NO** | Operational task tracking |
| **Task Comments & Working Drafts**| **NO** | Informal scratchpad notes |
| **Employee Rosters & Profiles** | **NO** | Privacy and operational security |
| **Workload & Velocity Analytics** | **NO** | Internal capacity metrics |
| **Project Health & SLA Status** | **NO** | Internal schedule tracking |
| **Internal Submission Revisions** | **NO** | Intermediate working cycles |

---

## 4. Digital Sign-Off & Deliverable Feedback

When a client reviews a deliverable document, they execute a binding feedback action:

1. **Acceptance (`POST /api/client/projects/:id/deliverables/:docId/accept`):**
   - Requires `clientSignedName` and optional `notes`.
   - Records feedback with `status = 'ACCEPTED'`.
   - Emits a real-time event and creates a permanent entry in `ClientPortalAuditLog`.
2. **Revision Request (`POST /api/client/projects/:id/deliverables/:docId/request-revision`):**
   - Requires detailed `feedbackText` explaining the needed changes.
   - Records feedback with `status = 'REVISION_REQUESTED'`.
   - Flags the deliverable internally for management attention.

---

## 5. Client Onboarding & Invitation Lifecycle

1. **Invitation Generation:**  
   An administrator invites a client by submitting their email and target project grants (`POST /api/client-invitations`).
2. **Secure Token Dispatch:**  
   The system generates a cryptographically secure 32-byte hex token. The SHA-256 hash is saved in the database with an expiration date.
3. **Acceptance & Account Creation:**  
   The client receives the invitation link (`/invite/accept?token=<token>`), verifies their email, establishes their password, and is automatically provisioned as a `CLIENT` user with active access to the designated projects.
