import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { rolesSchemas } from "../../validation/roles.js";
import { Permissions } from "../../lib/permissions.js";
import * as rolesController from "../controllers/rolesController.js";

const router = Router();

// Roles
router.get("/roles", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), rolesController.getRoles);
router.get("/roles/:id", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), rolesController.getRole);
router.post("/roles", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), validate(rolesSchemas.createRole), rolesController.createRoleController);
router.put("/roles/:id", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), validate(rolesSchemas.updateRole), rolesController.updateRoleController);
router.delete("/roles/:id", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), rolesController.deleteRoleController);

// Permissions
router.get("/permissions", authMiddleware, requirePermission(Permissions.MANAGE_PERMISSIONS), validate(rolesSchemas.pagination, "query"), rolesController.getPermissions);
router.post("/permissions", authMiddleware, requirePermission(Permissions.MANAGE_PERMISSIONS), validate(rolesSchemas.createPermission), rolesController.createPermissionController);
router.put("/permissions/:id", authMiddleware, requirePermission(Permissions.MANAGE_PERMISSIONS), validate(rolesSchemas.updatePermission), rolesController.updatePermissionController);
router.delete("/permissions/:id", authMiddleware, requirePermission(Permissions.MANAGE_PERMISSIONS), rolesController.deletePermissionController);

// Role-Permission Assignment
router.post("/roles/:id/permissions", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), validate(rolesSchemas.assignPermission), rolesController.assignPermissionController);
router.delete("/roles/:id/permissions/:permissionId", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), rolesController.removePermissionController);

// User Roles
router.put("/users/:id/role", authMiddleware, requirePermission(Permissions.MANAGE_ROLES), validate(rolesSchemas.updateUserRole), rolesController.updateUserRoleController);

export default router;
