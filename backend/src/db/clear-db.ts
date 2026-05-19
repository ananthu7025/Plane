import "dotenv/config";
import { db } from "./index.js";
import {
  apiLogs,
  auditLogs,
  letterAcknowledgements,
  postLikes,
  commentLikes,
  communityComments,
  communityPosts,
  communityFeedback,
  flaggedContent,
  bannedUsers,
  studentLetters,
  emailQueue,
  systemSettings,
  communityRules,
  authTokens,
  userProfiles,
  mediaFiles,
  users,
  rolePermissions,
  permissions,
  roles,
  communityCategories,
} from "./schema.js";

async function clearDatabase() {
  console.log("🗑️  Clearing database...");
  console.log("⚠️  This will delete all data but keep the schema intact");

  try {
    // Delete in order respecting foreign key constraints
    // Tables with no dependencies or external FK references first

    console.log("🗑️  Clearing api_logs...");
    await db.delete(apiLogs);

    console.log("🗑️  Clearing audit_logs...");
    await db.delete(auditLogs);

    console.log("🗑️  Clearing letter_acknowledgements...");
    await db.delete(letterAcknowledgements);

    console.log("🗑️  Clearing post_likes...");
    await db.delete(postLikes);

    console.log("🗑️  Clearing comment_likes...");
    await db.delete(commentLikes);

    console.log("🗑️  Clearing community_comments...");
    await db.delete(communityComments);

    console.log("🗑️  Clearing community_posts...");
    await db.delete(communityPosts);

    console.log("🗑️  Clearing community_feedback...");
    await db.delete(communityFeedback);

    console.log("🗑️  Clearing flagged_content...");
    await db.delete(flaggedContent);

    console.log("🗑️  Clearing banned_users...");
    await db.delete(bannedUsers);

    console.log("🗑️  Clearing student_letters...");
    await db.delete(studentLetters);

    console.log("🗑️  Clearing email_queue...");
    await db.delete(emailQueue);

    console.log("🗑️  Clearing system_settings...");
    await db.delete(systemSettings);

    console.log("🗑️  Clearing community_rules...");
    await db.delete(communityRules);

    console.log("🗑️  Clearing auth_tokens...");
    await db.delete(authTokens);

    console.log("🗑️  Clearing user_profiles...");
    await db.delete(userProfiles);

    console.log("🗑️  Clearing media_files...");
    await db.delete(mediaFiles);

    console.log("🗑️  Clearing users...");
    await db.delete(users);

    console.log("🗑️  Clearing role_permissions...");
    await db.delete(rolePermissions);

    console.log("🗑️  Clearing permissions...");
    await db.delete(permissions);

    console.log("🗑️  Clearing roles...");
    await db.delete(roles);

    console.log("🗑️  Clearing community_categories...");
    await db.delete(communityCategories);

    console.log("✅ Database cleared successfully!");
    console.log("📊 All tables are now empty but schema is preserved");
    console.log("💡 Run 'npm run seed' or 'yarn seed' to repopulate with default data");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }
}

clearDatabase();
