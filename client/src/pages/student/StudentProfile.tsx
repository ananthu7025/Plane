import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  getOwnProfile,
  updateOwnProfile,
  clearSuccessMessage,
  clearError,
  type UpdateProfilePayload,
} from "@/store/slices/userManagementSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { AcademicTab } from "@/components/profile/AcademicTab";
import { PaymentsTab } from "@/components/profile/PaymentsTab";
import { NotificationsTab } from "@/components/profile/NotificationsTab";
import { SecurityTab } from "@/components/profile/SecurityTab";
import { useToast } from "@/hooks/use-toast";

export default function StudentProfile() {
  const dispatch = useAppDispatch();
  const { ownProfile, ownProfileLoading, updating, updateError, successMessage } =
    useAppSelector((state) => state.userManagement);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(getOwnProfile() as any);
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast({ title: "Profile updated", description: successMessage });
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, toast, dispatch]);

  useEffect(() => {
    if (updateError) {
      toast({ title: "Update failed", description: updateError, variant: "destructive" });
      dispatch(clearError());
    }
  }, [updateError, toast, dispatch]);

  const handleSave = (data: UpdateProfilePayload) => {
    dispatch(updateOwnProfile(data) as any);
  };

  if (ownProfileLoading || !ownProfile) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <ProfileCard profile={ownProfile} updating={updating} onSave={handleSave} />

      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="academic">Academic Info</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="academic">
          <AcademicTab profile={ownProfile} updating={updating} onSave={handleSave} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
