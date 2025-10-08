import {
  AlertCircle,
  CheckCircle,
  Download,
  Edit,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import Papa from "papaparse";

export interface Column<T> {
  key: keyof T;
  header: string;
  type?:
    | "text"
    | "number"
    | "select"
    | "boolean"
    | "date"
    | "currency"
    | "textarea"
    | "custom";
  options?: string[] | { value: string; label: string }[];
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (id: string | number, data: Partial<T>) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
  onBulkDelete?: (ids: (string | number)[]) => Promise<void>;
  onBulkUpload?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onCreate?: (data: Partial<T>) => Promise<void>;
  idField: keyof T;
  title?: string;
  searchable?: boolean;
  exportable?: boolean;
  creatable?: boolean;
  editable?: boolean;
  exportHandler?: () => Promise<void>; 
  deletable?: boolean;
  bulkActions?: boolean;
  pageSize?: number;
  loading?: boolean;
  error?: string | null;
  onErrorClear?: () => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onDelete,
  onBulkDelete,
  onBulkUpload,
  onCreate,
  idField,
  title = "Data Table",
  searchable = true,
  exportable = true,
  exportHandler,
  creatable = true,
  editable = true,
  deletable = true,
  bulkActions = true,
  pageSize = 10,
  loading = false,
  error = null,
  onErrorClear,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showCreateDialog, setShowCreateDialog] = useState(true);
  const [createData, setCreateData] = useState<Partial<T>>({});

  // Enhanced error state management
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Clear all error messages
  const clearErrors = () => {
    setUploadError(null);
    setDeleteError(null);
    setCreateError(null);
    setGeneralError(null);
    setUploadSuccess(null);
  };

  // Filter and search data
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return columns.some((column) => {
      const value = row[column.key];
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((row) => row[idField])));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleEditNavigation = (row: T) => {
    const id = row[idField];
    navigate(`../../employees/${id}?mode=edit`);
  };

  const handleCreate = async () => {
    if (onCreate) {
      setIsCreating(true);
      setCreateError(null);
      try {
        await onCreate(createData);
        setShowCreateDialog(false);
        setCreateData({});
        clearErrors();
      } catch (error) {
        console.error("Error creating record:", error);
        setCreateError(
          `Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedRows.size > 0) {
      setIsBulkDeleting(true);
      setDeleteError(null);
      try {
        await onBulkDelete(Array.from(selectedRows));
        setSelectedRows(new Set());
        clearErrors();
      } catch (error) {
        console.error("Error bulk deleting:", error);
        setDeleteError(
          `Failed to delete selected records: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  const handleDelete = async (id: string | number) => {
    if (onDelete) {
      setIsDeleting(id);
      setDeleteError(null);
      try {
        await onDelete(id);
        clearErrors();
      } catch (error) {
        console.error("Error deleting record:", error);
        setDeleteError(
          `Failed to delete record: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setIsDeleting(null);
      }
    }
  };


  const renderCell = (row: T, column: Column<T>) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Yes" : "No"}
          </Badge>
        );
      case "date":
        return value ? new Date(value).toLocaleDateString() : "";
      default:
        return value?.toString() || "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {searchable && (
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            )}
            {exportable && (
              <Button variant="outline" size="sm" onClick={exportHandler}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {onBulkUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(event) => {
                    if (onBulkUpload) {
                      onBulkUpload(event);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </>
            )}
            {creatable && onCreate && (
              <Dialog
                open={showCreateDialog}
                onOpenChange={(open) => {
                  setShowCreateDialog(open);
                  if (open) {
                    setCreateError(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Record</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new record.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {columns
                      .filter((col) => col.editable !== false)
                      .map((column) => (
                        <div key={column.key?.toString()} className="space-y-2">
                          <Label>{column.header}</Label>
                          {column.type === "select" ? (
                            <Select
                              value={createData[column.key]?.toString() || ""}
                              onValueChange={(val) =>
                                setCreateData({
                                  ...createData,
                                  [column.key]: val,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={`Select ${column.header}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {column.options?.map((option) => (
                                  <SelectItem
                                    key={
                                      typeof option === "string"
                                        ? option
                                        : option.value
                                    }
                                    value={
                                      typeof option === "string"
                                        ? option
                                        : option.value
                                    }
                                  >
                                    {typeof option === "string"
                                      ? option
                                      : option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : column.type === "boolean" ? (
                            <Checkbox
                              checked={!!createData[column.key]}
                              onCheckedChange={(checked) =>
                                setCreateData({
                                  ...createData,
                                  [column.key]: checked,
                                })
                              }
                            />
                          ) : column.type === "textarea" ? (
                            <Textarea
                              value={createData[column.key]?.toString() || ""}
                              onChange={(e) =>
                                setCreateData({
                                  ...createData,
                                  [column.key]: e.target.value,
                                })
                              }
                              placeholder={`Enter ${column.header}`}
                            />
                          ) : (
                            <Input
                              type={
                                column.type === "number" ||
                                column.type === "currency"
                                  ? "number"
                                  : column.type === "date"
                                    ? "date"
                                    : "text"
                              }
                              value={createData[column.key]?.toString() || ""}
                              onChange={(e) =>
                                setCreateData({
                                  ...createData,
                                  [column.key]:
                                    column.type === "number" ||
                                    column.type === "currency"
                                      ? parseFloat(e.target.value) || 0
                                      : e.target.value,
                                })
                              }
                              placeholder={`Enter ${column.header}`}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                  <DialogFooter>
                    {createError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{createError}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setCreateError(null);
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Upload feedback */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {uploadSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{uploadSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Delete error feedback */}
        {deleteError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        {/* Create error feedback */}
        {createError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{createError}</AlertDescription>
          </Alert>
        )}

        {/* General error feedback */}
        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        {/* External error feedback */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {onErrorClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onErrorClear}
                  className="ml-2 h-auto p-0 text-xs underline"
                >
                  Dismiss
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Bulk actions */}
        {bulkActions && selectedRows.size > 0 && (
          <div className="flex items-center space-x-2 p-2 bg-muted rounded">
            <span className="text-sm">{selectedRows.size} row(s) selected</span>
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isBulkDeleting ? "Deleting..." : "Delete Selected"}
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {bulkActions && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((row) =>
                          selectedRows.has(row[idField])
                        )
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key.toString()}
                    className={`${column.width || ""} ${
                      column.sortable !== false
                        ? "cursor-pointer hover:bg-muted"
                        : ""
                    }`}
                    onClick={() =>
                      column.sortable !== false && handleSort(column.key)
                    }
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {(editable || deletable) && (
                  <TableHead className="w-24">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length +
                      (bulkActions ? 1 : 0) +
                      (editable || deletable ? 1 : 0)
                    }
                    className="text-center py-8"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length +
                      (bulkActions ? 1 : 0) +
                      (editable || deletable ? 1 : 0)
                    }
                    className="text-center py-8"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row[idField]?.toString()}>
                    {bulkActions && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(row[idField])}
                          onCheckedChange={(checked) =>
                            handleSelectRow(row[idField], !!checked)
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key?.toString()}>
                        {renderCell(row, column)}
                      </TableCell>
                    ))}
                    {deletable && (
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <>
                            {editable && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditNavigation(row)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {deletable && onDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(row[idField])}
                                disabled={isDeleting === row[idField]}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
