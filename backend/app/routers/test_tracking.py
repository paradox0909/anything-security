from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app import models
from app.services.tracking_service import TrackingService

router = APIRouter()


@router.get("/check", response_class=HTMLResponse)
def check_activity(
    rid: str,
    target_url: str = "https://example.com",
    db: Session = Depends(get_db),
):
    """
    클릭 감지 엔드포인트 (메일 버튼 클릭용)

    - rid: recipient uuid
    - target_url: 클릭 후 이동할 URL (기본 example.com)
    """
    recipient = TrackingService.get_recipient_by_uuid(rid, db)
    if recipient and not recipient.clicked:
        recipient.clicked = True
        recipient.clicked_at = datetime.now()
        db.commit()

    # 일반적으로는 실제 목적지로 리다이렉트시키는 게 자연스럽다.
    # 개발/테스트에서 "클릭 감지"만 확인하고 싶으면 HTMLResponse로도 볼 수 있게 한다.
    if target_url:
        return RedirectResponse(url=target_url)

    return HTMLResponse(
        "<html><body><h2>Click tracked</h2><p>Thanks.</p></body></html>"
    )


