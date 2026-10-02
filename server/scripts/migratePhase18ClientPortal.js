const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const { sequelize } = require("../src/config/database");

const runMigration = async () => {
  console.log("======================================================");
  console.log("  NexOps PHASE 18: Client Portal Database Migration   ");
  console.log("======================================================");

  await sequelize.authenticate();
  console.log("Database connected successfully.");

  const [dbResults] = await sequelize.query("SELECT DATABASE() AS db");
  const currentDb = dbResults[0].db;
  console.log(`Target database: ${currentDb}`);

  // Helper to check if a foreign key exists
  const foreignKeyExists = async (tableName, constraintName) => {
    const [rows] = await sequelize.query(
      `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = :currentDb AND TABLE_NAME = :tableName AND CONSTRAINT_NAME = :constraintName AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      { replacements: { currentDb, tableName, constraintName } }
    );
    return rows.length > 0;
  };

  // Helper to check if a table exists
  const tableExists = async (tableName) => {
    const [rows] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :currentDb AND TABLE_NAME = :tableName`,
      { replacements: { currentDb, tableName } }
    );
    return rows.length > 0;
  };

  // 1. Ensure projects columns have proper COLLATE utf8mb4_bin
  console.log("\n1. Ensuring projects column collations and foreign keys...");
  await sequelize.query(
    `ALTER TABLE projects MODIFY COLUMN approved_by CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL, MODIFY COLUMN published_by CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
  );

  if (!(await foreignKeyExists("projects", "fk_projects_approved_by"))) {
    try {
      await sequelize.query(
        `ALTER TABLE projects ADD CONSTRAINT fk_projects_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE`
      );
      console.log("Added fk_projects_approved_by.");
    } catch (e) {
      console.log("fk_projects_approved_by notice:", e.message);
    }
  }

  if (!(await foreignKeyExists("projects", "fk_projects_published_by"))) {
    try {
      await sequelize.query(
        `ALTER TABLE projects ADD CONSTRAINT fk_projects_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE`
      );
      console.log("Added fk_projects_published_by.");
    } catch (e) {
      console.log("fk_projects_published_by notice:", e.message);
    }
  }

  // 2. Ensure project_documents column collations and foreign keys
  console.log("\n2. Ensuring project_documents column collations and foreign keys...");
  await sequelize.query(
    `ALTER TABLE project_documents MODIFY COLUMN approved_for_client_by CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
  );

  if (!(await foreignKeyExists("project_documents", "fk_project_docs_approved_by"))) {
    try {
      await sequelize.query(
        `ALTER TABLE project_documents ADD CONSTRAINT fk_project_docs_approved_by FOREIGN KEY (approved_for_client_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE`
      );
      console.log("Added fk_project_docs_approved_by.");
    } catch (e) {
      console.log("fk_project_docs_approved_by notice:", e.message);
    }
  }

  // 3. Create client_project_access table
  console.log("\n3. Checking client_project_access table...");
  const cpaExists = await tableExists("client_project_access");
  if (!cpaExists) {
    console.log("Creating client_project_access table with binary collation matching existing tables...");
    await sequelize.query(`
      CREATE TABLE \`client_project_access\` (
        \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`organization_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`project_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`client_user_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`status\` enum('ACTIVE','REVOKED') NOT NULL DEFAULT 'ACTIVE',
        \`granted_by\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
        \`granted_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`notes\` text,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_cpa_project_client\` (\`project_id\`, \`client_user_id\`),
        KEY \`idx_cpa_org\` (\`organization_id\`),
        KEY \`idx_cpa_client_status\` (\`client_user_id\`, \`status\`),
        CONSTRAINT \`fk_cpa_org\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_cpa_project\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_cpa_client\` FOREIGN KEY (\`client_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_cpa_granter\` FOREIGN KEY (\`granted_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    console.log("client_project_access table created successfully.");
  } else {
    console.log("client_project_access table already exists.");
  }

  console.log("\nMigration completed successfully.");
  await sequelize.close();
};

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
