import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

class EmailService:
    def __init__(self):
        self.api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    async def send_phishing_email(self, recipient_email: str, recipient_name: str, template, recipient_uuid: str, target_url: str = "https://example.com"):
        """피싱 메일 발송 (smtplib + MIMEText 사용) - HTML 그대로 사용"""
        # 추적 URL 생성
        open_tracking_url = f"{self.api_base_url}/api/phishing/track/open/{recipient_uuid}"
        click_tracking_url = f"{self.api_base_url}/api/phishing/track/click/{recipient_uuid}?target_url={target_url}"
        report_url = f"{self.api_base_url}/api/phishing/track/report/{recipient_uuid}"
        
        # 템플릿의 HTML을 그대로 사용
        html_body = template.body or ""
        
        # 이메일 클라이언트는 <script> 실행이 거의 모두 차단되므로,
        # "스크립트 추적" 대신 아래 플레이스홀더 치환 + 픽셀/링크 추적을 사용한다.
        # 지원 플레이스홀더:
        # - {{click_url}}: 클릭 추적 링크(리다이렉트)
        # - {{check_activity_url}}: 클릭 감지 전용 엔드포인트(/api/test/check)
        # - {{report_url}}: 신고(피싱 신고) 엔드포인트
        # - {{open_tracking_url}}: 오픈 트래킹 픽셀 URL
        # - {{tracking_pixel}}: <img ...> 픽셀 태그 자체
        # - {{email}} / tempmail: 수신자 이메일 치환
        check_activity_url = f"{self.api_base_url}/api/test/check?rid={recipient_uuid}&target_url={target_url}"
        placeholders = {
            "{{click_url}}": click_tracking_url,
            "{{ click_url }}": click_tracking_url,
            "{{check_activity_url}}": check_activity_url,
            "{{ check_activity_url }}": check_activity_url,
            "{{report_url}}": report_url,
            "{{ report_url }}": report_url,
            "{{open_tracking_url}}": open_tracking_url,
            "{{ open_tracking_url }}": open_tracking_url,
            "{{email}}": recipient_email,
            "{{ email }}": recipient_email,
            "tempmail": recipient_email,
        }
        for key, value in placeholders.items():
            if key in html_body:
                html_body = html_body.replace(key, value)
        
        # Tracking Pixel 추가 (플레이스홀더가 있으면 그 자리에, 없으면 </body> 앞에 삽입)
        tracking_pixel = f'<img src="{open_tracking_url}" width="1" height="1" style="display:none;" />'
        if "{{tracking_pixel}}" in html_body:
            html_body = html_body.replace("{{tracking_pixel}}", tracking_pixel)
        elif "{{ tracking_pixel }}" in html_body:
            html_body = html_body.replace("{{ tracking_pixel }}", tracking_pixel)
        else:
            if "</body>" in html_body:
                html_body = html_body.replace("</body>", f"{tracking_pixel}</body>")
            else:
                html_body += tracking_pixel
        
        # 발신자 정보 설정 (환경변수에서만 가져오기 - 1명만 지정)
        sender_email = os.getenv("SMTP_FROM_EMAIL", "")
        if not sender_email:
            raise ValueError("SMTP_FROM_EMAIL environment variable is required.")
        sender_name = os.getenv("SMTP_FROM_NAME", "Security Team")
        
        # SMTP 설정
        smtp_host = os.getenv("SMTP_HOST", "localhost")
        smtp_port = int(os.getenv("SMTP_PORT", "25"))
        smtp_user = os.getenv("SMTP_USER", "").strip()
        smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
        use_starttls = os.getenv("SMTP_STARTTLS", "false").lower() == "true"
        use_ssl = os.getenv("SMTP_SSL_TLS", "false").lower() == "true"
        
        # 테스트 스크립트(test_email.py)와 동일하게: multipart + HTML 1개만 attach
        msg = MIMEMultipart()
        msg['Subject'] = template.subject
        # 발신자 1명만 지정 (환경변수에서 가져온 값만 사용)
        msg['From'] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
        msg['To'] = recipient_email
        
        # HTML 본문만 첨부 (Naver 등 일부 클라이언트에서 plain 파트를 우선 표시하는 케이스 회피)
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        
        try:
            print(f"[EmailService] Sending email via SMTP to {recipient_email}")
            # 디버깅: 실제로 어떤 Content-Type으로 나가는지 헤더 일부 출력
            try:
                preview = msg.as_string().splitlines()[:12]
                print("[EmailService] MIME headers preview:")
                for line in preview:
                    print(f"[EmailService] {line}")
            except Exception:
                pass
            
            # SMTP 연결
            if use_ssl:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port)
            
            server.ehlo()
            
            if use_starttls:
                server.starttls()
                server.ehlo()  # STARTTLS 후 다시 EHLO 호출
            
            # 인증
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            
            # 메일 발송
            server.sendmail(sender_email, [recipient_email], msg.as_string())
            server.quit()
            
            print(f"[EmailService] Email sent successfully to {recipient_email}")
        except Exception as e:
            error_msg = f"Failed to send email to {recipient_email}: {e}"
            print(f"[EmailService] ERROR: {error_msg}")
            raise
