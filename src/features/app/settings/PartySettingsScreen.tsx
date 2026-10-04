"use client";

import {
  SettingsLayout,
  SettingsSection,
  SettingsToggleRow,
  useSettingsSection,
} from "./SettingsUi";

function PartySettingsContent() {
  const { values, update, isBusy } = useSettingsSection("party");

  return (
    <>
      <SettingsSection title="Party Details" icon="badge" description="Fields shown on the Add / Edit Party form">
        <SettingsToggleRow
          label="NTN Number"
          description="Capture the party's National Tax Number (NTN)."
          value={values.tinNumber}
          busy={isBusy("tinNumber")}
          onChange={(v) => void update("tinNumber", v)}
        />
        <SettingsToggleRow
          label="Party Grouping"
          description="Organise parties into categories."
          value={values.partyGrouping}
          busy={isBusy("partyGrouping")}
          onChange={(v) => void update("partyGrouping", v)}
        />
        <SettingsToggleRow
          label="Party Shipping Address"
          description="Keep a separate shipping address; used as the delivery address on Delivery Notes."
          value={values.partyShippingAddress}
          busy={isBusy("partyShippingAddress")}
          onChange={(v) => void update("partyShippingAddress", v)}
        />
      </SettingsSection>

      <SettingsSection title="Engagement" icon="loyalty">
        <SettingsToggleRow
          label="Invite parties to add themselves"
          description="Share a link so parties can enter their own details."
          value={values.inviteParties}
          busy={isBusy("inviteParties")}
          onChange={(v) => void update("inviteParties", v)}
        />
        <SettingsToggleRow
          label="Loyalty Points"
          description="Reward repeat customers with points on sales."
          value={values.loyaltyPoints}
          busy={isBusy("loyaltyPoints")}
          onChange={(v) => void update("loyaltyPoints", v)}
        />
      </SettingsSection>
    </>
  );
}

export function PartySettingsScreen() {
  return (
    <SettingsLayout title="Party Settings">
      <PartySettingsContent />
    </SettingsLayout>
  );
}
