/** Config declarativa de catálogos del mantenedor. */

export const GRUPOS = [
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
                    { name: "nombre", label: "Nombre", required: true },
                    {
                        name: "id_dpto", label: "Departamento", required: true,
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
        label: "Equipo Cómputo",
        catalogos: [
            {
                title: "Tipos de Equipo",
                endpoint: "/tipos-equipo",
                idField: "id_tipoeq",
                fields: [{ name: "nombre", label: "Nombre", required: true }],
            },
            {
                title: "Sistemas Operativos",
                custom: "sistemaOperativo",
            },
            { 
                title: "Plantillas de preparación",
                custom: "plantillasChecklist",
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
            
        ],
    },
    {
        label: "Marcas/Modelos",
        catalogos:[
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
                    { name: "nombre", label: "Nombre", required: true },
                    {
                        name: "id_marca", label: "Marca", required: true,
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
        label: "Licencias",
        catalogos: [
            {
                title: "proveedor de licencia",
                endpoint: "/proveedores-licencia",
                idField: "id_prov",
                fields: [{ name: "nombre", label: "Nombre", required: true }],
            },
            {
                title: "versión de Licencia",
                endpoint: "/versiones-licencia",
                idField: "id_ver",
                fields: [
                    { name: "nombre", label: "Nombre", required: true },
                    {
                        name: "id_prov", label: "Proveedor", required: true,
                        type: "select",
                        optionsEndpoint: "/proveedores-licencia",
                        optionsIdField: "id_prov",
                        optionsLabelField: "nombre",
                    },
                ],
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
    {
        label: "Condiciones",
        catalogos:[
            {
                title: "Disponibilidad",
                endpoint: "/disponibilidades",
                idField: "id_dispo",
                fields: [
                    { name: "nombre", label: "Nombre", required: true },
                    { name: "descr", label: "Descripción", required: true },
                    { name: "color", label: "Asignale un color", type: "colorselect", required: true },
                ],
            },
            {
                title: "Estado ↔ Disponibilidad",
                custom: "estadoDispo",
            },
        ],
    },
];
