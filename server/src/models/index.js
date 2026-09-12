const { sequelize } = require("../config/database");

const User = require("./User");
const Organization = require("./Organization");
const Department = require("./Department");

/*
 * Organization relationships
 */

Organization.hasMany(User, {
  foreignKey: "organizationId",
  as: "users",
});

User.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

Organization.hasMany(Department, {
  foreignKey: "organizationId",
  as: "departments",
});

Department.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Department relationships
 */

Department.hasMany(User, {
  foreignKey: "departmentId",
  as: "users",
});

User.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

const db = {
  sequelize,
  User,
  Organization,
  Department,
};

module.exports = db;