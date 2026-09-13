const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProjectMember = sequelize.define(
  "ProjectMember",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    role: {
      type: DataTypes.ENUM(
        "PROJECT_MANAGER",
        "TEAM_LEAD",
        "MEMBER",
        "VIEWER"
      ),
      allowNull: false,
      defaultValue: "MEMBER",
    },

    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "project_members",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["project_id", "user_id"],
      },
      {
        fields: ["project_id"],
      },
      {
        fields: ["user_id"],
      },
      {
        fields: ["role"],
      },
    ],
  }
);

module.exports = ProjectMember;