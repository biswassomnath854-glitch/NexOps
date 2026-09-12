require("./config/env");

const app = require("./app");
const { connectDatabase, sequelize } = require("./config/database");

require("./models");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    await sequelize.sync({
      alter: true,
    });

    console.log("Database models synchronized successfully.");

    app.listen(PORT, () => {
      console.log(`NexOps API server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start NexOps server.");
    console.error(error.message);

    process.exit(1);
  }
};

startServer();