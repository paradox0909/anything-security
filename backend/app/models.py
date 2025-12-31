from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# 피싱 메일 템플릿
class PhishingTemplate(Base):
    __tablename__ = "phishing_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    sender_email = Column(String(255))
    sender_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    campaigns = relationship("PhishingCampaign", back_populates="template")

# 피싱 캠페인
class PhishingCampaign(Base):
    __tablename__ = "phishing_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    template_id = Column(Integer, ForeignKey("phishing_templates.id"))
    status = Column(String(50), default="draft")  # draft, scheduled, sent, completed
    scheduled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    template = relationship("PhishingTemplate", back_populates="campaigns")
    recipients = relationship("PhishingRecipient", back_populates="campaign")

# 피싱 수신자
class PhishingRecipient(Base):
    __tablename__ = "phishing_recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("phishing_campaigns.id"))
    email = Column(String(255), nullable=False)
    name = Column(String(255))
    clicked = Column(Boolean, default=False)
    clicked_at = Column(DateTime(timezone=True))
    reported = Column(Boolean, default=False)
    reported_at = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaign = relationship("PhishingCampaign", back_populates="recipients")

# 자산 정보
class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(100))  # software, hardware, service
    vendor = Column(String(255))
    product = Column(String(255))
    version = Column(String(100))
    description = Column(Text)
    location = Column(String(255))
    owner = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    cve_alerts = relationship("CVEAlert", back_populates="asset")

# CVE 알림
class CVEAlert(Base):
    __tablename__ = "cve_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    cve_id = Column(String(50), nullable=False)  # CVE-2024-1234
    title = Column(String(500))
    description = Column(Text)
    severity = Column(String(50))  # CRITICAL, HIGH, MEDIUM, LOW
    cvss_score = Column(Float)
    published_date = Column(DateTime(timezone=True))
    notified = Column(Boolean, default=False)
    notified_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    asset = relationship("Asset", back_populates="cve_alerts")

