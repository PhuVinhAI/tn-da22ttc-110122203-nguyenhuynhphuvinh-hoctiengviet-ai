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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            data.map((record) => (
              <TableRow key={record.id}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
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
