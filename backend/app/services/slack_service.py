import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

class SlackService:
    def __init__(self):
        self.token = os.getenv("SLACK_BOT_TOKEN")
        self.channel_id = os.getenv("SLACK_CHANNEL_ID")
        self.client = WebClient(token=self.token) if self.token else None
    
    def send_cve_alert(self, asset, alert):
        """CVE 알림을 Slack으로 발송"""
        if not self.client or not self.channel_id:
            print("Slack not configured. Notification not sent.")
            return
        
        severity_emoji = {
            "CRITICAL": "🔴",
            "HIGH": "🟠",
            "MEDIUM": "🟡",
            "LOW": "🟢"
        }
        
        emoji = severity_emoji.get(alert.severity, "⚪")
        
        message = f"""
{emoji} *CVE 알림*

*자산 정보*
• 이름: {asset.name}
• 벤더: {asset.vendor}
• 제품: {asset.product}
• 버전: {asset.version}

*CVE 정보*
• CVE ID: {alert.cve_id}
• 심각도: {alert.severity or 'N/A'}
• CVSS 점수: {alert.cvss_score or 'N/A'}
• 제목: {alert.title or 'N/A'}

*설명*
{alert.description or '설명 없음'}

자세한 정보: https://nvd.nist.gov/vuln/detail/{alert.cve_id}
"""
        
        try:
            self.client.chat_postMessage(
                channel=self.channel_id,
                text=message
            )
        except SlackApiError as e:
            print(f"Slack API error: {e.response['error']}")
            raise

