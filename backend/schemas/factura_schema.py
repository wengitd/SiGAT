from pydantic import BaseModel, ConfigDict, Field
from datetime import date

from datetime import date

class FacturaBase(BaseModel):
    prov_fact       : str
    fecha_em        : date
    num_folio       : int
    ruta_pdf_fact   : str

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    prov_fact       : str
    fecha_em        : date
    num_folio       : int
    ruta_pdf_fact   : str

class FacturaOut(FacturaBase):
    id_fact : int

    model_config = ConfigDict(from_attributes=True)