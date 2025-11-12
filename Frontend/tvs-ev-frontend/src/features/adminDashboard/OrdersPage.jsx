// src/admin/pages/OrdersPage.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';
import OrderTable from './components/orders/OrderTable';
export default function OrdersPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Orders Management</Typography>
      <OrderTable />
    </Box>
  );
}