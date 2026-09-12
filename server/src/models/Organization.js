const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Organization = sequelize.define(
  "Organization",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Organization name is required.",
        },
        len: {
          args: [2, 150],
          msg: "Organization name must be between 2 and 150 characters.",
        },
      },
    },

    slug: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Organization slug is required.",
        },
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          msg: "Organization slug can contain only lowercase letters, numbers, and hyphens.",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "organizations",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = Organization;