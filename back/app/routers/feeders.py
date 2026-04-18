from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.feeder_repo import (
    get_all_feeders,
    get_feeder_by_id,
    get_network_metrics,
)
from app.repositories.timeseries_repo import get_timeseries_for_feeder
from app.services.feeder_service import to_map_response

router = APIRouter(prefix="/feeders", tags=["feeders"])

@router.get("/status")
def feeder_status(db: Session = Depends(get_db)):
    """
    GET /api/feeders/status
    Svi feederi sa statusom — 435 feedera.
    Angular boji polyline na mapi po angularStatus polju.
    """
    return [to_map_response(f) for f in get_all_feeders(db)]

@router.get("/metrics")
def network_metrics(db: Session = Depends(get_db)):
    """
    GET /api/feeders/metrics
    Agregirane metrike za header/sidebar widget.
    """
    return get_network_metrics(db)

@router.get("/{feeder_id}/chart")
def feeder_chart(feeder_id: int, db: Session = Depends(get_db)):
    """
    GET /api/feeders/{id}/chart
    24h timeseries za Chart komponentu — struja i napon po satu.
    Vraća prazan niz ako feeder nema podataka (ne 404).
    """
    rows = get_timeseries_for_feeder(db, feeder_id)
    return [
        {
            "hour":         r.HourBucket,
            "avgVoltA":     r.AvgVoltA,
            "avgCurrentA":  r.AvgCurrentA,
            "activeMeters": r.ActiveMeters,
        }
        for r in rows
    ]

@router.get("/{feeder_id}")
def get_feeder(feeder_id: int, db: Session = Depends(get_db)):
    f = get_feeder_by_id(db, feeder_id)
    if not f:
        raise HTTPException(status_code=404, detail="Feeder not found")
    return to_map_response(f)