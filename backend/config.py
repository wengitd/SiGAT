from pydantic_settings import BaseSettings, SettingsConfigDict # Libreria para manejar las configuraciones de la app

class Settings(BaseSettings):
    # Configuración de Postgres
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_port: int = 5432
    postgres_host: str = "localhost"

    # Configuración de la app
    app_name: str = "SiGAT API"
    app_env: str = "development"

    # Le dice a Pydantic dónde buscar el .env
    model_config = SettingsConfigDict(
        env_file="../.env",      
        env_file_encoding="utf-8",
        case_sensitive=False,    # acepta POSTGRES_USER o postgres_user
    )

    # Propiedad para obtener la URL de conexión a la base de datos  
    @property 
    def database_url(self) -> str:
        """URL de conexión que SQLAlchemy entiende."""
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}" #://user:password@host:port/database
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"       #://host:port/database
        )

# Instancia de la clase Settings que se reutiliza en toda la app
settings = Settings()