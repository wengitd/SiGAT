from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class FacturaBase(BaseModel):
    id_prov_fact: int
    fecha_em: date | None = None
    num_folio: int
    ruta_pdf_fact: str = Field(max_length=200)


class FacturaCreate(FacturaBase):
    pass


class FacturaUpdate(BaseModel):
    id_prov_fact: int | None = None
    fecha_em: date | None = None
    num_folio: int | None = None
    ruta_pdf_fact: str | None = Field(default=None, max_length=200)


class FacturaOut(FacturaBase):
    id_fact: int
    model_config = ConfigDict(from_attributes=True)
