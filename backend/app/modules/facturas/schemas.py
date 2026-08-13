from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class FacturaBase(BaseModel):
    fecha_em: date | None = None
    ruta_pdf_fact: str = Field(max_length=200)


class FacturaCreate(FacturaBase):
    pass


class FacturaUpdate(BaseModel):
    fecha_em: date | None = None
    ruta_pdf_fact: str | None = Field(default=None, max_length=200)


class FacturaOut(FacturaBase):
    id_fact: int
    model_config = ConfigDict(from_attributes=True)
