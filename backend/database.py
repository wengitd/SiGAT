from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

# Creamos el motor de la base de datos
engine = create_engine(
    settings.database_url,
    echo=False,  # Imprime cada query SQL en la consola (útil para debug)
    pool_pre_ping=True,  # Verifica que la conexión esté viva antes de usarla (evita errores de timeout)
)

# Cada request HTTP va a abrir su propia sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La clase base de la que heredarán todos los modelos ORM
Base = declarative_base()


def get_db():
    """
    Dependencia de FastAPI: abre una sesión por request, la cierra al final.
    Se inyecta a los endpoints con `Depends(get_db)`.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
