"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setError(null);
      setLoading(true);

      const { error: signInError, mustChangePassword } = await signIn(values.email, values.password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(mustChangePassword ? "/profile" : "/dashboard");
      }
    },
  });

  return (
    <div className="min-h-screen grid bg-white lg:grid-cols-[minmax(420px,60%)_1fr]">
      <section className="hidden bg-primary px-10 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-md">
          <div className="text-5xl mb-8">🚀</div>
          <h1 className="text-5xl font-bold leading-tight tracking-normal">Hello Devforger!!</h1>
          <p className="mt-6 text-xl font-medium">A place where technology meets standards!!</p>
        </div>
        <p className="text-sm font-medium">@2026 Devforge. All rights reserved.</p>
      </section>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DevForge[x]</h1>
            <p className="text-muted-foreground mt-1">Sign in to your workspace</p>
          </div>

          <Card className="shadow-lg border-0 shadow-slate-200/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-10"
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <div className="text-xs text-destructive">{formik.errors.email}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-10"
                  />
                  {formik.touched.password && formik.errors.password ? (
                    <div className="text-xs text-destructive">{formik.errors.password}</div>
                  ) : null}
                </div>
                <Button type="submit" className="w-full h-10" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
