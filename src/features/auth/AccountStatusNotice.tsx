"use client";

/** Why a signed-up account cannot sign in yet: awaiting Super Admin approval, or rejected. */
export function AccountStatusNotice({ status, message }: { status: "pending" | "rejected"; message: string }) {
  const pending = status === "pending";
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${
        pending ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <span aria-hidden className={`material-icons text-[22px] ${pending ? "text-amber-500" : "text-red-500"}`}>
        {pending ? "hourglass_top" : "block"}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{pending ? "Awaiting admin approval" : "Account not approved"}</p>
        <p className="mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
