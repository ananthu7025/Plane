import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { adminMiddleware } from "../../middleware/adminAuth.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  validate,
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionSchema,
  updateUserRoleSchema,
  intIdParamSchema,
  paginationSchema,
} from "../../utils/validation.js";
import { AppError } from "../../utils/errors.js";
import {
  getAllRoles,
  getRoleById,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
  updateUserRole,
} from "../services/rolesService.js";

const router = Router();

/**
 * @route GET /api/admin/roles
 * @description Get all roles with assigned permissions and user counts
 * @access Protected (requires ADMIN role)
 */
router.get("/roles", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await getAllRoles();
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get roles error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/admin/roles/:id
 * @description Get a single role with all its permissions
 * @access Protected (requires ADMIN role)
 * @param id Role ID (integer)
 */
router.get("/roles/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roleId = validate(intIdParamSchema, id);

    const role = await getRoleById(roleId);
    sendSuccess(res, 200, role);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get role error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/admin/permissions
 * @description Get all permissions with pagination and optional filtering
 * @access Protected (requires ADMIN role)
 * @query page=1&limit=20&search=&module=
 */
router.get("/permissions", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedFilters = validate(paginationSchema, req.query);
    const result = await getAllPermissions({
      page: validatedFilters.page,
      limit: validatedFilters.limit,
      search: validatedFilters.search,
      module: (req.query.module as string) || undefined,
    });
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get permissions error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/admin/permissions
 * @description Create a new permission
 * @access Protected (requires ADMIN role)
 * @body { name: string, description?: string, module: string }
 */
router.post("/permissions", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = validate(createPermissionSchema, req.body);
    const permission = await createPermission(validatedData);
    sendSuccess(res, 201, {
      message: "Permission created successfully",
      permission,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Create permission error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/admin/permissions/:id
 * @description Update a permission
 * @access Protected (requires ADMIN role)
 * @param id Permission ID (integer)
 * @body { name?: string, description?: string, module?: string }
 */
router.put("/permissions/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = validate(intIdParamSchema, id);
    const validatedData = validate(updatePermissionSchema, req.body);

    const permission = await updatePermission(permissionId, validatedData);
    sendSuccess(res, 200, {
      message: "Permission updated successfully",
      permission,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Update permission error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/admin/permissions/:id
 * @description Delete a permission
 * @access Protected (requires ADMIN role)
 * @param id Permission ID (integer)
 */
router.delete("/permissions/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = validate(intIdParamSchema, id);

    const result = await deletePermission(permissionId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete permission error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/admin/roles/:id/permissions
 * @description Assign a permission to a role
 * @access Protected (requires ADMIN role)
 * @param id Role ID (integer)
 * @body { permissionId: integer }
 */
router.post("/roles/:id/permissions", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roleId = validate(intIdParamSchema, id);
    const validatedData = validate(assignPermissionSchema, req.body);

    const assignment = await assignPermissionToRole(roleId, validatedData.permissionId);
    sendSuccess(res, 201, {
      message: "Permission assigned to role successfully",
      assignment,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Assign permission error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/admin/roles/:id/permissions/:permissionId
 * @description Remove a permission from a role
 * @access Protected (requires ADMIN role)
 * @param id Role ID (integer)
 * @param permissionId Permission ID (integer)
 */
router.delete("/roles/:id/permissions/:permissionId", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = Array.isArray(req.params.permissionId) ? req.params.permissionId[0] : req.params.permissionId;

    const roleId = validate(intIdParamSchema, id);
    const pId = validate(intIdParamSchema, permissionId);

    const result = await removePermissionFromRole(roleId, pId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Remove permission error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/admin/users/:id/role
 * @description Update a user's role
 * @access Protected (requires ADMIN role)
 * @param id User ID (UUID)
 * @body { role: "STUDENT" | "MENTOR" | "ADMIN" }
 */
router.put("/users/:id/role", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const validatedData = validate(updateUserRoleSchema, req.body);
    const user = await updateUserRole(id, validatedData.role);

    sendSuccess(res, 200, {
      message: `User role updated to ${validatedData.role}`,
      user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Update user role error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

export default router;
