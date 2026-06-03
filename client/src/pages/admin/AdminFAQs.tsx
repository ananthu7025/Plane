/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { fetchAdminFAQs } from "@/store/slices/faqSlice";
import { FAQList } from "@/components/faqs/admin/FAQList";
import { usePermission } from "@/hooks/usePermission";
import { Permissions } from "@/lib/permissions";

export default function AdminFAQs() {
  const dispatch = useAppDispatch();
  const canManageFAQs = usePermission(Permissions.MANAGE_FAQS);

  useEffect(() => {
    if (!canManageFAQs) return;
    dispatch(fetchAdminFAQs() as any);
  }, [dispatch, canManageFAQs]);

  if (!canManageFAQs) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          You don't have permission to manage FAQs.
        </p>
      </div>
    );
  }

  return <FAQList />;
}
