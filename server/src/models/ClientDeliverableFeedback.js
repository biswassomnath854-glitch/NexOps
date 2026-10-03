const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClientDeliverableFeedback = sequelize.define(
  "ClientDeliverableFeedback",
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
      allowNull: false,
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

    status: {
      type: DataTypes.ENUM("ACCEPTED", "REVISION_REQUESTED"),
      allowNull: false,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    clientSignedName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
  },
  {
    tableName: "client_deliverable_feedbacks",
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
        fields: ["project_id", "document_id"],
      },
      {
        fields: ["document_id", "created_at"],
      },
    ],
  }
);

module.exports = ClientDeliverableFeedback;
