import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "./index.js";
import { permissions, roles, rolePermissions } from "./schema.js";

const BLOG_PERMISSIONS = [
  {
    name: "MANAGE_BLOGS",
    module: "blogs",
    description: "Can create, edit, publish, and delete blog posts",
  },
];

// Roles that receive each permission
const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  ADMIN: ["MANAGE_BLOGS"],
  MENTOR: [],
  STUDENT: [],
};

async function seedBlogPermissions() {
  console.log("🌱 Seeding blog permissions...");

  try {
    // 1. Insert blog permissions (skip if already exist)
    const existingPerms = await db.query.permissions.findMany({
      where: inArray(
        permissions.name,
        BLOG_PERMISSIONS.map((p) => p.name)
      ),
    });

    const existingNames = new Set(existingPerms.map((p) => p.name));
    const toInsert = BLOG_PERMISSIONS.filter((p) => !existingNames.has(p.name));

    if (toInsert.length === 0) {
      console.log("✓ Blog permissions already exist — skipping insert");
    } else {
      await db.insert(permissions).values(toInsert);
      console.log(`✓ Inserted ${toInsert.length} blog permissions: ${toInsert.map((p) => p.name).join(", ")}`);
    }

    // 2. Reload all blog permissions to get their IDs
    const allBlogPerms = await db.query.permissions.findMany({
      where: inArray(
        permissions.name,
        BLOG_PERMISSIONS.map((p) => p.name)
      ),
    });
    const permMap = new Map(allBlogPerms.map((p) => [p.name, p.id]));

    // 3. Assign to each role (skip if already assigned)
    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS_MAP)) {
      if (permNames.length === 0) continue;

      const role = await db.query.roles.findFirst({
        where: eq(roles.name, roleName),
      });

      if (!role) {
        console.warn(`⚠ Role "${roleName}" not found — skipping`);
        continue;
      }

      const permIds = permNames
        .map((name) => permMap.get(name))
        .filter((id): id is number => id !== undefined);

      // Check which are already assigned
      const existing = await db.query.rolePermissions.findMany({
        where: (rp) =>
          inArray(rp.permissionId, permIds) && eq(rp.roleId, role.id),
      });

      const alreadyAssigned = new Set(existing.map((rp) => rp.permissionId));
      const toAssign = permIds.filter((id) => !alreadyAssigned.has(id));

      if (toAssign.length === 0) {
        console.log(`✓ ${roleName}: blog permissions already assigned`);
      } else {
        await db.insert(rolePermissions).values(
          toAssign.map((permissionId) => ({ roleId: role.id, permissionId }))
        );
        const assignedNames = permNames.filter(
          (name) => permMap.has(name) && toAssign.includes(permMap.get(name)!)
        );
        console.log(`✓ ${roleName}: assigned [${assignedNames.join(", ")}]`);
      }
    }

    console.log("✅ Blog permissions seeded successfully!");
  } catch (error) {
    console.error("❌ Blog permission seeding failed:", error);
    process.exit(1);
  }
}

seedBlogPermissions();
