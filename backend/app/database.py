import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 環境変数からデータベースURLを取得
# ローカル開発時はSQLite、本番環境ではSupabaseのPostgreSQLを使用
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./health_management.db"
)

# PostgreSQLの場合、connect_argsは不要
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """データベースセッションを取得する依存性"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
