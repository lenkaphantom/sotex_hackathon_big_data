from pydantic import BaseModel
from datetime import datetime

class TheftAlertResponse(BaseModel):
    dsId: int
    dsName: str
    feederName: str
    latitude: float
    longitude: float
    avgCurrentA: float | None
    avgCurrentB: float | None
    avgCurrentC: float | None
    imbalancePct: float | None
    riskLevel: str      # 'HIGH' | 'MEDIUM' | 'LOW'
    refreshedAt: datetime

    class Config:
        from_attributes = True