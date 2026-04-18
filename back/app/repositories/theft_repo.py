from sqlalchemy.orm import Session
from app.models.staging import TheftSuspect

def get_high_risk_suspects(db: Session):
    """Samo HIGH risk — za /api/theft-alerts"""
    return (
        db.query(TheftSuspect)
        .filter(TheftSuspect.RiskLevel == "HIGH")
        .order_by(TheftSuspect.CurrentImbalancePct.desc())
        .all()
    )

def get_all_suspects(db: Session):
    """Svi rizici — koristi se za /api/map"""
    return db.query(TheftSuspect).all()