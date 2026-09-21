// Smart Solar Microgrid Trading System - Staff User Management Page
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { parseApiError } from "@/utils/errorParser";
import type {
  User,
  CreateUserRequest,
  PaginatedStaffResponse,
} from "@/types/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Users,
  UserPlus,
  ShieldAlert,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

export function CreateUserPage() {
  const { isBackoffice } = useAuth();

  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "All" | "Backoffice" | "GridOperator"
  >("All");
  const [draftRoleFilter, setDraftRoleFilter] = useState<
    "All" | "Backoffice" | "GridOperator"
  >("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Pending" | "Deactivated" | "DeactivationRequested"
  >("All");
  const [draftStatusFilter, setDraftStatusFilter] = useState<
    "All" | "Active" | "Pending" | "Deactivated" | "DeactivationRequested"
  >("All");
  const [sortField, setSortField] = useState<
    "name" | "email" | "role" | "status"
  >("name");
  const [draftSortField, setDraftSortField] = useState<
    "name" | "email" | "role" | "status"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [draftSortOrder, setDraftSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [draftLimit, setDraftLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<"GridOperator" | "Backoffice">(
    "GridOperator",
  );

  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();

    const timer = window.setTimeout(() => {
      if (trimmed.length >= 2 || trimmed.length === 0) {
        setSearch(trimmed);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (filterButtonRef.current?.contains(target)) {
        return;
      }

      if (filterPanelRef.current && !filterPanelRef.current.contains(target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyFilters = () => {
    setRoleFilter(draftRoleFilter);
    setStatusFilter(draftStatusFilter);
    setSortField(draftSortField);
    setSortOrder(draftSortOrder);
    setLimit(draftLimit);
    setPage(1);
    setShowFilters(false);
  };

  const loadStaffUsers = async (
    nextPage = page,
    nextSearch = search,
    nextRole = roleFilter,
    nextStatus = statusFilter,
    nextSortField = sortField,
    nextSortOrder = sortOrder,
    nextLimit = limit,
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data: PaginatedStaffResponse = await userService.getStaffUsers({
        search: nextSearch,
        role: nextRole === "All" ? undefined : nextRole,
        status: nextStatus === "All" ? undefined : nextStatus,
        sortField: nextSortField,
        sortOrder: nextSortOrder,
        page: nextPage,
        limit: nextLimit,
      });

      setStaffUsers(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, "Failed to load staff accounts."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isBackoffice) return;

    setPage(1);
    loadStaffUsers(
      1,
      search,
      roleFilter,
      statusFilter,
      sortField,
      sortOrder,
      limit,
    );
  }, [
    isBackoffice,
    search,
    roleFilter,
    statusFilter,
    sortField,
    sortOrder,
    limit,
  ]);

  if (!isBackoffice) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="size-12 text-destructive mb-3" />
        <h2 className="text-xl font-semibold text-foreground">
          Access Restricted
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Staff user creation is restricted to Backoffice administration
          personnel only.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        nic: nic.trim() || undefined,
        address: address.trim() || undefined,
        role,
      };

      const newUser = await userService.createStaffUser(requestPayload);
      setSuccessMessage(
        `Staff user ${newUser.firstName} ${newUser.lastName} (${newUser.role}) successfully created.`,
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setNic("");
      setAddress("");
      setRole("GridOperator");

      await loadStaffUsers(1, "", "All", "All", "name", "asc", limit);
      setSearch("");
      setSearchInput("");
      setRoleFilter("All");
      setDraftRoleFilter("All");
      setStatusFilter("All");
      setDraftStatusFilter("All");
      setSortField("name");
      setDraftSortField("name");
      setSortOrder("asc");
      setDraftSortOrder("asc");
      setPage(1);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, "Failed to create staff account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              User Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administrative portal to create and oversee Grid Operator and
            Backoffice staff accounts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            loadStaffUsers(
              page,
              search,
              roleFilter,
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              <CardTitle className="text-base">Create Staff Account</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Add a new Grid Operator or Backoffice account with contact
              details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs">
                  Account Role *
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "GridOperator" | "Backoffice")
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="GridOperator">Grid Operator</option>
                  <option value="Backoffice">Backoffice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="e.g. Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@solargridx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="+94771234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nic" className="text-xs">
                  NIC
                </Label>
                <Input
                  id="nic"
                  type="text"
                  placeholder="200212312312"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs">
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password (min 8 chars) *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-xs h-9 gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    <span>Create User</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border shadow-xs">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Staff Members</CardTitle>
                <CardDescription className="text-xs">
                  Search staff by name, email, NIC, role, or status.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{totalCount} total</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="px-4 pb-2">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search name, email, NIC..."
                    className="h-9 pl-9 text-xs"
                  />
                </div>

                <div className="relative">
                  <Button
                    ref={filterButtonRef}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters((current) => !current)}
                    className="h-9 gap-2 text-xs"
                  >
                    <Filter className="size-3.5" />
                  </Button>

                  {showFilters && (
                    <div
                      ref={filterPanelRef}
                      className="absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] rounded-xl border border-border bg-popover p-4 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Role
                          </label>
                          <select
                            value={draftRoleFilter}
                            onChange={(e) =>
                              setDraftRoleFilter(
                                e.target.value as
                                  | "All"
                                  | "Backoffice"
                                  | "GridOperator",
                              )
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="All">All roles</option>
                            <option value="Backoffice">Backoffice</option>
                            <option value="GridOperator">Grid Operator</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Status
                          </label>
                          <select
                            value={draftStatusFilter}
                            onChange={(e) =>
                              setDraftStatusFilter(
                                e.target.value as
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
                            onChange={(e) =>
                              setDraftSortField(
                                e.target.value as
                                  | "name"
                                  | "email"
                                  | "role"
                                  | "status",
                              )
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="role">Role</option>
                            <option value="status">Status</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Order
                          </label>
                          <select
                            value={draftSortOrder}
                            onChange={(e) =>
                              setDraftSortOrder(
                                e.target.value as "asc" | "desc",
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
                            onChange={(e) =>
                              setDraftLimit(Number(e.target.value))
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value={1}>1 per page</option>
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
                            onClick={applyFilters}
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
            </div>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading staff directory...</span>
              </div>
            ) : staffUsers && staffUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No staff accounts found for this filter.
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
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffUsers &&
                      staffUsers.map((user) => (
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
                          <TableCell className="max-w-[180px] text-muted-foreground">
                            {user.address ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "Backoffice"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px] uppercase font-semibold"
                            >
                              {user.role === "GridOperator"
                                ? "Grid Operator"
                                : user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                            >
                              {user.accountStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between px-4 pb-4 pt-2 text-xs text-muted-foreground">
                  <span>
                    Page {page} of {Math.max(totalPages, 1)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => {
                        const nextPage = Math.max(1, page - 1);
                        setPage(nextPage);
                        loadStaffUsers(
                          nextPage,
                          search,
                          roleFilter,
                          statusFilter,
                          sortField,
                          sortOrder,
                        );
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        page >= totalPages || totalPages === 0 || isLoading
                      }
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        loadStaffUsers(
                          nextPage,
                          search,
                          roleFilter,
                          statusFilter,
                          sortField,
                          sortOrder,
                        );
                      }}
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
