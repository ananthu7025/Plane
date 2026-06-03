import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  bigint,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["STUDENT", "MENTOR", "ADMIN"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE", "SUSPENDED"]);
export const postStatusEnum = pgEnum("post_status", ["PENDING", "APPROVED", "REJECTED", "FLAGGED"]);
export const commentStatusEnum = pgEnum("comment_status", ["APPROVED", "PENDING", "REJECTED"]);
export const feedbackStatusEnum = pgEnum("feedback_status", ["PENDING", "REVIEWED"]);
export const feedbackCategoryEnum = pgEnum("feedback_category", ["GENERAL", "BUG", "FEATURE", "OTHER"]);
export const flagStatusEnum = pgEnum("flag_status", ["NEW", "REVIEWED", "APPROVED", "REJECTED"]);
export const tokenTypeEnum = pgEnum("token_type", ["ACCESS", "REFRESH", "PASSWORD_RESET", "OTP"]);
export const mediaTypeEnum = pgEnum("media_type", ["AVATAR", "COVER_IMAGE", "POST_IMAGE", "ATTACHMENT", "DOCUMENT"]);

// Tables
export const roles = pgTable(
  "roles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("roles_name_idx").on(table.name),
  })
);

export const permissions = pgTable(
  "permissions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    module: varchar("module", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    moduleIdx: index("permissions_module_idx").on(table.module),
    nameIdx: index("permissions_name_idx").on(table.name),
  })
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: integer("role_id").notNull(),
    permissionId: integer("permission_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    roleIdIdx: index("role_permissions_role_id_idx").on(table.roleId),
    permissionIdIdx: index("role_permissions_permission_id_idx").on(table.permissionId),
    uniqueIdx: uniqueIndex("role_permissions_unique_idx").on(table.roleId, table.permissionId),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: integer("role_id").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    lastLogin: timestamp("last_login"),
    lastIpAddress: varchar("last_ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    roleIdIdx: index("users_role_id_idx").on(table.roleId),
    statusIdx: index("users_status_idx").on(table.status),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  })
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    tokenType: tokenTypeEnum("token_type").notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
  },
  (table) => ({
    userIdIdx: index("auth_tokens_user_id_idx").on(table.userId),
    tokenHashIdx: index("auth_tokens_token_hash_idx").on(table.tokenHash),
    expiresAtIdx: index("auth_tokens_expires_at_idx").on(table.expiresAt),
    // Composite indexes for common queries
    userTypeIdx: index("auth_tokens_user_type_idx").on(table.userId, table.tokenType),
    userTypeRevokedIdx: index("auth_tokens_user_type_revoked_idx").on(table.userId, table.tokenType, table.revokedAt),
    // Index for cleanup of expired tokens
    expiresAtRevokedIdx: index("auth_tokens_expires_revoked_idx").on(table.expiresAt, table.revokedAt),
  })
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatarMediaId: uuid("avatar_media_id"),
    bio: text("bio"),
    city: varchar("city", { length: 100 }),
    country: varchar("country", { length: 100 }),
    qualification: varchar("qualification", { length: 255 }),
    institution: varchar("institution", { length: 255 }),
    careerGoal: varchar("career_goal", { length: 100 }),
    targetExam: varchar("target_exam", { length: 100 }),
    enrolledSubjects: text("enrolled_subjects").array(),
    reputationScore: integer("reputation_score").notNull().default(0),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_profiles_user_id_idx").on(table.userId),
    reputationScoreIdx: index("user_profiles_reputation_score_idx").on(table.reputationScore),
    verifiedIdx: index("user_profiles_verified_idx").on(table.verified),
  })
);

export const mediaFiles = pgTable(
  "media_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uploadedBy: uuid("uploaded_by").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    mimeType: varchar("mime_type", { length: 50 }).notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    storageService: varchar("storage_service", { length: 50 }).notNull(),
    storageKey: text("storage_key").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    metadata: jsonb("metadata"),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    uploadedByIdx: index("media_files_uploaded_by_idx").on(table.uploadedBy),
    mediaTypeIdx: index("media_files_media_type_idx").on(table.mediaType),
    createdAtIdx: index("media_files_created_at_idx").on(table.createdAt),
    storageServiceIdx: index("media_files_storage_service_idx").on(table.storageService),
    isPublicIdx: index("media_files_is_public_idx").on(table.isPublic),
  })
);

export const communityCategories = pgTable(
  "community_categories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    iconMediaId: uuid("icon_media_id"),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("community_categories_slug_idx").on(table.slug),
    isActiveIdx: index("community_categories_is_active_idx").on(table.isActive),
  })
);

export const communityPosts = pgTable(
  "community_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: integer("category_id").notNull(),
    authorId: uuid("author_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    status: postStatusEnum("status").notNull().default("PENDING"),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    featuredMediaId: uuid("featured_media_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    categoryIdIdx: index("community_posts_category_id_idx").on(table.categoryId),
    authorIdIdx: index("community_posts_author_id_idx").on(table.authorId),
    statusIdx: index("community_posts_status_idx").on(table.status),
    createdAtIdx: index("community_posts_created_at_idx").on(table.createdAt),
  })
);

export const communityComments = pgTable(
  "community_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").notNull(),
    authorId: uuid("author_id").notNull(),
    parentCommentId: uuid("parent_comment_id"),
    content: text("content").notNull(),
    likeCount: integer("like_count").notNull().default(0),
    status: commentStatusEnum("status").notNull().default("APPROVED"),
    depth: integer("depth").notNull().default(0),
    path: text("path").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    postIdIdx: index("community_comments_post_id_idx").on(table.postId),
    authorIdIdx: index("community_comments_author_id_idx").on(table.authorId),
    parentCommentIdIdx: index("community_comments_parent_comment_id_idx").on(table.parentCommentId),
    createdAtIdx: index("community_comments_created_at_idx").on(table.createdAt),
    statusIdx: index("community_comments_status_idx").on(table.status),
    depthIdx: index("community_comments_depth_idx").on(table.depth),
  })
);

export const postLikes = pgTable(
  "post_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index("post_likes_post_id_idx").on(table.postId),
    userIdIdx: index("post_likes_user_id_idx").on(table.userId),
    uniqueIdx: uniqueIndex("post_likes_unique_idx").on(table.postId, table.userId),
    createdAtIdx: index("post_likes_created_at_idx").on(table.createdAt),
  })
);

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    commentIdIdx: index("comment_likes_comment_id_idx").on(table.commentId),
    userIdIdx: index("comment_likes_user_id_idx").on(table.userId),
    uniqueIdx: uniqueIndex("comment_likes_unique_idx").on(table.commentId, table.userId),
    createdAtIdx: index("comment_likes_created_at_idx").on(table.createdAt),
  })
);

export const studentLetters = pgTable(
  "student_letters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id").notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    content: text("content").notNull(),
    coverMediaId: uuid("cover_media_id"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    status: postStatusEnum("status").notNull().default("PENDING"),
    acknowledgementCount: integer("acknowledgement_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    authorIdIdx: index("student_letters_author_id_idx").on(table.authorId),
    statusIdx: index("student_letters_status_idx").on(table.status),
    isPublishedIdx: index("student_letters_is_published_idx").on(table.isPublished),
    createdAtIdx: index("student_letters_created_at_idx").on(table.createdAt),
  })
);

export const letterAcknowledgements = pgTable(
  "letter_acknowledgements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    letterId: uuid("letter_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    letterIdIdx: index("letter_acknowledgements_letter_id_idx").on(table.letterId),
    userIdIdx: index("letter_acknowledgements_user_id_idx").on(table.userId),
    uniqueIdx: uniqueIndex("letter_acknowledgements_unique_idx").on(table.letterId, table.userId),
  })
);

export const communityFeedback = pgTable(
  "community_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    category: feedbackCategoryEnum("category").notNull(),
    rating: integer("rating").notNull(),
    feedbackText: text("feedback_text").notNull(),
    status: feedbackStatusEnum("status").notNull().default("PENDING"),
    adminResponse: text("admin_response"),
    adminId: uuid("admin_id"),
    responseDate: timestamp("response_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    userIdIdx: index("community_feedback_user_id_idx").on(table.userId),
    statusIdx: index("community_feedback_status_idx").on(table.status),
    categoryIdx: index("community_feedback_category_idx").on(table.category),
    createdAtIdx: index("community_feedback_created_at_idx").on(table.createdAt),
    adminIdIdx: index("community_feedback_admin_id_idx").on(table.adminId),
  })
);

export const flaggedContent = pgTable(
  "flagged_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flaggedBy: uuid("flagged_by").notNull(),
    contentType: varchar("content_type", { length: 20 }).notNull(),
    contentId: uuid("content_id").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    description: text("description"),
    status: flagStatusEnum("status").notNull().default("NEW"),
    reviewedBy: uuid("reviewed_by"),
    adminAction: text("admin_action"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    contentTypeIdx: index("flagged_content_content_type_idx").on(table.contentType),
    statusIdx: index("flagged_content_status_idx").on(table.status),
    createdAtIdx: index("flagged_content_created_at_idx").on(table.createdAt),
    flaggedByIdx: index("flagged_content_flagged_by_idx").on(table.flaggedBy),
    reviewedByIdx: index("flagged_content_reviewed_by_idx").on(table.reviewedBy),
  })
);

export const bannedUsers = pgTable(
  "banned_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    bannedBy: uuid("banned_by").notNull(),
    reason: text("reason").notNull(),
    banDuration: varchar("ban_duration", { length: 50 }),
    banUntil: timestamp("ban_until"),
    isPermanent: boolean("is_permanent").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("banned_users_user_id_idx").on(table.userId),
    banUntilIdx: index("banned_users_ban_until_idx").on(table.banUntil),
    bannedByIdx: index("banned_users_banned_by_idx").on(table.bannedBy),
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    reason: text("reason"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    entityTypeIdx: index("audit_logs_entity_type_idx").on(table.entityType),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    entityIdIdx: index("audit_logs_entity_id_idx").on(table.entityId),
  })
);

export const apiLogs = pgTable(
  "api_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    method: varchar("method", { length: 10 }).notNull(),
    statusCode: integer("status_code").notNull(),
    responseTimeMs: integer("response_time_ms").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("api_logs_user_id_idx").on(table.userId),
    endpointIdx: index("api_logs_endpoint_idx").on(table.endpoint),
    statusCodeIdx: index("api_logs_status_code_idx").on(table.statusCode),
    createdAtIdx: index("api_logs_created_at_idx").on(table.createdAt),
  })
);

export const communityRules = pgTable(
  "community_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    orderNum: integer("order_num").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    isActiveIdx: index("community_rules_is_active_idx").on(table.isActive),
    orderNumIdx: index("community_rules_order_num_idx").on(table.orderNum),
  })
);

export const systemSettings = pgTable(
  "system_settings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
    settingValue: jsonb("setting_value").notNull(),
    dataType: varchar("data_type", { length: 50 }).notNull(),
    description: text("description"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    settingKeyIdx: index("system_settings_setting_key_idx").on(table.settingKey),
    updatedByIdx: index("system_settings_updated_by_idx").on(table.updatedBy),
  })
);

// Email queue for persistent storage (production-ready)
export const emailQueue = pgTable(
  "email_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    subject: text("subject").notNull(),
    htmlContent: text("html_content").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"), // PENDING, SENT, FAILED
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastAttemptAt: timestamp("last_attempt_at"),
    nextRetryAt: timestamp("next_retry_at"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    recipientEmailIdx: index("email_queue_recipient_email_idx").on(table.recipientEmail),
    statusIdx: index("email_queue_status_idx").on(table.status),
    nextRetryAtIdx: index("email_queue_next_retry_at_idx").on(table.nextRetryAt),
    createdAtIdx: index("email_queue_created_at_idx").on(table.createdAt),
    // Composite index for finding pending emails to retry
    statusNextRetryIdx: index("email_queue_status_next_retry_idx").on(table.status, table.nextRetryAt),
  })
);

export const faqs = pgTable(
  "faqs",
  {
    id:        integer("id").primaryKey().generatedAlwaysAsIdentity(),
    question:  text("question").notNull(),
    answer:    text("answer").notNull(),
    category:  varchar("category", { length: 50 }).notNull().default("General"),
    order:     integer("order").notNull().default(0),
    isActive:  boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    isActiveIdx: index("faqs_is_active_idx").on(table.isActive),
    orderIdx:    index("faqs_order_idx").on(table.order),
    categoryIdx: index("faqs_category_idx").on(table.category),
  })
);

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  authTokens: many(authTokens),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
  mediaFiles: many(mediaFiles),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
  avatar: one(mediaFiles, { fields: [userProfiles.avatarMediaId], references: [mediaFiles.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  category: one(communityCategories, { fields: [communityPosts.categoryId], references: [communityCategories.id] }),
  author: one(users, { fields: [communityPosts.authorId], references: [users.id] }),
  comments: many(communityComments),
  likes: many(postLikes),
  featuredMedia: one(mediaFiles, { fields: [communityPosts.featuredMediaId], references: [mediaFiles.id] }),
}));

export const communityCommentsRelations = relations(communityComments, ({ one, many }) => ({
  post: one(communityPosts, { fields: [communityComments.postId], references: [communityPosts.id] }),
  author: one(users, { fields: [communityComments.authorId], references: [users.id] }),
  parent: one(communityComments, { fields: [communityComments.parentCommentId], references: [communityComments.id] }),
  likes: many(commentLikes),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(communityPosts, { fields: [postLikes.postId], references: [communityPosts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(communityComments, { fields: [commentLikes.commentId], references: [communityComments.id] }),
  user: one(users, { fields: [commentLikes.userId], references: [users.id] }),
}));

export const bannedUsersRelations = relations(bannedUsers, ({ one }) => ({
  user: one(users, { fields: [bannedUsers.userId], references: [users.id] }),
  bannedByUser: one(users, { fields: [bannedUsers.bannedBy], references: [users.id] }),
}));

export const studentLettersRelations = relations(studentLetters, ({ one, many }) => ({
  author: one(users, { fields: [studentLetters.authorId], references: [users.id] }),
  acknowledgements: many(letterAcknowledgements),
}));

export const letterAcknowledgementsRelations = relations(
  letterAcknowledgements,
  ({ one }) => ({
    letter: one(studentLetters, {
      fields: [letterAcknowledgements.letterId],
      references: [studentLetters.id],
    }),
    user: one(users, {
      fields: [letterAcknowledgements.userId],
      references: [users.id],
    }),
  })
);

// ============================================================================
// NEWSLETTER TABLES
// ============================================================================

export const newsletters = pgTable(
  "newsletters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull(),

    // Cloudinary storage
    cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
    cloudinaryUrl: varchar("cloudinary_url", { length: 500 }).notNull(),

    // Thumbnail (optional)
    thumbnailCloudinaryUrl: varchar("thumbnail_cloudinary_url", { length: 500 }),

    // File metadata
    fileSize: bigint("file_size", { mode: "number" }).notNull(),

    // Status management
    status: varchar("status", { length: 20 }).notNull().default("published"),

    // Metadata
    uploadedBy: uuid("uploaded_by").notNull(),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    archivedAt: timestamp("archived_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    statusIdx: index("newsletters_status_idx").on(table.status),
    categoryIdx: index("newsletters_category_idx").on(table.category),
    publishedIdx: index("newsletters_published_at_idx").on(table.publishedAt),
    uploadedByIdx: index("newsletters_uploaded_by_idx").on(table.uploadedBy),
  })
);

// Newsletter Relations
export const newslettersRelations = relations(newsletters, ({ one }) => ({
  uploadedByUser: one(users, { fields: [newsletters.uploadedBy], references: [users.id] }),
}));

// ============================================================================
// BLOGS TABLE
// ============================================================================

export const blogs = pgTable(
  "blogs",
  {
    // Primary & Identifiers
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Content
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    coverImageUrl: varchar("cover_image_url", { length: 500 }),

    // Metadata
    category: varchar("category", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"),

    // Relations
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),

    // Engagement Metrics
    viewCount: integer("view_count").notNull().default(0),
    acknowledgementCount: integer("acknowledgement_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),

    // Timestamps
    publishedDate: timestamp("published_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"), // Soft delete
  },
  (table) => ({
    statusIdx: index("blogs_status_idx").on(table.status),
    categoryIdx: index("blogs_category_idx").on(table.category),
    publishedDateIdx: index("blogs_published_date_idx").on(table.publishedDate),
    authorIdIdx: index("blogs_author_id_idx").on(table.authorId),
    deletedAtIdx: index("blogs_deleted_at_idx").on(table.deletedAt),
  })
);

// ============================================================================
// BLOG ACKNOWLEDGEMENTS TABLE
// ============================================================================

export const blogAcknowledgements = pgTable(
  "blog_acknowledgements",
  {
    // Primary & Identifiers
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    blogId: integer("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    blogIdIdx: index("blog_ack_blog_id_idx").on(table.blogId),
    userIdIdx: index("blog_ack_user_id_idx").on(table.userId),
    uniqueAckIdx: uniqueIndex("blog_ack_unique_idx").on(table.blogId, table.userId),
  })
);

// ============================================================================
// BLOG VIEWS TABLE (Optional - for analytics)
// ============================================================================

export const blogViews = pgTable(
  "blog_views",
  {
    // Primary & Identifiers
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    blogId: integer("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Timestamps
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (table) => ({
    blogIdIdx: index("blog_views_blog_id_idx").on(table.blogId),
    userIdIdx: index("blog_views_user_id_idx").on(table.userId),
  })
);

// ============================================================================
// BLOG RELATIONS
// ============================================================================

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  author: one(users, {
    fields: [blogs.authorId],
    references: [users.id],
  }),
  acknowledgements: many(blogAcknowledgements),
  views: many(blogViews),
}));

export const blogAcknowledgementsRelations = relations(blogAcknowledgements, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogAcknowledgements.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [blogAcknowledgements.userId],
    references: [users.id],
  }),
}));

export const blogViewsRelations = relations(blogViews, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogViews.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [blogViews.userId],
    references: [users.id],
  }),
}));

// Types
export type Blog = typeof blogs.$inferSelect;
export type BlogInsert = typeof blogs.$inferInsert;
export type BlogAcknowledgement = typeof blogAcknowledgements.$inferSelect;
export type BlogAcknowledgementInsert = typeof blogAcknowledgements.$inferInsert;
export type BlogView = typeof blogViews.$inferSelect;
export type BlogViewInsert = typeof blogViews.$inferInsert;
export type Newsletter = typeof newsletters.$inferSelect;
export type NewsletterInsert = typeof newsletters.$inferInsert;
