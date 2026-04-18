export type FeederStatus = 'normal' | 'high-load' | 'overloaded' | 'offline';

export interface LatLng {
  lat: number;
  lng: number;
}

// Feeder status from /feeders/status endpoint
export interface Feeder {
  feederId: number;
  feederName: string;
  status: string; // Backend status like "OK", "OVERLOADED", "SUSPECTED_THEFT"
  angularStatus: FeederStatus; // Mapped status for UI color coding
  loadPercent: number;
  activeDSCount: number;
  totalDSCount: number;
  imbalancePct: number;
  refreshedAt: string;
}

// Dead zones and theft suspects - points on the map
export interface MapPoint {
  id: number;
  name: string;
  feederName: string;
  latitude: number;
  longitude: number;
  pointType: 'dead_zone' | 'theft_suspect';
  riskLevel?: string;
  zoneType?: string;
  nameplateKVA?: number;
  imbalancePct?: number;
}

// Network metrics from /feeders/metrics
export interface NetworkMetrics {
  totalFeeders: number;
  onlineFeeders: number;
  offlineFeeders: number;
  overloadedFeeders?: number;
  avgImbalancePct: number;
  theftSuspects: number;
  deadZones: number;
}

// Time series data from /feeders/{id}/chart
export interface TimeSeriesPoint {
  hour: string;
  avgVoltA: number;
  avgCurrentA: number;
  activeMeters: number;
}

// Legacy interfaces for backward compatibility
export interface Substation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'transmission' | 'distribution';
  nameplateKVA: number;
}

export interface Transformer {
  id: string;
  name: string;
  lat: number;
  lng: number;
  feederId: string;
  nameplateKVA: number;
}

export interface Outage {
  id: string;
  lat: number;
  lng: number;
  feederId: string;
  startTime: Date;
  affectedConsumers: number;
}
