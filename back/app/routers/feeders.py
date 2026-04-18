from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.feeder_repo import (
    get_all_feeders, get_feeder_by_id, get_network_metrics
)
from app.repositories.timeseries_repo import get_timeseries_for_feeder
from app.repositories.alerts_repo import get_alerts
from app.services.feeder_service import to_map_response

router = APIRouter(prefix="/feeders", tags=["feeders"])

@router.get("/status")
def feeder_status(db: Session = Depends(get_db)):
    """435 feedera sa statusom i bojom za Leaflet polyline"""
    return [to_map_response(f) for f in get_all_feeders(db)]

@router.get("/metrics")
def network_metrics(db: Session = Depends(get_db)):
    """
    Sve metrike za sidebar odjednom:
    consumption, losses, consumers, unregistered, status counts
    """
    return get_network_metrics(db)

@router.get("/alerts")
def feeder_alerts(db: Session = Depends(get_db)):
    """
    Lista alertova sa porukom i severityjem — frontend samo renderuje listu.
    Sortiran po prioritetu: critical prvo.
    """
    return get_alerts(db)

@router.get("/{feeder_id}/chart")
def feeder_chart(feeder_id: int, db: Session = Depends(get_db)):
    """24h timeseries za Chart komponentu"""
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