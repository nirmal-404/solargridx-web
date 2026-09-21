import type { FormControl } from "./FormControls";

export function validateForm(
  controls: FormControl[],
  formData: Record<string, unknown>,
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const control of controls) {
    if (!control.validation) continue;

    const value = formData[control.name] ?? "";
    const result = control.validation.safeParse(value);

    if (!result.success) {
      errors[control.name] = result.error.issues[0]?.message ?? "Invalid value";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default validateForm;
