import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { parseApiError } from "@/utils/errorParser";
import type { PaginatedStaffResponse, User } from "@/types/auth";
import { CreateStaffUserSheet } from "@/components/staff/CreateStaffUserSheet";
import { StaffTablePanel } from "@/components/staff/StaffTablePanel";

export function UserManagementPage() {
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
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Pending" | "Deactivated" | "DeactivationRequested"
  >("All");
  const [sortField, setSortField] = useState<
    "name" | "email" | "role" | "status"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    void loadStaffUsers(
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

  const handleApplyFilters = (filters: {
    role: "All" | "Backoffice" | "GridOperator";
    status:
      | "All"
      | "Active"
      | "Pending"
      | "Deactivated"
      | "DeactivationRequested";
    sortField: "name" | "email" | "role" | "status";
    sortOrder: "asc" | "desc";
    limit: number;
  }) => {
    setRoleFilter(filters.role);
    setStatusFilter(filters.status);
    setSortField(filters.sortField);
    setSortOrder(filters.sortOrder);
    setLimit(filters.limit);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void loadStaffUsers(
      nextPage,
      search,
      roleFilter,
      statusFilter,
      sortField,
      sortOrder,
      limit,
    );
  };

  const handleCreated = async () => {
    setSuccessMessage("Staff user successfully created.");
    setSearch("");
    setSearchInput("");
    setRoleFilter("All");
    setStatusFilter("All");
    setSortField("name");
    setSortOrder("asc");
    setPage(1);
    await loadStaffUsers(1, "", "All", "All", "name", "asc", limit);
  };

  if (!isBackoffice) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="size-12 text-destructive mb-3" />
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void loadStaffUsers(
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

          <CreateStaffUserSheet onCreated={handleCreated} />
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

      <Card className="border shadow-xs">
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
        <CardContent className="space-y-4">
          <StaffTablePanel
            staffUsers={staffUsers}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            isLoading={isLoading}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            sortField={sortField}
            sortOrder={sortOrder}
            limit={limit}
            onApplyFilters={handleApplyFilters}
            onPageChange={handlePageChange}
            onStatusChanged={() =>
              void loadStaffUsers(
                page,
                search,
                roleFilter,
                statusFilter,
                sortField,
                sortOrder,
                limit,
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default UserManagementPage;
