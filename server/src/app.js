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

const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/*
 * API Routes
 */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);

/*
 * Task routes must be mounted before project routes.
 *
 * /api/projects/:projectId/tasks
 * must be handled by task authorization rather than
 * the project management ADMIN/SUPER_ADMIN middleware.
 */
app.use("/api", taskRoutes);

/*
 * Task Activity routes
 *
 * /api/tasks/:taskId/activities
 * provides the activity timeline for an individual task.
 */
app.use("/api", taskActivityRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectMemberRoutes);

/*
 * Health Check
 */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NexOps API is running",
    environment: process.env.NODE_ENV,
  });
});

/*
 * Global Error Handler
 *
 * This must be registered after all routes.
 */

app.use(errorHandler);

module.exports = app;