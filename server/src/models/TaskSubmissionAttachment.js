const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TaskSubmissionAttachment = sequelize.define(
  "TaskSubmissionAttachment",
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

    submissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "task_submissions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    attachmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "task_attachments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "task_submission_attachments",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["organization_id"],
      },
      {
        fields: ["submission_id"],
      },
      {
        fields: ["attachment_id"],
      },
      {
        unique: true,
        fields: ["submission_id", "attachment_id"],
      },
    ],
  }
);

module.exports = TaskSubmissionAttachment;
