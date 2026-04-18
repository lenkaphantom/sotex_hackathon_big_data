export type FeederStatus = 'normal' | 'high-load' | 'overloaded' | 'offline';

// Feeder status from GET /api/feeders/status
export interface Feeder {
  feederId: number;
  feederName: string;
  status: string;           // Backend: "OK", "OVERLOADED", "SUSPECTED_THEFT", "OFFLINE", "VOLTAGE_DROP"
  angularStatus: FeederStatus; // Mapped for UI color coding
  loadPercent: number | null;
  activeDSCount: number;
  totalDSCount: number;
  imbalancePct: number | null;
  refreshedAt: string;
}

// Dead zones and theft suspects from GET /api/map/
export interface MapPoint {
  id: number;
  name: string;
  feederName: string;
  latitude: number;
  longitude: number;
  pointType: 'dead_zone' | 'theft_suspect';
  riskLevel?: string | null;
  zoneType?: string | null;
  nameplateKVA?: number | null;
  imbalancePct?: number | null;
}

// Network-wide metrics from GET /api/feeders/metrics
export interface NetworkMetrics {
  totalFeeders: number;
  onlineFeeders: number;
  offlineFeeders: number;
  overloadedFeeders?: number;
  avgImbalancePct: number;
  theftSuspects: number;
  deadZones: number;
}

// Alert from GET /api/feeders/alerts
export interface Alert {
  feederId: number;
  feederName: string;
  status: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

// Theft alert from GET /api/theft-alerts/
export interface TheftAlert {
  dsId: number;
  dsName: string;
  feederName: string;
  latitude: number;
  longitude: number;
  avgCurrentA: number | null;
  avgCurrentB: number | null;
  avgCurrentC: number | null;
  imbalancePct: number | null;
  riskLevel: string;
  refreshedAt: string;
}

// Time series data from GET /api/feeders/{id}/chart
export interface TimeSeriesPoint {
  hour: string;
  avgVoltA: number;
  avgCurrentA: number;
  activeMeters: number;
}
