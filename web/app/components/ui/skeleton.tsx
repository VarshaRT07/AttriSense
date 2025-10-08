import { cn } from "~/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Table Header Skeleton */}
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DataTableSkeletonProps {
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  rows?: number;
  columns?: number;
}

function DataTableSkeleton({
  showSearch = true,
  showFilters = true,
  showPagination = true,
  rows = 10,
  columns = 6,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filters Skeleton */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && <Skeleton className="h-10 w-full sm:w-80" />}
          {showFilters && (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg p-4">
        <TableSkeleton rows={rows} columns={columns} />
      </div>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-8" />
            <Skeleton className="h-10 w-8" />
            <Skeleton className="h-10 w-8" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTableSkeleton, Skeleton, TableSkeleton };
