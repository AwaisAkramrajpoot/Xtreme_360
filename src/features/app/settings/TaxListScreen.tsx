"use client";

import { useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";

type TaxRate = {
  id: number;
  name: string;
  rate: string;
};

export function TaxListScreen() {
  const [activeTab, setActiveTab] = useState<"rates" | "groups">("rates");
  const [rates, setRates] = useState<TaxRate[]>([{ id: 1, name: "Amir", rate: "3%" }]);
  const [showModal, setShowModal] = useState(false);
  const [draftName, setDraftName] = useState("Other");
  const [draftRate, setDraftRate] = useState("");

  const handleSave = () => {
    const trimmedName = draftName.trim();
    const trimmedRate = draftRate.trim();
    if (!trimmedName || !trimmedRate) {
      setShowModal(false);
      return;
    }
    setRates((prev) => [{ id: Date.now(), name: trimmedName, rate: `${trimmedRate}%` }, ...prev]);
    setShowModal(false);
    setDraftName("Other");
    setDraftRate("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppAppBar title="Tax List" showBack showSearch />
      <div className="flex-1 px-3 pt-2">
        <div className="grid grid-cols-2 overflow-hidden rounded-md border" style={{ borderColor: AppColors.lightGrey }}>
          <button
            type="button"
            onClick={() => setActiveTab("rates")}
            className="py-2 text-sm"
            style={{
              backgroundColor: activeTab === "rates" ? AppColors.primary : AppColors.bgColor2,
              color: activeTab === "rates" ? AppColors.white : AppColors.black,
            }}
          >
            Tax Rates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className="py-2 text-sm"
            style={{
              backgroundColor: activeTab === "groups" ? AppColors.primary : AppColors.bgColor2,
              color: activeTab === "groups" ? AppColors.white : AppColors.black,
            }}
          >
            Tax Groups
          </button>
        </div>

        {activeTab === "rates" ? (
          <div className="mt-3 space-y-2">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ backgroundColor: AppColors.bgColor2 }}
              >
                <span className="text-sm text-black">{rate.name}</span>
                <span className="text-sm" style={{ color: AppColors.grey }}>
                  {rate.rate}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-md px-3 py-5 text-center text-sm" style={{ backgroundColor: AppColors.bgColor2, color: AppColors.grey }}>
            No tax groups yet.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg md:bottom-8"
        style={{ backgroundColor: AppColors.primary }}
      >
        <span className="material-icons text-white">add</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-sm bg-white p-5">
            <h3 className="mb-4 text-3xl font-semibold text-black">Add Tax Rate</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-black">Tax Rate Name</label>
              <label className="text-sm font-semibold text-black">Rate</label>
              <select
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="col-span-1 h-10 rounded-md border px-3 text-sm outline-none"
                style={{ borderColor: AppColors.lightGrey, backgroundColor: AppColors.bgColor2 }}
              >
                <option value="Other">Other</option>
                <option value="GST">GST</option>
                <option value="VAT">VAT</option>
              </select>
              <input
                value={draftRate}
                onChange={(e) => setDraftRate(e.target.value)}
                placeholder="e.g. 3"
                className="col-span-1 h-10 rounded-md border px-3 text-sm outline-none"
                style={{ borderColor: AppColors.lightGrey, backgroundColor: AppColors.bgColor2 }}
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-6">
              <button type="button" onClick={() => setShowModal(false)} className="text-sm text-black">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="text-sm text-black">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

