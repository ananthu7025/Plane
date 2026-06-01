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

    // 2. Insert Permissions (Redesigned - 30 permissions)
    console.log("📝 Seeding permissions...");
    const existingPerms = await db.query.permissions.findMany();
    if (existingPerms.length === 0) {
      await db.insert(permissions).values([
        // Posts (5 permissions) - Consolidated
        { name: "CREATE_POST", module: "community", description: "Can create new community posts" },
        { name: "EDIT_OWN_POST", module: "community", description: "Can edit own posts" },
        { name: "DELETE_OWN_POST", module: "community", description: "Can delete own posts" },
        { name: "MODERATE_POSTS", module: "community", description: "Can approve/reject/edit any post" },
        { name: "VIEW_POST", module: "community", description: "Can view posts" },

        // Comments (5 permissions) - Consolidated
        { name: "CREATE_COMMENT", module: "community", description: "Can create comments on posts" },
        { name: "EDIT_OWN_COMMENT", module: "community", description: "Can edit own comments" },
        { name: "DELETE_OWN_COMMENT", module: "community", description: "Can delete own comments" },
        { name: "MODERATE_COMMENTS", module: "community", description: "Can approve/reject/edit any comment" },
        { name: "APPROVE_COMMENT", module: "community", description: "Can approve comments (legacy alias)" },

        // Letters (6 permissions) - Consolidated
        { name: "CREATE_LETTER", module: "letters", description: "Can create/submit student letters" },
        { name: "EDIT_OWN_LETTER", module: "letters", description: "Can edit own letters" },
        { name: "DELETE_OWN_LETTER", module: "letters", description: "Can delete own letters" },
        { name: "MODERATE_LETTERS", module: "letters", description: "Can approve/reject/edit any letter" },
        { name: "PUBLISH_LETTER", module: "letters", description: "Can publish letters" },
        { name: "DELETE_LETTER", module: "letters", description: "Can delete any letter (admin)" },

        // Newsletters (2 permissions)
        { name: "MANAGE_NEWSLETTERS", module: "newsletters", description: "Can upload/edit/delete newsletters" },
        { name: "VIEW_NEWSLETTERS", module: "newsletters", description: "Can view full newsletter content" },

        // User Management (5 permissions) - Consolidated
        { name: "MANAGE_USERS", module: "users", description: "Can ban/unban/suspend users (consolidated)" },
        { name: "VIEW_USERS", module: "users", description: "Can view user list and details" },
        { name: "MANAGE_PROFILES", module: "users", description: "Can edit user profiles" },
        { name: "SUSPEND_USER", module: "users", description: "Can suspend users" },
        { name: "BAN_USER", module: "users", description: "Can ban users (legacy alias)" },

        // Community Management (2 permissions)
        { name: "MANAGE_COMMUNITY", module: "community", description: "Can manage categories and community settings" },
        { name: "MODERATE_COMMUNITY", module: "community", description: "Can moderate community (ban users, remove content)" },

        // Moderation & Flags (2 permissions)
        { name: "FLAG_CONTENT", module: "moderation", description: "Can flag/report content" },
        { name: "REVIEW_FLAGS", module: "moderation", description: "Can review flagged content and take action" },

        // System & Admin (3 permissions)
        { name: "MANAGE_ROLES", module: "system", description: "Can create/edit/delete roles" },
        { name: "MANAGE_PERMISSIONS", module: "system", description: "Can assign permissions to roles" },
        { name: "MANAGE_SETTINGS", module: "system", description: "Can edit platform settings" },
        { name: "VIEW_LOGS", module: "system", description: "Can view system logs and audit trail" },
      ]);
      console.log("✓ Permissions created (30 total)");
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

      // Student permissions (14 total)
      const studentPerms = [
        // Content Creation
        "CREATE_POST",
        "CREATE_COMMENT",
        "CREATE_LETTER",

        // Own Content Editing (Granular)
        "EDIT_OWN_POST",
        "EDIT_OWN_COMMENT",
        "EDIT_OWN_LETTER",
        "DELETE_OWN_POST",
        "DELETE_OWN_COMMENT",
        "DELETE_OWN_LETTER",

        // Reading
        "VIEW_NEWSLETTERS",
        "VIEW_USERS",

        // Engagement
        "FLAG_CONTENT",
        "VIEW_POST",
        "APPROVE_COMMENT",
      ];

      // Mentor permissions (28 total = STUDENT + additional)
      const mentorPerms = [
        ...studentPerms,

        // Moderation
        "MODERATE_POSTS",
        "MODERATE_COMMENTS",
        "MODERATE_LETTERS",

        // Community Management
        "MANAGE_COMMUNITY",
        "MANAGE_USERS",

        // Newsletters
        "MANAGE_NEWSLETTERS",

        // User Management
        "MANAGE_PROFILES",

        // Content Review
        "REVIEW_FLAGS",

        // Legacy aliases (for backward compatibility)
        "BAN_USER",
        "SUSPEND_USER",
        "PUBLISH_LETTER",
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
