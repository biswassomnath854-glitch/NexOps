const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CLIENT_PORTAL_AUDIT_ACTIONS = [
  "CLIENT_PROJECT_VIEWED",
  "CLIENT_DOCUMENT_VIEWED",
  "CLIENT_DOCUMENT_DOWNLOADED",
  "CLIENT_DELIVERABLE_VIEWED",
  "CLIENT_DELIVERABLE_ACCEPTED",
  "CLIENT_REVISION_REQUESTED",
];

const ClientPortalAuditLog = sequelize.define(
  "ClientPortalAuditLog",
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

    documentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "project_documents",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    clientUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    action: {
      type: DataTypes.ENUM(...CLIENT_PORTAL_AUDIT_ACTIONS),
      allowNull: false,
    },

    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE(6),
    },

    updatedAt: {
      type: DataTypes.DATE(6),
    },
  },
  {
    tableName: "client_portal_audit_logs",
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
        fields: ["document_id"],
      },
      {
        fields: ["client_user_id"],
      },
      {
        fields: ["action"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["project_id", "created_at"],
      },
    ],
  }
);

ClientPortalAuditLog.ACTIONS = CLIENT_PORTAL_AUDIT_ACTIONS;

module.exports = ClientPortalAuditLog;
