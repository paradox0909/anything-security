from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.services.email_service import EmailService
from app.services.tracking_service import TrackingService

router = APIRouter()

@router.post("/templates", response_model=schemas.PhishingTemplate)
def create_template(
    template: schemas.PhishingTemplateCreate,
    db: Session = Depends(get_db)
):
    """피싱 메일 템플릿 생성"""
    db_template = models.PhishingTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates", response_model=List[schemas.PhishingTemplate])
def get_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """피싱 메일 템플릿 목록 조회"""
    templates = db.query(models.PhishingTemplate).offset(skip).limit(limit).all()
    return templates

@router.get("/templates/{template_id}", response_model=schemas.PhishingTemplate)
def get_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """피싱 메일 템플릿 상세 조회"""
    template = db.query(models.PhishingTemplate).filter(models.PhishingTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/templates/{template_id}", response_model=schemas.PhishingTemplate)
def update_template(
    template_id: int,
    template_update: schemas.PhishingTemplateUpdate,
    db: Session = Depends(get_db)
):
    """피싱 메일 템플릿 수정"""
    template = db.query(models.PhishingTemplate).filter(models.PhishingTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """피싱 메일 템플릿 삭제"""
    template = db.query(models.PhishingTemplate).filter(models.PhishingTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

@router.post("/campaigns", response_model=schemas.PhishingCampaign)
def create_campaign(
    campaign: schemas.PhishingCampaignCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """피싱 캠페인 생성 및 발송"""
    # 템플릿 확인
    template = db.query(models.PhishingTemplate).filter(
        models.PhishingTemplate.id == campaign.template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # 캠페인 생성
    db_campaign = models.PhishingCampaign(
        name=campaign.name,
        template_id=campaign.template_id,
        scheduled_at=campaign.scheduled_at,
        status="draft"
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    
    # 수신자 추가
    for email in campaign.recipient_emails:
        recipient = models.PhishingRecipient(
            campaign_id=db_campaign.id,
            email=email,
        )
        db.add(recipient)
    
    db.commit()
    
    # 즉시 발송 또는 스케줄링
    if not campaign.scheduled_at or campaign.scheduled_at <= datetime.now():
        background_tasks.add_task(send_campaign_emails, db_campaign.id)
        db_campaign.status = "sent"
    else:
        db_campaign.status = "scheduled"
    
    db.commit()
    db.refresh(db_campaign)
    
    return db_campaign

@router.get("/campaigns", response_model=List[schemas.PhishingCampaign])
def get_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """피싱 캠페인 목록 조회"""
    campaigns = db.query(models.PhishingCampaign).offset(skip).limit(limit).all()
    return campaigns

@router.get("/campaigns/{campaign_id}", response_model=schemas.PhishingCampaign)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """피싱 캠페인 상세 조회"""
    campaign = db.query(models.PhishingCampaign).filter(
        models.PhishingCampaign.id == campaign_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/campaigns/{campaign_id}/recipients", response_model=List[schemas.PhishingRecipient])
def get_campaign_recipients(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """캠페인 수신자 목록 조회"""
    recipients = db.query(models.PhishingRecipient).filter(
        models.PhishingRecipient.campaign_id == campaign_id
    ).all()
    return recipients

@router.get("/campaigns/{campaign_id}/stats")
def get_campaign_stats(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """캠페인 통계 조회"""
    recipients = db.query(models.PhishingRecipient).filter(
        models.PhishingRecipient.campaign_id == campaign_id
    ).all()
    
    total = len(recipients)
    clicked = sum(1 for r in recipients if r.clicked)
    reported = sum(1 for r in recipients if r.reported)
    
    return {
        "total_recipients": total,
        "clicked": clicked,
        "reported": reported,
        "click_rate": (clicked / total * 100) if total > 0 else 0,
        "report_rate": (reported / total * 100) if total > 0 else 0
    }

@router.post("/track/click/{tracking_token}")
def track_click(
    tracking_token: str,
    db: Session = Depends(get_db)
):
    """링크 클릭 추적"""
    recipient = TrackingService.get_recipient_by_token(tracking_token, db)
    if recipient and not recipient.clicked:
        recipient.clicked = True
        recipient.clicked_at = datetime.now()
        db.commit()
    return {"status": "tracked"}

@router.post("/track/report/{tracking_token}")
def track_report(
    tracking_token: str,
    db: Session = Depends(get_db)
):
    """피싱 신고 추적"""
    recipient = TrackingService.get_recipient_by_token(tracking_token, db)
    if recipient and not recipient.reported:
        recipient.reported = True
        recipient.reported_at = datetime.now()
        db.commit()
    return {"status": "reported"}

def send_campaign_emails(campaign_id: int):
    """백그라운드에서 캠페인 이메일 발송"""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        campaign = db.query(models.PhishingCampaign).filter(
            models.PhishingCampaign.id == campaign_id
        ).first()
        if not campaign:
            return
        
        template = campaign.template
        recipients = campaign.recipients
        
        email_service = EmailService()
        
        for recipient in recipients:
            tracking_token = TrackingService.generate_token(recipient.id)
            email_service.send_phishing_email(
                recipient_email=recipient.email,
                template=template,
                tracking_token=tracking_token
            )
            recipient.sent_at = datetime.now()
        
        db.commit()
    finally:
        db.close()

