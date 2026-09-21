require("./config/env");

const app = require("./app");
const {
  connectDatabase,
  sequelize,
} = require("./config/database");

const {
  startNotificationAutomationScheduler,
} = require("./services/notificationAutomationScheduler");

require("./models");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    await sequelize.sync();

    console.log(
      "Database models synchronized successfully."
    );

    startNotificationAutomationScheduler({
      intervalMs:
        Number(
          process.env.NOTIFICATION_AUTOMATION_INTERVAL_MS
        ) || undefined,

      dueSoonHours:
        process.env.NOTIFICATION_DUE_SOON_HOURS
          ? Number(
              process.env.NOTIFICATION_DUE_SOON_HOURS
            )
          : undefined,
    });

    app.listen(PORT, () => {
      console.log(
        `NexOps API server running on port ${PORT}`
      );

      console.log(
        `Environment: ${process.env.NODE_ENV}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start NexOps server."
    );

    console.error(error.message);

    process.exit(1);
  }
};

startServer();