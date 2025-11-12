import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
} from "@mui/material";
export default function CrudForm({
  open,
  onClose,
  initialValues = {},
  onSubmit,
  fields = [],
  entityName = "Item", // :point_left: new prop
}) {
  const [values, setValues] = React.useState(initialValues);
  React.useEffect(() => setValues(initialValues), [initialValues]);
  const handleChange = (name) => (e) => {
    let value = e.target.value;
    // Convert "true"/"false" strings to booleans for specific fields
    if ((name === "isActive" || name === "isDiscountActive") && typeof value === "string") {
      value = value === "true";
    }
    setValues((v) => ({ ...v, [name]: value }));
  };
  const handleMultiSelectChange = (name) => (event, newValue) => {
    setValues((v) => ({ ...v, [name]: newValue }));
  };
  const submit = () => onSubmit(values);
  const isEditMode =
    !!initialValues?.planId ||
    !!initialValues?.featureId ||
    !!initialValues?.id; // generic check
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {isEditMode ? `Edit ${entityName}` : `Create ${entityName}`}
      </DialogTitle>
      <DialogContent sx={{ minWidth: 400 }}>
        {fields.map((f) => {
          if (f.type === "select") {
            return (
              <TextField
                key={f.name}
                select
                margin="dense"
                fullWidth
                label={f.label}
                value={values[f.name] ?? ""}
                onChange={handleChange(f.name)}
              >
                {(f.options || []).map((opt) => (
                  <MenuItem value={opt} key={String(opt)}>
                    {String(opt)}
                  </MenuItem>
                ))}
              </TextField>
            );
          }
          if (f.type === "multiselect") {
            return (
              <Autocomplete
                multiple
                key={f.name}
                options={f.options || []}
                getOptionLabel={
                  f.getOptionLabel || ((opt) => (typeof opt === "string" ? opt : opt.name))
                }
                value={values[f.name] || []}
                onChange={handleMultiSelectChange(f.name)}
                renderInput={(params) => (
                  <TextField {...params} label={f.label} margin="dense" fullWidth />
                )}
              />
            );
          }
          return (
            <TextField
              key={f.name}
              margin="dense"
              fullWidth
              label={f.label}
              value={values[f.name] ?? ""}
              onChange={handleChange(f.name)}
              type={f.type || "text"}
            />
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}