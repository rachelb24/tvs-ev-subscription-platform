import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  TablePagination,
  Toolbar,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DataTable({
  columns,
  rows,
  onEdit,
  onDelete,
  onAdd,
  loading,
}) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const visible =
    rows?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) || [];

  // ✅ Show actions column only if at least one handler exists
  const showActions = onEdit || onDelete;

  return (
    <Paper variant="outlined" sx={{ mt: 1 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <div />
        {onAdd && <Button variant="contained" onClick={onAdd}>Add</Button>}
      </Toolbar>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.field}>{c.headerName}</TableCell>
              ))}
              {showActions && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : visible.length ? (
              visible.map((row) => (
                <TableRow key={row.id ?? row._id ?? JSON.stringify(row)}>
                  {columns.map((c) => (
                    <TableCell key={c.field}>
                      {c.renderCell ? c.renderCell(row) : row[c.field]}
                    </TableCell>
                  ))}

                  {showActions && (
                    <TableCell>
                      {/* ✅ Only render Edit if onEdit exists */}
                      {onEdit && (
                        <IconButton size="small" onClick={() => onEdit(row)}>
                          <EditIcon />
                        </IconButton>
                      )}

                      {/* ✅ Only render Delete if onDelete exists */}
                      {onDelete && (
                        <IconButton size="small" onClick={() => onDelete(row)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)}>
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows?.length || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
}
