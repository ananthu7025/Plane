import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { usePermission } from "@/hooks/usePermission";
import { Permissions } from "@/lib/permissions";
import PermissionGate from "@/components/common/PermissionGate";
import {
  getAllUsers,
  clearSuccessMessage,
  clearError,
} from "@/store/slices/userManagementSlice";
import { getAllRoles, updateUserRole } from "@/store/slices/rolesSlice";
import { StatCard } from "@/components/shared";
import { UserDetailModal } from "@/components/admin/UserDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Users, Shield, Eye, Edit } from "lucide-react";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function UserManagement() {
  const dispatch = useAppDispatch();
  const canViewUsers = usePermission(Permissions.VIEW_USERS);
  const canSuspendUsers = usePermission(Permissions.SUSPEND_USER);

  // Redux state
  const { users = [], loading = false, successMessage, error } = useAppSelector(
    (state) => state.userManagement,
  ) || {};
  const { roles = [], updating = false } = useAppSelector((state) => state.roles) || {};

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserMode, setSelectedUserMode] = useState<"view" | "edit">(
    "view",
  );

  // Fetch data on mount
  useEffect(() => {
    dispatch(getAllUsers({ page: 1, limit: 100, search: "" }) as never);
    dispatch(getAllRoles() as never);
  }, [dispatch]);

  // Handle success/error toasts
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
  };

  const handleRoleChange = (
    userId: string,
    newRole: "STUDENT" | "MENTOR" | "ADMIN",
  ) => {
    dispatch(updateUserRole(userId, newRole) as never);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!canViewUsers) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-center h-96"
      >
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              You don't have permission to view user management
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all users, assign roles, and control access
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Total Users"
          value={stats.total}
          variant="primary"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-success" />}
          label="Active"
          value={stats.active}
          variant="success"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-red-500" />}
          label="Suspended"
          value={stats.suspended}
          variant="danger"
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search by name or email
                </label>
                <Input
                  placeholder="John Doe, john@example.com..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter by role
                </label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="MENTOR">Mentor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter by status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        {/* User */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src="" alt={user.fullName || ""} />
                              <AvatarFallback>
                                {(user.fullName || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {user.fullName || "N/A"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <PermissionGate permission={Permissions.SUSPEND_USER}>
                            <Select
                              value={user.role || "STUDENT"}
                              onValueChange={(newRole) =>
                                handleRoleChange(
                                  user.id,
                                  newRole as "STUDENT" | "MENTOR" | "ADMIN",
                                )
                              }
                              disabled={updating}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="MENTOR">Mentor</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.name}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </PermissionGate>
                          {!canSuspendUsers && (
                            <Badge variant="secondary">
                              {user.role || "STUDENT"}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setSelectedUserMode("view");
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setSelectedUserMode("edit");
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          initialMode={selectedUserMode}
        />
      )}
    </motion.div>
  );
}
