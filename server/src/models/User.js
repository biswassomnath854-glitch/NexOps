const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "organizations",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "departments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "First name is required.",
        },
        len: {
          args: [2, 50],
          msg: "First name must be between 2 and 50 characters.",
        },
      },
    },

    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Last name is required.",
        },
        len: {
          args: [2, 50],
          msg: "Last name must be between 2 and 50 characters.",
        },
      },
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Please provide a valid email address.",
        },
        notEmpty: {
          msg: "Email is required.",
        },
      },
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password is required.",
        },
        len: {
          args: [8, 255],
          msg: "Password must be at least 8 characters long.",
        },
      },
    },

    role: {
      type: DataTypes.ENUM(
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "EMPLOYEE",
        "VIEWER"
      ),
      allowNull: false,
      defaultValue: "EMPLOYEE",
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        fields: ["organization_id"],
      },
      {
        fields: ["department_id"],
      },
      {
        fields: ["role"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = User;