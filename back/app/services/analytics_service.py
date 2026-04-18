from app.models.staging import DeadZone, TheftSuspect

def dead_zone_to_map_point(dz: DeadZone) -> dict:
    return {
        "id":           dz.DSId,
        "name":         dz.DSName,
        "feederName":   dz.FeederName,
        "latitude":     dz.Latitude,
        "longitude":    dz.Longitude,
        "pointType":    "dead_zone",
        "riskLevel":    None,
        "zoneType":     dz.ZoneType,
        "nameplateKVA": dz.NameplateKVA,
        "imbalancePct": None,
    }

def theft_suspect_to_map_point(ts: TheftSuspect) -> dict:
    return {
        "id":           ts.DSId,
        "name":         ts.DSName,
        "feederName":   ts.FeederName,
        "latitude":     ts.Latitude,
        "longitude":    ts.Longitude,
        "pointType":    "theft_suspect",
        "riskLevel":    ts.RiskLevel,
        "zoneType":     None,
        "nameplateKVA": None,
        "imbalancePct": ts.CurrentImbalancePct,
    }

def theft_suspect_to_alert(ts: TheftSuspect) -> dict:
    return {
        "dsId":        ts.DSId,
        "dsName":      ts.DSName,
        "feederName":  ts.FeederName,
        "latitude":    ts.Latitude,
        "longitude":   ts.Longitude,
        "avgCurrentA": ts.AvgCurrentA,
        "avgCurrentB": ts.AvgCurrentB,
        "avgCurrentC": ts.AvgCurrentC,
        "imbalancePct": ts.CurrentImbalancePct,
        "riskLevel":   ts.RiskLevel,
        "refreshedAt": ts.RefreshedAt,
    }