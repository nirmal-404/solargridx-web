import type { FormEvent } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import type { FormControl } from "@/config/FormControls";

interface CommonFormProps<T extends Record<string, string | undefined>> {
  formControls: FormControl[];
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  buttonText?: string;
  isButtonDisabled?: boolean;
  isBtnDisabled?: boolean;
  dirtyFields?: Record<string, boolean>;
  errors?: Record<string, string>;
  onFieldChange?: (fieldName: string) => void;
}

function CommonForm<T extends Record<string, string | undefined>>({
  formControls,
  formData,
  setFormData,
  onSubmit,
  buttonText,
  isButtonDisabled,
  dirtyFields,
  errors,
  onFieldChange,
}: CommonFormProps<T>) {
  function renderInputsByComponentType(getControlItem: FormControl) {
    const value = formData[getControlItem.name] ?? "";
    const isDirty = !!dirtyFields?.[getControlItem.name];
    const fieldError = isDirty ? errors?.[getControlItem.name] : undefined;
    const invalidClassName = fieldError
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

    switch (getControlItem.componentType) {
      case "input":
        return (
          <>
            <Input
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.name}
              type={getControlItem.type ?? "text"}
              value={value}
              aria-invalid={Boolean(fieldError)}
              className={invalidClassName}
              onChange={(event) => {
                onFieldChange?.(getControlItem.name);
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                });
              }}
            />
            {fieldError && (
              <p className="mt-1 text-[10px] text-red-500">{fieldError}</p>
            )}
          </>
        );

      case "select":
        return (
          <>
            <Select
              onValueChange={(selectedValue) => {
                onFieldChange?.(getControlItem.name);
                setFormData({
                  ...formData,
                  [getControlItem.name]: selectedValue,
                });
              }}
              value={value}
            >
              <SelectTrigger
                className={`w-full ${invalidClassName}`}
                aria-invalid={Boolean(fieldError)}
              >
                <SelectValue placeholder={getControlItem.label} />
              </SelectTrigger>
              <SelectContent>
                {getControlItem.options?.map((optionItem) => (
                  <SelectItem key={optionItem.id} value={optionItem.id}>
                    {optionItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="mt-1 text-[10px] text-red-500">{fieldError}</p>
            )}
          </>
        );

      case "textarea":
        return (
          <>
            <Textarea
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.name}
              value={value}
              aria-invalid={Boolean(fieldError)}
              className={invalidClassName}
              onChange={(event) => {
                onFieldChange?.(getControlItem.name);
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                });
              }}
            />
            {fieldError && (
              <p className="mt-1 text-[10px] text-red-500">{fieldError}</p>
            )}
          </>
        );

      case "phoneInput":
        return (
          <>
            <Input
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.name}
              type="tel"
              value={value}
              aria-invalid={Boolean(fieldError)}
              className={invalidClassName}
              onChange={(event) => {
                onFieldChange?.(getControlItem.name);
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                });
              }}
            />
            {fieldError && (
              <p className="mt-1 text-[10px] text-red-500">{fieldError}</p>
            )}
          </>
        );

      default:
        return (
          <>
            <Input
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.name}
              type={getControlItem.type ?? "text"}
              value={value}
              aria-invalid={Boolean(fieldError)}
              className={invalidClassName}
              onChange={(event) => {
                onFieldChange?.(getControlItem.name);
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                });
              }}
            />
            {fieldError && (
              <p className="mt-1 text-[10px] text-red-500">{fieldError}</p>
            )}
          </>
        );
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-3">
        {formControls.map((controlItem) => (
          <div className="grid w-full gap-1.5" key={controlItem.name}>
            <Label className="mb-1">{controlItem.label}</Label>
            {renderInputsByComponentType(controlItem)}
          </div>
        ))}
      </div>
      <Button
        disabled={isButtonDisabled ?? false}
        type="submit"
        className="mt-2 w-full"
      >
        {buttonText || "Submit"}
      </Button>
    </form>
  );
}

export default CommonForm;
