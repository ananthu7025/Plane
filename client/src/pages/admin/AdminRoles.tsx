import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Shield, Edit, Users, MoreVertical, Key, Plus } from "lucide-react";
import { toast } from "sonner";
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
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  // Permission creation state
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false);
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [permissionModule, setPermissionModule] = useState("");
  const [isCreatingPermission, setIsCreatingPermission] = useState(false);

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
    setRoleName("");
    setRoleDescription("");
    setIsRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role: (typeof roles)[0]) => {
    setIsCreatingRole(false);
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setIsRoleDialogOpen(true);
  };

  const openEditPermissionsDialog = (role: (typeof roles)[0]) => {
    setEditingRole(role);
    setRoleFormPermissions(role.permissions.map((p) => p.id));
    setIsPermissionsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (isCreatingRole) {
      dispatch(
        createRole({
          name: roleName,
          description: roleDescription || undefined,
        }) as never,
      );
    } else if (editingRole) {
      dispatch(
        updateRole(editingRole.id, {
          name: roleName,
          description: roleDescription || undefined,
        }) as never,
      );
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
    setRoleName("");
    setRoleDescription("");
    setRoleFormPermissions([]);
  };

  const closePermissionsDialog = () => {
    setIsPermissionsDialogOpen(false);
    setEditingRole(null);
    setRoleFormPermissions([]);
    // Refetch roles to reflect any permission changes
    dispatch(getAllRoles() as never);
  };

  const handleCreatePermission = async () => {
    if (!permissionName.trim()) {
      toast.error("Permission name is required");
      return;
    }
    if (!permissionModule.trim()) {
      toast.error("Module is required");
      return;
    }

    setIsCreatingPermission(true);
    try {
      await dispatch(
        createPermission({
          name: permissionName,
          description: permissionDescription,
          module: permissionModule,
        }) as never
      );
      setPermissionName("");
      setPermissionDescription("");
      setPermissionModule("");
      setIsCreatePermissionDialogOpen(false);
      toast.success("Permission created successfully");
      dispatch(getAllPermissions() as never);
    } catch (error) {
      toast.error("Failed to create permission");
    } finally {
      setIsCreatingPermission(false);
    }
  };

  const closePermissionDialog = () => {
    setIsCreatePermissionDialogOpen(false);
    setPermissionName("");
    setPermissionDescription("");
    setPermissionModule("");
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g., Moderator, Reviewer"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description (Optional)</Label>
              <Textarea
                id="roleDescription"
                placeholder="Describe this role's purpose"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRoleDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={updating || !roleName.trim()}>
              {updating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
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
      <Dialog
        open={isCreatePermissionDialogOpen}
        onOpenChange={closePermissionDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="perm-name">Permission Name</Label>
              <Input
                id="perm-name"
                placeholder="e.g., CREATE_LETTER"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                disabled={isCreatingPermission}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="perm-module">Module</Label>
              <Input
                id="perm-module"
                placeholder="e.g., letters, roles, users"
                value={permissionModule}
                onChange={(e) => setPermissionModule(e.target.value)}
                disabled={isCreatingPermission}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="perm-description">Description (Optional)</Label>
              <Textarea
                id="perm-description"
                placeholder="Describe what this permission allows..."
                value={permissionDescription}
                onChange={(e) => setPermissionDescription(e.target.value)}
                disabled={isCreatingPermission}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closePermissionDialog}
              disabled={isCreatingPermission}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePermission}
              disabled={isCreatingPermission}
            >
              {isCreatingPermission ? "Creating..." : "Create Permission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
