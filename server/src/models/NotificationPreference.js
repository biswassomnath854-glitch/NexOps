const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const NotificationPreference = sequelize.define(
  "NotificationPreference",
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

    taskAssigned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskReassigned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskStatusChanged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskCommented: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskMentioned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskDueSoon: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskOverdue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    taskCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "notification_preferences",
    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: ["organization_id", "user_id"],
      },
      {
        fields: ["organization_id"],
      },
      {
        fields: ["user_id"],
      },
    ],
  }
);

module.exports = NotificationPreference;