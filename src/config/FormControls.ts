import { z } from "zod";

export type FormControlOption = {
  id: string;
  label: string;
};

export type FormControl = {
  name: string;
  label: string;
  placeholder?: string;
  componentType: "input" | "select" | "textarea" | "phoneInput";
  type?: string;
  options?: FormControlOption[];
  id?: string;
  validation?: z.ZodTypeAny;
};

export const loginFormControls: FormControl[] = [
  {
    name: "email",
    label: "Email address",
    placeholder: "name@example.com",
    componentType: "input",
    type: "email",
    validation: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),
  },
  {
    name: "password",
    label: "Password",
    placeholder: "",
    componentType: "input",
    type: "password",
    validation: z.string().min(1, "Password is required."),
  },
];

export const staffUserFormControls: FormControl[] = [
  {
    name: "role",
    label: "Account Role *",
    componentType: "select",
    validation: z.enum(["GridOperator", "Backoffice"], {
      message: "Please select a valid account role.",
    }),
    options: [
      { id: "GridOperator", label: "Grid Operator" },
      { id: "Backoffice", label: "Backoffice" },
    ],
  },
  {
    name: "firstName",
    label: "First Name *",
    placeholder: "e.g. Jane",
    componentType: "input",
    type: "text",
    validation: z.string().trim().min(1, "First name is required."),
  },
  {
    name: "lastName",
    label: "Last Name *",
    placeholder: "e.g. Doe",
    componentType: "input",
    type: "text",
    validation: z.string().trim().min(1, "Last name is required."),
  },
  {
    name: "email",
    label: "Email Address *",
    placeholder: "staff@solargridx.com",
    componentType: "input",
    type: "email",
    validation: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),
  },
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "+94771234567",
    componentType: "phoneInput",
    validation: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => !value || value.length >= 9,
        "Phone number is too short.",
      ),
  },
  {
    name: "nic",
    label: "NIC",
    placeholder: "200212312312",
    componentType: "input",
    type: "text",
    validation: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || value.length >= 8, "NIC is too short."),
  },
  {
    name: "address",
    label: "Address",
    placeholder: "123 Main Street",
    componentType: "textarea",
    validation: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || value.length >= 5, "Address is too short."),
  },
  {
    name: "password",
    label: "Password (min 8 chars) *",
    placeholder: "••••••••",
    componentType: "input",
    type: "password",
    validation: z
      .string()
      .min(8, "Password must be at least 8 characters long."),
  },
];

export const registerFormControls: FormControl[] = [
  {
    name: "firstName",
    label: "First name",
    placeholder: "e.g. Kamal",
    componentType: "input",
    type: "text",
    validation: z.string().trim().min(1, "First name is required."),
  },
  {
    name: "lastName",
    label: "Last name",
    placeholder: "e.g. Silva",
    componentType: "input",
    type: "text",
    validation: z.string().trim().min(1, "Last name is required."),
  },
  {
    name: "nic",
    label: "NIC",
    placeholder: "200112345678",
    componentType: "input",
    type: "text",
    validation: z.string().trim().min(1, "NIC is required."),
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "you@example.com",
    componentType: "input",
    type: "email",
    validation: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),
  },
  {
    name: "phone",
    label: "Phone number",
    placeholder: "+94771234567",
    componentType: "phoneInput",
    validation: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => !value || value.length >= 9,
        "Phone number is too short.",
      ),
  },
  {
    name: "address",
    label: "Address",
    placeholder: "123 Main Street",
    componentType: "textarea",
    validation: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || value.length >= 5, "Address is too short."),
  },
  {
    name: "password",
    label: "Password",
    placeholder: "",
    componentType: "input",
    type: "password",
    validation: z
      .string()
      .min(8, "Password must be at least 8 characters long."),
  },
];
