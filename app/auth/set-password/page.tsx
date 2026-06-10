"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/shared/ui";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { changePassword } from "@/lib/api/client";
import { toast } from "sonner";
import { useFormik } from "formik";
import * as Yup from "yup";

const passwordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "New passwords do not match")
    .required("Confirm new password is required"),
});

export default function SetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: passwordSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await changePassword("", values.newPassword);
        // Refresh session to update must_change_password flag
        await refreshProfile();
        toast.success("Password set successfully!");
        router.push("/dashboard");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to set password");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen grid bg-white lg:grid-cols-[minmax(420px,60%)_1fr]">
      <section className="hidden bg-primary px-10 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-md">
          <div className="text-5xl mb-8">🔒</div>
          <h1 className="text-5xl font-bold leading-tight tracking-normal">Security First</h1>
          <p className="mt-6 text-xl font-medium">Please secure your account by setting a new password.</p>
        </div>
        <p className="text-sm font-medium">@2026 Devforge. All rights reserved.</p>
      </section>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DevForge[x]</h1>
            <p className="text-muted-foreground mt-1">Setup Your Account Password</p>
          </div>

          <Card className="shadow-lg border-0 shadow-slate-200/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Setup Password</CardTitle>
              <CardDescription>You must set a new password to access the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-10"
                  />
                  {formik.touched.newPassword && formik.errors.newPassword ? (
                    <div className="text-xs text-destructive">{formik.errors.newPassword}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-10"
                  />
                  {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                    <div className="text-xs text-destructive">{formik.errors.confirmPassword}</div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button type="submit" className="w-full h-10" disabled={loading}>
                    {loading ? "Setting password..." : "Set Password & Login"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => signOut().then(() => router.push("/auth/login"))}
                    disabled={loading}
                  >
                    Cancel & Logout
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
