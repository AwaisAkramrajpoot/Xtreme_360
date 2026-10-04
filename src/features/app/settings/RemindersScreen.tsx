"use client";

import { AppColors } from "@/constants/colors";
import {
  SettingsLayout,
  SettingsSection,
  SettingsSelectRow,
  SettingsStepperRow,
  SettingsIcon,
  SettingsToggleRow,
  useSettingsScreen,
  useSettingsSection,
} from "./SettingsUi";

const FREQUENCIES = ["Once a Day", "Twice a Day", "Once a Week"] as const;

const BENEFITS = [
  { icon: "notifications_active", text: "Remind your parties" },
  { icon: "favorite", text: "Don't lose customers" },
  { icon: "trending_up", text: "Grow your business" },
];

function RemindersContent() {
  const { values, update, isBusy } = useSettingsSection("reminders");
  const { query } = useSettingsScreen();

  return (
    <>
      <SettingsSection title="Payment Reminder" icon="alarm">
        <SettingsToggleRow
          label="Self payment reminder"
          description="Get reminded about payments you are due to collect."
          value={values.selfPaymentReminder}
          busy={isBusy("selfPaymentReminder")}
          onChange={(v) => void update("selfPaymentReminder", v)}
        />
        <SettingsStepperRow
          label="Remind me for payment due more than"
          value={values.daysBeforeDue}
          suffix="days"
          min={0}
          max={90}
          disabled={!values.selfPaymentReminder}
          busy={isBusy("daysBeforeDue")}
          onChange={(v) => void update("daysBeforeDue", v)}
        />
        <SettingsSelectRow
          label="Reminder frequency"
          value={values.reminderFrequency}
          options={FREQUENCIES}
          disabled={!values.selfPaymentReminder}
          busy={isBusy("reminderFrequency")}
          onChange={(v) => void update("reminderFrequency", v)}
        />
      </SettingsSection>

      <SettingsSection title="Payment Reminder for Party" icon="forward_to_inbox">
        <SettingsToggleRow
          label="Send payment reminders to parties"
          description="Remind parties about their outstanding balance."
          value={values.partyPaymentReminder}
          busy={isBusy("partyPaymentReminder")}
          onChange={(v) => void update("partyPaymentReminder", v)}
        />
      </SettingsSection>

      <SettingsSection title="Service Reminders" icon="build_circle">
        <SettingsToggleRow
          label="Service reminders"
          description="Remind customers when a periodic service is due."
          value={values.serviceReminders}
          busy={isBusy("serviceReminders")}
          onChange={(v) => void update("serviceReminders", v)}
        />
        {!query.trim() && (
          <div className="px-4 py-3" style={{ borderColor: "#F0F0F0" }}>
            <p className="text-xs font-semibold text-black">Benefits of service reminders</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {BENEFITS.map((b) => (
                <div key={b.text} className="flex flex-col items-center text-center">
                  <SettingsIcon name={b.icon} />
                  <p className="mt-1.5 text-[11px]" style={{ color: AppColors.grey }}>
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SettingsSection>
    </>
  );
}

export function RemindersScreen() {
  return (
    <SettingsLayout title="Reminders">
      <RemindersContent />
    </SettingsLayout>
  );
}
