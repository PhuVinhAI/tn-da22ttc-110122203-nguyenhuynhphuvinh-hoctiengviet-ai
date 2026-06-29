import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export interface DataTableColumn<T> {
  key: string
  header: string
  cell: (record: T) => ReactNode
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  empty,
  onRowClick,
}: {
  columns: DataTableColumn<T>[]
  data: T[]
  empty: string
  onRowClick?: (record: T) => void
}) {
  return (
    <div className="rounded-lg border-2 border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-11 bg-muted hover:bg-muted border-b-2 border-border">
            {columns.map((column) => (
              <TableHead key={column.key} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground ${column.className || ''}`}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-[140px] text-center text-muted-foreground text-sm">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            data.map((record) => (
              <TableRow
                key={record.id}
                className={`h-12 border-b-2 border-border last:border-b-0 ${onRowClick ? 'hover:bg-muted/40 cursor-pointer' : 'hover:bg-muted/40'}`}
                onClick={onRowClick ? () => onRowClick(record) : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={`px-4 py-2 text-sm ${column.className || ''}`}>
                    {column.cell(record)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
