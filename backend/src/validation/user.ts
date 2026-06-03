import { z } from 'zod';

const CAREER_GOALS = [
  'Commercial Pilot License (CPL)',
  'Airline Transport Pilot License (ATPL)',
  'Private Pilot License (PPL)',
] as const;

const TARGET_EXAMS = [
  'DGCA CPL Written Exam',
  'DGCA ATPL Written Exam',
  'DGCA PPL Written Exam',
] as const;

export const userSchemas = {
  updateProfile: z.object({
    fullName: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().regex(/^[0-9\-\+\(\)\s]*$/, 'Invalid phone number format').max(20).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    qualification: z.string().max(255).optional(),
    institution: z.string().max(255).optional(),
    careerGoal: z.enum(CAREER_GOALS).optional(),
    targetExam: z.enum(TARGET_EXAMS).optional(),
    enrolledSubjects: z.array(z.string().max(100)).max(20).optional(),
  }).strict(),

  getPublicProfile: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),

  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
};
