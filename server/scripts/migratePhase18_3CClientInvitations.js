const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const { sequelize } = require("../src/config/database");

const runMigration = async () => {
  console.log("==================================================================");
  console.log("  NexOps PHASE 18.3C: Client Invitations & Onboarding Migration   ");
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

  const exists = await tableExists("client_invitations");
  if (!exists) {
    console.log("Creating client_invitations table with binary collation matching existing tables...");
    await sequelize.query(`
      CREATE TABLE \`client_invitations\` (
        \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`organization_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`token_hash\` varchar(255) NOT NULL,
        \`status\` enum('PENDING','ACCEPTED','REVOKED','EXPIRED') NOT NULL DEFAULT 'PENDING',
        \`expires_at\` datetime(6) NOT NULL,
        \`invited_by\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`project_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
        \`accepted_at\` datetime(6) DEFAULT NULL,
        \`accepted_by\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
        \`revoked_at\` datetime(6) DEFAULT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`idx_client_invitations_token_hash\` (\`token_hash\`),
        KEY \`idx_client_invitations_org\` (\`organization_id\`),
        KEY \`idx_client_invitations_email\` (\`email\`),
        KEY \`idx_client_invitations_status\` (\`status\`),
        KEY \`idx_client_invitations_expires\` (\`expires_at\`),
        KEY \`idx_client_invitations_project\` (\`project_id\`),
        KEY \`idx_client_invitations_invited_by\` (\`invited_by\`),
        KEY \`idx_client_invitations_accepted_by\` (\`accepted_by\`),
        KEY \`idx_client_invitations_org_email_status\` (\`organization_id\`, \`email\`, \`status\`),
        CONSTRAINT \`fk_ci_org\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_ci_project\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`fk_ci_invited_by\` FOREIGN KEY (\`invited_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_ci_accepted_by\` FOREIGN KEY (\`accepted_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    console.log("client_invitations table created successfully.");
  } else {
    console.log("client_invitations table already exists.");
  }

  // Ensure high-precision datetime(6)
  console.log("Ensuring microsecond precision on created_at and updated_at...");
  await sequelize.query(`
    ALTER TABLE \`client_invitations\`
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
