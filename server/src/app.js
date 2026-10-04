const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectMemberRoutes = require("./routes/projectMemberRoutes");
const taskRoutes = require("./routes/taskRoutes");
const taskActivityRoutes = require("./routes/taskActivityRoutes");
const taskCommentRoutes = require("./routes/taskCommentRoutes");
const taskAttachmentRoutes = require("./routes/taskAttachmentRoutes");
const overdueTaskRoutes = require("./routes/overdueTaskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const taskAnalyticsRoutes = require("./routes/taskAnalyticsRoutes");
const projectAnalyticsRoutes = require("./routes/projectAnalyticsRoutes");
const workloadRoutes = require("./routes/workloadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const notificationPreferenceRoutes = require("./routes/notificationPreferenceRoutes");
const globalSearchRoutes = require("./routes/globalSearchRoutes");
const workstreamRoutes = require("./routes/workstreamRoutes");
const projectDocumentRoutes = require("./routes/projectDocumentRoutes");
const taskSubmissionRoutes = require("./routes/taskSubmissionRoutes");
const projectHealthRoutes = require("./routes/projectHealthRoutes");
const clientRoutes = require("./routes/clientRoutes");
const clientInvitationRoutes = require("./routes/clientInvitationRoutes");

const {
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "SB Pvt. Ltd. API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/client-invitations", clientInvitationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);

/*
 * Global search is mounted before dynamic task routes.
 * The endpoint is isolated under /api/search, so it
 * does not conflict with /tasks/:taskId.
 */
app.use(
  "/api/search",
  globalSearchRoutes
);

/*
 * Overdue task routes must be mounted before the
 * generic task routes because taskRoutes contains
 * dynamic routes such as /tasks/:taskId.
 */
app.use("/api", overdueTaskRoutes);

app.use("/api", taskRoutes);
app.use("/api", taskActivityRoutes);
app.use("/api", taskCommentRoutes);
app.use("/api", taskAttachmentRoutes);
app.use("/api", taskSubmissionRoutes);
app.use("/api", workstreamRoutes);
app.use("/api", projectDocumentRoutes);
app.use("/api", projectHealthRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectMemberRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use(
  "/api/analytics/tasks",
  taskAnalyticsRoutes
);

app.use(
  "/api/analytics/projects",
  projectAnalyticsRoutes
);

app.use("/api/workload", workloadRoutes);

/*
 * Notification preference routes must be mounted BEFORE the
 * generic notification routes because notificationRoutes
 * contains a dynamic route /:notificationId that would
 * intercept GET /notifications/preferences as notificationId='preferences'.
 */
app.use(
  "/api/notifications/preferences",
  notificationPreferenceRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);



/*
 * Catch-all 404 handler for unmatched routes.
 * Must be registered after all valid routes but before errorHandler.
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
});

app.use(errorHandler);

module.exports = app;