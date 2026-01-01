#!/usr/bin/env python3
"""
HTML 이메일 발송 테스트 스크립트
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

# .env 파일에서 직접 읽기 (dotenv 없이)
def load_env():
    env_file = '.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env()

# SMTP 설정
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "").strip()
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Security Team")
USE_STARTTLS = os.getenv("SMTP_STARTTLS", "false").lower() == "true"
USE_SSL = os.getenv("SMTP_SSL_TLS", "false").lower() == "true"

# 테스트 수신자
TEST_RECIPIENT = input("수신자 이메일을 입력하세요: ").strip()

# HTML 본문
html_body = """
<html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h1 style="color: #333;">HTML 이메일 테스트</h1>
            <p>이 메일은 HTML 형식으로 전송된 테스트 메일입니다.</p>
            <p>이미지 테스트:</p>
            <img src="https://via.placeholder.com/300x100.png?text=Test+Image" alt="Test Image" style="max-width: 100%; height: auto;" />
            <p style="margin-top: 20px;">이 메일이 정상적으로 HTML로 렌더링되면 성공입니다!</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">이 메일은 자동으로 생성되었습니다.</p>
        </div>
    </body>
</html>
"""

print(f"\n=== 이메일 발송 테스트 ===")
print(f"SMTP Host: {SMTP_HOST}")
print(f"SMTP Port: {SMTP_PORT}")
print(f"SMTP User: {SMTP_USER}")
print(f"From: {SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>")
print(f"To: {TEST_RECIPIENT}")
print(f"Use STARTTLS: {USE_STARTTLS}")
print(f"Use SSL: {USE_SSL}")
print()

# MIMEMultipart로 메시지 생성
msg = MIMEMultipart()
msg['Subject'] = "HTML 이메일 테스트"
msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
msg['To'] = TEST_RECIPIENT

# HTML 본문 첨부
mimetext = MIMEText(html_body, "html", "utf-8")
msg.attach(mimetext)

try:
    print("SMTP 서버에 연결 중...")
    
    # SMTP 연결
    if USE_SSL:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    
    server.ehlo()
    
    if USE_STARTTLS:
        print("STARTTLS 시작...")
        server.starttls()
        server.ehlo()
    
    # 인증
    if SMTP_USER and SMTP_PASSWORD:
        print("SMTP 인증 중...")
        server.login(SMTP_USER, SMTP_PASSWORD)
    
    # 메일 발송
    print("이메일 발송 중...")
    server.sendmail(SMTP_FROM_EMAIL, [TEST_RECIPIENT], msg.as_string())
    server.quit()
    
    print("\n✅ 이메일이 성공적으로 발송되었습니다!")
    print(f"수신자: {TEST_RECIPIENT}")
    print("\n메일함을 확인해보세요. HTML이 정상적으로 렌더링되는지 확인하세요.")
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ SMTP 인증 실패: {e}")
    print("SMTP_USER와 SMTP_PASSWORD를 확인하세요.")
except smtplib.SMTPException as e:
    print(f"\n❌ SMTP 오류: {e}")
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()

