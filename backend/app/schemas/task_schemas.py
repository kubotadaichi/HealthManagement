from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


# PVT Schemas
class PVTResultCreate(BaseModel):
    """PVT結果作成用スキーマ"""
    miss_count: int = Field(..., ge=0, description="見逃し回数")
    average_reaction_time: float = Field(..., ge=0, description="平均反応時間（ミリ秒）")
    all_reaction_times: List[float] = Field(..., description="全反応時間の配列")


class PVTResultResponse(BaseModel):
    """PVT結果レスポンススキーマ"""
    id: int
    miss_count: int
    average_reaction_time: float
    all_reaction_times: List[float]
    completed_at: datetime

    class Config:
        from_attributes = True


# Flanker Schemas
class FlankerResultCreate(BaseModel):
    """Flanker結果作成用スキーマ"""
    total_correct: int = Field(..., ge=0, le=100)
    congruent_correct: int = Field(..., ge=0, le=100)
    incongruent_correct: int = Field(..., ge=0, le=100)
    total_trials: int = Field(default=100)
    trial_details: Optional[List[dict]] = None


class FlankerResultResponse(BaseModel):
    """Flanker結果レスポンススキーマ"""
    id: int
    total_correct: int
    congruent_correct: int
    incongruent_correct: int
    total_trials: int
    trial_details: Optional[List[dict]]
    completed_at: datetime

    class Config:
        from_attributes = True


# EFSI Schemas
class EFSIResultCreate(BaseModel):
    """EFSI結果作成用スキーマ"""
    total_score: int = Field(..., ge=26, le=104, description="総得点（26問×1-4点）")
    answers: List[int] = Field(..., min_length=26, max_length=26, description="26問の回答（1-4）")


class EFSIResultResponse(BaseModel):
    """EFSI結果レスポンススキーマ"""
    id: int
    total_score: int
    answers: List[int]
    completed_at: datetime

    class Config:
        from_attributes = True


# VAS Schemas
class VASResultCreate(BaseModel):
    """VAS結果作成用スキーマ"""
    sleepiness_score: int = Field(..., ge=0, le=100, description="眠気スコア")
    fatigue_score: int = Field(..., ge=0, le=100, description="疲労スコア")


class VASResultResponse(BaseModel):
    """VAS結果レスポンススキーマ"""
    id: int
    sleepiness_score: int
    fatigue_score: int
    completed_at: datetime

    class Config:
        from_attributes = True


# All Tasks Combined Schema
class AllTasksResultCreate(BaseModel):
    """全タスク結果一括作成用スキーマ"""
    pvt: PVTResultCreate
    flanker: FlankerResultCreate
    efsi: EFSIResultCreate
    vas: VASResultCreate


class AllTasksResultResponse(BaseModel):
    """全タスク結果一括レスポンススキーマ"""
    pvt: PVTResultResponse
    flanker: FlankerResultResponse
    efsi: EFSIResultResponse
    vas: VASResultResponse
    session_id: str = Field(..., description="セッションID")
    completed_at: datetime

    class Config:
        from_attributes = True
