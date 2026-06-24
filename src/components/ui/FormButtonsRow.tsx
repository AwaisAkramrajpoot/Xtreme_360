import { AppButton } from "./AppButton";
import { AppColors } from "@/constants/colors";

interface FormButtonsRowProps {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function FormButtonsRow({
  onCancel,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isLoading,
}: FormButtonsRowProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <AppButton
          text={cancelLabel}
          backgroundColor={AppColors.lightGrey}
          textColor={AppColors.black}
          onClick={onCancel}
        />
      </div>
      <div className="flex-1">
        <AppButton text={saveLabel} isLoading={isLoading} onClick={onSave} />
      </div>
    </div>
  );
}
