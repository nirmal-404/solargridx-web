import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserPlus } from "lucide-react";
import { userService } from "@/services/userService";
import { parseApiError } from "@/utils/errorParser";
import CommonForm from "@/components/common/Form";
import type { CreateUserRequest, User } from "@/types/auth";
import { staffUserFormControls } from "@/config/FormControls";
import { validateForm } from "@/config/ValidateForm";

interface CreateStaffUserSheetProps {
  onCreated: (user: User) => void;
}

type StaffFormData = {
  role: "GridOperator" | "Backoffice";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  address: string;
  password: string;
};

const initialFormData: StaffFormData = {
  role: "GridOperator",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nic: "",
  address: "",
  password: "",
};

export function CreateStaffUserSheet({ onCreated }: CreateStaffUserSheetProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});

  const validationResult = validateForm(staffUserFormControls, formData);
  const hasDirtyField = Object.keys(dirtyFields).length > 0;
  const isSubmitDisabled =
    isSubmitting || (hasDirtyField && !validationResult.isValid);

  const resetForm = () => {
    setFormData(initialFormData);
    setDirtyFields({});
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const validation = validateForm(staffUserFormControls, formData);
    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0];
      setErrorMessage(
        firstErrorMessage || "Please complete all required fields correctly.",
      );
      return;
    }

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!firstName || !lastName || !email || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestPayload: CreateUserRequest = {
        firstName,
        lastName,
        email,
        password,
        phone: formData.phone.trim() || undefined,
        nic: formData.nic.trim() || undefined,
        address: formData.address.trim() || undefined,
        role: formData.role,
      };

      const newUser = await userService.createStaffUser(requestPayload);
      onCreated(newUser);
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, "Failed to create staff account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" size="sm" className="gap-2 text-xs h-9">
          <UserPlus className="size-3.5" />
          <span>Create Staff User Account</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="border-b pb-4 shrink-0">
          <SheetTitle className="text-base">Create Staff Account</SheetTitle>
          <SheetDescription className="text-xs">
            Add a new Grid Operator or Backoffice staff member.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-xs">
          {errorMessage && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">
              {errorMessage}
            </div>
          )}

          <CommonForm
            formControls={staffUserFormControls}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            buttonText={isSubmitting ? "Creating Account..." : "Create User"}
            isButtonDisabled={isSubmitDisabled}
            dirtyFields={dirtyFields}
            errors={validationResult.errors}
            onFieldChange={(fieldName) => {
              setDirtyFields((previous) => ({
                ...previous,
                [fieldName]: true,
              }));
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
