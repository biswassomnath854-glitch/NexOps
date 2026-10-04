# Roles & Permissions Specification

**Project:** SB Pvt. Ltd. — Enterprise Task & Workspace Management  
**Source of Truth:** `server/src/constants/roles.js`, `server/src/middleware/authorizationMiddleware.js`, `server/src/middleware/authMiddleware.js`

---

## 1. Role Taxonomy Overview

The application defines seven discrete roles divided into **Internal Workspace Roles** and **External Client Roles**:

```
                       ┌───────────────────────────────┐
                       │   Platform Role Hierarchy    │
                       └──────────────┬────────────────┘
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
┌─────────────────────────────────┐                       ┌─────────────────┐
│     Internal Workspace Roles    │                       │  External Role  │
├─────────────────────────────────┤                       ├─────────────────┤
│ • SUPER_ADMIN (Global Authority)│                       │ • CLIENT        │
│ • ADMIN (Tenant Admin)          │                       │  (Project-Level │
│ • MANAGER (Project Operations)  │                       │   Consumer)     │
│ • TEAM_LEAD (Workstream Lead)   │                       └─────────────────┘
│ • EMPLOYEE (Work Execution)     │
│ • VIEWER (Internal Read-Only)   │
└─────────────────────────────────┘
```

---

## 2. Comprehensive Role Definitions

### 1. SUPER_ADMIN (Super Administrator)
- **Scope:** Global platform authority across all organizations.
- **Capabilities:** Create and manage organizations, configure multi-tenant boundaries, create and manage administrators, full read/write/delete access across all projects, tasks, and users.
- **Access Boundary:** Internal workspace only (not a client).

### 2. ADMIN (Organization Administrator)
- **Scope:** Assigned organization.
- **Capabilities:** Create and manage departments, invite and provision internal users, create projects, assign project managers, approve projects for publication, manage client invitations, and configure system settings.
- **Access Boundary:** Internal workspace only.

### 3. MANAGER (Project Manager)
- **Scope:** Projects where assigned or designated as manager within their organization.
- **Capabilities:** Create workstreams, define tasks, assign tasks to employees and leads, review formal work submissions (approve or request revision with notes), upload project documents, track project health, and view workload analytics.
- **Access Boundary:** Internal workspace only.

### 4. TEAM_LEAD (Workstream Lead)
- **Scope:** Workstreams where assigned as Lead.
- **Capabilities:** Coordinate workstream members, create tasks within their workstream, reassign tasks, review work submissions within their workstream, and track workstream deliverables.
- **Access Boundary:** Internal workspace only.

### 5. EMPLOYEE (Staff / Individual Contributor)
- **Scope:** Tasks assigned to them or projects where they are members.
- **Capabilities:** Update assigned task statuses (`TODO` $\rightarrow$ `IN_PROGRESS`), post task comments, upload informal working attachments, create formal work submissions with deliverable files, and resubmit revised work upon managerial feedback.
- **Access Boundary:** Internal workspace only.

### 6. VIEWER (Internal Read-Only Stakeholder)
- **Scope:** Assigned organization projects.
- **Capabilities:** Read-only access to view project details, task statuses, workstreams, and internal documents.
- **Constraints:** Cannot create tasks, cannot upload files, cannot submit work, cannot review or approve submissions, and cannot alter any system state.
- **Distinction from CLIENT:** The `VIEWER` is an **internal employee** with read-only visibility into the operational workspace; the `CLIENT` is an **external stakeholder** completely blocked from the internal workspace.

### 7. CLIENT (External Stakeholder / Customer)
- **Scope:** Explicitly granted published projects only via `ClientProjectAccess`.
- **Capabilities:** Access the dedicated **Client Portal** (`/client/projects`), inspect approved deliverables, download client-visible project documents, submit digital sign-off acceptance, and submit deliverable revision requests.
- **Strict Isolation & Prohibited Access:**
  - **NO access** to internal task lists
  - **NO access** to employees or team members
  - **NO access** to workstreams
  - **NO access** to task assignments or internal workloads
  - **NO access** to internal task comments or informal scratchpad attachments
  - **NO access** to internal activity history or audit feeds
  - **NO access** to workload or team analytics
  - **NO access** to internal notifications
  - **NO access** to task priorities, blockers, or internal deadlines
  - **NO access** to Project Health metrics
  - **NO access** to intermediate/draft work submissions

---

## 3. Permission Matrix Table

| Operational Capability | SUPER_ADMIN | ADMIN | MANAGER | TEAM_LEAD | EMPLOYEE | VIEWER | CLIENT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Organizations** | Yes | No | No | No | No | No | No |
| **Manage Users & Departments** | Yes | Yes | No | No | No | No | No |
| **Create & Edit Projects** | Yes | Yes | Yes | No | No | No | No |
| **Manage Workstreams** | Yes | Yes | Yes | Own Workstream | No | No | No |
| **Create & Assign Tasks** | Yes | Yes | Yes | Own Workstream | No | No | No |
| **Update Assigned Task Status** | Yes | Yes | Yes | Yes | Yes | No | No |
| **Post Task Comments & Files** | Yes | Yes | Yes | Yes | Yes | No | No |
| **Submit Formal Work Submissions**| Yes | Yes | Yes | Yes | Yes | No | No |
| **Review Submissions (Approve/Revise)**| Yes | Yes | Yes | Own Workstream | No | No | No |
| **View Internal Project Health** | Yes | Yes | Yes | Yes | Yes | Yes | **NO** |
| **View Workload & Team Analytics**| Yes | Yes | Yes | Yes | No | No | **NO** |
| **Approve & Publish Project** | Yes | Yes | Yes (Submit) | No | No | No | **NO** |
| **Invite & Grant Client Access** | Yes | Yes | No | No | No | No | **NO** |
| **Access Internal Workspace UI** | Yes | Yes | Yes | Yes | Yes | Yes | **NO** |
| **Access Dedicated Client Portal**| No | No | No | No | No | No | **YES** |
| **Digital Sign-Off on Deliverables**| No | No | No | No | No | No | **YES** |

---

## 4. Enforcement Implementation

- **API Layer (`authMiddleware.js`):**  
  The `blockClientRole` middleware guards every internal route and rejects clients with HTTP 403:
  ```javascript
  const blockClientRole = (req, res, next) => {
    if (req.user && req.user.role === "CLIENT") {
      return res.status(403).json({
        success: false,
        message: "Client accounts are restricted to the Client Portal.",
        code: "CLIENT_WORKSPACE_ACCESS_DENIED",
      });
    }
    next();
  };
  ```
- **UI Layer (`ProtectedRoute.jsx`):**  
  Enforces automatic routing redirection between client and internal users:
  ```javascript
  if (user && user.role === 'CLIENT') {
    if (!allowedRoles || !allowedRoles.includes('CLIENT')) {
      return <Navigate to={ROUTES.CLIENT_PROJECTS} replace />
    }
  }
  ```
