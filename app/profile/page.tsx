"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AppShell } from "@/components/shared/app-shell";
import { updateProfile, changePassword } from "@/lib/api/client";
import type { Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, Input } from "@/shared/ui";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useFormik } from "formik";
import * as Yup from "yup";

const profileSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
});

const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "New passwords do not match")
    .required("Confirm new password is required"),
});

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const isVendor = profile?.role === "vendor";
  const assignedCompanies = profile?.assignedCompanies ?? [];
  const noCompany = isVendor && assignedCompanies.length === 0;
  const mustChangePassword = profile?.must_change_password === true;

  const profileForm = useFormik({
    initialValues: {
      name: profile?.name || "",
      email: profile?.email || "",
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await updateProfile(values.name, values.email);
        await refreshProfile();
        toast.success("Profile updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update profile");
      }
      setSaving(false);
    },
  });

  const passwordForm = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { resetForm }) => {
      setChangingPassword(true);
      try {
        await changePassword(values.currentPassword, values.newPassword);
        await refreshProfile();
        toast.success("Password changed successfully");
        resetForm();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to change password");
      }
      setChangingPassword(false);
    },
  });

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
          <CardContent>
            <form onSubmit={profileForm.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profileForm.values.name}
                  onChange={profileForm.handleChange}
                  onBlur={profileForm.handleBlur}
                  placeholder="Your name"
                />
                {profileForm.touched.name && profileForm.errors.name ? (
                  <div className="text-xs text-destructive">{profileForm.errors.name}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={profileForm.values.email}
                  onChange={profileForm.handleChange}
                  onBlur={profileForm.handleBlur}
                  placeholder="Your email"
                  type="email"
                />
                {profileForm.touched.email && profileForm.errors.email ? (
                  <div className="text-xs text-destructive">{profileForm.errors.email}</div>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Role</Label>
                <div>
                  <Badge variant="secondary" className="capitalize">{profile?.role}</Badge>
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.values.currentPassword}
                  onChange={passwordForm.handleChange}
                  onBlur={passwordForm.handleBlur}
                  type="password"
                />
                {passwordForm.touched.currentPassword && passwordForm.errors.currentPassword ? (
                  <div className="text-xs text-destructive">{passwordForm.errors.currentPassword}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.values.newPassword}
                  onChange={passwordForm.handleChange}
                  onBlur={passwordForm.handleBlur}
                  type="password"
                />
                {passwordForm.touched.newPassword && passwordForm.errors.newPassword ? (
                  <div className="text-xs text-destructive">{passwordForm.errors.newPassword}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.values.confirmPassword}
                  onChange={passwordForm.handleChange}
                  onBlur={passwordForm.handleBlur}
                  type="password"
                />
                {passwordForm.touched.confirmPassword && passwordForm.errors.confirmPassword ? (
                  <div className="text-xs text-destructive">{passwordForm.errors.confirmPassword}</div>
                ) : null}
              </div>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </form>
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
