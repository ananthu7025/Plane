import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "./index.js";
import { permissions, roles, rolePermissions } from "./schema.js";

const MENTORSHIP_PERMISSIONS = [
  {
    name: "MANAGE_MENTORSHIP",
    module: "mentorship",
    description: "Manage mentorship requests and sessions",
  },
];

// Roles that receive each permission
const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  ADMIN:   ["MANAGE_MENTORSHIP"],
  MENTOR:  [],
  STUDENT: [],
};

async function seedMentorshipPermission() {
  console.log("🌱 Seeding mentorship permission...");

  try {
    // 1. Insert permission (skip if already exists)
    const existingPerms = await db.query.permissions.findMany({
      where: inArray(
        permissions.name,
        MENTORSHIP_PERMISSIONS.map((p) => p.name)
      ),
    });

    const existingNames = new Set(existingPerms.map((p) => p.name));
    const toInsert = MENTORSHIP_PERMISSIONS.filter((p) => !existingNames.has(p.name));

    if (toInsert.length === 0) {
      console.log("✓ MANAGE_MENTORSHIP already exists — skipping insert");
    } else {
      await db.insert(permissions).values(toInsert);
      console.log(`✓ Inserted: ${toInsert.map((p) => p.name).join(", ")}`);
    }

    // 2. Reload to get IDs
    const allPerms = await db.query.permissions.findMany({
      where: inArray(
        permissions.name,
        MENTORSHIP_PERMISSIONS.map((p) => p.name)
      ),
    });
    const permMap = new Map(allPerms.map((p) => [p.name, p.id]));

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

      const existing = await db.query.rolePermissions.findMany({
        where: (rp) =>
          inArray(rp.permissionId, permIds) && eq(rp.roleId, role.id),
      });

      const alreadyAssigned = new Set(existing.map((rp) => rp.permissionId));
      const toAssign = permIds.filter((id) => !alreadyAssigned.has(id));

      if (toAssign.length === 0) {
        console.log(`✓ ${roleName}: MANAGE_MENTORSHIP already assigned`);
      } else {
        await db.insert(rolePermissions).values(
          toAssign.map((permissionId) => ({ roleId: role.id, permissionId }))
        );
        console.log(`✓ ${roleName}: assigned MANAGE_MENTORSHIP`);
      }
    }

    console.log("✅ Mentorship permission seeded successfully!");
  } catch (error) {
    console.error("❌ Mentorship permission seeding failed:", error);
    process.exit(1);
  }
}

seedMentorshipPermission();
