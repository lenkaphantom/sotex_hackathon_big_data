from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.map_repo import get_all_map_points
from app.services.analytics_service import (
    dead_zone_to_map_point,
    theft_suspect_to_map_point,
)

router = APIRouter(prefix="/map", tags=["map"])

@router.get("/")
def get_map_points(db: Session = Depends(get_db)):
    """
    GET /api/map
    Vraća sve tačke za Leaflet — dead zones + theft suspects.
    13k+ tačaka, Angular ih renderuje kao markere u boji po pointType/riskLevel.
    """
    dead_zones, theft_suspects = get_all_map_points(db)

    points = []
    points.extend(dead_zone_to_map_point(dz) for dz in dead_zones)
    points.extend(theft_suspect_to_map_point(ts) for ts in theft_suspects)

    return points