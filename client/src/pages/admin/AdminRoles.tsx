import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Shield, Edit, Users, MoreVertical, Key } from "lucide-react";
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
} from "@/store/slices/rolesSlice";
import { PermissionCheckboxGroup } from "@/components/admin";
import { StatCard } from "@/components/shared";

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
  const { roles, permissions, loading } = useAppSelector(
    (state) => state.roles,
  );

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<(typeof roles)[0] | null>(
    null,
  );
  const [roleFormPermissions, setRoleFormPermissions] = useState<number[]>([]);

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

  const openEditRole = (role: (typeof roles)[0]) => {
    setEditingRole(role);
    setRoleFormPermissions(role.permissions.map((p) => p.id));
    setIsRoleDialogOpen(true);
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
    setEditingRole(null);
    setRoleFormPermissions([]);
    // Refetch roles to reflect any permission changes
    dispatch(getAllRoles() as never);
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
                      <DropdownMenuItem onClick={() => openEditRole(role)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Permissions
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
      <Dialog open={isRoleDialogOpen} onOpenChange={closeRoleDialog}>
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
            <Button variant="outline" onClick={closeRoleDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
