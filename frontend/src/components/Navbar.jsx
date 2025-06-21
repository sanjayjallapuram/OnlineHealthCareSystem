import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isAuthenticated) {
    return null;
  }

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    setDrawerOpen(false);
    logout();
    navigate('/');
  };

  const handleDashboard = () => {
    handleClose();
    setDrawerOpen(false);
    if (user?.roles?.includes('ROLE_DOCTOR')) {
      navigate('/doctor-dashboard');
    } else if (user?.roles?.includes('ROLE_PATIENT')) {
      navigate('/patient-dashboard');
    }
  };

  const handleViewProfile = () => {
    handleClose();
    setDrawerOpen(false);
    if (user?.roles?.includes('ROLE_DOCTOR')) {
      navigate(`/doctor-profile/${user.username}`);
    } else if (user?.roles?.includes('ROLE_PATIENT')) {
      navigate(`/patient-profile/${user.username}`);
    }
  };

  const navLinks = [
    { label: 'Calendar', onClick: () => { setDrawerOpen(false); navigate('/appointments'); } },
    { label: 'Medical Records', onClick: () => { setDrawerOpen(false); navigate('/medical-records'); } },
    { label: 'Dashboard', onClick: handleDashboard },
    { label: 'LogOut', onClick: handleLogout }
  ];

  return (
    <AppBar position="static" sx={{ background: theme.palette.primary.main, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 64 }}>
        {/* Left: App Title */}
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 600, letterSpacing: 1, flexGrow: 0, textAlign: 'left', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 0 }}
          onClick={() => navigate('/')}
        >
          Online Healthcare System
        </Typography>
        {/* Right: Auth/User Buttons */}
        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
                onClick={() => setDrawerOpen(false)}
                onKeyDown={() => setDrawerOpen(false)}
              >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Chip
                    label={`${user?.roles?.includes('ROLE_DOCTOR') ? 'Dr. ' : ''}${user?.username || ''}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ color: 'secondary.main', borderColor: 'secondary.main' }}
                    onClick={handleViewProfile}
                  />
                </Box>
                <Divider />
                <List>
                  {navLinks.map((item, idx) => (
                    <ListItem key={item.label} disablePadding>
                      <ListItemButton onClick={item.onClick}>
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent:'flex-end' }}>
            <Chip
              label={`${user?.roles?.includes('ROLE_DOCTOR') ? 'Dr. ' : ''}${user?.username || ''}`}
              color="secondary"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white', fontWeight: 500, fontSize: 16, px: 1.5, cursor: 'pointer' }}
              onClick={handleViewProfile}
            />
            <Button color="inherit" onClick={() => navigate('/appointments')} sx={{ fontWeight: 500 }}>Calendar</Button>
            <Button color="inherit" onClick={() => navigate('/medical-records')} sx={{ fontWeight: 500 }}>Medical Records</Button>
            <Button color="inherit" onClick={handleDashboard} sx={{ fontWeight: 500 }}>Dashboard</Button>
            <Button color="inherit" onClick={handleLogout} sx={{ fontWeight: 500 }}>LogOut</Button>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleDashboard}>Dashboard</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 