/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadgeDropdown } from "@/components/admin";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { usePermission } from "@/hooks/usePermission";
import { Permissions } from "@/lib/permissions";
import { UserDetailModal } from "../../components/admin/UserDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  Loader2,
  Download,
  Users,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react";
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  setFilters,
  clearSuccessMessage,
  clearError,
  type PaginationParams,
} from "@/store/slices/userManagementSlice";
import {
  TableActionButtons,
  DeleteConfirmDialog,
  PaginationControls,
  SearchFilterBar,
  StatCard,
} from "@/components/shared";

export function AdminStudents() {
  const dispatch = useAppDispatch();

  const { users = [], pagination, filters, loading = false, error, successMessage } =
    useAppSelector((state) => state.userManagement) || {};

  const canSuspend = usePermission(Permissions.SUSPEND_USER);

  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "SUSPENDED" | "all"
  >((filters.status as any) || "all");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [selectedUserMode, setSelectedUserMode] = useState<"view" | "edit">(
    "view",
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{
    userId: string;
    email: string;
  } | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch students
  useEffect(() => {
    const params: PaginationParams = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      search: searchQuery,
      status:
        statusFilter && statusFilter !== "all"
          ? (statusFilter as any)
          : undefined,
      role: "STUDENT",
      sort: filters.sort,
      order: filters.order,
    };

    dispatch(getAllUsers(params));
  }, [
    dispatch,
    filters.page,
    filters.limit,
    filters.sort,
    filters.order,
    searchQuery,
    statusFilter,
  ]);

  // Success toast
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  // Error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSearch = () => {
    dispatch(
      setFilters({
        search: searchQuery,
        page: 1,
      }),
    );
  };

  const handleFilterChange = () => {
    dispatch(
      setFilters({
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        page: 1,
      }),
    );
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    dispatch(
      updateUserStatus(
        userId,
        newStatus as "ACTIVE" | "INACTIVE" | "SUSPENDED",
      ),
    );
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setFilters({ page: newPage }));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      dispatch(deleteUser(deleteConfirm!.userId) as any);
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Manage students and track their progress
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export List
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Students"
          value={pagination.total}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          label="Active"
          value={users.filter((u) => u.status === "ACTIVE").length}
          variant="success"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-gray-600" />}
          label="Inactive"
          value={users.filter((u) => u.status === "INACTIVE").length}
        />
        <StatCard
          icon={<Ban className="w-5 h-5 text-red-600" />}
          label="Suspended"
          value={users.filter((u) => u.status === "SUSPENDED").length}
          variant="danger"
        />
      </div>
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        filterValue={statusFilter}
        onFilterChange={(value: any) => {
          setStatusFilter(value);
          handleFilterChange();
        }}
        filterLabel="All Status"
        filterOptions={[
          { value: "all", label: "All Status" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "SUSPENDED", label: "Suspended" },
        ]}
      />
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            No students found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Student
                  </th>

                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>

                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Joined
                  </th>

                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={
                              user.avatarMediaId
                                ? `/api/media/${user.avatarMediaId}`
                                : undefined
                            }
                          />

                          <AvatarFallback>
                            {user.fullName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "S"}
                          </AvatarFallback>
                        </Avatar>

                        {user.fullName || "Unknown"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <StatusBadgeDropdown
                        status={user.status}
                        onStatusChange={
                          canSuspend
                            ? (newStatus) => handleStatusChange(user.id, newStatus)
                            : () => {} // No-op if user lacks permission
                        }
                      />
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <TableActionButtons
                        onView={() => {
                          setSelectedUserId(user.id);
                          setSelectedUserMode("view");
                        }}
                        onEdit={() => {
                          setSelectedUserId(user.id);
                          setSelectedUserMode("edit");
                        }}
                        onDelete={() =>
                          setDeleteConfirm({
                            userId: user.id,
                            email: user.email,
                          })
                        }
                        viewTitle="View"
                        editTitle="Edit student details"
                        deleteTitle="Delete student"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {!loading && users.length > 0 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => {
            setSelectedUserId(null);
            setSelectedUserMode("view");
          }}
          initialMode={selectedUserMode}
        />
      )}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Student"
        itemName={deleteConfirm?.email || ""}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
