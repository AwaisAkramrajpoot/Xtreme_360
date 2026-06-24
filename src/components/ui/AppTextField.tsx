"use client";

import { useState } from "react";
import clsx from "clsx";
import { AppColors } from "@/constants/colors";
import { AppAsset } from "./AppAsset";
import { AppImages } from "@/constants/images";
import { formatDate } from "@/utils/helpers";

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

  const currentValue = value ?? internalValue;

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  const handleDateClick = async () => {
    if (onClick) onClick();
    if (isDateField) {
      const input = document.createElement("input");
      input.type = "date";
      input.onchange = () => {
        if (input.value) {
          const date = new Date(input.value);
          const formatted = formatDate(date, "dd/MM/yyyy");
          handleChange(formatted);
          onDateChange?.(date);
        }
      };
      input.click();
    }
  };

  const InputTag = maxLines && maxLines > 1 ? "textarea" : "input";

  return (
    <div className="w-full">
      {title && (
        <>
          <label
            className="block text-sm font-semibold text-black"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {title}
          </label>
          <div className="h-[5px]" />
        </>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">{prefix}</div>
        )}
        <InputTag
          name={name}
          value={currentValue}
          readOnly={readOnly || isDateField}
          onClick={isDateField ? handleDateClick : onClick}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={hintText}
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
            prefix ? "pl-12" : "px-4",
            isPasswordField || isDateField || suffix ? "pr-12" : "pr-4",
            maxLines && maxLines > 1 ? "py-2" : "h-12 flex items-center"
          )}
          style={{
            backgroundColor: fillColor,
            borderRadius,
            border: error ? "1px solid red" : "1px solid transparent",
            fontFamily: "var(--font-poppins)",
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.border = `1px solid ${AppColors.primary}`;
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.border = "1px solid transparent";
          }}
        />
        {isDateField && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <AppAsset src={AppImages.date} width={20} height={20} />
          </div>
        )}
        {isPasswordField && !suffix && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => setPasswordVisible(!passwordVisible)}
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
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
