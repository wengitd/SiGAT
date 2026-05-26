import { Outlet, useNavigate } from "react-router-dom";
import { Box, List, ListItemButton, ListItemText, Typography } from "@mui/material";


export default function Layout() {
  const navigate = useNavigate();

  /*SIDEBAR */
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box sx={{ width: 240, bgcolor: "primary.main", color: "white", p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>SiGAT</Typography>
        <List>
          <ListItemButton onClick={() => navigate("/dashboard")}>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/activos")}>
            <ListItemText primary="Activos" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/empleados")}>
            <ListItemText primary="Empleados" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/inventario")}>
            <ListItemText primary="Inventario Activos" />
          </ListItemButton>


        </List>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

