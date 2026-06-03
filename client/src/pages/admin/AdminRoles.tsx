import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Shield, Edit, Users, MoreVertical, Key, Plus } from "lucide-react";
import { toast } from "sonner";

const roleFormSchema = z.object({
  name:        z.string().min(2, "Role name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

const permissionFormSchema = z.object({
  name:        z.string().min(2, "Permission name must be at least 2 characters").max(100),
  module:      z.string().min(2, "Module is required").max(50),
  description: z.string().max(500).optional(),
});

type RoleFormData       = z.infer<typeof roleFormSchema>;
type PermissionFormData = z.infer<typeof permissionFormSchema>;
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getAllRoles,
  getAllPermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  createRole,
  updateRole,
  deleteRole,
  createPermission,
} from "@/store/slices/rolesSlice";
import { PermissionCheckboxGroup } from "@/components/admin";
import { StatCard } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AdminRoles() {
  const dispatch = useAppDispatch();
  const { roles = [], permissions = [], loading = false, updating = false } = useAppSelector(
    (state) => state.roles,
  ) || {};

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<(typeof roles)[0] | null>(
    null,
  );
  const [roleToDelete, setRoleToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleFormPermissions, setRoleFormPermissions] = useState<number[]>([]);

  // Permission creation state
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false);
  const [isCreatingPermission, setIsCreatingPermission] = useState(false);

  const roleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const permissionForm = useForm<PermissionFormData>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: { name: "", module: "", description: "" },
  });

  useEffect(() => {
    dispatch(getAllRoles() as never);
    dispatch(getAllPermissions() as never);
  }, [dispatch]);

  // Group permissions by module
  const groupedPermissions = permissions.reduce(
    (acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    },
    {} as Record<string, typeof permissions>,
  );

  const openCreateRoleDialog = () => {
    setIsCreatingRole(true);
    setEditingRole(null);
    roleForm.reset({ name: "", description: "" });
    setIsRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role: (typeof roles)[0]) => {
    setIsCreatingRole(false);
    setEditingRole(role);
    roleForm.reset({ name: role.name, description: role.description || "" });
    setIsRoleDialogOpen(true);
  };

  const openEditPermissionsDialog = (role: (typeof roles)[0]) => {
    setEditingRole(role);
    setRoleFormPermissions(role.permissions.map((p) => p.id));
    setIsPermissionsDialogOpen(true);
  };

  const handleSaveRole = (data: RoleFormData) => {
    if (isCreatingRole) {
      dispatch(createRole({ name: data.name, description: data.description || undefined }) as never);
    } else if (editingRole) {
      dispatch(updateRole(editingRole.id, { name: data.name, description: data.description || undefined }) as never);
    }
    setIsRoleDialogOpen(false);
  };

  const openDeleteConfirmation = (roleId: number, roleName: string) => {
    setRoleToDelete({ id: roleId, name: roleName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      dispatch(deleteRole(roleToDelete.id) as never);
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const togglePermissionCheckbox = (permissionId: number) => {
    setRoleFormPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );

    if (editingRole) {
      const isCurrentlyAssigned = editingRole.permissions.some(
        (p) => p.id === permissionId,
      );
      if (isCurrentlyAssigned) {
        dispatch(
          removePermissionFromRole(editingRole.id, permissionId) as never
        );
      } else {
        dispatch(assignPermissionToRole(editingRole.id, permissionId) as never);
      }
    }
  };

  const closeRoleDialog = () => {
    setIsRoleDialogOpen(false);
    setIsCreatingRole(false);
    setEditingRole(null);
    roleForm.reset();
    setRoleFormPermissions([]);
  };

  const closePermissionsDialog = () => {
    setIsPermissionsDialogOpen(false);
    setEditingRole(null);
    setRoleFormPermissions([]);
    // Refetch roles to reflect any permission changes
    dispatch(getAllRoles() as never);
  };

  const handleCreatePermission = async (data: PermissionFormData) => {
    setIsCreatingPermission(true);
    try {
      await dispatch(createPermission({ name: data.name, description: data.description, module: data.module }) as never);
      permissionForm.reset();
      setIsCreatePermissionDialogOpen(false);
      toast.success("Permission created successfully");
      dispatch(getAllPermissions() as never);
    } catch {
      toast.error("Failed to create permission");
    } finally {
      setIsCreatingPermission(false);
    }
  };

  const closePermissionDialog = () => {
    setIsCreatePermissionDialogOpen(false);
    permissionForm.reset();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Roles & Access
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateRoleDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
          <Button
            onClick={() => setIsCreatePermissionDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Permission
          </Button>
        </div>
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <StatCard
          icon={<Shield className="w-5 h-5 text-primary" />}
          label="Total Roles"
          value={roles.length}
          variant="primary"
        />
        <StatCard
          icon={<Key className="w-5 h-5 text-warning" />}
          label="Permissions"
          value={permissions.length}
          variant="warning"
        />
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {loading ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            No roles found
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditRoleDialog(role)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditPermissionsDialog(role)}>
                        <Key className="w-4 h-4 mr-2" />
                        Edit Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteConfirmation(role.id, role.name)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Role
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {role.userCount} users
                  </Badge>
                  <Badge variant="secondary">
                    <Key className="w-3 h-3 mr-1" />
                    {role.permissions.length} permissions
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map((p) => (
                    <Badge key={p.id} variant="default" className="text-xs">
                      {p.name}
                    </Badge>
                  ))}
                  {role.permissions.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{role.permissions.length - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>
      {/* Create/Edit Role Dialog */}
      <Dialog open={isRoleDialogOpen && !isPermissionsDialogOpen} onOpenChange={closeRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreatingRole ? "Create New Role" : "Edit Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit(handleSaveRole)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="roleName">Role Name <span className="text-red-500">*</span></Label>
              <Input
                id="roleName"
                placeholder="e.g., Moderator, Reviewer"
                {...roleForm.register("name")}
                className={`mt-2 ${roleForm.formState.errors.name ? "border-red-500" : ""}`}
              />
              {roleForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{roleForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="roleDescription">Description (Optional)</Label>
              <Textarea
                id="roleDescription"
                placeholder="Describe this role's purpose"
                {...roleForm.register("description")}
                rows={3}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeRoleDialog}>Cancel</Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={closePermissionsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {editingRole.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {editingRole.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-base font-semibold">Permissions</Label>
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <PermissionCheckboxGroup
                    key={module}
                    module={module}
                    permissions={perms}
                    assignedIds={roleFormPermissions}
                    onToggle={togglePermissionCheckbox}
                  />
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closePermissionsDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the role{" "}
              <span className="font-semibold text-foreground">
                "{roleToDelete?.name}"
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setRoleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRole}
              disabled={updating}
            >
              {updating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Permission Dialog */}
      <Dialog open={isCreatePermissionDialogOpen} onOpenChange={closePermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
          </DialogHeader>
          <form onSubmit={permissionForm.handleSubmit(handleCreatePermission)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="perm-name">Permission Name <span className="text-red-500">*</span></Label>
              <Input
                id="perm-name"
                placeholder="e.g., CREATE_LETTER"
                {...permissionForm.register("name")}
                disabled={isCreatingPermission}
                className={`mt-2 ${permissionForm.formState.errors.name ? "border-red-500" : ""}`}
              />
              {permissionForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{permissionForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="perm-module">Module <span className="text-red-500">*</span></Label>
              <Input
                id="perm-module"
                placeholder="e.g., letters, roles, users"
                {...permissionForm.register("module")}
                disabled={isCreatingPermission}
                className={`mt-2 ${permissionForm.formState.errors.module ? "border-red-500" : ""}`}
              />
              {permissionForm.formState.errors.module && (
                <p className="text-sm text-red-500 mt-1">{permissionForm.formState.errors.module.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="perm-description">Description (Optional)</Label>
              <Textarea
                id="perm-description"
                placeholder="Describe what this permission allows..."
                {...permissionForm.register("description")}
                disabled={isCreatingPermission}
                className="mt-2"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePermissionDialog} disabled={isCreatingPermission}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingPermission}>
                {isCreatingPermission ? "Creating..." : "Create Permission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
