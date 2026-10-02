const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProjectWorkstream = sequelize.define(
  "ProjectWorkstream",
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

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Workstream name is required.",
        },
        len: {
          args: [2, 100],
          msg: "Workstream name must be between 2 and 100 characters.",
        },
      },
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Workstream code is required.",
        },
        len: {
          args: [2, 50],
          msg: "Workstream code must be between 2 and 50 characters.",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "COMPLETED", "ARCHIVED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    leadUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    tableName: "project_workstreams",
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
        fields: ["lead_user_id"],
      },
      {
        fields: ["status"],
      },
      {
        unique: true,
        fields: ["project_id", "name"],
      },
      {
        unique: true,
        fields: ["project_id", "code"],
      },
    ],
  }
);

module.exports = ProjectWorkstream;
