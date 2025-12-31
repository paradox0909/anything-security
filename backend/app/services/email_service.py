import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)
    
    def send_phishing_email(self, recipient_email: str, template, tracking_token: str):
        """피싱 메일 발송"""
        if not self.smtp_user or not self.smtp_password:
            print("SMTP credentials not configured. Email not sent.")
            return
        
        # 템플릿에 추적 토큰 추가
        body_template = Template(template.body)
        tracking_url = f"http://localhost:8000/api/phishing/track/click/{tracking_token}"
        report_url = f"http://localhost:8000/api/phishing/track/report/{tracking_token}"
        
        # HTML 본문에 추적 링크 추가
        html_body = body_template.render(
            tracking_url=tracking_url,
            report_url=report_url
        )
        
        # 기본 링크가 없으면 추가
        if tracking_url not in html_body:
            html_body += f'<br><br><a href="{tracking_url}">링크 클릭</a>'
            html_body += f'<br><a href="{report_url}">피싱 신고</a>'
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = template.subject
        msg["From"] = template.sender_email or self.smtp_from_email
        msg["To"] = recipient_email
        
        if template.sender_name:
            msg["From"] = f"{template.sender_name} <{msg['From']}>"
        
        msg.attach(MIMEText(html_body, "html"))
        
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
        except Exception as e:
            print(f"Failed to send email: {e}")
            raise

