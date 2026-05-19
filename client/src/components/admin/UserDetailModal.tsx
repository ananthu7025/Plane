/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { getUserById, updateUserProfile } from "@/store/slices/userManagementSlice";
import { InputText } from "@/components/ui/input-text";
import { InputTextarea } from "@/components/ui/input-textarea";
import { Button } from "@/components/ui/button";

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
  initialMode?: "view" | "edit";
}

export function UserDetailModal({ userId, onClose, initialMode = "view" }: UserDetailModalProps) {
  const dispatch = useAppDispatch();
  const { selectedUser, selectedUserLoading, updating } = useAppSelector(
    (state) => state.userManagement
  );
  const [isEditing, setIsEditing] = useState(initialMode === "edit");

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      phone: "",
      city: "",
      country: "",
    },
  });

  // Fetch user details when userId changes
  useEffect(() => {
    if (userId) {
      dispatch(getUserById(userId));
    }
  }, [userId, dispatch]);

  // Update form when selectedUser data loads
  useEffect(() => {
    if (selectedUser && !selectedUserLoading) {
      console.log("📦 Full selectedUser object:", selectedUser);
      const formData = {
        fullName: selectedUser.fullName || "",
        bio: selectedUser.bio || "",
        phone: selectedUser.phone || "",
        city: selectedUser.city || "",
        country: selectedUser.country || "",
      };
      console.log("🔄 Populating form with user data:", formData);
      form.reset(formData);
    }
  }, [selectedUser, selectedUserLoading]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    if (!userId) return;

    dispatch(
      updateUserProfile(userId, {
        fullName: data.fullName,
        bio: data.bio,
        phone: data.phone,
        city: data.city,
        country: data.country,
      }) as any
    );

    // Close edit mode on success
    setIsEditing(false);
  };

  if (!userId) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e: any) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit User" : "User Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {selectedUserLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : selectedUser ? (
          <div className="p-6 space-y-6">
            {!isEditing ? (
              // View Mode
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedUser.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Full Name
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {selectedUser.fullName || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Role
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {selectedUser.role}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Status
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {selectedUser.status}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Reputation Score
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {selectedUser.reputationScore || 0}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Bio
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedUser.bio || "Not set"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Phone
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {selectedUser.phone || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        City
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {selectedUser.city || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Country
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedUser.country || "Not set"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Joined
                      </label>
                      <p className="text-lg text-gray-900 mt-1">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedUser.lastLogin && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Last Login
                        </label>
                        <p className="text-lg text-gray-900 mt-1">
                          {new Date(selectedUser.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              // Edit Mode
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <InputText
                  hookForm={form}
                  field="fullName"
                  label="Full Name"
                  labelMandatory
                  type="text"
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />

                <InputTextarea
                  hookForm={form}
                  field="bio"
                  label="Bio"
                  placeholder="Enter bio"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputText
                    hookForm={form}
                    field="phone"
                    label="Phone"
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                  <InputText
                    hookForm={form}
                    field="city"
                    label="City"
                    type="text"
                    placeholder="Enter city"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>

                <InputText
                  hookForm={form}
                  field="country"
                  label="Country"
                  type="text"
                  placeholder="Enter country"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />

                {/* Form Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No user data available</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
