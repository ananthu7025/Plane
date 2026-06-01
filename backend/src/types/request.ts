declare global {
  namespace Express {
    interface Request {
      userId?: string;
      roleId?: number;
      roleName?: string;
      userPermissions?: string[];
      email?: string;
      token?: string;
    }
  }
}

export {};
