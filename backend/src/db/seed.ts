import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import {
  roles,
  permissions,
  rolePermissions,
  communityCategories,
  communityRules,
  systemSettings,
  users,
  userProfiles,
} from "./schema.js";
import { hashPassword } from "../utils/auth.js";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Insert Roles
    console.log("📝 Seeding roles...");
    const existingRoles = await db.query.roles.findMany();
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        {
          name: "STUDENT",
          description: "Student user role - can post, comment, and view content",
        },
        {
          name: "MENTOR",
          description: "Mentor user role - can manage and moderate content",
        },
        {
          name: "ADMIN",
          description: "Administrator role - full system access",
        },
      ]);
      console.log("✓ Roles created");
    } else {
      console.log(`✓ Roles already exist (${existingRoles.length} found)`);
    }

    // 2. Insert Permissions
    console.log("📝 Seeding permissions...");
    const existingPerms = await db.query.permissions.findMany();
    if (existingPerms.length === 0) {
      await db.insert(permissions).values([
        // Post permissions
        { name: "CREATE_POST", module: "posts", description: "Can create community posts" },
        { name: "EDIT_POST", module: "posts", description: "Can edit own posts" },
        { name: "DELETE_POST", module: "posts", description: "Can delete own posts" },
        { name: "APPROVE_POST", module: "posts", description: "Can approve pending posts" },
        { name: "REJECT_POST", module: "posts", description: "Can reject posts" },
        { name: "VIEW_POST", module: "posts", description: "Can view posts" },

        // Comment permissions
        { name: "CREATE_COMMENT", module: "comments", description: "Can create comments" },
        { name: "EDIT_COMMENT", module: "comments", description: "Can edit own comments" },
        { name: "DELETE_COMMENT", module: "comments", description: "Can delete own comments" },
        { name: "APPROVE_COMMENT", module: "comments", description: "Can approve comments" },
        { name: "REJECT_COMMENT", module: "comments", description: "Can reject comments" },

        // Letter permissions
        { name: "CREATE_LETTER", module: "letters", description: "Can create student letters" },
        { name: "PUBLISH_LETTER", module: "letters", description: "Can publish letters" },
        { name: "DELETE_LETTER", module: "letters", description: "Can delete own letters" },
        { name: "APPROVE_LETTER", module: "letters", description: "Can approve letters" },

        // Newsletter permissions
        { name: "MANAGE_NEWSLETTERS", module: "newsletters", description: "Can manage newsletters" },
        { name: "VIEW_NEWSLETTERS", module: "newsletters", description: "Can view newsletters" },

        // User management permissions
        { name: "BAN_USER", module: "users", description: "Can ban users" },
        { name: "UNBAN_USER", module: "users", description: "Can unban users" },
        { name: "SUSPEND_USER", module: "users", description: "Can suspend users" },
        { name: "VIEW_USERS", module: "users", description: "Can view user list" },

        // Content moderation
        { name: "FLAG_CONTENT", module: "moderation", description: "Can flag inappropriate content" },
        { name: "REVIEW_FLAGS", module: "moderation", description: "Can review flagged content" },
        { name: "RESPOND_FEEDBACK", module: "moderation", description: "Can respond to feedback" },

        // System permissions
        { name: "MANAGE_ROLES", module: "system", description: "Can manage roles" },
        { name: "MANAGE_PERMISSIONS", module: "system", description: "Can manage permissions" },
        { name: "MANAGE_SETTINGS", module: "system", description: "Can manage system settings" },
        { name: "VIEW_LOGS", module: "system", description: "Can view system logs" },
      ]);
      console.log("✓ Permissions created");
    } else {
      console.log(`✓ Permissions already exist (${existingPerms.length} found)`);
    }

    // 3. Assign Permissions to Roles
    console.log("📝 Assigning permissions to roles...");
    const existingRolePerms = await db.query.rolePermissions.findMany();
    if (existingRolePerms.length === 0) {
      const [studentRole, mentorRole, adminRole] = await Promise.all([
        db.query.roles.findFirst({ where: (roles) => eq(roles.name, "STUDENT") }),
        db.query.roles.findFirst({ where: (roles) => eq(roles.name, "MENTOR") }),
        db.query.roles.findFirst({ where: (roles) => eq(roles.name, "ADMIN") }),
      ]);

      const allPerms = await db.query.permissions.findMany();
      const permMap = new Map(allPerms.map((p) => [p.name, p.id]));

      // Student permissions
      const studentPerms = [
        "CREATE_POST",
        "EDIT_POST",
        "DELETE_POST",
        "VIEW_POST",
        "CREATE_COMMENT",
        "EDIT_COMMENT",
        "DELETE_COMMENT",
        "CREATE_LETTER",
        "DELETE_LETTER",
        "FLAG_CONTENT",
      ];

      // Mentor permissions
      const mentorPerms = [
        ...studentPerms,
        "APPROVE_POST",
        "REJECT_POST",
        "APPROVE_COMMENT",
        "REJECT_COMMENT",
        "APPROVE_LETTER",
        "PUBLISH_LETTER",
        "REVIEW_FLAGS",
        "RESPOND_FEEDBACK",
        "MANAGE_NEWSLETTERS",
        "VIEW_NEWSLETTERS",
      ];

      // Admin permissions - all
      const adminPerms = Array.from(permMap.keys());

      // Assign permissions
      if (studentRole) {
        await db.insert(rolePermissions).values(
          studentPerms
            .map((perm) => permMap.get(perm))
            .filter((id) => id !== undefined)
            .map((permId) => ({
              roleId: studentRole.id,
              permissionId: permId!,
            }))
        );
      }

      if (mentorRole) {
        await db.insert(rolePermissions).values(
          mentorPerms
            .map((perm) => permMap.get(perm))
            .filter((id) => id !== undefined)
            .map((permId) => ({
              roleId: mentorRole.id,
              permissionId: permId!,
            }))
        );
      }

      if (adminRole) {
        await db.insert(rolePermissions).values(
          adminPerms
            .map((perm) => permMap.get(perm))
            .filter((id) => id !== undefined)
            .map((permId) => ({
              roleId: adminRole.id,
              permissionId: permId!,
            }))
        );
      }
      console.log("✓ Role permissions assigned");
    } else {
      console.log(`✓ Role permissions already exist (${existingRolePerms.length} found)`);
    }

    // 4. Insert Community Categories
    console.log("📝 Seeding community categories...");
    const existingCategories = await db.query.communityCategories.findMany();
    if (existingCategories.length === 0) {
      await db.insert(communityCategories).values([
        {
          name: "General Discussion",
          slug: "general-discussion",
          description: "General topics and discussions",
          isActive: true,
        },
        {
          name: "Course Help",
          slug: "course-help",
          description: "Help with coursework and academics",
          isActive: true,
        },
        {
          name: "Study Resources",
          slug: "study-resources",
          description: "Share and discuss study materials",
          isActive: true,
        },
        {
          name: "Career & Internships",
          slug: "career-internships",
          description: "Career advice and internship opportunities",
          isActive: true,
        },
        {
          name: "Events & Announcements",
          slug: "events-announcements",
          description: "Campus events and important announcements",
          isActive: true,
        },
        {
          name: "Off-Topic",
          slug: "off-topic",
          description: "Off-topic discussions and fun content",
          isActive: true,
        },
      ]);
      console.log("✓ Community categories created");
    } else {
      console.log(`✓ Community categories already exist (${existingCategories.length} found)`);
    }

    // 5. Insert Community Rules
    console.log("📝 Seeding community rules...");
    const existingRules = await db.query.communityRules.findMany();
    if (existingRules.length === 0) {
      await db.insert(communityRules).values([
        {
          title: "Be Respectful",
          description: "Treat all community members with respect and dignity. No harassment, bullying, or hate speech.",
          orderNum: 1,
          isActive: true,
        },
        {
          title: "Stay On Topic",
          description: "Keep discussions relevant to the channel topic. Use appropriate channels for off-topic content.",
          orderNum: 2,
          isActive: true,
        },
        {
          title: "No Spam",
          description: "Do not spam, promote, or advertise without permission. Keep messages meaningful and constructive.",
          orderNum: 3,
          isActive: true,
        },
        {
          title: "Respect Privacy",
          description: "Do not share others' personal information without consent. Respect confidentiality.",
          orderNum: 4,
          isActive: true,
        },
        {
          title: "Academic Integrity",
          description: "Maintain academic integrity. Do not ask for or share answers to assignments or exams.",
          orderNum: 5,
          isActive: true,
        },
        {
          title: "No Inappropriate Content",
          description: "Do not post explicit, offensive, or inappropriate content. Keep the community safe for everyone.",
          orderNum: 6,
          isActive: true,
        },
        {
          title: "Use Clear Language",
          description: "Use clear and constructive language. Avoid excessive slang, emojis, or caps lock.",
          orderNum: 7,
          isActive: true,
        },
        {
          title: "Report Issues",
          description: "If you encounter rule violations or inappropriate content, report it to moderators.",
          orderNum: 8,
          isActive: true,
        },
      ]);
      console.log("✓ Community rules created");
    } else {
      console.log(`✓ Community rules already exist (${existingRules.length} found)`);
    }

    // 6. Insert System Settings
    console.log("📝 Seeding system settings...");
    const existingSettings = await db.query.systemSettings.findMany();
    if (existingSettings.length === 0) {
      await db.insert(systemSettings).values([
        {
          settingKey: "platform_name",
          settingValue: { value: "Plane & Prop Community" },
          dataType: "string",
          description: "The name of the platform",
        },
        {
          settingKey: "max_upload_size_mb",
          settingValue: { value: 50 },
          dataType: "number",
          description: "Maximum file upload size in MB",
        },
        {
          settingKey: "post_moderation_enabled",
          settingValue: { value: true },
          dataType: "boolean",
          description: "Whether posts require moderation before publishing",
        },
        {
          settingKey: "email_verification_required",
          settingValue: { value: true },
          dataType: "boolean",
          description: "Whether email verification is required to sign in",
        },
        {
          settingKey: "min_reputation_to_post",
          settingValue: { value: 0 },
          dataType: "number",
          description: "Minimum reputation score required to create posts",
        },
        {
          settingKey: "ban_duration_days",
          settingValue: { value: 30 },
          dataType: "number",
          description: "Default ban duration in days",
        },
        {
          settingKey: "otp_expiry_minutes",
          settingValue: { value: 15 },
          dataType: "number",
          description: "OTP expiry time in minutes",
        },
        {
          settingKey: "rate_limit_requests_per_minute",
          settingValue: { value: 100 },
          dataType: "number",
          description: "API rate limit - requests per minute",
        },
      ]);
      console.log("✓ System settings created");
    } else {
      console.log(`✓ System settings already exist (${existingSettings.length} found)`);
    }

    // 7. Seed Admin User
    console.log("📝 Seeding admin user...");
    const existingAdmin = await db.query.users.findFirst({
      where: (users) => eq(users.email, "admin@gmail.com"),
    });

    if (!existingAdmin) {
      const adminRole = await db.query.roles.findFirst({
        where: (roles) => eq(roles.name, "ADMIN"),
      });

      if (adminRole) {
        const passwordHash = await hashPassword("Test@1234");
        const [adminUser] = await db
          .insert(users)
          .values({
            roleId: adminRole.id,
            email: "admin@gmail.com",
            passwordHash,
            status: "ACTIVE",
          })
          .returning();

        // Create admin profile (verified)
        await db.insert(userProfiles).values({
          userId: adminUser.id,
          fullName: "Admin User",
          verified: true,
        });

        console.log(
          "✓ Admin user created (email: admin@gmail.com, password: Test@1234)"
        );
      }
    } else {
      console.log("✓ Admin user already exists");
    }

    console.log("✅ Database seeded successfully!");
    console.log("✅ Roles, permissions, categories, rules, settings, and admin user created!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
