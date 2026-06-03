import { useState } from "react";
import { GraduationCap, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserProfile, UpdateProfilePayload } from "@/store/slices/userManagementSlice";

const CAREER_GOALS = [
  "Commercial Pilot License (CPL)",
  "Airline Transport Pilot License (ATPL)",
  "Private Pilot License (PPL)",
] as const;

const TARGET_EXAMS = [
  "DGCA CPL Written Exam",
  "DGCA ATPL Written Exam",
  "DGCA PPL Written Exam",
] as const;

interface AcademicTabProps {
  profile: UserProfile;
  updating: boolean;
  onSave: (data: UpdateProfilePayload) => void;
}

export function AcademicTab({ profile, updating, onSave }: AcademicTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    qualification: profile.qualification ?? "",
    institution: profile.institution ?? "",
    careerGoal: profile.careerGoal ?? "",
    targetExam: profile.targetExam ?? "",
  });

  const handleSave = () => {
    onSave({
      qualification: form.qualification || undefined,
      institution: form.institution || undefined,
      careerGoal: form.careerGoal || undefined,
      targetExam: form.targetExam || undefined,
      enrolledSubjects: profile.enrolledSubjects,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      qualification: profile.qualification ?? "",
      institution: profile.institution ?? "",
      careerGoal: profile.careerGoal ?? "",
      targetExam: profile.targetExam ?? "",
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Academic Information
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Update Academic Info
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  placeholder="e.g. Bachelor of Science (Physics)"
                />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="e.g. Mumbai University"
                />
              </div>
              <div className="space-y-2">
                <Label>Career Goal</Label>
                <Select
                  value={form.careerGoal}
                  onValueChange={(v) => setForm({ ...form, careerGoal: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select career goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREER_GOALS.map((goal) => (
                      <SelectItem key={goal} value={goal}>
                        {goal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Exam</Label>
                <Select
                  value={form.targetExam}
                  onValueChange={(v) => setForm({ ...form, targetExam: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_EXAMS.map((exam) => (
                      <SelectItem key={exam} value={exam}>
                        {exam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updating}>
                <Save className="w-4 h-4 mr-1" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Qualification</p>
              <p className="font-medium mt-1">{profile.qualification || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Institution</p>
              <p className="font-medium mt-1">{profile.institution || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Career Goal</p>
              <p className="font-medium mt-1">{profile.careerGoal || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target Exam</p>
              <p className="font-medium mt-1">{profile.targetExam || "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-2">Enrolled Subjects</p>
              {profile.enrolledSubjects && profile.enrolledSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.enrolledSubjects.map((subject) => (
                    <Badge key={subject} variant="default">
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not set</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
