const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Notification = sequelize.define(
  "Notification",
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

    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    taskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "tasks",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "projects",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    type: {
      type: DataTypes.ENUM(
        "TASK_ASSIGNED",
        "TASK_REASSIGNED",
        "TASK_STATUS_CHANGED",
        "TASK_COMMENTED",
        "TASK_MENTIONED",
        "TASK_DUE_SOON",
        "TASK_OVERDUE",
        "TASK_COMPLETED"
      ),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Notification title is required.",
        },
        len: {
          args: [2, 200],
          msg: "Notification title must be between 2 and 200 characters.",
        },
      },
    },

    message: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Notification message is required.",
        },
        len: {
          args: [2, 500],
          msg: "Notification message must be between 2 and 500 characters.",
        },
      },
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        fields: ["organization_id"],
      },
      {
        fields: ["recipient_id"],
      },
      {
        fields: ["actor_id"],
      },
      {
        fields: ["task_id"],
      },
      {
        fields: ["project_id"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["is_read"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["recipient_id", "is_read"],
      },
    ],
  }
);

module.exports = Notification;