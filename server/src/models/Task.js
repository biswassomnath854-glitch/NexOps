const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Task = sequelize.define(
  "Task",
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

    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Task title is required.",
        },
        len: {
          args: [2, 200],
          msg: "Task title must be between 2 and 200 characters.",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    priority: {
      type: DataTypes.ENUM(
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT"
      ),
      allowNull: false,
      defaultValue: "MEDIUM",
    },

    status: {
      type: DataTypes.ENUM(
        "TODO",
        "IN_PROGRESS",
        "BLOCKED",
        "COMPLETED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "TODO",
    },

    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tasks",
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
        fields: ["assigned_to"],
      },
      {
        fields: ["created_by"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["priority"],
      },
      {
        fields: ["due_date"],
      },
    ],
  }
);

module.exports = Task;