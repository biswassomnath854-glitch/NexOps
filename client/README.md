# SB Pvt. Ltd. — Frontend Web Application

> **Single Page Application (SPA) for Enterprise Task Management, Workstream Collaboration, and Client Portal.**

---

## 1. Purpose & Overview

The **SB Pvt. Ltd.** frontend is a modern, responsive enterprise application built with **React 19**, **Vite 8**, and **Tailwind CSS v4**. It serves two primary audiences within a single application shell:

1. **Internal Enterprise Users (Employees, Managers, Leads, Administrators):**
   Access to dashboards, workstreams, task execution, document uploads, formal submission reviews, workload insights, project health metrics, and administrative governance.
2. **External Clients:**
   Access to a dedicated, security-isolated **Client Portal** for reviewing published projects, inspecting approved deliverables, downloading release documents, and executing digital sign-offs.

---

## 2. Architecture & Design System

- **Component Hierarchy:** Modular Atomic Design (`components/ui` for primitives, `components/common` for layout badges/skeletons, domain-specific folders like `components/tasks`, `components/projects`, `components/workstreams`, `components/client`).
- **Styling:** Tailwind CSS v4 using modern `@import "tailwindcss";` in `src/index.css`. Dynamic utility class combination uses the `cn()` helper (`clsx` + `tailwind-merge`).
- **Brand Consistency:** Centralized branding tokens in `src/constants/branding.js`, official SVG vector logo `SBLogo`, and unified color palette (Indigo primary, Slate neutrals, Emerald successes, Amber warnings, Rose destructions).

---

## 3. Route Organization & Access Control

Routing is managed via **React Router DOM v7** (`createBrowserRouter`) in `src/routes/index.jsx`. All primary pages are **lazy-loaded** using React `Suspense` with an accessible `RouteLoadingFallback`.

```
/                                   LandingPage (Public marketing portal)
/login                              LoginPage (Public authentication)
/register                           RegisterPage (Public user onboarding)
/invite/accept                      AcceptInvitationPage (Public client onboarding with token)

/dashboard                          DashboardPage (Internal protected)
/tasks                              TasksPage (Internal task list)
/tasks/:taskId                      TaskDetailsPage (Submissions, comments, files)
/projects                           ProjectsPage (Internal project catalog)
/projects/:projectId                ProjectDetailsPage (Workstreams, members, documents)
/projects/health                    ProjectHealthPage (Project health & SLA metrics)
/workload                           WorkloadPage (Team capacity - Managers & Admins)
/analytics                          AnalyticsPage (Productivity analytics - Managers & Admins)
/notifications                      NotificationCenterPage (Internal notification feed)
/notifications/preferences          NotificationPreferencesPage (Notification settings)
/admin/users                        UsersPage (User administration - Admins only)
/admin/departments                  DepartmentsPage (Department hierarchy - Admins only)
/admin/organizations                OrganizationsPage (Tenant management - Super Admins)
/settings                           SettingsPage (Account preferences)

/client/projects                    ClientProjectsPage (Client Portal - CLIENT role only)
/client/projects/:projectId         ClientProjectDetailsPage (Client deliverable review & sign-off)
/client/projects/:projectId/documents ClientProjectDetailsPage (Client documents tab)

/unauthorized                       UnauthorizedPage (HTTP 403 Forbidden handler)
*                                   NotFoundPage (HTTP 404 Fallback)
```

### Route Guards
- **`PublicRoute`:** Redirects already-authenticated users to their appropriate dashboard (`/dashboard` for internal users, `/client/projects` for clients).
- **`ProtectedRoute` (`src/routes/ProtectedRoute.jsx`):**
  - Validates authentication token and session status (`ACTIVE`).
  - **Client Isolation:** If `user.role === 'CLIENT'`, automatically redirects away from internal routes to `/client/projects`.
  - **Internal Isolation:** If internal users attempt to visit `/client/*`, redirects them to `/dashboard`.
  - Enforces `allowedRoles` arrays for administrative and managerial sections.

---

## 4. API Integration & Interceptors

All backend communication flows through the centralized Axios client at `src/api/client.js`:

- **Base URL:** Loaded dynamically from `import.meta.env.VITE_API_BASE_URL` (defaults to `http://localhost:5000/api`).
- **Request Interceptor:** Automatically injects the JWT Bearer access token stored in localStorage into the `Authorization` header.
- **Response Interceptor:** Automatically flattens API payloads to return `response.data`.
- **Token Refresh & Re-auth:** Intercepts `401 Unauthorized` responses, attempts token refresh via HTTP-only cookies, replays queued requests, and dispatches a global `nexops:unauthorized` event on permanent session expiry to trigger a clean logout.

---

## 5. Environment Variables

Create `.env` in the `client/` folder:
```ini
# SB Pvt. Ltd. API Base URL (Frontend -> Backend)
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 6. Development & Build Commands

Run all commands from the `client/` directory:

```bash
# Start local Vite development server (http://localhost:5173)
npm run dev

# Run Oxlint static analysis
npm run lint

# Build production bundle to dist/
npm run build

# Preview production build locally
npm run preview

# Run frontend authentication verification script
npm run test:auth
```

---

## 7. Important Conventions & Coding Standards

1. **Role Identification:** Always use constants from `src/constants/roles.js` (`ROLES.SUPER_ADMIN`, `ROLES.ADMIN`, `ROLES.MANAGER`, `ROLES.TEAM_LEAD`, `ROLES.EMPLOYEE`, `ROLES.VIEWER`, `ROLES.CLIENT`).
2. **Path Aliasing:** Use the `@/` alias for all internal source imports (e.g., `@/components/ui/Button`, `@/hooks/useAuth`).
3. **Data Types:** UUIDs must be handled as strings; **never cast database IDs with `Number()`**.
4. **Branding:** All user-visible headers, footers, page titles, and tooltips must reference **SB Pvt. Ltd.**
