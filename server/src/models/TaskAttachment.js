const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TaskAttachment = sequelize.define(
  "TaskAttachment",
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

    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Original file name is required.",
        },
        len: {
          args: [1, 255],
          msg: "Original file name must be between 1 and 255 characters.",
        },
      },
    },

    storedName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Stored file name is required.",
        },
        len: {
          args: [1, 255],
          msg: "Stored file name must be between 1 and 255 characters.",
        },
      },
    },

    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "File path is required.",
        },
      },
    },

    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "MIME type is required.",
        },
      },
    },

    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "File size must be greater than zero.",
        },
      },
    },
  },
  {
    tableName: "task_attachments",
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
        fields: ["uploaded_by"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

module.exports = TaskAttachment;