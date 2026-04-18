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
            COUNT(*)                                                    AS total_feeders,
            SUM(CASE WHEN Status != 'OFFLINE' THEN 1 ELSE 0 END)       AS online_feeders,
            SUM(CASE WHEN Status = 'OFFLINE'  THEN 1 ELSE 0 END)       AS offline_feeders,
            SUM(CASE WHEN Status = 'OVERLOADED' THEN 1 ELSE 0 END)     AS overloaded_feeders,
            SUM(CASE WHEN Status IN ('VOLTAGE_DROP','SUSPECTED_THEFT')
                          THEN 1 ELSE 0 END)                            AS high_load_feeders,
            SUM(CASE WHEN Status = 'OK' THEN 1 ELSE 0 END)             AS normal_feeders,

            -- Consumers
            SUM(ISNULL(ActiveDSCount, 0))                               AS total_consumers,
            SUM(ISNULL(NoMeterCount, 0))                                AS est_unregistered,

            -- Consumption: I(A) * V(11kV) * sqrt(3) / 1,000,000 = MW
            -- Koristimo 11000V kao standardni napon 11kV feedera u Lagosu
            SUM(
                ISNULL(AvgCurrentA, 0) * 11000.0 * 1.732 / 1000000.0
            )                                                           AS total_consumption_mw,

            -- Gubici: prosek CurrentImbalancePct kao proxy za losses
            AVG(ISNULL(CurrentImbalancePct, 0))                        AS avg_losses_pct,
            AVG(ISNULL(CurrentImbalancePct, 0))                        AS avg_imbalance_pct

        FROM dbo.mv_feeder_status
    """)).mappings().one()

    theft_count = db.execute(
        text("SELECT COUNT(*) FROM dbo.mv_theft_suspects WHERE RiskLevel = 'HIGH'")
    ).scalar()

    dead_count = db.execute(
        text("SELECT COUNT(*) FROM dbo.mv_dead_zones")
    ).scalar()

    return {
        "totalFeeders":          row["total_feeders"],
        "onlineFeeders":         row["online_feeders"],
        "offlineFeeders":        row["offline_feeders"],
        "overloadedFeeders":     row["overloaded_feeders"],
        "highLoadFeeders":       row["high_load_feeders"],
        "normalFeeders":         row["normal_feeders"],
        "totalConsumers":        row["total_consumers"],
        "estimatedUnregistered": row["est_unregistered"],
        "totalConsumptionMW":    round(row["total_consumption_mw"] or 0, 1),
        "totalLossesPct":        round(row["avg_losses_pct"] or 0, 1),
        "avgImbalancePct":       round(row["avg_imbalance_pct"] or 0, 2),
        "theftSuspects":         theft_count,
        "deadZones":             dead_count,
    }