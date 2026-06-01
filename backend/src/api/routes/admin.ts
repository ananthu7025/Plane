import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { adminMiddleware } from "../../middleware/adminAuth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { adminSchemas } from "../../validation/admin.js";
import { Permissions } from "../../lib/permissions.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();

router.get("/users", authMiddleware, requirePermission(Permissions.VIEW_USERS), validate(adminSchemas.getUserFilters, "query"), adminController.getUsers);
router.get("/users/:id", authMiddleware, requirePermission(Permissions.VIEW_USERS), adminController.getUser);
router.put("/users/:id", authMiddleware, requirePermission(Permissions.SUSPEND_USER), validate(adminSchemas.updateUserProfile), adminController.updateUser);
router.put("/users/:id/status", authMiddleware, requirePermission(Permissions.SUSPEND_USER), validate(adminSchemas.updateUserStatus), adminController.updateUserStatusController);
router.delete("/users/:id", authMiddleware, requirePermission(Permissions.SUSPEND_USER), adminController.deleteUserController);

export default router;
