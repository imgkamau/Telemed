import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Telemedicine
        </Typography>
        <Box>
          {user ? (
            <Button color="inherit" onClick={signOut}>
              Logout
            </Button>
          ) : (
            <Button color="inherit">Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}