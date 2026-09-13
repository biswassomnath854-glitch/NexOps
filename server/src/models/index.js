const { sequelize } = require("../config/database");

const User = require("./User");
const Organization = require("./Organization");
const Department = require("./Department");
const RefreshToken = require("./RefreshToken");
const Project = require("./Project");

/*
 * Organization ↔ User
 */

Organization.hasMany(User, {
  foreignKey: "organizationId",
  as: "users",
});

User.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Organization ↔ Department
 */

Organization.hasMany(Department, {
  foreignKey: "organizationId",
  as: "departments",
});

Department.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Department ↔ User
 */

Department.hasMany(User, {
  foreignKey: "departmentId",
  as: "users",
});

User.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

/*
 * Organization ↔ Project
 */

Organization.hasMany(Project, {
  foreignKey: "organizationId",
  as: "projects",
});

Project.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * User ↔ RefreshToken
 */

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
});

RefreshToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Database Models
 */

const db = {
  sequelize,
  User,
  Organization,
  Department,
  RefreshToken,
  Project,
};

module.exports = db;