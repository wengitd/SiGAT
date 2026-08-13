"""Importa todos los modelos ORM para registrar metadata de SQLAlchemy."""

from app.modules.activos.models import (  # noqa: F401
    ActivoTi,
    Disponibilidad,
    EdicionSO,
    EquipoComputo,
    EstadoDispo,
    FamiliaSO,
    Marca,
    Modelo,
    Periferico,
    TipoEquipo,
    TipoPeriferico,
    VersionSO,
)
from app.modules.asignaciones.models import Asignacion  # noqa: F401
from app.modules.catalogos.models_org import (  # noqa: F401
    Departamento,
    Empresa,
    SubArea,
)
from app.modules.catalogos.models_tipo_estado import TipoEstado  # noqa: F401
from app.modules.checklist.models import (  # noqa: F401
    Checklist,
    ChecklistPaso,
    Plantilla,
    PlantillaPaso,
)
from app.modules.empleados.models import Cargo, Empleado, Planta  # noqa: F401
from app.modules.facturas.models import Factura  # noqa: F401
from app.modules.historial.models import HistorialEstado  # noqa: F401
from app.modules.licencias.models import (  # noqa: F401
    ProveedorLicencia,
    VersionLicencia,
)
from app.modules.licencias.models_emp_lic import EmpLic  # noqa: F401
from app.modules.solicitudes_baja.models import SolicitudBaja  # noqa: F401
from app.modules.usuarios.models import UsuarioSistema  # noqa: F401
