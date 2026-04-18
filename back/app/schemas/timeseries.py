from pydantic import BaseModel
from datetime import datetime

class TimeseriesPointResponse(BaseModel):
    hour: datetime
    avgVoltA: float | None
    avgCurrentA: float | None
    activeMeters: int | None

    class Config:
        from_attributes = True