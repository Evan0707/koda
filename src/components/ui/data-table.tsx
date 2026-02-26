'use client'

import * as React from 'react'
import {
 ColumnDef,
 flexRender,
 getCoreRowModel,
 useReactTable,
 getPaginationRowModel,
 SortingState,
 getSortedRowModel,
 ColumnFiltersState,
 getFilteredRowModel,
} from '@tanstack/react-table'

import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface DataTableProps<TData, TValue> {
 columns: ColumnDef<TData, TValue>[]
 data: TData[]
 searchKey?: string
 searchPlaceholder?: string
 noDataMessage?: string
 onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
 columns,
 data,
 searchKey,
 searchPlaceholder = 'Rechercher...',
 noDataMessage = 'Aucun résultat.',
 onRowClick,
}: DataTableProps<TData, TValue>) {
 const [sorting, setSorting] = React.useState<SortingState>([])
 const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

 const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  onSortingChange: setSorting,
  getSortedRowModel: getSortedRowModel(),
  onColumnFiltersChange: setColumnFilters,
  getFilteredRowModel: getFilteredRowModel(),
  state: {
   sorting,
   columnFilters,
  },
  initialState: {
   pagination: {
    pageSize: 10,
   }
  }
 })

 return (
  <div>
   {searchKey && (
    <div className="flex items-center py-4">
     <input
      placeholder={searchPlaceholder}
      value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
      onChange={(event) =>
       table.getColumn(searchKey)?.setFilterValue(event.target.value)
      }
      className="max-w-sm flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
     />
    </div>
   )}
   <div className="rounded-md border">
    <Table>
     <TableHeader className="bg-muted/50">
      {table.getHeaderGroups().map((headerGroup) => (
       <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => {
         return (
          <TableHead key={header.id}>
           {header.isPlaceholder
            ? null
            : flexRender(
             header.column.columnDef.header,
             header.getContext()
            )}
          </TableHead>
         )
        })}
       </TableRow>
      ))}
     </TableHeader>
     <TableBody>
      {table.getRowModel().rows?.length ? (
       table.getRowModel().rows.map((row) => (
        <TableRow
         key={row.id}
         data-state={row.getIsSelected() && 'selected'}
         className={`hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
         onClick={() => onRowClick && onRowClick(row.original)}
        >
         {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
           {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
         ))}
        </TableRow>
       ))
      ) : (
       <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
         {noDataMessage}
        </TableCell>
       </TableRow>
      )}
     </TableBody>
    </Table>
   </div>

   <div className="flex items-center justify-end space-x-2 py-4">
    <Button
     variant="outline"
     size="sm"
     onClick={() => table.previousPage()}
     disabled={!table.getCanPreviousPage()}
    >
     Précédent
    </Button>
    <Button
     variant="outline"
     size="sm"
     onClick={() => table.nextPage()}
     disabled={!table.getCanNextPage()}
    >
     Suivant
    </Button>
   </div>
  </div>
 )
}
