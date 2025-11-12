import React from "react";
import DataTable from "../common/DataTable";
import CrudForm from "../common/CrudForm";
import {
  fetchFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
} from "../../featureService";
export default function FeatureTable() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchFeatures();
      // if axios returns {data: [...]}, extract data
      setData(Array.isArray(res) ? res : res.data ?? []);
    } catch (e) {
      console.error("Error loading features:", e);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    load();
  }, []);
  const handleAdd = () => {
    setSelected({
      code: "",
      name: "",
      description: "",
      unit: "",
      usageLimit: 0,
      pricePerUnit: 0,
      defaultIncludedUnits: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };
  const handleEdit = (row) => {
    setSelected(row);
    setDialogOpen(true);
  };
  const handleDelete = async (row) => {
    if (!confirm("Delete this feature?")) return;
    try {
      await deleteFeature(row.featureId);
      setData((d) => d.filter((r) => r.featureId !== row.featureId));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };
  const handleSubmit = async (values) => {
    try {
      if (values.featureId) {
        const res = await updateFeature(values.featureId, values);
        setData((d) =>
          d.map((r) => (r.featureId === values.featureId ? res : r))
        );
      } else {
        const res = await createFeature(values);
        setData((d) => [res, ...d]);
      }
      setDialogOpen(false);
    } catch (e) {
      console.error(e);
      alert("Save failed");
    }
  };
  const columns = [
    { field: "featureId", headerName: "Feature ID" },
    { field: "code", headerName: "Code" },
    { field: "name", headerName: "Name" },
    { field: "description", headerName: "Description" },
    { field: "unit", headerName: "Unit" },
    { field: "usageLimit", headerName: "Usage Limit" },
    { field: "pricePerUnit", headerName: "Price per Unit" },
    { field: "defaultIncludedUnits", headerName: "Default Included Units" },
    {
      field: "isActive",
      headerName: "Active",
      renderCell: (row) => (row.isActive ? "Yes" : "No"),
    },
  ];
  return (
    <>
      <DataTable
        columns={columns}
        rows={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />
      <CrudForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialValues={selected || {}}
        onSubmit={handleSubmit}
        entityName="Feature"
        fields={[
          { name: "code", label: "Code" },
          { name: "name", label: "Name" },
          { name: "description", label: "Description" },
          { name: "unit", label: "Unit" },
          { name: "usageLimit", label: "Usage Limit", type: "number" },
          { name: "pricePerUnit", label: "Price per Unit", type: "number" },
          {
            name: "defaultIncludedUnits",
            label: "Default Included Units",
            type: "number",
          },
          {
            name: "isActive",
            label: "Active",
            type: "select",
            options: [true, false],
          },
        ]}
      />
    </>
  );
}