import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import type { Employee, PulseSurvey } from "../../lib/interface";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Checkbox } from "./checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { DataTableSkeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export interface Column<T> {
  key: keyof T;
  header: string;
  type?:
    | "text"
    | "number"
    | "boolean"
    | "select"
    | "date"
    | "email"
    | "textarea"
    | "custom";
  options?: string[] | { value: string; label: string }[];
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface UnifiedDataTableProps {
  employeeData: Employee[];
  surveyData: PulseSurvey[];
  employeeColumns: Column<Employee>[];
  surveyColumns: Column<PulseSurvey>[];
  onEmployeeDelete?: (id: number) => void;
  onSurveyDelete?: (id: number) => void;
  onEmployeeCreate?: (data: Partial<Employee>) => void;
  onSurveyCreate?: (data: Partial<PulseSurvey>) => void;
  onEmployeeBulkDelete?: (ids: number[]) => void;
  onSurveyBulkDelete?: (ids: number[]) => void;
  employeePagination?: {
    currentPage: number;
    totalPages: number;
    totalEmployees: number;
    limit: number;
  };
  surveyPagination?: {
    currentPage: number;
    totalPages: number;
    totalSurveys: number;
    limit: number;
  };
  onEmployeePageChange?: (page: number) => void;
  onSurveyPageChange?: (page: number) => void;
  onEmployeeSearch?: (search: string) => void;
  onSurveySearch?: (search: string) => void;
  onEmployeeSort?: (sortBy: string, sortOrder: string) => void;
  onSurveySort?: (sortBy: string, sortOrder: string) => void;
  title?: string;
  searchable?: boolean;
  exportable?: boolean;
  creatable?: boolean;
  deletable?: boolean;
  bulkActions?: boolean;
  pageSize?: number;
  loading?: boolean;
  serverSidePagination?: boolean;
}

export function UnifiedDataTable({
  employeeData,
  surveyData,
  employeeColumns,
  surveyColumns,
  onEmployeeDelete,
  onSurveyDelete,
  onEmployeeCreate,
  onSurveyCreate,
  onEmployeeBulkDelete,
  onSurveyBulkDelete,
  employeePagination,
  surveyPagination,
  onEmployeePageChange,
  onSurveyPageChange,
  onEmployeeSearch,
  onSurveySearch,
  onEmployeeSort,
  onSurveySort,
  title = "Data Management",
  searchable = true,
  exportable = true,
  creatable = true,
  deletable = true,
  bulkActions = true,
  pageSize = 10,
  loading = false,
  serverSidePagination = false,
}: UnifiedDataTableProps) {
  // State management
  const [activeTab, setActiveTab] = useState<"employees" | "surveys">(
    "employees"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeeRows, setSelectedEmployeeRows] = useState<Set<number>>(
    new Set()
  );
  const [selectedSurveyRows, setSelectedSurveyRows] = useState<Set<number>>(
    new Set()
  );
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [currentSurveyPage, setCurrentSurveyPage] = useState(1);
  const [sortEmployeeColumn, setSortEmployeeColumn] = useState<
    keyof Employee | null
  >(null);
  const [sortSurveyColumn, setSortSurveyColumn] = useState<
    keyof PulseSurvey | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showEmployeeCreateDialog, setShowEmployeeCreateDialog] =
    useState(false);
  const [showSurveyCreateDialog, setShowSurveyCreateDialog] = useState(false);
  const [createEmployeeData, setCreateEmployeeData] = useState<
    Partial<Employee>
  >({});
  const [createSurveyData, setCreateSurveyData] = useState<
    Partial<PulseSurvey>
  >({});

  // Debounced search handler for server-side search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      if (serverSidePagination) {
        // Debounce the server-side search
        const timeoutId = setTimeout(() => {
          if (activeTab === "employees" && onEmployeeSearch) {
            onEmployeeSearch(value);
          } else if (activeTab === "surveys" && onSurveySearch) {
            onSurveySearch(value);
          }
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    },
    [serverSidePagination, activeTab, onEmployeeSearch, onSurveySearch]
  );

  // Client-side filtering and sorting (only used when server-side pagination is disabled)
  const filteredEmployeeData = useMemo(() => {
    if (serverSidePagination) return employeeData;

    let filtered = employeeData?.filter((employee) =>
      Object.values(employee).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Apply sorting if a sort column is selected
    if (sortEmployeeColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortEmployeeColumn];
        const bValue = b[sortEmployeeColumn];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [
    employeeData,
    searchTerm,
    serverSidePagination,
    sortEmployeeColumn,
    sortDirection,
  ]);

  const filteredSurveyData = useMemo(() => {
    if (serverSidePagination) return surveyData;

    let filtered = surveyData?.filter((survey) =>
      Object.values(survey).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Apply sorting if a sort column is selected
    if (sortSurveyColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortSurveyColumn];
        const bValue = b[sortSurveyColumn];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [
    surveyData,
    searchTerm,
    serverSidePagination,
    sortSurveyColumn,
    sortDirection,
  ]);

  // Pagination data
  const paginatedEmployeeData = useMemo(() => {
    if (serverSidePagination) return employeeData;

    const startIndex = (currentEmployeePage - 1) * pageSize;
    return filteredEmployeeData?.slice(startIndex, startIndex + pageSize);
  }, [
    serverSidePagination,
    employeeData,
    filteredEmployeeData,
    currentEmployeePage,
    pageSize,
  ]);

  const paginatedSurveyData = useMemo(() => {
    if (serverSidePagination) return surveyData;

    const startIndex = (currentSurveyPage - 1) * pageSize;
    return filteredSurveyData?.slice(startIndex, startIndex + pageSize);
  }, [
    serverSidePagination,
    surveyData,
    filteredSurveyData,
    currentSurveyPage,
    pageSize,
  ]);

  const totalEmployeePages = serverSidePagination
    ? employeePagination?.totalPages || 1
    : Math.ceil(filteredEmployeeData.length / pageSize);

  const totalSurveyPages = serverSidePagination
    ? surveyPagination?.totalPages || 1
    : Math.ceil(filteredSurveyData.length / pageSize);

  const currentEmployeePageNumber = serverSidePagination
    ? employeePagination?.currentPage || 1
    : currentEmployeePage;

  const currentSurveyPageNumber = serverSidePagination
    ? surveyPagination?.currentPage || 1
    : currentSurveyPage;

  // Sort handler
  const handleSort = (column: keyof Employee | keyof PulseSurvey) => {
    if (serverSidePagination) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);

      if (activeTab === "employees" && onEmployeeSort) {
        setSortEmployeeColumn(column as keyof Employee);
        onEmployeeSort(column as string, newDirection);
      } else if (activeTab === "surveys" && onSurveySort) {
        setSortSurveyColumn(column as keyof PulseSurvey);
        onSurveySort(column as string, newDirection);
      }
    } else {
      // Client-side sorting logic would go here if needed
      if (activeTab === "employees") {
        if (sortEmployeeColumn === column) {
          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
          setSortEmployeeColumn(column as keyof Employee);
          setSortDirection("asc");
        }
      } else {
        if (sortSurveyColumn === column) {
          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
          setSortSurveyColumn(column as keyof PulseSurvey);
          setSortDirection("asc");
        }
      }
    }
  };

  // Create handlers
  const handleEmployeeCreate = async () => {
    if (onEmployeeCreate) {
      try {
        await onEmployeeCreate(createEmployeeData);
        setShowEmployeeCreateDialog(false);
        setCreateEmployeeData({});
      } catch (error) {
        console.error("Error creating employee:", error);
      }
    }
  };

  const handleSurveyCreate = async () => {
    if (onSurveyCreate) {
      try {
        await onSurveyCreate(createSurveyData);
        setShowSurveyCreateDialog(false);
        setCreateSurveyData({});
      } catch (error) {
        console.error("Error creating survey:", error);
      }
    }
  };

  // Export handler
  const handleExport = () => {
    const data = activeTab === "employees" ? employeeData : surveyData;
    const columns = activeTab === "employees" ? employeeColumns : surveyColumns;

    const csvContent = [
      columns.map((col) => col.header).join(","),
      ...data.map((row) =>
        columns
          .map((col) => {
            const value = (row as any)[col.key];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value?.toString() || "";
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render cell content
  const renderCellContent = (column: Column<any>, value: any, row: any) => {
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
      case "number":
        return typeof value === "number" ? value.toLocaleString() : value;
      default:
        return value?.toString() || "";
    }
  };

  // Pagination handlers
  const handleEmployeePageChange = (page: number) => {
    if (serverSidePagination && onEmployeePageChange) {
      onEmployeePageChange(page);
    } else {
      setCurrentEmployeePage(page);
    }
  };

  const handleSurveyPageChange = (page: number) => {
    if (serverSidePagination && onSurveyPageChange) {
      onSurveyPageChange(page);
    } else {
      setCurrentSurveyPage(page);
    }
  };

  // Render pagination controls
  const renderPaginationControls = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Page</p>
          <p className="text-sm font-medium">
            {currentPage} of {totalPages}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render table header with sorting
  const renderTableHeader = (columns: Column<any>[], sortColumn: any) => (
    <TableHeader>
      <TableRow>
        {bulkActions && (
          <TableHead className="w-12">
            <Checkbox
              checked={
                activeTab === "employees"
                  ? selectedEmployeeRows.size ===
                      paginatedEmployeeData.length &&
                    paginatedEmployeeData.length > 0
                  : selectedSurveyRows.size === paginatedSurveyData.length &&
                    paginatedSurveyData.length > 0
              }
              onCheckedChange={(checked) => {
                if (activeTab === "employees") {
                  if (checked) {
                    setSelectedEmployeeRows(
                      new Set(
                        paginatedEmployeeData.map((emp) => emp.employee_id)
                      )
                    );
                  } else {
                    setSelectedEmployeeRows(new Set());
                  }
                } else {
                  if (checked) {
                    setSelectedSurveyRows(
                      new Set(
                        paginatedSurveyData.map((survey) => survey.survey_id)
                      )
                    );
                  } else {
                    setSelectedSurveyRows(new Set());
                  }
                }
              }}
            />
          </TableHead>
        )}
        {columns.map((column) => (
          <TableHead
            key={column.key as string}
            style={{ width: column.width }}
            className={column.sortable ? "cursor-pointer select-none" : ""}
            onClick={() => column.sortable && handleSort(column.key as any)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.header}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  {sortColumn === column.key ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  )}
                </div>
              )}
            </div>
          </TableHead>
        ))}
        {deletable && <TableHead className="w-20">Actions</TableHead>}
      </TableRow>
    </TableHeader>
  );

  // Render table body
  const renderTableBody = (
    data: any[],
    columns: Column<any>[],
    selectedRows: Set<number>,
    setSelectedRows: (rows: Set<number>) => void,
    idKey: string
  ) => (
    <TableBody>
      {data.map((row) => (
        <TableRow key={row[idKey]}>
          {bulkActions && (
            <TableCell>
              <Checkbox
                checked={selectedRows.has(row[idKey])}
                onCheckedChange={(checked) => {
                  const newSelected = new Set(selectedRows);
                  if (checked) {
                    newSelected.add(row[idKey]);
                  } else {
                    newSelected.delete(row[idKey]);
                  }
                  setSelectedRows(newSelected);
                }}
              />
            </TableCell>
          )}
          {columns.map((column) => (
            <TableCell key={column.key as string}>
              {renderCellContent(column, row[column.key], row)}
            </TableCell>
          ))}
          {deletable && (
            <TableCell>
            {activeTab === "employees" && (
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a href={`/employees/${row.employee_id}?mode=edit`}>
                  <Edit2 className="h-4 w-4" />
                </a>
              </Button>
            )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeTab === "employees" && onEmployeeDelete) {
                    onEmployeeDelete(row[idKey]);
                  } else if (activeTab === "surveys" && onSurveyDelete) {
                    onSurveyDelete(row[idKey]);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "employees" | "surveys")
          }
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="employees">
                Employees (
                {serverSidePagination
                  ? employeePagination?.totalEmployees || 0
                  : filteredEmployeeData.length}
                )
              </TabsTrigger>
              <TabsTrigger value="surveys">
                Surveys (
                {serverSidePagination
                  ? surveyPagination?.totalSurveys || 0
                  : filteredSurveyData.length}
                )
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              )}
              {creatable && (
                <>
                  {activeTab === "employees" && (
                    <Dialog
                      open={showEmployeeCreateDialog}
                      onOpenChange={setShowEmployeeCreateDialog}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Employee
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Employee</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          {employeeColumns
                            ?.filter(
                              (col) =>
                                col.key !== "employee_id" &&
                                col.key !== ("actions" as keyof Employee)
                            )
                            .map((column) => (
                              <div
                                key={column.key as string}
                                className="space-y-2"
                              >
                                <Label htmlFor={column.key as string}>
                                  {column.header}
                                </Label>
                                {column.type === "select" ? (
                                  <Select
                                    value={
                                      createEmployeeData[
                                        column.key
                                      ]?.toString() || ""
                                    }
                                    onValueChange={(value) =>
                                      setCreateEmployeeData({
                                        ...createEmployeeData,
                                        [column.key]: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
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
                                ) : column.type === "textarea" ? (
                                  <Textarea
                                    id={column.key as string}
                                    value={
                                      createEmployeeData[
                                        column.key
                                      ]?.toString() || ""
                                    }
                                    onChange={(e) =>
                                      setCreateEmployeeData({
                                        ...createEmployeeData,
                                        [column.key]: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  <Input
                                    id={column.key as string}
                                    type={column.type || "text"}
                                    value={
                                      createEmployeeData[
                                        column.key
                                      ]?.toString() || ""
                                    }
                                    onChange={(e) =>
                                      setCreateEmployeeData({
                                        ...createEmployeeData,
                                        [column.key]:
                                          column.type === "number"
                                            ? parseFloat(e.target.value) || 0
                                            : e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowEmployeeCreateDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleEmployeeCreate}>Create</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {activeTab === "surveys" && (
                    <Dialog
                      open={showSurveyCreateDialog}
                      onOpenChange={setShowSurveyCreateDialog}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Survey
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Survey</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          {surveyColumns
                            ?.filter(
                              (col) =>
                                col.key !== "survey_id" &&
                                col.key !== ("actions" as keyof PulseSurvey)
                            )
                            .map((column) => (
                              <div
                                key={column.key as string}
                                className="space-y-2"
                              >
                                <Label htmlFor={column.key as string}>
                                  {column.header}
                                </Label>
                                {column.type === "select" ? (
                                  <Select
                                    value={
                                      createSurveyData[
                                        column.key
                                      ]?.toString() || ""
                                    }
                                    onValueChange={(value) =>
                                      setCreateSurveyData({
                                        ...createSurveyData,
                                        [column.key]: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
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
                                ) : column.type === "textarea" ? (
                                  <Textarea
                                    id={column.key as string}
                                    value={
                                      createSurveyData[
                                        column.key
                                      ]?.toString() || ""
                                    }
                                    onChange={(e) =>
                                      setCreateSurveyData({
                                        ...createSurveyData,
                                        [column.key]: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  <Input
                                    id={column.key as string}
                                    type={column.type || "text"}
                                    value={
                                      createSurveyData[
                                        column.key
                                      ]?.toString() || ""
                                    }
                                    onChange={(e) =>
                                      setCreateSurveyData({
                                        ...createSurveyData,
                                        [column.key]:
                                          column.type === "number"
                                            ? parseFloat(e.target.value) || 0
                                            : e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowSurveyCreateDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSurveyCreate}>Create</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
              {bulkActions && (
                <>
                  {activeTab === "employees" &&
                    selectedEmployeeRows.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (onEmployeeBulkDelete) {
                            onEmployeeBulkDelete(
                              Array.from(selectedEmployeeRows)
                            );
                            setSelectedEmployeeRows(new Set());
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedEmployeeRows.size})
                      </Button>
                    )}
                  {activeTab === "surveys" && selectedSurveyRows.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (onSurveyBulkDelete) {
                          onSurveyBulkDelete(Array.from(selectedSurveyRows));
                          setSelectedSurveyRows(new Set());
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedSurveyRows.size})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <TabsContent value="employees" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                {renderTableHeader(employeeColumns, sortEmployeeColumn)}
                {renderTableBody(
                  paginatedEmployeeData,
                  employeeColumns,
                  selectedEmployeeRows,
                  setSelectedEmployeeRows,
                  "employee_id"
                )}
              </Table>
            </div>
            {totalEmployeePages > 1 && (
              <div className="mt-4">
                {renderPaginationControls(
                  currentEmployeePageNumber,
                  totalEmployeePages,
                  handleEmployeePageChange
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="surveys" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                {renderTableHeader(surveyColumns, sortSurveyColumn)}
                {renderTableBody(
                  paginatedSurveyData,
                  surveyColumns,
                  selectedSurveyRows,
                  setSelectedSurveyRows,
                  "survey_id"
                )}
              </Table>
            </div>
            {totalSurveyPages > 1 && (
              <div className="mt-4">
                {renderPaginationControls(
                  currentSurveyPageNumber,
                  totalSurveyPages,
                  handleSurveyPageChange
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="mt-4">
            <DataTableSkeleton
              rows={pageSize}
              columns={
                activeTab === "employees"
                  ? employeeColumns.length
                  : surveyColumns.length
              }
              showSearch={searchable}
              showFilters={true}
              showPagination={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
