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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);

app.use("/api", taskRoutes);
app.use("/api", taskActivityRoutes);
app.use("/api", taskCommentRoutes);
app.use("/api", taskAttachmentRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectMemberRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NexOps API is running",
    environment: process.env.NODE_ENV,
  });
});

app.use(errorHandler);

module.exports = app;