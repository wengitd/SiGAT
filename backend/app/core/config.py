"""Variables de entorno y configuración tipada (Pydantic Settings)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Configuración de Postgres
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_port: int = 5432
    postgres_host: str = "localhost"

    # Campos de JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Configuración de la app
    app_name: str = "SiGAT API"
    app_env: str = "development"

    # Almacenamiento local de PDFs de factura (volumen Docker en prod/dev)
    facturas_storage_path: str = "/data/facturas"

    # Almacenamiento local de actas de entrega (PDF/imagen; volumen Docker)
    actas_storage_path: str = "/data/actas"

    # Usuario administrador inicial (opcional; se crea al arrancar si no existe)
    admin_user: str | None = None  # email de login
    admin_password: str | None = None

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def database_url(self) -> str:
        """URL de conexión que SQLAlchemy entiende."""
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
