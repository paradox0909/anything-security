from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import phishing, assets, cve

# 데이터베이스 테이블 생성
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시
    Base.metadata.create_all(bind=engine)
    yield
    # 종료 시

app = FastAPI(
    title="Anything Security Platform",
    description="보안 관리 All-in-One 플랫폼",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(phishing.router, prefix="/api/phishing", tags=["phishing"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(cve.router, prefix="/api/cve", tags=["cve"])

@app.get("/")
async def root():
    return {"message": "Anything Security Platform API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

