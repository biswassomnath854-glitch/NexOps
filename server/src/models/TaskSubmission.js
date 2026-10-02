const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TaskSubmission = sequelize.define(
  "TaskSubmission",
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

    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tasks",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    submittedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Submission note is required.",
        },
      },
    },

    status: {
      type: DataTypes.ENUM(
        "SUBMITTED",
        "APPROVED",
        "REVISION_REQUIRED"
      ),
      allowNull: false,
      defaultValue: "SUBMITTED",
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    reviewNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "task_submissions",
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
        fields: ["task_id"],
      },
      {
        fields: ["submitted_by"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["submitted_at"],
      },
    ],
  }
);

module.exports = TaskSubmission;
