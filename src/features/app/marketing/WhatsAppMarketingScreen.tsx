"use client";

import { useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { useAsyncData } from "@/hooks/use-async-data";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { getParties, type PartyRecord } from "@/services/party-api";

const MAX_MESSAGE = 1000;

/** Pakistani local numbers (03xx…) → international 923xx…; other numbers keep their digits. */
function toWhatsAppNumber(raw?: string | null) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 11) return `92${digits.slice(1)}`;
  if (digits.length < 10) return null;
  return digits;
}

const personalise = (template: string, party: PartyRecord, businessName: string) =>
  template.replace(/\{name\}/gi, party.party_name).replace(/\{business\}/gi, businessName);

export function WhatsAppMarketingScreen() {
  const businessName = useSessionProfileStore((s) => s.business?.name) || "our shop";
  const { data: parties, loading, error, reload } = useAsyncData(getParties, [] as PartyRecord[], "Failed to load parties");
  const [message, setMessage] = useState("Assalam o Alaikum {name}! New stock has arrived at {business}. Visit us or reply to order.");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sent, setSent] = useState<Set<number>>(new Set());

  const reachable = useMemo(() => parties.filter((p) => toWhatsAppNumber(p.mobile_number) && p.is_active !== false), [parties]);
  const unreachable = parties.length - reachable.length;
  const types = useMemo(() => ["All", ...Array.from(new Set(reachable.map((p) => p.party_type).filter(Boolean) as string[]))], [reachable]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reachable.filter(
      (p) =>
        (typeFilter === "All" || p.party_type === typeFilter) &&
        (!q || [p.party_name, p.mobile_number, p.city].some((v) => v && v.toLowerCase().includes(q)))
    );
  }, [reachable, search, typeFilter]);

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s);
      for (const p of visible) {
        if (allVisibleSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });

  const recipients = reachable.filter((p) => selected.has(p.id));
  const preview = recipients[0] ? personalise(message, recipients[0], businessName) : personalise(message, { id: 0, party_name: "Customer" }, businessName);
  const messageError = !message.trim() ? "Write a message first" : message.length > MAX_MESSAGE ? `Keep it under ${MAX_MESSAGE} characters` : "";

  const openChat = (party: PartyRecord) => {
    const number = toWhatsAppNumber(party.mobile_number);
    if (!number || messageError) return;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(personalise(message, party, businessName))}`, "_blank", "noopener");
    setSent((s) => new Set(s).add(party.id));
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title="WhatsApp Marketing"
        subtitle="Send a personalised message to your customers on WhatsApp"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search parties"
      />

      <div className="grid gap-4 pb-10 lg:grid-cols-5">
        <section className="space-y-3 self-start rounded-2xl border bg-white p-4 lg:col-span-2 lg:p-5" style={{ borderColor: AppColors.lightGrey }}>
          <label htmlFor="wa-message" className="block text-sm font-semibold text-black">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="wa-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border p-3 text-sm outline-none focus:border-[#588157]"
            style={{ borderColor: messageError ? "#EF4444" : AppColors.lightGrey }}
          />
          <div className="flex justify-between text-xs" style={{ color: messageError ? "#EF4444" : AppColors.grey }}>
            <span>{messageError || "Use {name} and {business} to personalise."}</span>
            <span>{message.length}/{MAX_MESSAGE}</span>
          </div>
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "#E7F6DE" }}>
            <p className="mb-1 text-xs font-semibold" style={{ color: AppColors.grey }}>Preview</p>
            <p className="whitespace-pre-wrap text-black">{preview}</p>
          </div>
          <p className="text-xs" style={{ color: AppColors.grey }}>
            Each “Send” opens WhatsApp with the message ready — press send there. WhatsApp doesn&apos;t allow sending to many people automatically.
          </p>
        </section>

        <section className="space-y-3 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: typeFilter === t ? AppColors.primary : AppColors.lightGrey,
                    color: typeFilter === t ? AppColors.white : AppColors.greyishBlack,
                    backgroundColor: typeFilter === t ? AppColors.primary : "white",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button type="button" onClick={toggleAll} disabled={!visible.length} className="text-sm font-semibold disabled:opacity-40" style={{ color: AppColors.primary }}>
              {allVisibleSelected ? "Clear selection" : `Select all (${visible.length})`}
            </button>
          </div>

          {loading && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
          {error && (
            <p className="text-sm text-red-500">
              {error}{" "}
              <button type="button" className="underline" onClick={reload}>Retry</button>
            </p>
          )}
          {!loading && !error && !reachable.length && (
            <p className="rounded-2xl border bg-white px-4 py-10 text-center text-sm" style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
              No active parties with a mobile number yet. Add mobile numbers in Party to message them here.
            </p>
          )}

          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: AppColors.lightGrey }}>
            {visible.map((party) => (
              <div key={party.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "#F0F0F0" }}>
                <input
                  type="checkbox"
                  checked={selected.has(party.id)}
                  onChange={() => toggle(party.id)}
                  aria-label={`Select ${party.party_name}`}
                  className="h-4 w-4 accent-[#588157]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-black">{party.party_name}</p>
                  <p className="truncate text-xs" style={{ color: AppColors.grey }}>
                    {party.mobile_number}
                    {party.party_type ? ` · ${party.party_type}` : ""}
                  </p>
                </div>
                {selected.has(party.id) && (
                  <button
                    type="button"
                    disabled={Boolean(messageError)}
                    onClick={() => openChat(party)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: sent.has(party.id) ? AppColors.grey : "#25D366" }}
                  >
                    <span className="material-icons text-[16px]" aria-hidden>{sent.has(party.id) ? "done" : "send"}</span>
                    {sent.has(party.id) ? "Opened" : "Send"}
                  </button>
                )}
              </div>
            ))}
          </div>
          {recipients.length > 0 && (
            <p className="text-sm" style={{ color: AppColors.grey }}>
              {sent.size ? `${[...sent].filter((id) => selected.has(id)).length} of ${recipients.length} opened` : `${recipients.length} selected`}
            </p>
          )}
          {unreachable > 0 && (
            <p className="text-xs" style={{ color: AppColors.grey }}>
              {unreachable} {unreachable === 1 ? "party is" : "parties are"} hidden (inactive or no valid mobile number).
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
