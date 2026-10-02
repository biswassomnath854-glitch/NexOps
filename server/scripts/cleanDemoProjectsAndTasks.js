require("../src/config/env");
const fs = require("fs");
const path = require("path");
const { sequelize, connectDatabase } = require("../src/config/database");
const {
  Project,
  Task,
  TaskActivity,
  TaskComment,
  TaskAttachment,
  ProjectMember,
  Notification,
} = require("../src/models");

const cleanDemoProjectsAndTasks = async () => {
  try {
    await connectDatabase();
    console.log("Connected to database. Starting cleanup...");

    const transaction = await sequelize.transaction();

    try {
      // 1. Gather all attachments to remove local uploaded files
      const attachments = await TaskAttachment.findAll({ transaction });
      console.log(`Found ${attachments.length} task attachment records.`);

      // 2. Delete task attachments
      const deletedAttachments = await TaskAttachment.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedAttachments} task attachments.`);

      // 3. Delete task comments
      const deletedComments = await TaskComment.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedComments} task comments.`);

      // 4. Delete task activities
      const deletedActivities = await TaskActivity.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedActivities} task activities.`);

      // 5. Delete notifications
      const deletedNotifications = await Notification.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedNotifications} notifications.`);

      // 6. Delete project members
      const deletedMembers = await ProjectMember.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedMembers} project members.`);

      // 7. Delete all demo tasks
      const deletedTasks = await Task.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedTasks} tasks.`);

      // 8. Delete all demo projects
      const deletedProjects = await Project.destroy({
        where: {},
        transaction,
      });
      console.log(`Deleted ${deletedProjects} projects.`);

      await transaction.commit();
      console.log("Transaction committed successfully.");

      // Clean up uploaded files on disk
      for (const att of attachments) {
        if (att.filePath) {
          try {
            const fullPath = path.resolve(att.filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Removed file: ${fullPath}`);
            }
          } catch (fileErr) {
            console.warn(`Could not delete file ${att.filePath}:`, fileErr.message);
          }
        }
      }

      // Also clean any files in server/uploads/tasks
      const uploadsTaskDir = path.resolve(__dirname, "../uploads/tasks");
      if (fs.existsSync(uploadsTaskDir)) {
        const files = fs.readdirSync(uploadsTaskDir);
        for (const file of files) {
          const filePath = path.join(uploadsTaskDir, file);
          try {
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
              console.log(`Removed orphaned upload: ${filePath}`);
            }
          } catch (e) {
            console.warn(`Error removing ${filePath}:`, e.message);
          }
        }
      }

      // Verify counts
      const remainingProjects = await Project.count();
      const remainingTasks = await Task.count();
      console.log(`\nVerification:`);
      console.log(`Remaining projects in database: ${remainingProjects}`);
      console.log(`Remaining tasks in database: ${remainingTasks}`);

      process.exit(0);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanDemoProjectsAndTasks();
