from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# 피싱 템플릿 스키마
class PhishingTemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    is_active: bool = True

class PhishingTemplateCreate(PhishingTemplateBase):
    pass

class PhishingTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    is_active: Optional[bool] = None

class PhishingTemplate(PhishingTemplateBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# 피싱 캠페인 스키마
class PhishingCampaignBase(BaseModel):
    name: str
    template_id: int
    scheduled_at: Optional[datetime] = None

class PhishingCampaignCreate(PhishingCampaignBase):
    recipient_emails: List[EmailStr]

class PhishingCampaign(PhishingCampaignBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# 피싱 수신자 스키마
class PhishingRecipientBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class PhishingRecipient(PhishingRecipientBase):
    id: int
    campaign_id: int
    clicked: bool
    clicked_at: Optional[datetime] = None
    reported: bool
    reported_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# 자산 스키마
class AssetBase(BaseModel):
    name: str
    asset_type: Optional[str] = None
    vendor: Optional[str] = None
    product: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    owner: Optional[str] = None
    is_active: bool = True

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    vendor: Optional[str] = None
    product: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    owner: Optional[str] = None
    is_active: Optional[bool] = None

class Asset(AssetBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# CVE 알림 스키마
class CVEAlertBase(BaseModel):
    cve_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    cvss_score: Optional[float] = None
    published_date: Optional[datetime] = None

class CVEAlert(CVEAlertBase):
    id: int
    asset_id: int
    notified: bool
    notified_at: Optional[datetime] = None
    created_at: datetime
    asset: Optional[Asset] = None
    
    class Config:
        from_attributes = True

