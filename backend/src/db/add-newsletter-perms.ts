import "dotenv/config";
import { db } from "./index.js";
import { permissions, rolePermissions, roles } from "./schema.js";
import { eq } from "drizzle-orm";

async function addNewsletterPermissions() {
  try {
    console.log("📝 Adding newsletter permissions...");

    // 1. Check if permissions exist
    const managePerm = await db.query.permissions.findFirst({
      where: eq(permissions.name, "MANAGE_NEWSLETTERS"),
    });

    const viewPerm = await db.query.permissions.findFirst({
      where: eq(permissions.name, "VIEW_NEWSLETTERS"),
    });

    if (!managePerm || !viewPerm) {
      // Insert missing permissions
      const newPerms = await db
        .insert(permissions)
        .values([
          ...(managePerm
            ? []
            : [
                {
                  name: "MANAGE_NEWSLETTERS",
                  module: "newsletters",
                  description: "Can manage newsletters",
                },
              ]),
          ...(viewPerm
            ? []
            : [
                {
                  name: "VIEW_NEWSLETTERS",
                  module: "newsletters",
                  description: "Can view newsletters",
                },
              ]),
        ])
        .returning();

      console.log(`✓ Newsletter permissions created (${newPerms.length} new)`);

      // Fetch the permissions again
      const finalManagePerm =
        managePerm ||
        (await db.query.permissions.findFirst({
          where: eq(permissions.name, "MANAGE_NEWSLETTERS"),
        }));

      const finalViewPerm =
        viewPerm ||
        (await db.query.permissions.findFirst({
          where: eq(permissions.name, "VIEW_NEWSLETTERS"),
        }));

      // Get mentor role
      const mentorRole = await db.query.roles.findFirst({
        where: eq(roles.name, "MENTOR"),
      });

      if (mentorRole && finalManagePerm && finalViewPerm) {
        // Assign to mentor role
        await db.insert(rolePermissions).values([
          { roleId: mentorRole.id, permissionId: finalManagePerm.id },
          { roleId: mentorRole.id, permissionId: finalViewPerm.id },
        ]);

        console.log("✓ Newsletter permissions assigned to MENTOR role");
      }
    } else {
      console.log("✓ Newsletter permissions already exist");
    }

    console.log("✅ Newsletter permissions added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding permissions:", error);
    process.exit(1);
  }
}

addNewsletterPermissions();
