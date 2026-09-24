import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  Check,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { parseApiError } from "@/utils/errorParser";
import CommonForm from "@/components/common/Form";
import { prosumerUserFormControls } from "@/config/FormControls";
import { validateForm } from "@/config/ValidateForm";
import type {
  CreateProsumerRequest,
  PaginatedProsumerResponse,
  User,
} from "@/types/auth";

type ProsumerFormData = {
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

const initialProsumerFormData: ProsumerFormData = {
  firstName: "",
  lastName: "",
  nic: "",
  email: "",
  phone: "",
  address: "",
  password: "",
};

function CreateProsumerSheet({
  onCreated,
}: {
  onCreated: (user: User) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ProsumerFormData>(
    initialProsumerFormData,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});

  const validationResult = validateForm(prosumerUserFormControls, formData);
  const hasDirtyField = Object.keys(dirtyFields).length > 0;
  const isSubmitDisabled =
    isSubmitting || (hasDirtyField && !validationResult.isValid);

  const resetForm = () => {
    setFormData(initialProsumerFormData);
    setDirtyFields({});
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const validation = validateForm(prosumerUserFormControls, formData);
    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0];
      setErrorMessage(
        firstErrorMessage || "Please complete all required fields correctly.",
      );
      return;
    }

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const nic = formData.nic.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!firstName || !lastName || !nic || !email || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestPayload: CreateProsumerRequest = {
        firstName,
        lastName,
        nic,
        email,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        password,
      };

      const newUser = await userService.createProsumer(requestPayload);
      onCreated(newUser);
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, "Failed to create prosumer account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" size="sm" className="gap-2 text-xs h-9">
          <UserPlus className="size-3.5" />
          <span>Create Prosumer Account</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="border-b pb-4 shrink-0">
          <SheetTitle className="text-base">Create Prosumer Account</SheetTitle>
          <SheetDescription className="text-xs">
            Add a new prosumer profile for the backoffice directory.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-xs">
          {errorMessage && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">
              {errorMessage}
            </div>
          )}

          <CommonForm
            formControls={prosumerUserFormControls}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            buttonText={
              isSubmitting ? "Creating Account..." : "Create Prosumer"
            }
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

export function ProsumerManagementPage() {
  const { isBackoffice } = useAuth();

  const [prosumerUsers, setProsumerUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Pending" | "Deactivated" | "DeactivationRequested"
  >("All");
  const [sortField, setSortField] = useState<"name" | "email" | "status">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [draftStatusFilter, setDraftStatusFilter] = useState(statusFilter);
  const [draftSortField, setDraftSortField] = useState(sortField);
  const [draftSortOrder, setDraftSortOrder] = useState(sortOrder);
  const [draftLimit, setDraftLimit] = useState(limit);
  const handleCreated = async () => {
    setSuccessMessage("Prosumer account successfully created.");
    setSearch("");
    setSearchInput("");
    setStatusFilter("All");
    setSortField("name");
    setSortOrder("asc");
    setPage(1);
    await refreshProsumerUsers(1, "", "All", "name", "asc", limit);
  };

  const refreshProsumerUsers = async (
    nextPage = page,
    nextSearch = search,
    nextStatus = statusFilter,
    nextSortField = sortField,
    nextSortOrder = sortOrder,
    nextLimit = limit,
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data: PaginatedProsumerResponse = await userService.getProsumers({
        search: nextSearch,
        status: nextStatus === "All" ? undefined : nextStatus,
        sortField: nextSortField,
        sortOrder: nextSortOrder,
        page: nextPage,
        limit: nextLimit,
      });

      setProsumerUsers(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, "Failed to load prosumer accounts."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = searchInput.trim();
    const timer = window.setTimeout(() => {
      if (trimmed.length >= 2 || trimmed.length === 0) {
        setSearch(trimmed);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isBackoffice) return;
    void refreshProsumerUsers(
      1,
      search,
      statusFilter,
      sortField,
      sortOrder,
      limit,
    );
  }, [isBackoffice, search, statusFilter, sortField, sortOrder, limit]);

  useEffect(() => {
    setDraftStatusFilter(statusFilter);
    setDraftSortField(sortField);
    setDraftSortOrder(sortOrder);
    setDraftLimit(limit);
  }, [statusFilter, sortField, sortOrder, limit]);

  const handleApplyFilters = () => {
    setStatusFilter(draftStatusFilter);
    setSortField(draftSortField);
    setSortOrder(draftSortOrder);
    setLimit(draftLimit);
    setPage(1);
    setShowFilters(false);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void refreshProsumerUsers(
      nextPage,
      search,
      statusFilter,
      sortField,
      sortOrder,
      limit,
    );
  };

  const handleStatusToggle = async (user: User) => {
    const nextStatus =
      user.accountStatus === "Active" ? "Deactivated" : "Active";
    try {
      await userService.updateProsumerStatus(user.id, nextStatus);
      await refreshProsumerUsers(
        page,
        search,
        statusFilter,
        sortField,
        sortOrder,
        limit,
      );
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, "Failed to update prosumer status."));
    }
  };

  if (!isBackoffice) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="size-12 text-destructive mb-3" />
        <h2 className="text-xl font-semibold text-foreground">
          Access Restricted
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Prosumer management is restricted to Backoffice administration
          personnel only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Prosumer Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create and manage Prosumer users with explicit filtering, sorting,
            and pagination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void refreshProsumerUsers(
                page,
                search,
                statusFilter,
                sortField,
                sortOrder,
                limit,
              )
            }
            disabled={isLoading}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh List</span>
          </Button>

          <CreateProsumerSheet onCreated={handleCreated} />
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        <Card className="border shadow-xs">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Prosumer Accounts</CardTitle>
                <CardDescription className="text-xs">
                  Search by first name, last name, email, NIC, or status.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{totalCount} total</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search name, email, NIC..."
                  className="h-9 pl-9 text-xs"
                />
              </div>

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters((current) => !current)}
                  className="h-9 gap-2 text-xs"
                >
                  <Filter className="size-3.5" />
                  <span>Filter &amp; Sort</span>
                </Button>

                {showFilters && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-70 rounded-xl border border-border bg-popover p-4 shadow-lg">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Status
                        </label>
                        <select
                          value={draftStatusFilter}
                          onChange={(event) =>
                            setDraftStatusFilter(
                              event.target.value as
                                | "All"
                                | "Active"
                                | "Pending"
                                | "Deactivated"
                                | "DeactivationRequested",
                            )
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="All">All statuses</option>
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Deactivated">Deactivated</option>
                          <option value="DeactivationRequested">
                            Deactivation requested
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Sort by
                        </label>
                        <select
                          value={draftSortField}
                          onChange={(event) =>
                            setDraftSortField(
                              event.target.value as "name" | "email" | "status",
                            )
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="name">Name</option>
                          <option value="email">Email</option>
                          <option value="status">Status</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Order
                        </label>
                        <select
                          value={draftSortOrder}
                          onChange={(event) =>
                            setDraftSortOrder(
                              event.target.value as "asc" | "desc",
                            )
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Page size
                        </label>
                        <select
                          value={draftLimit}
                          onChange={(event) =>
                            setDraftLimit(Number(event.target.value))
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value={5}>5 per page</option>
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                        </select>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyFilters}
                          className="h-8 text-xs"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading prosumers...</span>
              </div>
            ) : prosumerUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No prosumers found for this filter.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>NIC</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prosumerUsers.map((user) => (
                      <TableRow key={user.id} className="text-xs align-top">
                        <TableCell className="font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.nic ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.phone ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-44 text-muted-foreground">
                          {user.address ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                          >
                            {user.accountStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant={
                              user.accountStatus === "Active"
                                ? "destructive"
                                : "default"
                            }
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => void handleStatusToggle(user)}
                          >
                            {user.accountStatus === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between px-1 pb-2 text-xs text-muted-foreground">
                  <span>
                    Page {page} of {Math.max(totalPages, 1)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        page >= totalPages || totalPages === 0 || isLoading
                      }
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProsumerManagementPage;
