// src/admin/pages/PlansPage.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';
import PlanTable from './components/plans/PlanTable';  // Your existing

export default function PlansPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Plans Management</Typography>
      <PlanTable />
    </Box>
  );
}
