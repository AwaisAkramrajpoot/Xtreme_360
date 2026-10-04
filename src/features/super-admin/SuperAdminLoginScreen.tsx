"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppButton } from "@/components/ui/AppButton";
import { hasLiveSuperAdminSession, useSuperAdminAuthStore } from "@/stores/super-admin-auth-store";
import { superAdminLogin } from "@/services/super-admin-api";
import { friendlyError } from "./ui";
import { SUPER_ADMIN_ROUTES } from "./SuperAdminShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only in-panel paths are allowed as a post-login destination. */
const safeNext = (next: string | null) =>
  next && next.startsWith("/super-admin/") && !next.startsWith(SUPER_ADMIN_ROUTES.login) ? next : SUPER_ADMIN_ROUTES.dashboard;

export function SuperAdminLoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const hasHydrated = useSuperAdminAuthStore((s) => s.hasHydrated);
  const token = useSuperAdminAuthStore((s) => s.token);
  const expiresAt = useSuperAdminAuthStore((s) => s.expiresAt);
  const setSession = useSuperAdminAuthStore((s) => s.setSession);
  // e.g. "Your session has expired" — cleared by the next successful sign-in.
  const notice = useSuperAdminAuthStore((s) => (s.hasHydrated ? s.notice : null));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const signedIn = hasHydrated && hasLiveSuperAdminSession({ token, expiresAt });

  useEffect(() => {
    if (signedIn) router.replace(next);
  }, [signedIn, next, router]);

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Enter your password";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const session = await superAdminLogin(email, password);
      setPassword("");
      setSession(session.access_token, session.admin, session.expires_in);
      router.replace(next);
    } catch (error) {
      setFormError(friendlyError(error, "Sign in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (signedIn) return null;

  return (
    <AuthSplitLayout
      title="Super Admin Sign In"
      subtitle="Restricted area. Business users sign in from the regular login page."
      showBack={false}
    >
      <div className="mx-auto w-full max-w-md">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {notice && !formError && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#FFF8E6", color: "#8A6200" }} role="status">
              {notice}
            </p>
          )}
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <AppTextField
            title="Email"
            hintText="admin@company.com"
            value={email}
            onChange={setEmail}
            type="email"
            name="email"
            error={errors.email}
          />
          <AppTextField
            title="Password"
            hintText="Enter password"
            value={password}
            onChange={setPassword}
            isPasswordField
            name="password"
            error={errors.password}
          />
          <AppButton text={loading ? "Signing in…" : "Sign In"} isLoading={loading} type="submit" disabled={loading} />
        </form>
      </div>
    </AuthSplitLayout>
  );
}
