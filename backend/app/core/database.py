"""Motor SQLAlchemy, sesión por request y Base ORM."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de FastAPI: abre una sesión por request y la cierra al final.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
