const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Department = sequelize.define(
  "Department",
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

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Department name is required.",
        },
        len: {
          args: [2, 100],
          msg: "Department name must be between 2 and 100 characters.",
        },
      },
    },

    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Department code is required.",
        },
        len: {
          args: [2, 30],
          msg: "Department code must be between 2 and 30 characters.",
        },
        isUppercase: {
          msg: "Department code must be uppercase.",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "departments",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["organization_id", "code"],
      },
      {
        fields: ["organization_id"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = Department;