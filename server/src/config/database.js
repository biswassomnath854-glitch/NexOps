const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",

    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();

    console.log("MySQL database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to MySQL database.");
    console.error(error.message);

    throw error;
  }
};

module.exports = {
  sequelize,
  connectDatabase,
};