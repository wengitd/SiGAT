import { useState } from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";
import MantenedorCatalogo from "../components/MantenedorCatalogo";
import MantenedorEstadoDispo from "../components/MantenedorEstadoDispo";
import MantenedorSistemaOperativo from "../components/MantenedorSistemaOperativo";
import MantenedorPlantillas from "../components/MantenedorPlantillas";
import { GRUPOS } from "../config/grupos";


// ── Página ────────────────────────────────────────────────────────────────────

export default function MantenedorPage() {
    const [grupoIdx, setGrupoIdx] = useState(0);
    const [catalogoIdx, setCatalogoIdx] = useState(0);

    const grupo = GRUPOS[grupoIdx];
    const catalogo = grupo.catalogos[catalogoIdx];

    function handleGrupo(_, newIdx) {
        setGrupoIdx(newIdx);
        setCatalogoIdx(0);
    }

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                Mantenedor de Catálogos
            </Typography>

            {/* Tabs de grupo */}
            <Paper variant="outlined" sx={{ mb: 3 }}>
                <Tabs
                    value={grupoIdx}
                    onChange={handleGrupo}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                    {GRUPOS.map((g) => (
                        <Tab key={g.label} label={g.label} />
                    ))}
                </Tabs>

                {/* Sub-tabs del grupo seleccionado */}
                <Tabs
                    value={catalogoIdx}
                    onChange={(_, v) => setCatalogoIdx(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="secondary"
                    indicatorColor="secondary"
                    sx={{ px: 2, bgcolor: "action.hover" }}
                >
                    {grupo.catalogos.map((c) => (
                        <Tab key={c.title} label={c.title} sx={{ fontSize: 13 }} />
                    ))}
                </Tabs>
            </Paper>

            {/* Tabla CRUD del catálogo seleccionado */}
            <Paper sx={{ p: 3 }}>
                {catalogo.custom === "estadoDispo" ? (
                    <MantenedorEstadoDispo key={`${grupoIdx}-${catalogoIdx}`} />
                ) : catalogo.custom === "sistemaOperativo" ? (
                    <MantenedorSistemaOperativo key={`${grupoIdx}-${catalogoIdx}`} />
                ) : catalogo.custom === "plantillasChecklist" ? (
                    <MantenedorPlantillas key={`${grupoIdx}-${catalogoIdx}`} />
                ) : (
                    <MantenedorCatalogo
                        key={`${grupoIdx}-${catalogoIdx}`}
                        title={catalogo.title}
                        endpoint={catalogo.endpoint}
                        idField={catalogo.idField}
                        fields={catalogo.fields}
                    />
                )}
            </Paper>
        </Box>
    );
}
