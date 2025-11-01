from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class PVTResult(Base):
    """PVT（覚醒度検査）結果モデル"""
    __tablename__ = "pvt_results"

    id = Column(Integer, primary_key=True, index=True)
    miss_count = Column(Integer, nullable=False)  # 見逃し回数
    average_reaction_time = Column(Float, nullable=False)  # 平均反応時間（ミリ秒）
    all_reaction_times = Column(JSON, nullable=False)  # 全反応時間の配列
    completed_at = Column(DateTime(timezone=True), server_default=func.now())


class FlankerResult(Base):
    """Flanker Task（実行機能検査）結果モデル"""
    __tablename__ = "flanker_results"

    id = Column(Integer, primary_key=True, index=True)
    total_correct = Column(Integer, nullable=False)  # 総正解数
    congruent_correct = Column(Integer, nullable=False)  # 一致試行正解数
    incongruent_correct = Column(Integer, nullable=False)  # 不一致試行正解数
    total_trials = Column(Integer, default=100)  # 総試行数
    trial_details = Column(JSON, nullable=True)  # 各試行の詳細
    completed_at = Column(DateTime(timezone=True), server_default=func.now())


class EFSIResult(Base):
    """EFSI（過労徴候しらべ）結果モデル"""
    __tablename__ = "efsi_results"

    id = Column(Integer, primary_key=True, index=True)
    total_score = Column(Integer, nullable=False)  # 総得点
    answers = Column(JSON, nullable=False)  # 26問の回答（1-4の配列）
    completed_at = Column(DateTime(timezone=True), server_default=func.now())


class VASResult(Base):
    """VAS（主観調査）結果モデル"""
    __tablename__ = "vas_results"

    id = Column(Integer, primary_key=True, index=True)
    sleepiness_score = Column(Integer, nullable=False)  # 眠気スコア（0-100）
    fatigue_score = Column(Integer, nullable=False)  # 疲労スコア（0-100）
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
