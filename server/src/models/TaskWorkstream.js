const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TaskWorkstream = sequelize.define(
  "TaskWorkstream",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "organizations",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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

    workstreamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "project_workstreams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "tasks",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    assignedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
  },
  {
    tableName: "task_workstreams",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["organization_id"],
      },
      {
        fields: ["project_id"],
      },
      {
        fields: ["workstream_id"],
      },
      {
        unique: true,
        fields: ["task_id"],
      },
    ],
  }
);

module.exports = TaskWorkstream;
