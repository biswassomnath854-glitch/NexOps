const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Project = sequelize.define(
  "Project",
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
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Project name is required.",
        },
        len: {
          args: [2, 150],
          msg: "Project name must be between 2 and 150 characters.",
        },
      },
    },

    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Project code is required.",
        },
        len: {
          args: [2, 30],
          msg: "Project code must be between 2 and 30 characters.",
        },
        isUppercase: {
          msg: "Project code must be uppercase.",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "PLANNING",
        "ACTIVE",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "PLANNING",
    },
  },
  {
    tableName: "projects",
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

module.exports = Project;