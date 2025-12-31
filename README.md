# Anything Security Platform

보안 관리 All-in-One 플랫폼

## 주요 기능

### 1. 피싱 메일 훈련 솔루션
- 피싱 메일 템플릿 관리
- 사용자별 맞춤 메일 발송
- 클릭/응답 추적 및 통계

### 2. 자산 정보 관리 및 CVE 모니터링
- 자산 정보 등록 및 관리
- CVE 자동 모니터링
- Slack 알림 통합

## 기술 스택

- **Backend**: FastAPI
- **Database**: MySQL
- **Frontend**: React
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

### Docker Compose를 사용한 실행 (권장)

1. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 입력하세요
```

2. Docker Compose로 모든 서비스 실행
```bash
docker-compose up -d
```

3. 서비스 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs
- MySQL: localhost:3306

4. 로그 확인
```bash
docker-compose logs -f
```

5. 서비스 중지
```bash
docker-compose down
```

### 수동 설치 및 실행

#### Backend
```bash
cd backend
pip install -r requirements.txt
# .env 파일 설정 필요
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### Database
MySQL 데이터베이스를 설정하고 컨테이너가 자동으로 테이블을 생성합니다.

## 환경 변수 설정

`.env` 파일에 다음 변수들을 설정하세요:

- `SLACK_BOT_TOKEN`: Slack Bot Token (CVE 알림용)
- `SLACK_CHANNEL_ID`: Slack 채널 ID
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`: 이메일 발송 설정 (피싱 훈련용)
- `NVD_API_KEY`: NVD API 키 (선택사항, CVE 검색 속도 향상)

## 사용 방법

### 1. 피싱 메일 훈련
1. "피싱 훈련" 메뉴에서 템플릿을 생성합니다
2. 캠페인을 생성하여 수신자에게 메일을 발송합니다
3. 수신자의 클릭 및 신고 여부를 추적합니다

### 2. 자산 관리 및 CVE 모니터링
1. "자산 관리" 메뉴에서 IT 자산을 등록합니다 (벤더, 제품, 버전 정보 포함)
2. "CVE 모니터링" 메뉴에서 자산별 CVE 스캔을 실행합니다
3. 새로운 CVE가 발견되면 자동으로 Slack 알림이 발송됩니다
