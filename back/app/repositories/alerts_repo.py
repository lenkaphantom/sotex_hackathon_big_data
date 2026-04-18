from sqlalchemy.orm import Session
from sqlalchemy import text

def get_alerts(db: Session) -> list[dict]:
    """
    Generiše listu alertova na backendu — frontend samo renderuje.
    Prioritet: OVERLOADED > SUSPECTED_THEFT > VOLTAGE_DROP > dead meters
    """
    rows = db.execute(text("""
        SELECT TOP 50
            fs.FeederId,
            fs.FeederName,
            fs.Status,
            fs.CurrentImbalancePct,
            fs.DeadMeterCount,
            fs.NoMeterCount,
            fs.ActiveDSCount,
            fs.TotalDSCount
        FROM dbo.mv_feeder_status fs
        WHERE fs.Status != 'OK'
        ORDER BY
            CASE fs.Status
                WHEN 'OVERLOADED'      THEN 1
                WHEN 'SUSPECTED_THEFT' THEN 2
                WHEN 'VOLTAGE_DROP'    THEN 3
                WHEN 'OFFLINE'         THEN 4
                ELSE 5
            END,
            fs.CurrentImbalancePct DESC
    """)).mappings().all()

    alerts = []
    for r in rows:
        message, severity = _build_alert_message(r)
        alerts.append({
            "feederId":   r["FeederId"],
            "feederName": r["FeederName"],
            "status":     r["Status"],
            "message":    message,
            "severity":   severity,   # 'critical' | 'warning' | 'info'
        })

    return alerts


def _build_alert_message(r) -> tuple[str, str]:
    status = r["Status"]
    imbalance = r["CurrentImbalancePct"] or 0
    dead = r["DeadMeterCount"] or 0
    no_meter = r["NoMeterCount"] or 0

    if status == "OVERLOADED":
        return f"Overloaded — imbalance {imbalance:.1f}%", "critical"

    if status == "SUSPECTED_THEFT":
        return f"High losses — possible theft ({imbalance:.1f}% imbalance)", "critical"

    if status == "VOLTAGE_DROP":
        return f"Voltage drop detected — {dead} dead meters", "warning"

    if status == "OFFLINE":
        return "Feeder offline — no data", "critical"

    return f"{no_meter} unregistered consumers detected", "info"