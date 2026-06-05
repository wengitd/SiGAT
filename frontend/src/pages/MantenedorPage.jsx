import { useState } from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";
import MantenedorCatalogo from "../components/mantenedor/MantenedorCatalogo";

// ── Definición de catálogos por grupo ────────────────────────────────────────

const GRUPOS = [
  {
    label: "Organización",
    catalogos: [
      {
        title: "Empresas",
        endpoint: "/empresas",
        idField: "id_org",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Plantas",
        endpoint: "/plantas",
        idField: "id_planta",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Sub-áreas",
        endpoint: "/sub-areas",
        idField: "id_sub",
        fields: [
          { name: "nombre",  label: "Nombre",       required: true },
          {
            name: "id_dpto", label: "Departamento",  required: true,
            type: "select",
            optionsEndpoint: "/departamento",
            optionsIdField: "id_dpto",
            optionsLabelField: "nom_dpto",
          },
        ],
      },
    ],
  },
  {
    label: "Equipos",
    catalogos: [
      {
        title: "Tipos de Equipo",
        endpoint: "/tipos-equipo",
        idField: "id_tipoeq",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Sistemas Operativos",
        endpoint: "/sistemas-operativos",
        idField: "id_so",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Disponibilidad",
        endpoint: "/disponibilidades",
        idField: "id_dispo",
        fields: [
          { name: "nombre", label: "Nombre",      required: true },
          { name: "descr",  label: "Descripción" },
          { name: "color",  label: "Asignale un color", type: "colorselect", required: true },
        ],
      },
    ],
  },
  {
    label: "Periféricos",
    catalogos: [
      {
        title: "Tipos de Periférico",
        endpoint: "/tipos-periferico",
        idField: "id_tipoper",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Marcas",
        endpoint: "/marcas",
        idField: "id_marca",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Modelos",
        endpoint: "/modelos",
        idField: "id_modelo",
        fields: [
          { name: "nombre",   label: "Nombre", required: true },
          {
            name: "id_marca", label: "Marca",  required: true,
            type: "select",
            optionsEndpoint: "/marcas",
            optionsIdField: "id_marca",
            optionsLabelField: "nombre",
          },
        ],
      },
    ],
  },
  {
    label: "Proveedores",
    catalogos: [
      {
        title: "Proveedores de Licencia",
        endpoint: "/proveedores-licencia",
        idField: "id_prov",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
      {
        title: "Versiones de Licencia",
        endpoint: "/versiones-licencia",
        idField: "id_ver",
        fields: [
          { name: "nombre",   label: "Nombre",   required: true },
          {
            name: "id_prov",  label: "Proveedor", required: true,
            type: "select",
            optionsEndpoint: "/proveedores-licencia",
            optionsIdField: "id_prov",
            optionsLabelField: "nombre",
          },
        ],
      },
      {
        title: "Proveedores de Factura",
        endpoint: "/proveedores-factura",
        idField: "id_prov_fact",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
    ],
  },
  {
    label: "Personal",
    catalogos: [
      {
        title: "Cargos",
        endpoint: "/cargos",
        idField: "id_cargo",
        fields: [{ name: "nombre", label: "Nombre", required: true }],
      },
    ],
  },
];

// ── Página ────────────────────────────────────────────────────────────────────

export default function MantenedorPage() {
  const [grupoIdx,    setGrupoIdx]    = useState(0);
  const [catalogoIdx, setCatalogoIdx] = useState(0);

  const grupo    = GRUPOS[grupoIdx];
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
        <MantenedorCatalogo
          key={`${grupoIdx}-${catalogoIdx}`}
          title={catalogo.title}
          endpoint={catalogo.endpoint}
          idField={catalogo.idField}
          fields={catalogo.fields}
        />
      </Paper>
    </Box>
  );
}
