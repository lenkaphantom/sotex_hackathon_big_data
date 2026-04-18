from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.theft_repo import get_high_risk_suspects
from app.services.analytics_service import theft_suspect_to_alert

router = APIRouter(prefix="/theft-alerts", tags=["theft"])

@router.get("/")
def get_theft_alerts(db: Session = Depends(get_db)):
    """
    GET /api/theft-alerts
    Samo HIGH risk suspects — za sidebar listu alarma za inspektore.
    """
    suspects = get_high_risk_suspects(db)
    return [theft_suspect_to_alert(s) for s in suspects]