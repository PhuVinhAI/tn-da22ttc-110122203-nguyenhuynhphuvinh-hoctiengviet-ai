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
}: {
  columns: DataTableColumn<T>[]
  data: T[]
  empty: string
}) {
  return (
    <div className="rounded-2xl border-2">
      <Table>
        <TableHeader>
          <TableRow className="h-14 bg-muted hover:bg-muted">
            {columns.map((column) => (
              <TableHead key={column.key} className={`px-5 py-4 text-base font-bold ${column.className || ''}`}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-[200px] text-center text-muted-foreground text-lg">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            data.map((record) => (
              <TableRow key={record.id} className="h-16 hover:bg-muted/50">
                {columns.map((column) => (
                  <TableCell key={column.key} className={`px-5 py-4 ${column.className || ''}`}>
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
