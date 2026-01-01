import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
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
        target_url=campaign.target_url or "https://example.com",
        scheduled_at=campaign.scheduled_at,
        status="draft"
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    
    # 수신자 추가 (UUID 생성)
    # 웹에서 입력받은 recipient_emails 사용
    if not campaign.recipient_emails:
        raise HTTPException(
            status_code=400,
            detail="recipient_emails is required. Please provide at least one recipient email."
        )
    
    for email in campaign.recipient_emails:
        recipient = models.PhishingRecipient(
            campaign_id=db_campaign.id,
            email=email,
            uuid=TrackingService.generate_uuid()
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
    # 과거 데이터/테스트로 template_id가 NULL인 깨진 레코드가 있을 수 있음.
    # response_model(PhishingCampaign)에서 template_id는 int라서 NULL이면 500이 나므로 제외한다.
    campaigns = (
        db.query(models.PhishingCampaign)
        .filter(models.PhishingCampaign.template_id.isnot(None))
        .offset(skip)
        .limit(limit)
        .all()
    )
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
    opened = sum(1 for r in recipients if r.opened)
    clicked = sum(1 for r in recipients if r.clicked)
    reported = sum(1 for r in recipients if r.reported)
    
    return {
        "total_recipients": total,
        "opened": opened,
        "clicked": clicked,
        "reported": reported,
        "open_rate": (opened / total * 100) if total > 0 else 0,
        "click_rate": (clicked / total * 100) if total > 0 else 0,
        "report_rate": (reported / total * 100) if total > 0 else 0
    }

@router.get("/track/open/{recipient_uuid}")
def track_open(
    recipient_uuid: str,
    db: Session = Depends(get_db)
):
    """메일 오픈 추적 (Tracking Pixel)"""
    recipient = TrackingService.get_recipient_by_uuid(recipient_uuid, db)
    if recipient and not recipient.opened:
        recipient.opened = True
        recipient.opened_at = datetime.now()
        db.commit()
    
    # 1x1 투명 픽셀 이미지 반환
    pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
    return Response(content=pixel, media_type="image/png")

@router.get("/track/click/{recipient_uuid}")
def track_click(
    recipient_uuid: str,
    target_url: str = "https://example.com",
    db: Session = Depends(get_db)
):
    """링크 클릭 추적 및 리다이렉트"""
    recipient = TrackingService.get_recipient_by_uuid(recipient_uuid, db)
    if recipient and not recipient.clicked:
        recipient.clicked = True
        recipient.clicked_at = datetime.now()
        db.commit()
    
    # 실제 목적지로 리다이렉트
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=target_url)

@router.post("/track/report/{recipient_uuid}")
def track_report(
    recipient_uuid: str,
    db: Session = Depends(get_db)
):
    """피싱 신고 추적"""
    recipient = TrackingService.get_recipient_by_uuid(recipient_uuid, db)
    if recipient and not recipient.reported:
        recipient.reported = True
        recipient.reported_at = datetime.now()
        db.commit()
    return {"status": "reported"}

@router.post("/campaigns/{campaign_id}/close")
def close_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """프로젝트 종료"""
    campaign = db.query(models.PhishingCampaign).filter(
        models.PhishingCampaign.id == campaign_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status == "closed":
        raise HTTPException(status_code=400, detail="Campaign already closed")
    
    campaign.status = "closed"
    campaign.closed_at = datetime.now()
    db.commit()
    
    return {"message": "Campaign closed successfully", "campaign": campaign}

def send_campaign_emails(campaign_id: int):
    """백그라운드에서 캠페인 이메일 발송 (동기 래퍼)"""
    import asyncio
    from app.database import SessionLocal
    
    print(f"[send_campaign_emails] Starting email sending for campaign {campaign_id}")
    
    async def send_emails_async():
        db = SessionLocal()
        try:
            campaign = db.query(models.PhishingCampaign).filter(
                models.PhishingCampaign.id == campaign_id
            ).first()
            if not campaign:
                print(f"[send_campaign_emails] Campaign {campaign_id} not found")
                return
            
            print(f"[send_campaign_emails] Found campaign: {campaign.name}")
            
            template = db.query(models.PhishingTemplate).filter(
                models.PhishingTemplate.id == campaign.template_id
            ).first()
            if not template:
                print(f"[send_campaign_emails] Template {campaign.template_id} not found")
                return
            
            print(f"[send_campaign_emails] Found template: {template.name}")
            
            recipients = db.query(models.PhishingRecipient).filter(
                models.PhishingRecipient.campaign_id == campaign_id
            ).all()
            
            print(f"[send_campaign_emails] Found {len(recipients)} recipients")
            
            email_service = EmailService()
            
            # 캠페인의 target_url 사용
            target_url = campaign.target_url or 'https://example.com'
            
            for recipient in recipients:
                try:
                    print(f"[send_campaign_emails] Sending email to {recipient.email}")
                    await email_service.send_phishing_email(
                        recipient_email=recipient.email,
                        recipient_name=recipient.name,
                        template=template,
                        recipient_uuid=recipient.uuid,
                        target_url=target_url
                    )
                    recipient.sent_at = datetime.now()
                    print(f"[send_campaign_emails] Successfully sent email to {recipient.email}")
                except Exception as e:
                    print(f"[send_campaign_emails] Failed to send email to {recipient.email}: {e}")
                    import traceback
                    traceback.print_exc()
            
            db.commit()
            print(f"[send_campaign_emails] Completed sending emails for campaign {campaign_id}")
        except Exception as e:
            print(f"[send_campaign_emails] Error in send_emails_async: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    
    # 이벤트 루프 생성 및 실행
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(send_emails_async())
    except Exception as e:
        print(f"[send_campaign_emails] Error running async function: {e}")
        import traceback
        traceback.print_exc()

