# Security Architecture & Controls

**Project:** SB Pvt. Ltd. — Enterprise Task & Workspace Management  
**Scope:** Authentication, Authorization, Client Boundary Isolation, and Data Integrity

---

## 1. Authentication & Token Management

- **Dual-Token Architecture:**
  - **Access Token:** Short-lived JWT (15m expiry) signed with `JWT_ACCESS_SECRET` containing user ID, role, and organization ID. Carried in HTTP `Authorization: Bearer <token>` headers.
  - **Refresh Token:** Long-lived cryptographically signed token (7d expiry) signed with `JWT_REFRESH_SECRET` and stored in the database (`RefreshToken` model). Stored in a secure, HTTP-only cookie.
- **Token Rotation & Revocation:**
  - Upon token refresh (`POST /api/auth/refresh`), the old refresh token is deleted and replaced with a newly generated token.
  - User logout (`POST /api/auth/logout`) explicitly revokes the stored refresh token and clears client cookies.
- **Password Security:**
  - Passwords are salted and hashed using `bcryptjs` with 12 salt rounds before database persistence. Plaintext passwords are never logged or stored.

---

## 2. Role-Based Access Control (RBAC) & IDOR Protection

- **Middleware Enforcement (`authorize`):**
  - Route endpoints declare required roles (e.g., `authorize(['ADMIN', 'SUPER_ADMIN'])`).
  - Unauthorized requests are rejected with `403 Forbidden` (`FORBIDDEN`).
- **Granular Ownership & IDOR Protection:**
  - Controllers and services verify entity ownership. A user cannot view, edit, or delete another user's task or project simply by modifying UUID route parameters.
  - Task authorization middleware (`taskAuthorizationMiddleware.js`) ensures only assignees, managers, leads, or administrators can alter task states.
- **Privilege Escalation Prevention:**
  - Only `SUPER_ADMIN` accounts can create, assign, or promote users to the `SUPER_ADMIN` role (`userService.js`).
  - Client accounts (`CLIENT`) cannot be converted or promoted into internal workspace roles.

---

## 3. Client Security Boundary & Isolation

The platform enforces a strict security perimeter isolating external `CLIENT` users:

1. **`blockClientRole` Guard:**
   - Applied to all internal operational endpoints (`/api/tasks`, `/api/workstreams`, `/api/workload`, `/api/analytics`, `/api/projects`, `/api/project-health`, `/api/users`).
   - Client access attempts immediately fail with `403 Forbidden` (`CLIENT_WORKSPACE_ACCESS_DENIED`).
2. **Explicit Project Access Grants (`ClientProjectAccess`):**
   - Clients have zero implicit access. They can only query projects explicitly granted via `ClientProjectAccess` records.
3. **Publication Gating:**
   - Unpublished projects (`isPublished = false`) cannot be queried by clients, even if a permission grant exists.
4. **Deliverable Visibility:**
   - Documents attached to projects are hidden from clients unless explicitly marked `isClientVisible = true` by an authorized manager/admin.
5. **No Workplace Leakage:**
   - Client response payloads strip workstreams, internal task lists, internal comments, task assignments, activity logs, and workload metrics.

---

## 4. Client Invitations & Onboarding

- **Token Hashing:** Client onboarding invitations generate cryptographically random 32-byte hex tokens. Only the SHA-256 hash of the token is persisted in `client_invitations`.
- **Single-Use Enforcement:** Invitations are marked `ACCEPTED` upon registration and cannot be reused.
- **Expiration Gating:** Invitations carry an explicit expiration timestamp (default: 7 days). Expired tokens are rejected.
- **Revocation:** Administrators can manually revoke pending invitations before use.

---

## 5. Input Validation & Injection Defenses

- **Strict Joi Schemas:** All incoming JSON payloads, route parameters, and query strings are validated against strict schemas before reaching controller logic. Extra parameters are stripped or rejected.
- **SQL Injection Prevention:** Sequelize ORM uses parameterized queries exclusively. Raw SQL queries are avoided.
- **UUID Format Enforcement:** All ID parameters are validated against strict UUIDv4 regex patterns (`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`) to eliminate injection and malformed lookups.

---

## 6. File Upload Security & Storage Protection

- **File Type Whitelisting:** Multer config (`upload.js`) allows only vetted extensions: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.csv`, `.png`, `.jpg`, `.jpeg`, `.zip`. Executables and scripts (`.exe`, `.sh`, `.bat`, `.js`, `.py`) are rejected.
- **Size Limits:** Hard file size limit of 10MB per upload.
- **Path Traversal Defense:** Uploaded files are renamed using generated UUIDs and timestamps. User-supplied filenames are never used for disk storage paths.
- **Safe Downloads:** Downloads are served with sanitized `Content-Disposition` headers and explicit MIME types.

---

## 7. Transport Security & Rate Limiting

- **Security Headers:** `helmet()` is applied globally to set secure HTTP headers (XSS Filter, frameguard, HSTS, noSniff).
- **CORS Restrictions:** Cross-Origin requests are restricted strictly to the configured `CLIENT_URL` with credentials enabled.
- **API Rate Limiting:** `express-rate-limit` throttles high-frequency requests on authentication and submission endpoints to protect against brute-force attacks.

---

## 8. Audit Logging

- **Client Portal Audit Trail (`ClientPortalAuditLog`):**
  - Records every critical client action: login, project access, document view, deliverable download, acceptance sign-off, and revision requests.
  - Captures `clientUserId`, `projectId`, `action`, `ipAddress`, `userAgent`, and action metadata.
  - Internal management can inspect the audit trail via `/api/projects/:projectId/audit-logs`.
