import { type ReactNode } from "react";
import { ROUTES } from "./constants";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import { AdminRoles } from "@/pages/admin/AdminRoles";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { AdminStudents } from "@/pages/admin/AdminStudents";
import { UserManagement } from "@/pages/admin/UserManagement";
import CommunityFeed from "@/pages/community/CommunityFeed";
import { AdminCommunity } from "@/pages/admin/AdminCommunity";
import { AdminLayout } from "@/components/layout/AdminLayout";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import { StudentLayout } from "@/components/layout/StudentLayout";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import EmailVerificationPage from "@/pages/auth/EmailVerificationPage";
import Letters from "@/pages/student/Letters";
import AdminLetters from "@/pages/admin/AdminLetters";
import Newsletters from "@/pages/student/Newsletters";
import AdminNewsletters from "@/pages/admin/AdminNewsletters";
import AdminBlogs from "@/pages/admin/AdminBlogs";
import AdminFAQs from "@/pages/admin/AdminFAQs";
import AdminFeedback from "@/pages/admin/AdminFeedback";
import StudentBlogs from "@/pages/student/StudentBlogs";
import StudentFeedback from "@/pages/student/StudentFeedback";
import StudentProfile from "@/pages/student/StudentProfile";

export interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  protected?: boolean;
  authOnly?: boolean;
  requiredRole?: "STUDENT" | "ADMIN";
}

export const authRoutes: RouteConfig[] = [
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
    authOnly: true,
  },
  {
    path: ROUTES.SIGNUP,
    element: <SignUpPage />,
    authOnly: true,
  },
  {
    path: ROUTES.VERIFY_EMAIL,
    element: <EmailVerificationPage />,
    authOnly: true,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
    authOnly: true,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
    authOnly: true,
  },
  {
    path: ROUTES.ADMIN_LOGIN,
    element: <LoginPage portalType="admin" />,
    authOnly: true,
  },
];

export const studentRoutes: RouteConfig[] = [
  {
    path: ROUTES.STUDENT_DASHBOARD,
    element: <StudentLayout />,
    protected: true,
    requiredRole: "STUDENT",
    children: [
      {
        path: "",
        element: <StudentDashboard />,
      },
      {
        path: "community",
        element: <CommunityFeed />,
      },
      {
        path: "letters",
        element: <Letters />,
      },
      {
        path: "newsletters",
        element: <Newsletters />,
      },
      {
        path: "blogs",
        element: <StudentBlogs />,
      },
      {
        path: "blogs/:blogId",
        element: <StudentBlogs />,
      },
      {
        path: "profile",
        element: <StudentProfile />,
      },
      {
        path: "feedback",
        element: <StudentFeedback />,
      },
    ],
  },
];

export const adminRoutes: RouteConfig[] = [
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: <AdminLayout />,
    protected: true,
    requiredRole: "ADMIN",
    children: [
      {
        path: "",
        element: <AdminDashboard />,
      },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "students",
        element: <AdminStudents />,
      },
      {
        path: "roles",
        element: <AdminRoles />,
      },
      {
        path: "community",
        element: <AdminCommunity />,
      },
      {
        path: "letters",
        element: <AdminLetters />,
      },
      {
        path: "newsletters",
        element: <AdminNewsletters />,
      },
      {
        path: "blogs",
        element: <AdminBlogs />,
      },
      {
        path: "faqs",
        element: <AdminFAQs />,
      },
      {
        path: "feedback",
        element: <AdminFeedback />,
      },
    ],
  },
];

export const notFoundRoute: RouteConfig = {
  path: ROUTES.NOT_FOUND,
  element: <NotFoundPage />,
};
