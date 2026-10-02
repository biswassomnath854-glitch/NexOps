const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProjectDocument = sequelize.define(
  "ProjectDocument",
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

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Document title is required.",
        },
        len: {
          args: [2, 200],
          msg: "Document title must be between 2 and 200 characters.",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    category: {
      type: DataTypes.ENUM(
        "REQUIREMENT",
        "SPECIFICATION",
        "REFERENCE",
        "REPORT",
        "DESIGN",
        "DELIVERABLE",
        "OTHER"
      ),
      allowNull: false,
      defaultValue: "REQUIREMENT",
    },

    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Original file name is required.",
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

    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "File path is required.",
        },
      },
    },

    isClientVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    approvedForClientAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    approvedForClientBy: {
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
    tableName: "project_documents",
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
        fields: ["uploaded_by"],
      },
      {
        fields: ["category"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["project_id", "is_client_visible"],
      },
    ],
  }
);

module.exports = ProjectDocument;
