"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppColors } from "@/constants/colors";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AppModal
        open={open}
        onClose={() => close(false)}
        title={options?.title || "Confirm"}
        size="sm"
        footer={
          <div className="flex gap-3">
            <div className="flex-1">
              <AppButton
                text={options?.cancelLabel || "Cancel"}
                backgroundColor={AppColors.lightGrey}
                textColor={AppColors.black}
                onClick={() => close(false)}
              />
            </div>
            <div className="flex-1">
              <AppButton
                text={options?.confirmLabel || "Confirm"}
                backgroundColor={options?.danger ? AppColors.redText : AppColors.primary}
                onClick={() => close(true)}
              />
            </div>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-black" style={{ fontFamily: "var(--font-poppins)" }}>
          {options?.message}
        </p>
      </AppModal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
