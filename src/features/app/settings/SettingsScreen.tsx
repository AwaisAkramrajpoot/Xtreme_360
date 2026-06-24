"use client";

import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppTile } from "@/components/ui/AppTile";
import { AppBanner } from "@/components/ui/AppBanner";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { ExpansionSelectionTile } from "@/components/ui/ExpansionSelectionTile";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppColors } from "@/constants/colors";
import { settingsItems } from "@/constants/menu-data";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsScreen() {
  const router = useRouter();
  const [passcode, setPasscode] = useState(false);
  const [stockTransfer, setStockTransfer] = useState(true);
  const [backup, setBackup] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Settings" showBack showSearch />
      <div className="flex-1 overflow-auto py-4">
        {settingsItems.map((item, index) => (
          <AppTile
            key={item.title}
            title={item.title}
            leading={item.image}
            showArrow
            showNew={index === 0 || index === 1}
            bgColor={AppColors.primary}
            fgColor={AppColors.white}
            onClick={() => item.href && router.push(item.href)}
          />
        ))}
        <div className="h-4" />
        <div className="px-4">
          <ExpansionSelectionTile
            title="Security"
            widgetItems={[
              <div key="sec" className="px-4">
                <AppTile
                  title="Passcode/Fingerprint(if present)"
                  titleSuffix={<span className="material-icons text-black text-lg">info_outline</span>}
                  trailing={<AppSwitch value={passcode} onChange={setPasscode} />}
                  bgColor={AppColors.bgColor2}
                  showArrow={false}
                  customTrailing={<AppSwitch value={passcode} onChange={setPasscode} />}
                />
              </div>,
            ]}
          />
        </div>
        <div className="h-4" />
        <div className="px-4">
          <ExpansionSelectionTile
            title="Multifirm"
            widgetItems={[
              <div key="mf" className="px-4">
                <AppTile title="Multifirm Settings" titleSuffix={<span className="material-icons text-black text-lg">info_outline</span>} showArrow bgColor={AppColors.bgColor2} />
              </div>,
            ]}
          />
        </div>
        <div className="h-4" />
        <div className="px-4">
          <ExpansionSelectionTile
            title="Stock Transfer Between Stores"
            widgetItems={[
              <div key="st" className="px-4">
                <AppTile
                  title="Store management & Stock transfer"
                  titleSuffix={<span className="material-icons text-black text-lg">info_outline</span>}
                  customTrailing={<AppSwitch value={stockTransfer} onChange={setStockTransfer} />}
                  bgColor={AppColors.bgColor2}
                />
              </div>,
            ]}
          />
        </div>
        <div className="h-4" />
        <div className="px-4">
          <ExpansionSelectionTile
            title="Backup"
            widgetItems={[
              <div key="bk" className="px-4">
                <AppTile
                  title="Backup Settings"
                  titleSuffix={<span className="material-icons text-black text-lg">info_outline</span>}
                  customTrailing={<AppSwitch value={backup} onChange={setBackup} />}
                  bgColor={AppColors.bgColor2}
                />
              </div>,
            ]}
          />
        </div>
        <div className="h-4" />
        <div className="px-4"><AppBanner title="Transaction Prefixes" /></div>
        <div className="h-4" />
        <div className="px-4 space-y-4">
          <AppTextField title="Sale Invoice Prefix" hintText="SI-" defaultValue="SI-" />
          <AppTextField title="Purchase Bill Prefix" hintText="PB-" defaultValue="PB-" />
          <AppTextField title="Quotation Prefix" hintText="QT-" defaultValue="QT-" />
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
