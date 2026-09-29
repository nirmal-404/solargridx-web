// Smart Solar Microgrid Trading System - Login Page
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CommonForm from "@/components/common/Form";
import { loginFormControls } from "@/config/FormControls";
import { validateForm } from "@/config/ValidateForm";
import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/utils/errorParser";

type LoginFormData = {
  email: string;
  password: string;
};

const initialLoginFormData: LoginFormData = {
  email: "",
  password: "",
};

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>(initialLoginFormData);
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validationResult = validateForm(loginFormControls, formData);
  const hasDirtyField = Object.keys(dirtyFields).length > 0;
  const isSubmitDisabled =
    isLoading || (hasDirtyField && !validationResult.isValid);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const validation = validateForm(loginFormControls, formData);
    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0];
      setErrorMessage(
        firstErrorMessage || "Please complete all required fields correctly.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      setErrorMessage(
        parseApiError(err, "Authentication failed. Check your credentials."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setFormData({ email: testEmail, password: testPass });
    setDirtyFields({ email: true, password: true });
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="SolarGridX Logo"
              className="h-28 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105 duration-200"
            />
          </div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Smart Solar Microgrid Energy Trading &amp; Booking Portal
          </p>
        </div>

        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your microgrid account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <CommonForm
              formControls={loginFormControls}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              buttonText={isLoading ? "Signing In..." : "Sign In"}
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

            <div className="pt-3 border-t">
              <p className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <KeyRound className="size-3 text-amber-500" />
                <span>Quick Test Accounts:</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() =>
                    handleQuickFill("admin@solargridx.local", "Admin@1234")
                  }
                >
                  Backoffice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() =>
                    handleQuickFill(
                      "operator@solargridx.local",
                      "Operator@1234",
                    )
                  }
                >
                  Operator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
