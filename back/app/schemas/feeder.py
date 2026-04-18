from pydantic import BaseModel
from datetime import datetime

class FeederMapResponse(BaseModel):
    feederId: int
    feederName: str
    status: str             # iz baze: 'OK','OVERLOADED',...
    angularStatus: str      # za Angular: 'normal','overloaded',...
    loadPercent: float | None
    activeDSCount: int
    totalDSCount: int
    imbalancePct: float | None
    refreshedAt: datetime

    class Config:
        from_attributes = True

class NetworkMetricsResponse(BaseModel):
    totalFeeders: int
    onlineFeeders: int
    offlineFeeders: int
    overloadedFeeders: int
    theftSuspects: int
    deadZones: int
    avgImbalancePct: float