from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# 環境変数を読み込む
load_dotenv()

from app.database import engine, Base
from app.models import task_results  # モデルをインポートしてテーブル作成
from app.routers import tasks

# データベーステーブルを作成
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Health Management API")

# ルーターを登録
app.include_router(tasks.router)

# CORS設定
# 環境変数から許可するオリジンを取得
allowed_origins = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Health Management API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
