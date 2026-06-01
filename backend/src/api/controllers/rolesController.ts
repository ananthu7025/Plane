import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { AppError } from '../../utils/errors.js';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
  updateUserRole,
} from '../services/rolesService.js';

// ===== ROLES =====

export async function getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAllRoles();
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get roles error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid role ID');
      return;
    }

    const role = await getRoleById(roleId);
    sendSuccess(res, 200, role);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get role error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function createRoleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await createRole(req.body.name, req.body.description);
    sendSuccess(res, 201, role);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Create role error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function updateRoleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid role ID');
      return;
    }

    const role = await updateRole(roleId, req.body.name, req.body.description);
    sendSuccess(res, 200, role);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Update role error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function deleteRoleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid role ID');
      return;
    }

    const result = await deleteRole(roleId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Delete role error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

// ===== PERMISSIONS =====

export async function getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAllPermissions({
      page: (req.query.page as unknown as number),
      limit: (req.query.limit as unknown as number),
      search: (req.query.search as string) || undefined,
      module: (req.query.module as string) || undefined,
    });
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get permissions error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function createPermissionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permission = await createPermission(req.body);
    sendSuccess(res, 201, {
      message: 'Permission created successfully',
      permission,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Create permission error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function updatePermissionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid permission ID');
      return;
    }

    const permission = await updatePermission(permissionId, req.body);
    sendSuccess(res, 200, {
      message: 'Permission updated successfully',
      permission,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Update permission error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function deletePermissionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid permission ID');
      return;
    }

    const result = await deletePermission(permissionId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Delete permission error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

// ===== ROLE-PERMISSION ASSIGNMENT =====

export async function assignPermissionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid role ID');
      return;
    }

    const assignment = await assignPermissionToRole(roleId, req.body.permissionId);
    sendSuccess(res, 201, {
      message: 'Permission assigned to role successfully',
      assignment,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Assign permission error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

export async function removePermissionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = Array.isArray(req.params.permissionId) ? req.params.permissionId[0] : req.params.permissionId;

    const roleId = parseInt(id);
    const pId = parseInt(permissionId);

    if (isNaN(roleId) || isNaN(pId)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid role or permission ID');
      return;
    }

    const result = await removePermissionFromRole(roleId, pId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Remove permission error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

// ===== USER ROLE =====

export async function updateUserRoleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format');
      return;
    }

    const user = await updateUserRole(id, req.body.role);

    sendSuccess(res, 200, {
      message: `User role updated to ${req.body.role}`,
      user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Update user role error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}
