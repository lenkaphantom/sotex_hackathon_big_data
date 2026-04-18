from pydantic import BaseModel
from datetime import datetime

class MapPointResponse(BaseModel):
    """Jedna tačka na Leaflet mapi — i dead zone i theft suspect"""
    id: int
    name: str
    feederName: str
    latitude: float
    longitude: float
    pointType: str      # 'dead_zone' | 'theft_suspect'
    riskLevel: str | None = None    # samo za theft suspects: 'HIGH','MEDIUM','LOW'
    zoneType: str | None = None     # samo za dead zones: 'NO_METER','DEAD_METER'
    nameplateKVA: int | None = None
    imbalancePct: float | None = None

    class Config:
        from_attributes = True