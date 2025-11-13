from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

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
    AllTasksResultCreate,
    AllTasksResultResponse,
)
from app.services.notion_service import notion_service

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


# All Tasks Combined Endpoint
@router.post("/all", response_model=AllTasksResultResponse, status_code=201)
def create_all_tasks_result(result: AllTasksResultCreate, db: Session = Depends(get_db)):
    """全タスク結果を一括保存"""
    from datetime import datetime
    import uuid
    
    try:
        # セッションIDを生成
        session_id = str(uuid.uuid4())
        session_time = datetime.now()
        
        # PVT結果を保存
        pvt_result = PVTResult(
            miss_count=result.pvt.miss_count,
            average_reaction_time=result.pvt.average_reaction_time,
            all_reaction_times=result.pvt.all_reaction_times,
        )
        db.add(pvt_result)
        
        # Flanker結果を保存
        flanker_result = FlankerResult(
            total_correct=result.flanker.total_correct,
            congruent_correct=result.flanker.congruent_correct,
            incongruent_correct=result.flanker.incongruent_correct,
            total_trials=result.flanker.total_trials,
            trial_details=result.flanker.trial_details,
        )
        db.add(flanker_result)
        
        # EFSI結果を保存
        efsi_result = EFSIResult(
            total_score=result.efsi.total_score,
            answers=result.efsi.answers,
        )
        db.add(efsi_result)
        
        # VAS結果を保存
        vas_result = VASResult(
            sleepiness_score=result.vas.sleepiness_score,
            fatigue_score=result.vas.fatigue_score,
        )
        db.add(vas_result)
        
        # 全てコミット
        db.commit()
        db.refresh(pvt_result)
        db.refresh(flanker_result)
        db.refresh(efsi_result)
        db.refresh(vas_result)
        
        # レスポンスを構築
        return AllTasksResultResponse(
            pvt=pvt_result,
            flanker=flanker_result,
            efsi=efsi_result,
            vas=vas_result,
            session_id=session_id,
            completed_at=session_time,
        )
    except Exception as e:
        db.rollback()
        print(f"Error saving all tasks: {e}")
        print(f"Result data: {result}")
        raise


# Notion Integration Endpoint
@router.post("/notion/save", status_code=201)
async def save_to_notion(task_results: AllTasksResultCreate):
    """
    全タスク結果をNotionデータベースに保存
    
    Args:
        task_results: 全タスクの結果
    
    Returns:
        Notionページ作成のレスポンス
    """
    try:
        # 結果を辞書形式に変換
        results_dict = {
            "pvt": {
                "miss_count": task_results.pvt.miss_count,
                "average_reaction_time": task_results.pvt.average_reaction_time,
                "all_reaction_times": task_results.pvt.all_reaction_times,
            },
            "flanker": {
                "total_correct": task_results.flanker.total_correct,
                "congruent_correct": task_results.flanker.congruent_correct,
                "incongruent_correct": task_results.flanker.incongruent_correct,
                "total_trials": task_results.flanker.total_trials,
                "trial_details": task_results.flanker.trial_details or [],
            },
            "efsi": {
                "total_score": task_results.efsi.total_score,
                "answers": task_results.efsi.answers,
            },
            "vas": {
                "sleepiness_score": task_results.vas.sleepiness_score,
                "fatigue_score": task_results.vas.fatigue_score,
            }
        }
        
        # Notionに保存
        response = await notion_service.create_page(results_dict)
        
        return {
            "success": True,
            "message": "Notionに保存しました",
            "notion_page_id": response.get("id"),
            "notion_url": response.get("url")
        }
    except Exception as e:
        print(f"Error saving to Notion: {e}")
        raise HTTPException(status_code=500, detail=f"Notionへの保存に失敗しました: {str(e)}")
