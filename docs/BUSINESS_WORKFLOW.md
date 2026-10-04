# End-to-End Business Workflow Specification

**Project:** SB Pvt. Ltd. — Enterprise Task & Workspace Management  
**Scope:** Complete Operational Lifecycle from Project Creation to Client Acceptance

---

## 1. Lifecycle Overview

The platform executes a structured, audited 16-stage business workflow connecting internal delivery teams to external client stakeholders:

```
[1. Project Creation]
         │
         ▼
[2. Workstream Setup]
         │
         ▼
[3. Task Definition & Assignment]
         │
         ▼
[4. Work Execution & Scratchpad Files]
         │
         ▼
[5. Formal Work Submission] ◀────────────────┐
         │                                   │
         ▼                                   │
[6. Managerial Review]                       │
    ├── Revision Requested (with feedback) ──┘
    └── Approved
         │
         ▼
[7. Task Auto-Completion]
         │
         ▼
[8. Deliverable Document Tagging (Client-Visible)]
         │
         ▼
[9. Project Executive Approval]
         │
         ▼
[10. Project Publication]
         │
         ▼
[11. Client Access Grant / Invitation]
         │
         ▼
[12. Client Portal Inspection]
         │
         ▼
[13. Client Acceptance & Digital Sign-Off]
```

---

## 2. Step-by-Step Workflow Breakdown

### Phase 1: Planning & Setup
1. **Admin Creates Project:**  
   An Organization Admin creates the project with a budget, start date, and end date (`POST /api/projects`). Project status initializes as `PLANNING`.
2. **Workstream Definition:**  
   The project is decomposed into functional workstreams (e.g., "Data Ingestion Pipeline", "UI Polish") with designated leads (`POST /api/projects/:id/workstreams`).
3. **Task Assignment:**  
   Tasks are created under a specific workstream with a priority, due date, and assigned employee (`POST /api/projects/:id/tasks`).

### Phase 2: Execution & Submissions
4. **Employee Work Initiation:**  
   The assigned employee transitions the task status to `IN_PROGRESS` (`PATCH /api/tasks/:id/status`).
5. **Informal Attachments (Scratchpad):**  
   During execution, the employee may upload drafts or logs (`POST /api/tasks/:id/attachments`).
6. **Formal Work Submission:**  
   When the work is ready, the employee creates a **formal work submission** (`POST /api/tasks/:id/submissions`) referencing the final deliverable files and providing submission notes. The submission status initializes as `PENDING_REVIEW`.

> **Critical Distinction:**  
> - **Task Attachments** are informal working files uploaded during task execution.  
> - **Task Submissions** are formal, versioned snapshots presented for managerial sign-off. Only approved submissions can trigger task completion.

### Phase 3: Review & Approval
7. **Managerial Review:**  
   A Manager or Lead reviews the submission (`PATCH /api/task-submissions/:id/review`):
   - **If Revision Required:** The reviewer enters a mandatory feedback note detailing requested changes. Submission status becomes `REVISION_REQUIRED`. The employee is notified, makes corrections, and submits a revised submission.
   - **If Approved:** The reviewer approves the submission with optional notes. Submission status becomes `APPROVED`.
8. **Task Auto-Completion:**  
   Upon approval of the submission, the underlying task status automatically transitions to `COMPLETED`.

### Phase 4: Project Publication & Client Access
9. **Deliverable Document Tagging:**  
   Management uploads the finalized release specification or deliverable document and marks it client-visible (`PATCH /api/projects/:id/documents/:docId/client-visibility` with `{ isClientVisible: true }`).
10. **Executive Project Approval:**  
    The project is formally submitted for approval (`POST /api/projects/:id/approval/submit`) and approved by an administrator (`POST /api/projects/:id/approval/approve`).
11. **Project Publication:**  
    The administrator publishes the project to the client portal (`POST /api/projects/:id/publish`), setting `isPublished = true`.
12. **Client Access Provisioning:**  
    The administrator grants access to an existing client user (`POST /api/projects/:id/client-access`) or invites a new client via email token (`POST /api/client-invitations`).

### Phase 5: Client Portal & Sign-Off
13. **Client Portal Login:**  
    The client logs into the dedicated Client Portal (`/client/projects`).
14. **Deliverable Inspection & Download:**  
    The client reviews the project summary and downloads approved deliverables (`GET /api/client/projects/:id/documents/:docId/download`). Internal tasks, comments, and team members remain completely hidden.
15. **Digital Sign-Off Acceptance:**  
    The client completes the digital sign-off dialog (`POST /api/client/projects/:id/deliverables/:docId/accept`), entering their legal sign-off name and acceptance notes.
16. **Internal Verification:**  
    Internal management immediately views the accepted feedback record and signature audit trail (`GET /api/projects/:id/deliverables/feedback`).
