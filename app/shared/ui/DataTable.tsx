import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import type { SxProps, Theme } from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import type { ReactNode } from 'react'
import { visuallyHidden } from './visuallyHidden'

export type SortOrder = 'asc' | 'desc'

/** `sx` puede ser un objeto, una función o un arreglo; se normaliza para combinarlo con otros estilos. */
function toSxArray(sx: SxProps<Theme> | undefined) {
  if (!sx) return []
  return Array.isArray(sx) ? sx : [sx]
}

export interface DataTableColumn<T> {
  id: string
  header: string
  render: (row: T) => ReactNode
  /** Campo del backend por el que se puede ordenar. Sin él, la columna no muestra control de orden. */
  sortField?: string
  align?: 'left' | 'right' | 'center'
  /** En pantallas pequeñas (tarjetas) esta columna es el título de la tarjeta. */
  primary?: boolean
}

interface DataTableProps<T> {
  /** Título accesible de la tabla (se anuncia a lectores de pantalla). */
  caption: string
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => number | string
  getRowSx?: (row: T) => SxProps<Theme>
  /** Celda de acciones por fila (menú ⋮). Si no se pasa, no se muestra la columna. */
  rowActions?: (row: T) => ReactNode
  sort: { sortBy: string; order: SortOrder }
  onSortChange: (sortBy: string, order: SortOrder) => void
  pagination: {
    /** Base 1, igual que la API. */
    page: number
    limit: number
    total: number
    limitOptions?: number[]
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
  }
  /** true mientras se pide otra página con datos previos visibles: muestra una barra fina de progreso. */
  fetching?: boolean
  /** Se muestra cuando no hay filas. */
  emptyState: ReactNode
}

/**
 * Tabla con orden y paginación resueltos por el servidor (docs/UI-UX-PLAN.md, 6.2).
 * Por debajo de 600 px se convierte en una lista de tarjetas.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  getRowSx,
  rowActions,
  sort,
  onSortChange,
  pagination,
  fetching = false,
  emptyState,
}: DataTableProps<T>) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const toggleSort = (field: string) => {
    if (sort.sortBy === field) onSortChange(field, sort.order === 'asc' ? 'desc' : 'asc')
    else onSortChange(field, 'asc')
  }

  if (rows.length === 0) return <>{emptyState}</>

  const pager = (
    <TablePagination
      component="div"
      count={pagination.total}
      page={pagination.page - 1}
      rowsPerPage={pagination.limit}
      rowsPerPageOptions={pagination.limitOptions ?? [10, 20, 50]}
      onPageChange={(_, zeroBased) => pagination.onPageChange(zeroBased + 1)}
      onRowsPerPageChange={(event) => pagination.onLimitChange(Number(event.target.value))}
      labelRowsPerPage="Filas:"
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      getItemAriaLabel={(type) =>
        ({
          first: 'Primera página',
          last: 'Última página',
          next: 'Página siguiente',
          previous: 'Página anterior',
        })[type]
      }
    />
  )

  const progress = fetching ? (
    <LinearProgress aria-label="Actualizando datos" sx={{ height: 3 }} />
  ) : (
    <Box sx={{ height: 3 }} />
  )

  if (isMobile) {
    const sortable = columns.filter((column) => column.sortField)
    const primary = columns.find((column) => column.primary) ?? columns[0]!
    const details = columns.filter((column) => column !== primary)

    return (
      <Box>
        {sortable.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center' }}>
            <TextField
              select
              fullWidth
              label="Ordenar por"
              value={sort.sortBy}
              onChange={(event) => onSortChange(event.target.value, sort.order)}
            >
              {sortable.map((column) => (
                <MenuItem key={column.id} value={column.sortField}>
                  {column.header}
                </MenuItem>
              ))}
            </TextField>
            <IconButton
              onClick={() => onSortChange(sort.sortBy, sort.order === 'asc' ? 'desc' : 'asc')}
              aria-label={
                sort.order === 'asc'
                  ? 'Orden ascendente, cambiar a descendente'
                  : 'Orden descendente, cambiar a ascendente'
              }
              sx={{ width: 44, height: 44 }}
            >
              {sort.order === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
            </IconButton>
          </Stack>
        )}
        {progress}
        <Stack component="ul" spacing={1.5} aria-label={caption} sx={{ listStyle: 'none', p: 0, m: 0, mt: 1 }}>
          {rows.map((row) => (
            <Card component="li" key={getRowId(row)} sx={[{ p: 2 }, ...toSxArray(getRowSx?.(row))]}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="h3" component="p" sx={{ wordBreak: 'break-word' }}>
                  {primary.render(row)}
                </Typography>
                {rowActions?.(row)}
              </Box>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  mt: 1,
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  columnGap: 2,
                  rowGap: 0.75,
                  alignItems: 'center',
                }}
              >
                {details.map((column) => (
                  <Box key={column.id} sx={{ display: 'contents' }}>
                    <Typography component="dt" variant="body2" color="text.secondary">
                      {column.header}
                    </Typography>
                    <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                      {column.render(row)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          ))}
        </Stack>
        {pager}
      </Box>
    )
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {progress}
      <TableContainer>
        <Table size="medium">
          <Box component="caption" sx={visuallyHidden}>
            {caption}
          </Box>
          <TableHead>
            <TableRow>
              {columns.map((column) => {
                const active = column.sortField !== undefined && sort.sortBy === column.sortField
                return (
                  <TableCell
                    key={column.id}
                    scope="col"
                    align={column.align}
                    sortDirection={active ? sort.order : false}
                    sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {column.sortField ? (
                      <TableSortLabel
                        active={active}
                        direction={active ? sort.order : 'asc'}
                        onClick={() => toggleSort(column.sortField!)}
                      >
                        {column.header}
                        {active && (
                          <Box component="span" sx={visuallyHidden}>
                            {sort.order === 'asc' ? ' (orden ascendente)' : ' (orden descendente)'}
                          </Box>
                        )}
                      </TableSortLabel>
                    ) : (
                      column.header
                    )}
                  </TableCell>
                )
              })}
              {rowActions && (
                <TableCell align="right" scope="col" sx={{ fontWeight: 600 }}>
                  <Box component="span" sx={visuallyHidden}>
                    Acciones
                  </Box>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowId(row)} hover sx={getRowSx?.(row)}>
                {columns.map((column) =>
                  column.primary ? (
                    <TableCell key={column.id} component="th" scope="row" align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ) : (
                    <TableCell key={column.id} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ),
                )}
                {rowActions && <TableCell align="right">{rowActions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pager}
    </Paper>
  )
}
