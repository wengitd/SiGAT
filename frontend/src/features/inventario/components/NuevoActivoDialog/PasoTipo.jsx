import { Box, Typography, Card, CardActionArea, CardContent, FormHelperText } from "@mui/material"
import { TIPOS, limpiarError } from "./constants"

export function PasoTipo({ form, setForm, setAsignarAhora, errores, setErrores }) {
    return (
        <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
                ¿Qué tipo de activo deseas registrar?
            </Typography>

            <Box sx={{ display: "flex", gap: 3 }}>
                {TIPOS.map(t => (
                    <Card
                        key={t.valor}
                        variant="outlined"
                        sx={{
                            flex: 1,
                            border: form.tipo === t.valor ? "2px solid" : "1px solid",
                            borderColor: errores?.tipo && !form.tipo
                                ? "error.main"
                                : form.tipo === t.valor ? "primary.main" : "divider",
                            bgcolor: form.tipo === t.valor ? "primary.50" : "background.paper",
                        }}
                    >
                        <CardActionArea
                            onClick={() => {
                                setForm({ ...form, tipo: t.valor })
                                limpiarError(setErrores, "tipo")
                                if (t.valor === "Equipo Computo") setAsignarAhora(false)
                            }}
                            sx={{ p: 3, textAlign: "center" }}
                        >
                            <CardContent>
                                {t.icon}
                                <Typography variant="h6" sx={{ mt: 1 }}>{t.label}</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>
            {errores?.tipo && (
                <FormHelperText error sx={{ mt: 1.5, mx: 0 }}>
                    {errores.tipo}
                </FormHelperText>
            )}
        </Box>
    )
}
