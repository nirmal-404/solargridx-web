// Smart Solar Microgrid Trading System - Registration Page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, SunMedium } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CommonForm from "@/components/common/Form";
import { registerFormControls } from "@/config/FormControls";
import { validateForm } from "@/config/ValidateForm";
import { authService } from "@/services/authService";
import { parseApiError } from "@/utils/errorParser";

type RegisterFormData = {
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

const initialRegisterFormData: RegisterFormData = {
  firstName: "",
  lastName: "",
  nic: "",
  email: "",
  phone: "",
  address: "",
  password: "",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>(
    initialRegisterFormData,
  );
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validationResult = validateForm(registerFormControls, formData);
  const hasDirtyField = Object.keys(dirtyFields).length > 0;
  const isSubmitDisabled =
    isLoading || (hasDirtyField && !validationResult.isValid);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateForm(registerFormControls, formData);
    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0];
      setErrorMessage(
        firstErrorMessage || "Please complete all required fields correctly.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nic: formData.nic.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        password: formData.password,
      });

      setSuccessMessage(
        "Your account has been created successfully. Redirecting to sign in...",
      );
      setFormData(initialRegisterFormData);
      setDirtyFields({});

      window.setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage(
        parseApiError(err, "Account creation failed. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <SunMedium className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Register Your Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Create your SolarGridX prosumer profile to access the trading
            platform
          </p>
        </div>

        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Create Account</CardTitle>
            <CardDescription className="text-xs">
              Fill in your details below to begin using the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <CommonForm
              formControls={registerFormControls}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              buttonText={isLoading ? "Creating Account..." : "Create Account"}
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

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>

            <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">Account review</p>
              <p className="mt-1">
                Your profile will be created in a pending state and must be
                activated by the Backoffice team before you can use the
                platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
