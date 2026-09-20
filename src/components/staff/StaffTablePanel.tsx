import { useEffect, useRef, useState } from "react";
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
import { Filter, Loader2, Search } from "lucide-react";
import { userService } from "@/services/userService";
import type { User } from "@/types/auth";

interface StaffTablePanelProps {
  staffUsers: User[];
  page: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  roleFilter: "All" | "Backoffice" | "GridOperator";
  statusFilter:
    | "All"
    | "Active"
    | "Pending"
    | "Deactivated"
    | "DeactivationRequested";
  sortField: "name" | "email" | "role" | "status";
  sortOrder: "asc" | "desc";
  limit: number;
  onApplyFilters: (filters: {
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
  }) => void;
  onPageChange: (nextPage: number) => void;
  onStatusChanged?: () => void;
}

export function StaffTablePanel({
  staffUsers,
  page,
  totalPages,
  totalCount,
  isLoading,
  searchInput,
  onSearchInputChange,
  roleFilter,
  statusFilter,
  sortField,
  sortOrder,
  limit,
  onApplyFilters,
  onPageChange,
  onStatusChanged,
}: StaffTablePanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [draftRoleFilter, setDraftRoleFilter] = useState(roleFilter);
  const [draftStatusFilter, setDraftStatusFilter] = useState(statusFilter);
  const [draftSortField, setDraftSortField] = useState(sortField);
  const [draftSortOrder, setDraftSortOrder] = useState(sortOrder);
  const [draftLimit, setDraftLimit] = useState(limit);

  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setDraftRoleFilter(roleFilter);
    setDraftStatusFilter(statusFilter);
    setDraftSortField(sortField);
    setDraftSortOrder(sortOrder);
    setDraftLimit(limit);
  }, [roleFilter, statusFilter, sortField, sortOrder, limit]);

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

  const handleApplyFilters = () => {
    onApplyFilters({
      role: draftRoleFilter,
      status: draftStatusFilter,
      sortField: draftSortField,
      sortOrder: draftSortOrder,
      limit: draftLimit,
    });
    setShowFilters(false);
  };

  const handleStatusToggle = async (user: User) => {
    const nextStatus =
      user.accountStatus === "Active" ? "Deactivated" : "Active";

    try {
      await userService.updateStaffStatus(user.id, nextStatus);
      onStatusChanged?.();
    } catch (error) {
      console.error("Failed to update staff status", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
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
            <span>Filter &amp; Sort</span>
          </Button>

          {showFilters && (
            <div
              ref={filterPanelRef}
              className="absolute right-0 top-[calc(100%+8px)] z-20 w-70 rounded-xl border border-border bg-popover p-4 shadow-lg"
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </label>
                  <select
                    value={draftRoleFilter}
                    onChange={(event) =>
                      setDraftRoleFilter(
                        event.target.value as
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
                        event.target.value as
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
                    onChange={(event) =>
                      setDraftSortOrder(event.target.value as "asc" | "desc")
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
          <span>Loading staff directory...</span>
        </div>
      ) : staffUsers.length === 0 ? (
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffUsers.map((user) => (
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
                  <TableCell className="max-w-45 text-muted-foreground">
                    {user.address ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "Backoffice" ? "default" : "secondary"
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
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || totalPages === 0 || isLoading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
