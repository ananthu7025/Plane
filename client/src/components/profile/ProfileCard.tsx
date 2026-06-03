import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, Edit, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile, UpdateProfilePayload } from "@/store/slices/userManagementSlice";

interface ProfileCardProps {
  profile: UserProfile;
  updating: boolean;
  onSave: (data: UpdateProfilePayload) => void;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatJoinDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileCard({ profile, updating, onSave }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.fullName ?? "",
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    bio: profile.bio ?? "",
  });

  const handleSave = () => {
    onSave({
      fullName: form.name || undefined,
      phone: form.phone || undefined,
      city: form.city || undefined,
      bio: form.bio || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: profile.fullName ?? "",
      phone: profile.phone ?? "",
      city: profile.city ?? "",
      bio: profile.bio ?? "",
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updating}>
                <Save className="w-4 h-4 mr-1" />
                {updating ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9999999999"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Mumbai"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                placeholder="Tell us a little about yourself"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <Avatar className="w-32 h-32 text-2xl">
            <AvatarImage
              src={profile.avatarMediaId ? `/api/media/${profile.avatarMediaId}` : undefined}
            />
            <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{profile.fullName ?? "—"}</h2>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-1 italic">{profile.bio}</p>
                )}
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{profile.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{profile.city || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm">Joined {formatJoinDate(profile.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <Badge variant="default">{profile.role ?? "Student"}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
