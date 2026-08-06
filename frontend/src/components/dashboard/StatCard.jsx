import { Card, Box, Typography, alpha } from "@mui/material"

/*
  Tarjeta de KPI para el Dashboard: ícono + número grande + etiqueta,
  con un acento de color a la izquierda. Reutilizable para cualquier
  total (activos, licencias, etc.).
*/
export default function StatCard({ icon: Icon, value, label, color = "#1B6B5A" }) {
    return (
        <Card
            sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderLeft: 4,
                borderColor: color,
                height: "100%",
            }}
        >
            {Icon && (
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(color, 0.12),
                        color,
                    }}
                >
                    <Icon fontSize="medium" />
                </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={700} noWrap>
                    {value ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {label}
                </Typography>
            </Box>
        </Card>
    )
}
