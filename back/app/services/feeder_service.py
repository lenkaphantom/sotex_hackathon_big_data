from app.models.staging import FeederStatus

STATUS_MAP = {
    "OK":               "normal",
    "VOLTAGE_DROP":     "high-load",
    "OVERLOADED":       "overloaded",
    "SUSPECTED_THEFT":  "high-load",
    "OFFLINE":          "offline",
}

def to_map_response(f: FeederStatus) -> dict:
    load_pct = None
    if f.CapacityKVA and f.CapacityKVA > 0 and f.AvgCurrentA:
        load_pct = round((f.AvgCurrentA / f.CapacityKVA) * 100, 1)

    return {
        "feederId":       f.FeederId,
        "feederName":     f.FeederName,
        "status":         f.Status,
        "angularStatus":  STATUS_MAP.get(f.Status, "normal"),
        "loadPercent":    load_pct,
        "activeDSCount":  f.ActiveDSCount or 0,
        "totalDSCount":   f.TotalDSCount or 0,
        "imbalancePct":   f.CurrentImbalancePct,
        "refreshedAt":    f.RefreshedAt,
    }