from pydantic import BaseModel

class NetworkMetricsResponse(BaseModel):
    totalFeeders:          int
    onlineFeeders:         int
    offlineFeeders:        int
    overloadedFeeders:     int
    highLoadFeeders:       int
    normalFeeders:         int
    totalConsumers:        int
    estimatedUnregistered: int
    totalConsumptionMW:    float
    totalLossesPct:        float
    avgImbalancePct:       float
    theftSuspects:         int
    deadZones:             int

class AlertResponse(BaseModel):
    feederId:   int
    feederName: str
    status:     str
    message:    str
    severity:   str   # 'critical' | 'warning' | 'info'