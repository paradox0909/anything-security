import uuid
from sqlalchemy.orm import Session
from app import models

class TrackingService:
    @staticmethod
    def generate_uuid() -> str:
        """수신자별 고유 UUID 생성"""
        return str(uuid.uuid4())
    
    @staticmethod
    def get_recipient_by_uuid(recipient_uuid: str, db: Session):
        """UUID로 수신자 조회"""
        recipient = db.query(models.PhishingRecipient).filter(
            models.PhishingRecipient.uuid == recipient_uuid
        ).first()
        return recipient

