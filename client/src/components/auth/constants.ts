import {
  BookOpen,
  Users,
  Award,
  Sparkles,
} from "lucide-react";

export const AUTH_HERO_HIGHLIGHTS = [
  {
    icon: BookOpen,
    text: "15,000+ MCQ questions with expert explanations",
  },
  {
    icon: Users,
    text: "1-on-1 mentorship from certified pilots",
  },
  {
    icon: Award,
    text: "DGCA exam prep with 95% pass rate",
  },
  {
    icon: Sparkles,
    text: "Join 2,000+ aspiring pilots already on board",
  },
];

export const AUTH_TESTIMONIAL = {
  text: "Plane & Prop transformed my DGCA preparation. The MCQ bank and mentorship made all the difference — I cleared my exams on the first attempt!",
  author: "Arjun Kapoor",
  initials: "AK",
  title: "CPL Holder, Class of 2024",
};

export const AUTH_FORM_MESSAGES = {
  LOGIN: {
    TITLE: "Welcome Back, Aviator",
    SUBTITLE_STUDENT: "Sign in to your Student Portal",
    SUBTITLE_ADMIN: "Sign in to your Admin Portal",
  },
  SIGNUP: {
    TITLE: "Create Account",
    SUBTITLE: "Join thousands of aspiring pilots in our community",
  },
  VERIFY_EMAIL: {
    TITLE: "Verify Your Email",
    SUBTITLE: "We've sent a 6-digit code to",
  },
  FORGOT_PASSWORD: {
    TITLE: "Reset Your Password",
    SUBTITLE:
      "Enter your email address and we'll send you a link to reset your password",
    SUCCESS_TITLE: "Check Your Email",
    SUCCESS_SUBTITLE: "We've sent a password reset link to",
    STEPS: [
      "Check your email inbox",
      "Click the reset password link",
      "Create a new password",
      "Sign in with your new password",
    ],
  },
  RESET_PASSWORD: {
    TITLE: "Create New Password",
    SUBTITLE: "Enter your new password below",
    SUCCESS_TITLE: "Password Reset Successful",
    SUCCESS_SUBTITLE:
      "Your password has been reset. You can now sign in with your new password.",
  },
};
