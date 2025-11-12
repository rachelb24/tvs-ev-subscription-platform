// src/admin/layouts/AdminLayout.jsx
import React from 'react';
import { Box, Drawer, Toolbar, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const drawerWidth = 240;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('role');
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/admin' },
    { text: 'Features', path: '/admin/features' },
    { text: 'Plans', path: '/admin/plans' },
    { text: 'Users', path: '/admin/users' },
    { text: 'Orders', path: '/admin/orders' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Removed the AppBar completely */}

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          {/* Keep the sidebar title */}
          <Typography variant="h6" sx={{ p: 2 }}>
            EV Admin Dashboard
          </Typography>

          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={NavLink} to={item.path}>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
