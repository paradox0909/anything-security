from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.services.cve_service import CVEService
from app.services.slack_service import SlackService

router = APIRouter()

@router.get("/alerts", response_model=List[schemas.CVEAlert])
def get_cve_alerts(
    asset_id: int = None,
    notified: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """CVE 알림 목록 조회"""
    query = db.query(models.CVEAlert).options(joinedload(models.CVEAlert.asset))
    
    if asset_id:
        query = query.filter(models.CVEAlert.asset_id == asset_id)
    if notified is not None:
        query = query.filter(models.CVEAlert.notified == notified)
    
    alerts = query.order_by(models.CVEAlert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts

@router.get("/alerts/{alert_id}", response_model=schemas.CVEAlert)
def get_cve_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """CVE 알림 상세 조회"""
    alert = db.query(models.CVEAlert).filter(models.CVEAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="CVE alert not found")
    return alert

@router.post("/scan/{asset_id}")
def scan_asset_cves(
    asset_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """특정 자산에 대한 CVE 스캔 실행"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if not asset.vendor or not asset.product or not asset.version:
        raise HTTPException(
            status_code=400,
            detail="Asset must have vendor, product, and version for CVE scanning"
        )
    
    background_tasks.add_task(scan_and_notify_cves, asset_id)
    return {"message": "CVE scan started", "asset_id": asset_id}

@router.post("/scan/all")
def scan_all_assets(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """모든 활성 자산에 대한 CVE 스캔 실행"""
    assets = db.query(models.Asset).filter(
        models.Asset.is_active == True,
        models.Asset.vendor.isnot(None),
        models.Asset.product.isnot(None),
        models.Asset.version.isnot(None)
    ).all()
    
    for asset in assets:
        background_tasks.add_task(scan_and_notify_cves, asset.id)
    
    return {"message": f"CVE scan started for {len(assets)} assets", "count": len(assets)}

def scan_and_notify_cves(asset_id: int):
    """백그라운드에서 CVE 스캔 및 알림"""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
        if not asset:
            return
        
        cve_service = CVEService()
        slack_service = SlackService()
        
        # CVE 검색
        cves = cve_service.search_cves(asset.vendor, asset.product, asset.version)
        
        for cve_data in cves:
            # 이미 존재하는 알림인지 확인
            existing = db.query(models.CVEAlert).filter(
                models.CVEAlert.asset_id == asset_id,
                models.CVEAlert.cve_id == cve_data["cve_id"]
            ).first()
            
            if not existing:
                # 새 알림 생성
                alert = models.CVEAlert(
                    asset_id=asset_id,
                    cve_id=cve_data["cve_id"],
                    title=cve_data.get("title"),
                    description=cve_data.get("description"),
                    severity=cve_data.get("severity"),
                    cvss_score=cve_data.get("cvss_score"),
                    published_date=cve_data.get("published_date")
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                
                # Slack 알림 발송
                try:
                    slack_service.send_cve_alert(asset, alert)
                    alert.notified = True
                    alert.notified_at = datetime.now()
                    db.commit()
                except Exception as e:
                    print(f"Failed to send Slack notification: {e}")
    finally:
        db.close()

