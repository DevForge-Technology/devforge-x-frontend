"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AppShell } from "@/components/shared/app-shell";
import { updateProfile, changePassword } from "@/lib/api/client";
import type { Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const isVendor = profile?.role === "vendor";
  const assignedCompanies = profile?.assignedCompanies ?? [];
  const noCompany = isVendor && assignedCompanies.length === 0;
  const mustChangePassword = profile?.must_change_password === true;

  async function handleSaveProfile() {
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(name, email);
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      await refreshProfile();
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    }
    setChangingPassword(false);
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {noCompany && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              No workspace assigned. Contact your admin to get assigned to a company.
            </p>
          </div>
        )}

        {mustChangePassword && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-900">
              Set your own password before continuing to the rest of DevForge.
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>Update your name and email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" type="email" />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Role</Label>
              <Badge variant="secondary" className="capitalize">{profile?.role}</Badge>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {isVendor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Companies</CardTitle>
              <CardDescription>Companies you are assigned to as a vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No companies assigned yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {assignedCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      {company.logo ? (
                        <img src={company.logo} alt="" className="h-8 w-8 rounded" />
                      ) : (
                        <div
                          className="h-8 w-8 rounded flex items-center justify-center text-sm font-medium text-white"
                          style={{ backgroundColor: company.accent_color || "#0B5DF4" }}
                        >
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{company.name}</p>
                        {company.description && (
                          <p className="text-xs text-muted-foreground truncate">{company.description}</p>
                        )}
                      </div>
                      <Badge variant={company.status === "active" ? "default" : "secondary"}>
                        {company.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
