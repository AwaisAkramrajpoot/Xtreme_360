"use client";

import { useState } from "react";
import axios from "axios";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { IconButton } from "@/components/ui/IconButton";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/constants/permissions";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/hooks/use-toast";
import { addTeamMember, getTeam, removeTeamMember, updateTeamMember, type TeamMember } from "@/services/team-api";
import { getApiErrorMessage } from "@/utils/api-error";

type MemberRole = Exclude<Role, "owner">;
const MEMBER_ROLES: MemberRole[] = ["manager", "staff"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "password" | "role", string>>;

function AddMemberModal({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Name is required";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email";
    if (password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSubmitError("");
    try {
      await addTeamMember({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password, role });
      onSaved(`${name.trim()} added as ${ROLE_LABELS[role].toLowerCase()}`);
      onClose();
    } catch (err) {
      const serverErrors = axios.isAxiosError(err) ? err.response?.data?.data?.errors : null;
      if (serverErrors) setErrors(serverErrors);
      setSubmitError(getApiErrorMessage(err, "Failed to add team member"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open onClose={onClose} title="Add Team Member" size="md" footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} saveLabel="Add Member" isLoading={saving} />}>
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title="Full Name" required hintText="e.g. Ahmed Khan" value={name} onChange={setName} error={errors.name} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Email" required type="email" hintText="Used to sign in" value={email} onChange={setEmail} error={errors.email} />
          <AppTextField title="Phone" type="tel" hintText="Optional" value={phone} onChange={setPhone} error={errors.phone} />
        </div>
        <AppTextField
          title="Temporary Password"
          required
          isPasswordField
          hintText="At least 8 characters"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-black">
            Role <span className="text-red-500">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MEMBER_ROLES.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors"
                style={{ borderColor: role === r ? AppColors.primary : AppColors.lightGrey, backgroundColor: role === r ? "#F1F5F1" : "white" }}
              >
                <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="mt-1 accent-[#588157]" />
                <span>
                  <span className="block text-sm font-semibold text-black">{ROLE_LABELS[r]}</span>
                  <span className="block text-xs" style={{ color: AppColors.grey }}>{ROLE_DESCRIPTIONS[r]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-xs" style={{ color: AppColors.grey }}>
          Share the email and temporary password with them. They can change it any time with “Forgot password”.
        </p>
      </div>
    </AppModal>
  );
}

export function TeamScreen() {
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const { data: team, loading, error, reload } = useAsyncData(getTeam, [] as TeamMember[], "Failed to load team");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const update = async (member: TeamMember, patch: Parameters<typeof updateTeamMember>[1], message: string) => {
    setBusy(member.user_id);
    try {
      await updateTeamMember(member.user_id, patch);
      showToast(message);
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to update"), "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (member: TeamMember) => {
    const ok = await confirm({
      title: "Remove team member",
      message: `Remove ${member.name}? They will be signed out and can no longer log in. Records they created stay in your business.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setBusy(member.user_id);
    try {
      await removeTeamMember(member.user_id);
      showToast(`${member.name} removed`);
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to remove"), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="User Management" subtitle="Give your team their own login with the right level of access" showBack />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {(["owner", "manager", "staff"] as Role[]).map((r) => (
          <div key={r} className="rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
            <p className="font-semibold text-black">{ROLE_LABELS[r]}</p>
            <p className="mt-1 text-xs" style={{ color: AppColors.grey }}>{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      {loading && !team.length && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
      {error && (
        <div className="flex flex-col items-center gap-3 py-10 text-sm text-red-500">
          <p>{error}</p>
          <button type="button" onClick={reload} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ backgroundColor: AppColors.primary }}>
            Retry
          </button>
        </div>
      )}

      <div className="space-y-3 pb-24 md:pb-6">
        {team.map((member) => {
          const isOwner = member.role === "owner";
          return (
            <div key={member.user_id} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey, opacity: member.is_active ? 1 : 0.65 }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ backgroundColor: AppColors.primary }}>
                {member.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-black">
                  {member.name}
                  {!member.is_active && <span className="ml-2 rounded-full bg-[#F0F0F0] px-2 py-0.5 text-xs font-medium">Inactive</span>}
                </p>
                <p className="truncate text-sm" style={{ color: AppColors.grey }}>
                  {member.email}
                  {member.phone ? ` · ${member.phone}` : ""}
                </p>
              </div>
              {isOwner ? (
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "#EAF2EA", color: AppColors.primary }}>Owner</span>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label={`Role for ${member.name}`}
                    value={member.role}
                    disabled={busy === member.user_id}
                    onChange={(e) => void update(member, { role: e.target.value as MemberRole }, `${member.name} is now ${e.target.value}`)}
                    className="h-9 rounded-lg border bg-white px-2 text-sm"
                    style={{ borderColor: AppColors.lightGrey }}
                  >
                    {MEMBER_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <AppSwitch
                      value={member.is_active}
                      disabled={busy === member.user_id}
                      ariaLabel={`${member.is_active ? "Deactivate" : "Activate"} ${member.name}`}
                      onChange={(v) => void update(member, { is_active: v }, `${member.name} ${v ? "activated" : "deactivated"}`)}
                    />
                    {member.is_active ? "Active" : "Inactive"}
                  </label>
                  <IconButton icon="person_remove" label={`Remove ${member.name}`} variant="delete" onClick={() => void remove(member)} />
                </div>
              )}
            </div>
          );
        })}
        {!loading && !error && team.length === 1 && (
          <p className="py-6 text-center text-sm" style={{ color: AppColors.grey }}>
            No team members yet. Tap + to give someone their own login.
          </p>
        )}
      </div>

      <FloatingActionButton onClick={() => setAdding(true)} />
      {adding && <AddMemberModal onClose={() => setAdding(false)} onSaved={(m) => { showToast(m); reload(); }} />}
      {Toast}
    </div>
  );
}
