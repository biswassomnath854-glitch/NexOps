require("../config/env");

const bcrypt = require("bcryptjs");

const { sequelize } = require("../config/database");
const {
  User,
  Organization,
  Department,
} = require("../models");

const seedDevelopmentData = async () => {
  try {
    console.log("Starting NexOps development seed...");

    await sequelize.authenticate();

    console.log("Database connection verified.");

    /*
     * ---------------------------------------------------------
     * 1. Create or find development organization
     * ---------------------------------------------------------
     */

    const [organization] = await Organization.findOrCreate({
      where: {
        slug: "nexops-development",
      },
      defaults: {
        name: "NexOps Development",
        slug: "nexops-development",
        description: "Development organization for NexOps testing.",
        industry: "Technology",
        status: "ACTIVE",
      },
    });

    console.log(`Organization ready: ${organization.name}`);
    console.log(`Organization ID: ${organization.id}`);

    /*
     * ---------------------------------------------------------
     * 2. Create or find departments
     * ---------------------------------------------------------
     */

    const [operationsDepartment] = await Department.findOrCreate({
      where: {
        organizationId: organization.id,
        code: "OPS",
      },
      defaults: {
        organizationId: organization.id,
        name: "Operations",
        code: "OPS",
        description: "Operations and workflow management department.",
        status: "ACTIVE",
      },
    });

    const [supportDepartment] = await Department.findOrCreate({
      where: {
        organizationId: organization.id,
        code: "SUP",
      },
      defaults: {
        organizationId: organization.id,
        name: "Support",
        code: "SUP",
        description: "Customer and internal support department.",
        status: "ACTIVE",
      },
    });

    console.log(`Department ready: ${operationsDepartment.name}`);
    console.log(`Department ready: ${supportDepartment.name}`);

    /*
     * ---------------------------------------------------------
     * 3. Hash development password
     * ---------------------------------------------------------
     */

    const hashedPassword = await bcrypt.hash(
      "NexOps@12345",
      12
    );

    /*
     * ---------------------------------------------------------
     * 4. Create development admin user
     * ---------------------------------------------------------
     */

    const [adminUser, adminCreated] = await User.findOrCreate({
      where: {
        email: "admin@nexops.local",
      },
      defaults: {
        organizationId: organization.id,
        departmentId: operationsDepartment.id,
        firstName: "NexOps",
        lastName: "Admin",
        email: "admin@nexops.local",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    /*
     * ---------------------------------------------------------
     * 5. Create development employee
     * ---------------------------------------------------------
     */

    const [employeeUser, employeeCreated] = await User.findOrCreate({
      where: {
        email: "employee@nexops.local",
      },
      defaults: {
        organizationId: organization.id,
        departmentId: supportDepartment.id,
        firstName: "NexOps",
        lastName: "Employee",
        email: "employee@nexops.local",
        password: hashedPassword,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });

    console.log(
      `Admin user ready: ${adminUser.email} ${
        adminCreated ? "(created)" : "(already existed)"
      }`
    );

    console.log(
      `Employee user ready: ${employeeUser.email} ${
        employeeCreated ? "(created)" : "(already existed)"
      }`
    );

    /*
     * ---------------------------------------------------------
     * 6. Verify organization relationships
     * ---------------------------------------------------------
     */

    const organizationWithRelations = await Organization.findOne({
      where: {
        id: organization.id,
      },
      include: [
        {
          model: User,
          as: "users",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "role",
            "status",
          ],
        },
        {
          model: Department,
          as: "departments",
          attributes: [
            "id",
            "name",
            "code",
            "status",
          ],
        },
      ],
    });

    console.log("\nOrganization relationship verification:");

    console.log(
      JSON.stringify(
        organizationWithRelations,
        null,
        2
      )
    );

    /*
     * ---------------------------------------------------------
     * 7. Verify department → users relationship
     * ---------------------------------------------------------
     */

    const departmentsWithUsers = await Department.findAll({
      where: {
        organizationId: organization.id,
      },
      include: [
        {
          model: User,
          as: "users",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "role",
            "status",
          ],
        },
      ],
      order: [["code", "ASC"]],
    });

    console.log("\nDepartment relationship verification:");

    console.log(
      JSON.stringify(
        departmentsWithUsers,
        null,
        2
      )
    );

    /*
     * ---------------------------------------------------------
     * 8. Verify user → organization and department
     * ---------------------------------------------------------
     */

    const usersWithRelations = await User.findAll({
      where: {
        organizationId: organization.id,
      },
      include: [
        {
          model: Organization,
          as: "organization",
          attributes: [
            "id",
            "name",
            "slug",
          ],
        },
        {
          model: Department,
          as: "department",
          attributes: [
            "id",
            "name",
            "code",
          ],
        },
      ],
      order: [["email", "ASC"]],
    });

    console.log("\nUser relationship verification:");

    console.log(
      JSON.stringify(
        usersWithRelations,
        null,
        2
      )
    );

    /*
     * ---------------------------------------------------------
     * Complete
     * ---------------------------------------------------------
     */

    console.log("\nDevelopment seed completed successfully.");

    console.log("\nDevelopment login accounts:");

    console.log("Admin:");
    console.log("  Email: admin@nexops.local");
    console.log("  Password: NexOps@12345");

    console.log("\nEmployee:");
    console.log("  Email: employee@nexops.local");
    console.log("  Password: NexOps@12345");
  } catch (error) {
    console.error("\nDevelopment seed failed.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seedDevelopmentData();