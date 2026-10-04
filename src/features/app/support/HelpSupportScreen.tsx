"use client";

import { useCallback, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { AppColors } from "@/constants/colors";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/hooks/use-toast";
import { createSupportTicket, getMySupportTickets, type SupportTicket } from "@/services/support-api";
import { getApiErrorMessage } from "@/utils/api-error";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUS: Record<SupportTicket["status"], { label: string; bg: string; color: string }> = {
  open: { label: "Open", bg: "#E0F2FE", color: "#0277BD" },
  in_progress: { label: "In progress", bg: "#FFF3E0", color: "#E65100" },
  resolved: { label: "Resolved", bg: "#E8F5E9", color: "#2E7D32" },
  closed: { label: "Closed", bg: "#F1F2F5", color: "#5B6170" },
};

function NewTicketModal({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: typeof errors = {};
    if (!subject.trim()) next.subject = "Enter a subject";
    if (!description.trim()) next.description = "Describe the problem";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setSubmitError("");
    try {
      const { message } = await createSupportTicket({ subject: subject.trim(), description: description.trim(), priority: priority.toLowerCase(), phone: phone.trim() });
      onSaved(message);
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to submit ticket"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open onClose={onClose} title="New Support Ticket" titleIcon="support_agent" size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} saveLabel="Submit" isLoading={saving} />}>
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title="Subject" required hintText="e.g. Cannot access dashboard" value={subject} onChange={setSubject} error={errors.subject} maxLength={200} />
        <AppTextField title="Describe the problem" required hintText="What happened, and what did you expect?" value={description} onChange={setDescription} maxLines={5} error={errors.description} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppDropDown title="Priority" items={PRIORITIES} value={priority} onChange={setPriority} />
          <AppTextField title="Contact number" hintText="Optional" value={phone} onChange={setPhone} maxLength={30} />
        </div>
      </div>
    </AppModal>
  );
}

/** Utilities › Help & Support: raise tickets with the Xtreme 360 team and read their replies. */
export function HelpSupportScreen() {
  const loader = useCallback(() => getMySupportTickets(), []);
  const { data, loading, error, reload } = useAsyncData(loader, [] as SupportTicket[], "Failed to load your tickets");
  const [creating, setCreating] = useState(false);
  const { showToast, Toast } = useToast();

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="Help & Support" subtitle="Ask the Xtreme 360 team for help. Replies appear here." showBack />

      {loading && !data.length && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
      {error && (
        <div className="py-10 text-center text-sm text-red-500">
          {error}{" "}
          <button type="button" className="underline" onClick={reload}>Try again</button>
        </div>
      )}
      {!loading && !error && !data.length && (
        <div className="flex flex-col items-center gap-2 py-16 text-center" style={{ color: AppColors.grey }}>
          <span className="material-icons text-5xl" aria-hidden>support_agent</span>
          <p className="text-sm">No tickets yet. Tap + to contact support.</p>
        </div>
      )}

      <div className="space-y-3 pb-24">
        {data.map((t) => {
          const s = STATUS[t.status];
          return (
            <div key={t.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: AppColors.grey }}>#{t.ticket_code} · {new Date(t.created_at).toLocaleDateString()}</p>
                  <p className="font-semibold text-black">{t.subject}</p>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: AppColors.greyishBlack }}>{t.description}</p>
              {t.admin_response && (
                <div className="mt-3 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: "#EAF2EA" }}>
                  <p className="text-xs font-semibold" style={{ color: AppColors.primary }}>Reply from support</p>
                  <p className="whitespace-pre-wrap text-black">{t.admin_response}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FloatingActionButton onClick={() => setCreating(true)} />
      {creating && <NewTicketModal onClose={() => setCreating(false)} onSaved={(m) => { showToast(m); reload(); }} />}
      {Toast}
    </div>
  );
}
