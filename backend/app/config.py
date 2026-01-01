import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://security_user:security_password@mysql:3306/security_platform")
    
    # Email (FastAPI-Mail)
    MAIL_USERNAME: str = os.getenv("SMTP_USER", "")
    MAIL_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    MAIL_FROM: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@security.local")
    MAIL_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Security Team")
    MAIL_PORT: int = int(os.getenv("SMTP_PORT", "25"))
    MAIL_SERVER: str = os.getenv("SMTP_HOST", "localhost")
    MAIL_STARTTLS: bool = os.getenv("SMTP_STARTTLS", "false").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("SMTP_SSL_TLS", "false").lower() == "true"
    MAIL_USE_CREDENTIALS: bool = True
    MAIL_VALIDATE_CERTS: bool = True
    
    # API
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    class Config:
        env_file = ".env"

settings = Settings()

