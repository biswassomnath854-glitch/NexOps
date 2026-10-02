const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProjectWorkstreamMember = sequelize.define(
  "ProjectWorkstreamMember",
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

    workstreamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "project_workstreams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "MEMBER",
    },
  },
  {
    tableName: "project_workstream_members",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["organization_id"],
      },
      {
        fields: ["workstream_id"],
      },
      {
        fields: ["user_id"],
      },
      {
        unique: true,
        fields: ["workstream_id", "user_id"],
      },
    ],
  }
);

module.exports = ProjectWorkstreamMember;
