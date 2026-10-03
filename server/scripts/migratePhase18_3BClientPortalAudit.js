const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const { sequelize } = require("../src/config/database");

const runMigration = async () => {
  console.log("==================================================================");
  console.log("  NexOps PHASE 18.3B: Client Portal Audit Logging Migration       ");
  console.log("==================================================================");

  await sequelize.authenticate();
  console.log("Database connected successfully.");

  const [dbResults] = await sequelize.query("SELECT DATABASE() AS db");
  const currentDb = dbResults[0].db;
  console.log(`Target database: ${currentDb}`);

  // Helper to check if a table exists
  const tableExists = async (tableName) => {
    const [rows] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :currentDb AND TABLE_NAME = :tableName`,
      { replacements: { currentDb, tableName } }
    );
    return rows.length > 0;
  };

  const exists = await tableExists("client_portal_audit_logs");
  if (!exists) {
    console.log("Creating client_portal_audit_logs table with binary collation matching existing tables...");
    await sequelize.query(`
      CREATE TABLE \`client_portal_audit_logs\` (
        \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`organization_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`project_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`document_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
        \`client_user_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`action\` enum('CLIENT_PROJECT_VIEWED','CLIENT_DOCUMENT_VIEWED','CLIENT_DOCUMENT_DOWNLOADED','CLIENT_DELIVERABLE_VIEWED','CLIENT_DELIVERABLE_ACCEPTED','CLIENT_REVISION_REQUESTED') NOT NULL,
        \`ip_address\` varchar(100) DEFAULT NULL,
        \`user_agent\` text DEFAULT NULL,
        \`metadata\` json DEFAULT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`idx_cpal_org\` (\`organization_id\`),
        KEY \`idx_cpal_proj\` (\`project_id\`),
        KEY \`idx_cpal_doc\` (\`document_id\`),
        KEY \`idx_cpal_client_user\` (\`client_user_id\`),
        KEY \`idx_cpal_action\` (\`action\`),
        KEY \`idx_cpal_created\` (\`created_at\`),
        KEY \`idx_cpal_proj_created\` (\`project_id\`, \`created_at\`),
        CONSTRAINT \`fk_cpal_org\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_cpal_project\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_cpal_doc\` FOREIGN KEY (\`document_id\`) REFERENCES \`project_documents\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_cpal_client_user\` FOREIGN KEY (\`client_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    console.log("client_portal_audit_logs table created successfully.");
  } else {
    console.log("client_portal_audit_logs table already exists.");
  }

  // Ensure high-precision datetime(6)
  console.log("Ensuring microsecond precision on created_at and updated_at...");
  await sequelize.query(`
    ALTER TABLE \`client_portal_audit_logs\`
    MODIFY COLUMN \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    MODIFY COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);
  `);
  console.log("Precision ensured.");

  console.log("\nMigration completed successfully.");
  await sequelize.close();
};

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
