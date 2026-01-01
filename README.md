# Anything Security Platform

보안 관리 All-in-One 플랫폼

## 주요 기능

### 1. 피싱 메일 훈련 솔루션
- 피싱 메일 템플릿 관리
- 사용자별 맞춤 메일 발송
- 클릭/응답 추적 및 통계
- 메일 오픈 추적 (Tracking Pixel)

### 2. 자산 정보 관리 및 CVE 모니터링
- 자산 정보 등록 및 관리
- CVE 자동 모니터링
- Slack 알림 통합

## 기술 스택

- **Backend**: FastAPI
- **Database**: MySQL
- **Frontend**: React
- **Email**: FastAPI-Mail (sendmail 지원)
- **Notifications**: Slack API

## 프로젝트 구조

```
anything-security/
├── backend/          # FastAPI 백엔드
├── frontend/         # React 프론트엔드
├── database/         # 데이터베이스 스키마 및 마이그레이션
└── docker-compose.yml
```

## 설치 및 실행

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Email 설정 (sendmail 사용 시)
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USER=dokingkns2006@gmail.com
SMTP_PASSWORD=your-app-password-here
# 발신자 이메일 (피싱 메일을 보낼 이메일 주소)
SMTP_FROM_EMAIL=dokingkns2006@gmail.com
SMTP_FROM_NAME=Security Team
SMTP_STARTTLS=false
SMTP_SSL_TLS=false

# 테스트 수신자 이메일 (필수) - 피싱 메일을 받을 이메일 주소
TEST_EMAIL=recipient@example.com

# Slack (선택사항)
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C1234567890

# NVD API (선택사항, CVE 모니터링 속도 향상용)
NVD_API_KEY=your-nvd-api-key-here

# API Base URL
API_BASE_URL=http://localhost:8000
```

**중요**: 
- `SMTP_USER`와 `SMTP_FROM_EMAIL`: 피싱 메일을 **보낼** 이메일 주소 (발신자)
  - 예: `dokingkns2006@gmail.com`
  - 프론트엔드에서 변경 불가, env에서만 관리
- `SMTP_PASSWORD`: Gmail 앱 비밀번호
- `TEST_EMAIL`: 테스트용 기본 수신자 이메일 (선택사항)
  - 웹에서 수신자 이메일을 직접 입력할 수 있습니다
  - 이 값은 "테스트 이메일 사용" 버튼에만 사용됩니다

### 2. Docker Compose로 실행

```bash
docker-compose up -d --build
```

### 3. 서비스 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs
- MySQL: localhost:3306

### 4. 로그 확인

```bash
docker-compose logs -f
```

### 5. 서비스 중지

```bash
docker-compose down
```

## 사용 방법

### 1. 피싱 메일 훈련
1. "이메일 템플릿" 메뉴에서 템플릿을 생성합니다
2. "캠페인" 메뉴에서 캠페인을 생성합니다
3. 수신자 이메일은 `.env` 파일의 `TEST_EMAIL`로 자동 설정됩니다
4. 캠페인 생성 시 자동으로 이메일이 발송됩니다

### 2. 자산 관리 및 CVE 모니터링
1. "자산 관리" 메뉴에서 IT 자산을 등록합니다 (벤더, 제품, 버전 정보 포함)
2. "CVE 모니터링" 메뉴에서 자산별 CVE 스캔을 실행합니다
3. 새로운 CVE가 발견되면 자동으로 Slack 알림이 발송됩니다

## Gmail 앱 비밀번호 설정

Gmail을 사용하는 경우:

1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 비밀번호를 `.env` 파일의 `SMTP_PASSWORD`에 입력

## 주의사항

- 수신자 이메일은 프론트엔드에서 입력할 수 없으며, `.env` 파일의 `TEST_EMAIL`로만 관리됩니다
- 이메일 발송은 FastAPI-Mail을 통해 sendmail 또는 SMTP로 처리됩니다
