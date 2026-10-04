# System Architecture Specification

**Project:** SB Pvt. Ltd. — Enterprise Task & Workspace Management  
**Architecture Pattern:** Layered Multi-Tenant Client-Server (REST API + SPA)

---

## 1. High-Level Architecture Overview

SB Pvt. Ltd. follows a modern, decoupled client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Browser SPA)                  │
│       React 19 • Vite 8 • Tailwind CSS v4 • Recharts        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Security & Gateway Layer                    │
│      Helmet • CORS • Rate Limiting • Cookie Parser          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│    Routes  ──▶  Controllers  ──▶  Services  ──▶  Models     │
│   (Joi Validated) (HTTP Adapters) (Business Logic) (Sequelize)│
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Persistence Layer                       │
│                   MySQL 8 Database Engine                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy & Data Isolation

The persistence layer enforces multi-tenancy at the root `Organization` model:
- Every operational record (`User`, `Department`, `Project`, `Task`, `ProjectWorkstream`, `ProjectDocument`) carries a mandatory `organization_id` foreign key.
- Service methods automatically inject the authenticated user's `organizationId` into all Sequelize `where` clauses.
- Cross-tenant access is explicitly blocked at the service layer and tested in automated regression suites (`testStage4ApiValidation.js`).

---

## 3. Backend Layering & Separation of Concerns

The backend enforces a strict four-layer architecture:

1. **Routes (`server/src/routes/`):**
   - Declare URL paths and HTTP verbs.
   - Apply middleware (`authenticate`, `authorize`, `blockClientRole`, `taskAuthorizationMiddleware`).
   - Validate incoming query, param, and body parameters using Joi schemas.
2. **Controllers (`server/src/controllers/`):**
   - Act as HTTP transport adapters.
   - Extract parameters from `req.body`, `req.params`, `req.query`, and authenticated user `req.user`.
   - Pass normalized inputs to services and serialize results into standard JSON envelopes:
     ```json
     {
       "success": true,
       "data": { ... },
       "message": "Operation successful"
     }
     ```
3. **Services (`server/src/services/`):**
   - Contain 100% of domain business logic, authorization invariants, and transaction management.
   - Decoupled from Express `req` and `res` objects, enabling direct execution in automated unit and integration tests.
4. **Models (`server/src/models/`):**
   - Sequelize ORM definitions with UUID primary keys (`CHAR(36)` / `UUIDV4`).
   - Define relational foreign keys, cascade constraints, and indexes.

---

## 4. Background Services & Event Lifecycles

### Notification Automation Scheduler
- Managed by `server/src/services/notificationAutomationScheduler.js` and initialized in `server.js`.
- Periodically queries tasks approaching deadlines (24h warning) and tasks transitioning past due dates to generate automated internal notifications.
- Operates strictly on internal tasks and dispatches alerts only to assigned internal team members.

---

## 5. File Upload & Storage Architecture

- **Multer Configuration:** `server/src/config/upload.js` handles multipart file streams.
- **Path Isolation:** Files are written to isolated directories (`uploads/tasks` and `uploads/project-documents`).
- **File Metadata Separation:**
  - `originalName`: Preserved for user download displays.
  - `storedName`: Unique identifier (`${uuid}-${Date.now()}.${ext}`) preventing collision and path traversal vulnerabilities.
  - Strict file size cap (10MB) and MIME-type validation.
