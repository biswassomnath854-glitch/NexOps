const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClientProjectAccess = sequelize.define(
  "ClientProjectAccess",
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

    clientUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "REVOKED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    grantedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "client_project_access",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["project_id", "client_user_id"],
      },
      {
        fields: ["organization_id"],
      },
      {
        fields: ["client_user_id", "status"],
      },
    ],
  }
);

module.exports = ClientProjectAccess;
