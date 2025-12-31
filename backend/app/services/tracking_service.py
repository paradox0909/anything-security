import hashlib
import hmac
from sqlalchemy.orm import Session
from app import models

class TrackingService:
    SECRET_KEY = "your-secret-key-change-in-production"
    
    @staticmethod
    def generate_token(recipient_id: int) -> str:
        """수신자 ID를 기반으로 추적 토큰 생성"""
        message = f"recipient_{recipient_id}"
        token = hmac.new(
            TrackingService.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{recipient_id}_{token[:16]}"
    
    @staticmethod
    def get_recipient_by_token(token: str, db: Session):
        """토큰에서 수신자 ID 추출 및 조회"""
        try:
            recipient_id = int(token.split("_")[0])
            recipient = db.query(models.PhishingRecipient).filter(
                models.PhishingRecipient.id == recipient_id
            ).first()
            return recipient
        except (ValueError, IndexError):
            return None

