"use client";

import { useId, useRef, useState } from "react";
import clsx from "clsx";
import { AppColors } from "@/constants/colors";
import { AppAsset } from "./AppAsset";
import { AppImages } from "@/constants/images";
import { DatePickerPopover } from "./DatePickerPopover";

interface AppTextFieldProps {
  title?: string;
  hintText?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onDateChange?: (date: Date) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  maxLength?: number;
  validator?: (value: string) => string | undefined;
  borderRadius?: number;
  borderColor?: string;
  fillColor?: string;
  maxLines?: number;
  isDateField?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
  isPasswordField?: boolean;
  type?: string;
  name?: string;
  error?: string;
}

export function AppTextField({
  title,
  hintText,
  value,
  defaultValue,
  onChange,
  onDateChange,
  prefix,
  suffix,
  maxLength,
  borderRadius = 6,
  fillColor = AppColors.inputFill,
  maxLines,
  isDateField,
  readOnly,
  onClick,
  isPasswordField,
  type,
  name,
  error,
}: AppTextFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [dateOpen, setDateOpen] = useState(false);
  const fieldId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);

  const currentValue = value ?? internalValue;
  const canPickDate = Boolean(isDateField) && !readOnly;

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  const openDatePicker = () => {
    onClick?.();
    if (!canPickDate) return;
    setDateOpen(true);
  };

  const InputTag = maxLines && maxLines > 1 ? "textarea" : "input";

  return (
    <div className="w-full">
      {title && (
        <label
          htmlFor={fieldId}
          className="mb-[5px] block text-sm font-semibold text-black"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          {title}
        </label>
      )}

      <div className="relative" ref={anchorRef}>
        {prefix && (
          <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
            {prefix}
          </div>
        )}

        <InputTag
          id={fieldId}
          name={name}
          value={currentValue}
          readOnly={readOnly || isDateField}
          onClick={canPickDate ? openDatePicker : onClick}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={hintText ?? (isDateField ? "dd/mm/yyyy" : undefined)}
          maxLength={maxLength}
          type={
            isPasswordField
              ? passwordVisible
                ? "text"
                : "password"
              : type ?? "text"
          }
          rows={maxLines}
          className={clsx(
            "w-full text-sm text-black outline-none",
            prefix ? "pl-12" : "pl-4",
            isPasswordField || isDateField || suffix ? "pr-12" : "pr-4",
            maxLines && maxLines > 1 ? "py-2.5" : "h-12",
            canPickDate ? "cursor-pointer" : ""
          )}
          style={{
            backgroundColor: fillColor,
            borderRadius,
            border: error
              ? "1px solid red"
              : dateOpen
                ? `1px solid ${AppColors.primary}`
                : "1px solid transparent",
            fontFamily: "var(--font-poppins)",
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.border = `1px solid ${AppColors.primary}`;
          }}
          onBlur={(e) => {
            if (!error && !dateOpen) e.currentTarget.style.border = "1px solid transparent";
          }}
        />

        {isDateField && (
          <button
            type="button"
            tabIndex={canPickDate ? 0 : -1}
            disabled={!canPickDate}
            aria-label="Open date picker"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDatePicker();
            }}
            className={clsx(
              "absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md",
              canPickDate ? "cursor-pointer hover:bg-black/5" : "cursor-default opacity-60"
            )}
          >
            <AppAsset src={AppImages.date} width={20} height={20} />
          </button>
        )}

        {isPasswordField && !suffix && (
          <button
            type="button"
            className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center"
            onClick={() => setPasswordVisible(!passwordVisible)}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            <span className="material-icons text-xl" style={{ color: AppColors.grey }}>
              {passwordVisible ? "visibility" : "visibility_off"}
            </span>
          </button>
        )}

        {suffix && !isDateField && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {canPickDate && (
        <DatePickerPopover
          open={dateOpen}
          anchorEl={anchorRef.current}
          value={currentValue}
          onClose={() => setDateOpen(false)}
          onSelect={(formatted, date) => {
            handleChange(formatted);
            if (formatted) {
              onDateChange?.(date);
            }
          }}
        />
      )}
    </div>
  );
}
