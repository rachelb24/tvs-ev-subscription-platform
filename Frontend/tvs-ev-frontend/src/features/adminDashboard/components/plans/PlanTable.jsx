import React from "react";
import DataTable from "../common/DataTable";
import CrudForm from "../common/CrudForm";
import {
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../../planService";
import { fetchFeatures } from "../../featureService"; // implement this to fetch list of all features
export default function PlanTable() {
  const [data, setData] = React.useState([]);
  const [allFeatures, setAllFeatures] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  React.useEffect(() => {
    loadPlans();
    loadFeatures();
  }, []);
  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetchPlans();
      setData(Array.isArray(res) ? res : res.data ?? []);
    } catch (e) {
      console.error("Error loading plans:", e);
    } finally {
      setLoading(false);
    }
  };
  const loadFeatures = async () => {
    try {
      const featuresRes = await fetchFeatures();
      setAllFeatures(featuresRes || []);
    } catch (e) {
      console.error("Error loading features:", e);
    }
  };
  const handleAdd = () => {
    setSelected({
      name: "",
      description: "",
      duration: "",
      totalPrice: 0,
      isActive: true,
      isDiscountActive: false,
      discountPercentage: 0,
      featureIds: [],
    });
    setDialogOpen(true);
  };
  const handleEdit = (row) => {
    // Map features array of objects to featureIds array for multi-select value
    const selectedFeatureIds = (row.features || []).map((f) => f.featureId);
    setSelected({ ...row, featureIds: selectedFeatureIds });
    setDialogOpen(true);
  };
  const handleDelete = async (row) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await deletePlan(row.planId);
      setData((d) => d.filter((r) => r.planId !== row.planId));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };
  const handleSubmit = async (values) => {
    try {
      // Convert feature objects selected in multiselect to array of IDs if needed
      let submitValues = { ...values };
      if (Array.isArray(submitValues.featureIds)) {
        // If featureIds array contains objects, convert to array of their IDs
        if (submitValues.featureIds.length > 0 && typeof submitValues.featureIds[0] === "object") {
          submitValues.featureIds = submitValues.featureIds.map((f) =>
            f.featureId || f.id || f // support different key names
          );
        }
      }
      if (submitValues.planId) {
        const res = await updatePlan(submitValues.planId, submitValues);
        setData((d) =>
          d.map((r) => (r.planId === submitValues.planId ? res : r))
        );
      } else {
        const res = await createPlan(submitValues);
        setData((d) => [res, ...d]);
      }
      setDialogOpen(false);
    } catch (e) {
      console.error(e);
      alert("Save failed");
    }
  };
  const columns = [
    { field: "planId", headerName: "Plan ID" },
    { field: "name", headerName: "Name" },
    { field: "discountPercentage", headerName: "Discount Percentage" },
    {
      field: "discountedPrice",
      headerName: "Discounted Price",
      renderCell: (row) => {
        if (row.isDiscountActive && row.discountPercentage) {
          const discounted =
            row.totalPrice -
            (row.totalPrice * row.discountPercentage) / 100;
          return discounted.toFixed(2);
        }
        return row.totalPrice?.toFixed(2) ?? "-";
      },
    },
    {
      field: "isDiscountActive",
      headerName: "Discount Active",
      renderCell: (row) => (row.isDiscountActive ? "Yes" : "No"),
    },
    { field: "description", headerName: "Description" },
    { field: "duration", headerName: "Duration" },
    {
      field: "features",
      headerName: "Features",
      renderCell: (row) =>
        row.features?.map((f) => f.name).join(", ") || "No features",
    },
    { field: "totalPrice", headerName: "Total Price" },
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
  entityName="Plan"
  fields={[
    { name: "name", label: "Name" },
    { name: "description", label: "Description" },
    {
      name: "duration",
      label: "Duration",
      type: "select",
      options: ["MONTH", "QUARTER", "YEAR"],
    },
    {
      name: "isActive",
      label: "Active",
      type: "select",
      options: [true, false]
    },
    {
      name: "discountPercentage",
      label: "Discount Percentage",
      type: "number",
    },
    {
      name: "isDiscountActive",
      label: "Discount Active",
      type: "select",
      options: [true, false],
    },
    {
      name: "featureIds",
      label: "Features",
      type: "multiselect",
      options: allFeatures,
      getOptionLabel: (opt) => opt.name,
      getOptionValue: (opt) => opt.featureId,
    },
  ]}
/>
    </>
  );
}

















