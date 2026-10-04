"use client";

import { useState } from "react";
import Link from "next/link";
import { AppColors } from "@/constants/colors";
import { useToast } from "@/hooks/use-toast";
import { getSuperAdminDashboard, reviewPayment, type DashboardData } from "@/services/super-admin-api";
import { ErrorState, Panel, PageHeader, Pill, SA, SAButton, StatCard, formatDate, formatMoney, formatMoneyShort, friendlyError, timeAgo, type Tone } from "./ui";
import { SUPER_ADMIN_ROUTES } from "./SuperAdminShell";
import { useLoader } from "./use-paged-list";

/** "+12% from last month", or a plain count when last month had none. */
function growth(current: number, previous: number) {
  if (!previous) return current ? `+${current} this month` : "No change";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% from last month`;
}

const ACTIVITY: Record<string, { icon: string; tone: Tone; label: string }> = {
  company_registered: { icon: "check_circle_outline", tone: "success", label: "success" },
  user_joined: { icon: "person_add_alt", tone: "info", label: "joined" },
  user_pending: { icon: "hourglass_empty", tone: "warning", label: "pending" },
  branch_added: { icon: "storefront", tone: "success", label: "branch" },
  payment_verified: { icon: "paid", tone: "success", label: "success" },
  payment_pending: { icon: "credit_card", tone: "warning", label: "warning" },
  payment_rejected: { icon: "money_off", tone: "danger", label: "alert" },
  license_assigned: { icon: "workspace_premium", tone: "success", label: "success" },
  ticket_opened: { icon: "support_agent", tone: "warning", label: "warning" },
  ticket_resolved: { icon: "task_alt", tone: "success", label: "success" },
};
const FALLBACK = { icon: "bolt", tone: "neutral" as Tone, label: "info" };

const TONE_COLOR: Record<Tone, string> = { success: "#2E7D32", info: "#0277BD", warning: "#E65100", danger: "#C2185B", neutral: "#5B6170" };

const TYPE_LABEL: Record<string, string> = { basic: "Basic", standard: "Standard", premium: "Premium", enterprise: "Enterprise" };

export function SuperAdminDashboardScreen() {
  const { data, loading, error, reload } = useLoader(getSuperAdminDashboard, "dashboard", "Failed to load the dashboard");
  const [verifying, setVerifying] = useState<number | null>(null);
  const { showToast, Toast } = useToast();

  const verify = async (id: number) => {
    setVerifying(id);
    try {
      showToast(await reviewPayment(id, "verified"));
      reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to verify payment"), "error");
    } finally {
      setVerifying(null);
    }
  };

  const t: DashboardData["totals"] | undefined = data?.totals;

  return (
    <>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Monitor and manage Xtreme 360"
        actions={<SAButton variant="outline" icon="refresh" onClick={() => reload()} loading={loading && Boolean(data)}>Refresh</SAButton>}
      />

      {error && !data ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon="apartment" label="Total Companies" value={t?.companies ?? 0} badge={t ? growth(t.companies_this_month, t.companies_last_month) : undefined} loading={!t} />
            <StatCard icon="workspace_premium" label="Active Licenses" value={t?.active_licenses ?? 0} badge={t ? growth(t.licenses_this_month, t.licenses_last_month) : undefined} loading={!t} />
            <StatCard icon="group" label="Total User" value={t?.users ?? 0} badge={t ? growth(t.users_this_month, t.users_last_month) : undefined} loading={!t} />
            <StatCard icon="pending_actions" label="Pending Verifications" value={t?.pending_payments ?? 0} badge={t ? `${t.urgent_payments} urgent` : undefined} badgeTone={t?.urgent_payments ? "danger" : "neutral"} loading={!t} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel
              title="Expiring Licenses"
              icon="schedule"
              iconColor="#F9A825"
              badge={data ? <Pill tone="warning">{data.expiring_licenses.filter((l) => l.days_left <= 3).length} Urgent</Pill> : undefined}
              action={<Link href={`${SUPER_ADMIN_ROUTES.licenses}?status=expiring`} className="text-xs font-medium" style={{ color: AppColors.primary }}>View all</Link>}
            >
              <ul className="space-y-2">
                {!data && Array.from({ length: 4 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-gray-50" />)}
                {data?.expiring_licenses.length === 0 && <li className="py-6 text-center text-sm" style={{ color: SA.muted }}>No licenses expiring soon</li>}
                {data?.expiring_licenses.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5" style={{ backgroundColor: "#F8F9FB" }}>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium" style={{ color: SA.text }}>{l.company_name}</p>
                      <p className="text-[11px]" style={{ color: SA.muted }}>Expires: {formatDate(l.expires_at)}</p>
                    </div>
                    <Pill tone={l.days_left <= 3 ? "danger" : l.days_left <= 7 ? "warning" : "neutral"}>{l.days_left}d</Pill>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Pending Payments" icon="attach_money" iconColor="#1565C0" badge={t ? <Pill tone="info">{t.pending_payments} Pending</Pill> : undefined}>
              <ul className="space-y-3">
                {!data && Array.from({ length: 2 }, (_, i) => <li key={i} className="h-24 animate-pulse rounded-lg bg-gray-50" />)}
                {data?.pending_payments.length === 0 && <li className="py-6 text-center text-sm" style={{ color: SA.muted }}>Nothing waiting for verification</li>}
                {data?.pending_payments.map((p) => (
                  <li key={p.id} className="rounded-lg border p-3" style={{ borderColor: SA.border }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium" style={{ color: SA.text }}>{p.company_name}</p>
                        <p className="text-xs" style={{ color: "#1565C0" }}>{formatMoney(p.amount)}</p>
                      </div>
                      {p.license_type && <span className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: SA.border }}>{TYPE_LABEL[p.license_type] ?? p.license_type}</span>}
                    </div>
                    <p className="mt-1 text-right text-[11px]" style={{ color: SA.muted }}>{timeAgo(p.created_at)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <SAButton icon="check_circle_outline" className="h-8 text-xs" loading={verifying === p.id} onClick={() => void verify(p.id)}>Verify</SAButton>
                      <Link href={`${SUPER_ADMIN_ROUTES.payments}?status=pending`} className="flex h-8 items-center justify-center rounded-md border text-xs" style={{ borderColor: SA.border, color: SA.text }}>Review</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Recent Activity">
              <ul className="space-y-4">
                {!data && Array.from({ length: 3 }, (_, i) => <li key={i} className="h-10 animate-pulse rounded-lg bg-gray-50" />)}
                {data?.activity.length === 0 && <li className="py-6 text-center text-sm" style={{ color: SA.muted }}>Nothing yet</li>}
                {data?.activity.map((a, i) => {
                  const meta = ACTIVITY[a.type] ?? FALLBACK;
                  return (
                    <li key={`${a.type}-${a.at}-${i}`} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${TONE_COLOR[meta.tone]}14`, color: TONE_COLOR[meta.tone] }}>
                        <span aria-hidden className="material-icons text-[18px]">{meta.icon}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-medium" style={{ color: SA.text }}>{a.title}</p>
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                        </div>
                        <p className="truncate text-xs" style={{ color: SA.muted }}>{a.detail}</p>
                        <p className="text-[11px]" style={{ color: "#A5A9B5" }}>{timeAgo(a.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          <Panel title="Revenue Overview" icon="trending_up" className="mt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "This Month", value: t?.revenue_month, bg: "#EAF7EE", border: "#BFE5CB", color: "#22A35A" },
                { label: "This Quarter", value: t?.revenue_quarter, bg: "#EEF2FB", border: "#C9D6F2", color: "#5B7A5A" },
                { label: "This Year", value: t?.revenue_year, bg: "#F6F7F9", border: SA.border, color: SA.text },
                { label: "Pending", value: t?.revenue_pending, bg: "#FFF6EA", border: "#F6DDB4", color: "#F29D1E" },
              ].map((card) => (
                <div key={card.label} className="rounded-lg border px-4 py-5 text-center" style={{ backgroundColor: card.bg, borderColor: card.border }}>
                  {t ? (
                    <p className="text-2xl font-semibold sm:text-3xl" style={{ color: card.color }} title={formatMoney(card.value)}>{formatMoneyShort(card.value)}</p>
                  ) : (
                    <span className="mx-auto block h-8 w-20 animate-pulse rounded bg-white/70" />
                  )}
                  <p className="mt-1 text-xs" style={{ color: SA.muted }}>{card.label}</p>
                </div>
              ))}
            </div>
          </Panel>
          {error && data && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </>
      )}
      {Toast}
    </>
  );
}
