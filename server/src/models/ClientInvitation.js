const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClientInvitation = sequelize.define(
  "ClientInvitation",
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

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(val) {
        this.setDataValue("email", val ? val.trim().toLowerCase() : "");
      },
      validate: {
        isEmail: {
          msg: "Please provide a valid email address.",
        },
        notEmpty: {
          msg: "Email is required.",
        },
      },
    },

    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM("PENDING", "ACCEPTED", "REVOKED", "EXPIRED"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
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
      onDelete: "SET NULL",
    },

    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    acceptedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "client_invitations",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["token_hash"],
      },
      {
        fields: ["organization_id"],
      },
      {
        fields: ["email"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["expires_at"],
      },
      {
        fields: ["project_id"],
      },
      {
        fields: ["invited_by"],
      },
      {
        fields: ["accepted_by"],
      },
      {
        fields: ["organization_id", "email", "status"],
      },
    ],
  }
);

ClientInvitation.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.tokenHash;
  return values;
};

module.exports = ClientInvitation;
