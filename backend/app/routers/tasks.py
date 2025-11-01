from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.task_results import PVTResult, FlankerResult, EFSIResult, VASResult
from app.schemas.task_schemas import (
    PVTResultCreate,
    PVTResultResponse,
    FlankerResultCreate,
    FlankerResultResponse,
    EFSIResultCreate,
    EFSIResultResponse,
    VASResultCreate,
    VASResultResponse,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# PVT Endpoints
@router.post("/pvt", response_model=PVTResultResponse, status_code=201)
def create_pvt_result(result: PVTResultCreate, db: Session = Depends(get_db)):
    """PVT結果を保存"""
    db_result = PVTResult(
        miss_count=result.miss_count,
        average_reaction_time=result.average_reaction_time,
        all_reaction_times=result.all_reaction_times,
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.get("/pvt", response_model=List[PVTResultResponse])
def get_pvt_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """PVT結果の一覧を取得"""
    results = db.query(PVTResult).order_by(PVTResult.completed_at.desc()).offset(skip).limit(limit).all()
    return results


@router.get("/pvt/{result_id}", response_model=PVTResultResponse)
def get_pvt_result(result_id: int, db: Session = Depends(get_db)):
    """特定のPVT結果を取得"""
    result = db.query(PVTResult).filter(PVTResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


# Flanker Endpoints
@router.post("/flanker", response_model=FlankerResultResponse, status_code=201)
def create_flanker_result(result: FlankerResultCreate, db: Session = Depends(get_db)):
    """Flanker結果を保存"""
    db_result = FlankerResult(
        total_correct=result.total_correct,
        congruent_correct=result.congruent_correct,
        incongruent_correct=result.incongruent_correct,
        total_trials=result.total_trials,
        trial_details=result.trial_details,
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.get("/flanker", response_model=List[FlankerResultResponse])
def get_flanker_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Flanker結果の一覧を取得"""
    results = db.query(FlankerResult).order_by(FlankerResult.completed_at.desc()).offset(skip).limit(limit).all()
    return results


# EFSI Endpoints
@router.post("/efsi", response_model=EFSIResultResponse, status_code=201)
def create_efsi_result(result: EFSIResultCreate, db: Session = Depends(get_db)):
    """EFSI結果を保存"""
    db_result = EFSIResult(
        total_score=result.total_score,
        answers=result.answers,
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.get("/efsi", response_model=List[EFSIResultResponse])
def get_efsi_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """EFSI結果の一覧を取得"""
    results = db.query(EFSIResult).order_by(EFSIResult.completed_at.desc()).offset(skip).limit(limit).all()
    return results


# VAS Endpoints
@router.post("/vas", response_model=VASResultResponse, status_code=201)
def create_vas_result(result: VASResultCreate, db: Session = Depends(get_db)):
    """VAS結果を保存"""
    db_result = VASResult(
        sleepiness_score=result.sleepiness_score,
        fatigue_score=result.fatigue_score,
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.get("/vas", response_model=List[VASResultResponse])
def get_vas_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """VAS結果の一覧を取得"""
    results = db.query(VASResult).order_by(VASResult.completed_at.desc()).offset(skip).limit(limit).all()
    return results
