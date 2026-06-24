"use client";

import { useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { AddFormScreen } from "@/features/app/forms/AddFormScreens";

const tabs = ["Products", "Services", "Manufacturing", "Categories", "Units"];

export function CalendarScreen() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Calendar" showNotification showBack />
      <div className="p-4">
        <h2 className="text-lg font-bold text-center mb-4">{month}</h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2" style={{ color: AppColors.grey }}>
          {days.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - today.getDay() + 1;
            const isToday = day === today.getDate();
            return (
              <div
                key={i}
                className="aspect-square flex items-center justify-center text-sm rounded-full"
                style={{
                  backgroundColor: isToday ? AppColors.primary : "transparent",
                  color: isToday ? AppColors.white : day > 0 && day <= 31 ? AppColors.black : "transparent",
                }}
              >
                {day > 0 && day <= 31 ? day : ""}
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <p className="text-base font-bold mb-2">Today&apos;s Events</p>
          <div className="p-3 rounded-lg" style={{ backgroundColor: AppColors.bgColor2 }}>
            <p className="font-semibold">Team Meeting</p>
            <p className="text-sm" style={{ color: AppColors.grey }}>10:00 AM - 11:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function POSScreen() {
  const categories = ["All", "Beverages", "Snacks", "Electronics"];
  const [activeCategory, setActiveCategory] = useState("All");
  const items = [
    { name: "Coca Cola", price: "Rs. 100" },
    { name: "Lays Chips", price: "Rs. 50" },
    { name: "USB Cable", price: "Rs. 350" },
    { name: "Water Bottle", price: "Rs. 60" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="POS" showBack showSearch />
      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
            style={{
              backgroundColor: activeCategory === cat ? AppColors.primary : AppColors.bgColor2,
              color: activeCategory === cat ? AppColors.white : AppColors.black,
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 p-4 overflow-auto">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            className="p-4 rounded-lg text-left"
            style={{ backgroundColor: AppColors.bgColor2 }}
          >
            <p className="font-bold text-black">{item.name}</p>
            <p className="text-sm" style={{ color: AppColors.primary }}>{item.price}</p>
          </button>
        ))}
      </div>
      <div className="p-4 border-t" style={{ borderColor: AppColors.lightGrey }}>
        <div className="flex justify-between mb-2">
          <span>Total Items: 0</span>
          <span className="font-bold">Rs. 0</span>
        </div>
        <button type="button" className="w-full h-12 rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
          Checkout
        </button>
      </div>
    </div>
  );
}

export function PlansAndPricingScreen() {
  const plans = [
    { name: "Basic", price: "Rs. 999/mo", features: ["5 Users", "Basic Reports", "Email Support"] },
    { name: "Pro", price: "Rs. 2,499/mo", features: ["20 Users", "Advanced Reports", "Priority Support"] },
    { name: "Enterprise", price: "Rs. 4,999/mo", features: ["Unlimited Users", "All Features", "24/7 Support"] },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Plans & Pricing" showBack />
      <div className="flex-1 p-4 overflow-auto space-y-4">
        {plans.map((plan) => (
          <div key={plan.name} className="p-5 rounded-xl border" style={{ borderColor: AppColors.lightGrey }}>
            <h3 className="text-xl font-bold text-black">{plan.name}</h3>
            <p className="text-lg font-semibold mt-1" style={{ color: AppColors.primary }}>{plan.price}</p>
            <ul className="mt-3 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm flex items-center gap-2">
                  <span className="material-icons text-base" style={{ color: AppColors.primary }}>check</span>
                  {f}
                </li>
              ))}
            </ul>
            <button type="button" className="w-full h-11 mt-4 rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserManagementScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="User Management" showBack showSearch />
      <div className="p-5 space-y-3">
        {["Admin User", "Manager User", "Staff User"].map((user) => (
          <div key={user} className="p-4 rounded-lg flex justify-between items-center" style={{ backgroundColor: AppColors.bgColor2 }}>
            <div>
              <p className="font-bold text-black">{user}</p>
              <p className="text-sm" style={{ color: AppColors.grey }}>Active</p>
            </div>
            <span className="material-icons" style={{ color: AppColors.grey }}>more_vert</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImportBaseScreen({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title={title} showBack />
      <div className="flex-1 p-5 flex flex-col items-center justify-center">
        <div className="w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3" style={{ borderColor: AppColors.bordercolor }}>
          <span className="material-icons text-4xl" style={{ color: AppColors.grey }}>upload_file</span>
          <p className="text-sm" style={{ color: AppColors.grey }}>Click to upload or drag and drop</p>
          <p className="text-xs" style={{ color: AppColors.grey }}>CSV, XLS, XLSX</p>
        </div>
        <div className="h-6" />
        <button type="button" className="w-full h-14 rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
          Import
        </button>
      </div>
    </div>
  );
}

export function ProfileDetailScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Profile Detail" showBack showAvatar />
      <div className="p-5 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <p className="text-lg font-bold">John Doe</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>john.doe@example.com</p>
        </div>
      </div>
    </div>
  );
}

export function BusinessDetailScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Business Detail" showBack />
      <div className="p-5 space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold text-lg">Xtreme 360</p>
          <p className="text-sm mt-1" style={{ color: AppColors.grey }}>Retail Business</p>
          <p className="text-sm mt-2">123 Business Street, Karachi</p>
        </div>
      </div>
    </div>
  );
}

export function OtherIncomeScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Other Income" showBack showSearch />
      <div className="p-5">
        <div className="p-4 rounded-lg mb-3" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">Rental Income</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>Rs. 25,000</p>
        </div>
      </div>
    </div>
  );
}

export function RecycleBinScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Recycle Bin" showBack />
      <div className="p-5 text-center" style={{ color: AppColors.grey }}>
        <span className="material-icons text-5xl mb-2">delete_outline</span>
        <p>No deleted items</p>
      </div>
    </div>
  );
}

export function CloseFinancialYearsScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Close Financial Years" showBack />
      <div className="p-5 space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">FY 2024-2025</p>
          <p className="text-sm" style={{ color: AppColors.greenText }}>Active</p>
        </div>
        <button type="button" className="w-full h-12 rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
          Close Current Year
        </button>
      </div>
    </div>
  );
}

export function CashInHandScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Cash in Hand" showBack />
      <div className="p-5">
        <div className="p-6 rounded-xl text-center" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="text-sm" style={{ color: AppColors.grey }}>Current Balance</p>
          <p className="text-3xl font-bold mt-2" style={{ color: AppColors.primary }}>Rs. 1,50,000</p>
        </div>
      </div>
    </div>
  );
}

export function LoanAmountScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Loan Amount" showBack />
      <div className="p-5">
        <div className="p-4 rounded-lg" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">Business Loan</p>
          <p className="text-lg font-semibold mt-1" style={{ color: AppColors.redText }}>Rs. 5,00,000</p>
        </div>
      </div>
    </div>
  );
}

export function ChequeScreen() {
  const [tab, setTab] = useState(0);
  const tabs = ["Pending", "Deposited", "Bounced"];
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Cheques" showBack />
      <div className="flex border-b" style={{ borderColor: AppColors.lightGrey }}>
        {tabs.map((t, i) => (
          <button key={t} type="button" onClick={() => setTab(i)} className="flex-1 py-3 text-sm font-semibold" style={{ color: tab === i ? AppColors.primary : AppColors.grey, borderBottom: tab === i ? `2px solid ${AppColors.primary}` : "none" }}>
            {t}
          </button>
        ))}
      </div>
      <div className="p-5">
        <div className="p-4 rounded-lg" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">Cheque #12345</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>Rs. 50,000 | Due: 15/01/2024</p>
        </div>
      </div>
    </div>
  );
}

export function BankAccountScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Bank Account" showBack showSearch />
      <div className="p-5">
        <div className="p-4 rounded-lg mb-3" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">HBL - Main Account</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>****1234</p>
          <p className="text-lg font-semibold mt-1" style={{ color: AppColors.primary }}>Rs. 2,00,000</p>
        </div>
      </div>
    </div>
  );
}

export function TransferScreen({ title }: { title: string }) {
  return (
    <AddFormScreen
      title={title}
      submitLabel="Transfer"
      fields={[
        { title: "From Account", hintText: "Select account" },
        { title: "To Account", hintText: "Select account" },
        { title: "Amount", hintText: "0.00" },
        { title: "Date", hintText: "dd/mm/yyyy", isDate: true },
        { title: "Description", hintText: "Enter description", maxLines: 2 },
      ]}
    />
  );
}
