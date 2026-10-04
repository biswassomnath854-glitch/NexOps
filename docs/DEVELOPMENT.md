# Developer & Contributor Guide

**Project:** SB Pvt. Ltd. — Enterprise Task & Workspace Management  
**Scope:** Local Development Setup, Coding Conventions, and Testing Workflows

---

## 1. Local Environment Setup

### System Prerequisites
- **Node.js:** v18.x or v20.x LTS
- **npm:** v9.x or higher
- **MySQL:** v8.0 or higher running on port 3306

### Initial Setup Commands
```bash
# 1. Clone repository
git clone https://github.com/biswassomnath854-glitch/NexOps.git
cd NexOps

# 2. Install workspace dependencies
npm install
npm install --prefix server
npm install --prefix client

# 3. Configure environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Create MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nexops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 5. Run sequential schema migrations
node server/scripts/migratePhase18ClientPortal.js
node server/scripts/migratePhase18_3AClientFeedback.js
node server/scripts/migratePhase18_3BClientPortalAudit.js
node server/scripts/migratePhase18_3CClientInvitations.js

# 6. Seed development demo data
npm run seed:development --prefix server
```

---

## 2. Development Execution

### Running Both Services (Concurrently)
```bash
npm run dev
```
Starts:
- **Server:** Node/Express on `http://localhost:5000` (Nodemon watcher enabled)
- **Client:** Vite/React on `http://localhost:5173` (HMR enabled)

### Running Services Independently
- Server only: `npm run dev:server` (or `cd server && npm run dev`)
- Client only: `npm run dev:client` (or `cd client && npm run dev`)

---

## 3. Code Conventions & Standards

### Identifiers & Data Types
- **UUID Keys:** All IDs across MySQL models are stored as UUID strings (`CHAR(36)`). **Never use `Number()` or `parseInt()` on IDs.** Always pass them as strings or nullable strings.
- **Role References:** Always import role constants from `@/constants/roles` in the frontend or `src/constants/roles` in the backend.

### Frontend Architecture
- **Path Aliasing:** Use `@/` to import from `client/src/`.
- **Styling:** Use Tailwind CSS v4 utility classes. Combine conditional styles using the `cn()` helper (`@/utils/cn`).
- **Icons:** Use `lucide-react` for all interface icons.
- **Components:** Place shared components in `components/ui/` or `components/common/`. Place domain-specific components in their dedicated folder (e.g., `components/tasks/`, `components/workstreams/`).

### Backend Architecture
- **Layering:** Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Model.
- **Validation:** Always define and attach a Joi schema for query, param, and body validation.
- **Error Handling:** Use `createServiceError(message, statusCode, code)` in services to propagate standard HTTP error envelopes.

---

## 4. Testing & Quality Verification

### Running Automated Test Suites
The platform includes 14 automated backend suites and 2 frontend test scripts:

```bash
# Run the complete Phase 20 E2E lifecycle test
node server/scripts/testPhase20EndToEndWorkflow.js

# Run full Stage 3 to 19 regression suites
node server/scripts/testPhase19Hardening.js
node server/scripts/testPhase18_4ClientPortalUx.js
node server/scripts/testPhase18_3CClientInvitations.js
node server/scripts/testPhase18_3BClientPortalAudit.js
node server/scripts/testPhase18_3AClientFeedback.js
node server/scripts/testPhase18ClientPortal.js
node server/scripts/testPhase17WorkstreamsDocumentsHealth.js
node server/scripts/testPhase14DataIntegrity.js
node server/scripts/testStage9SecurityOwasp.js
node server/scripts/testStage8EdgeCases.js
node server/scripts/testStage5DatabaseModels.js
node server/scripts/testStage4ApiValidation.js
node server/scripts/testStage3AuthRbac.js
```

### Running Static Analysis & Production Build
```bash
# Run Oxlint
npm run lint --prefix client

# Run Vite production build
npm run build --prefix client
```
Both commands must complete with **0 errors**.
