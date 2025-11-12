// src/admin/pages/FeaturesPage.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';
import FeatureTable from './components/features/FeatureTable';  // Your existing

export default function FeaturesPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Features Management</Typography>
      <FeatureTable />
    </Box>
  );
}
