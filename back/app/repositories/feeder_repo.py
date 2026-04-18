from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.staging import FeederStatus

def get_all_feeders(db: Session):
    return db.query(FeederStatus).all()

def get_feeder_by_id(db: Session, feeder_id: int):
    return db.query(FeederStatus).filter(FeederStatus.FeederId == feeder_id).first()

def get_network_metrics(db: Session) -> dict:
    row = db.execute(text("""
        SELECT
            COUNT(*)                                         AS total_feeders,
            SUM(CASE WHEN Status != 'OFFLINE' THEN 1 END)   AS online_feeders,
            SUM(CASE WHEN Status = 'OFFLINE'  THEN 1 END)   AS offline_feeders,
            SUM(CASE WHEN Status = 'OVERLOADED' THEN 1 END) AS overloaded,
            AVG(CurrentImbalancePct)                         AS avg_imbalance
        FROM dbo.mv_feeder_status
    """)).mappings().one()

    theft_count = db.execute(
        text("SELECT COUNT(*) FROM dbo.mv_theft_suspects WHERE RiskLevel = 'HIGH'")
    ).scalar()

    dead_count = db.execute(
        text("SELECT COUNT(*) FROM dbo.mv_dead_zones")
    ).scalar()

    return {
        "totalFeeders":      row["total_feeders"],
        "onlineFeeders":     row["online_feeders"],
        "offlineFeeders":    row["offline_feeders"],
        "overloadedFeeders": row["overloaded"],
        "avgImbalancePct":   round(row["avg_imbalance"] or 0, 2),
        "theftSuspects":     theft_count,
        "deadZones":         dead_count,
    }