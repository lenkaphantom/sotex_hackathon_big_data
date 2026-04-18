import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Feeder, MapPoint, NetworkMetrics, TimeSeriesPoint, Alert, TheftAlert
} from '../models/network.models';

const EMPTY_METRICS: NetworkMetrics = {
  totalFeeders: 0, onlineFeeders: 0, offlineFeeders: 0,
  overloadedFeeders: 0, highLoadFeeders: 0, normalFeeders: 0,
  totalConsumers: 0, estimatedUnregistered: 0,
  totalConsumptionMW: 0, totalLossesPct: 0,
  avgImbalancePct: 0, theftSuspects: 0, deadZones: 0,
};

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private apiBase = 'http://localhost:8000/api';

  // ─── Shared state ─────────────────────────────────────────────────────────────
  readonly feeders$       = new BehaviorSubject<Feeder[]>([]);
  readonly mapPoints$     = new BehaviorSubject<MapPoint[]>([]);
  readonly metrics$       = new BehaviorSubject<NetworkMetrics>(EMPTY_METRICS);
  readonly alerts$        = new BehaviorSubject<Alert[]>([]);
  readonly theftAlerts$   = new BehaviorSubject<TheftAlert[]>([]);
  readonly selectedFeeder$ = new BehaviorSubject<Feeder | null>(null);
  readonly viewMode$ = new BehaviorSubject<'consumption' | 'losses' | 'outages'>('consumption');

  constructor(private http: HttpClient) {}

  // ─── Bootstrap: called ONCE from AppComponent ─────────────────────────────────
  // Each HTTP call is independent so one slow/failing endpoint doesn't block others
  loadAllData(): void {
    // 1) Feeders
    this.http.get<Feeder[]>(`${this.apiBase}/feeders/status`).pipe(
      catchError(e => { console.error('[feeders/status]', e); return of([] as Feeder[]); })
    ).subscribe(feeders => {
      console.log('[feeders/status] loaded', feeders.length);
      this.feeders$.next(feeders);
      // Default selected feeder: highest imbalance
      const sorted = feeders
        .filter(f => f.imbalancePct != null)
        .sort((a, b) => (b.imbalancePct ?? 0) - (a.imbalancePct ?? 0));
      if (sorted.length > 0) this.selectedFeeder$.next(sorted[0]);
    });

    // 2) Metrics
    this.http.get<NetworkMetrics>(`${this.apiBase}/feeders/metrics`).pipe(
      catchError(e => { console.error('[feeders/metrics]', e); return of(EMPTY_METRICS); })
    ).subscribe(m => {
      console.log('[feeders/metrics] loaded', m);
      this.metrics$.next(m);
    });

    // 3) Alerts
    this.http.get<Alert[]>(`${this.apiBase}/feeders/alerts`).pipe(
      catchError(e => { console.error('[feeders/alerts]', e); return of([] as Alert[]); })
    ).subscribe(a => {
      console.log('[feeders/alerts] loaded', a.length);
      this.alerts$.next(a);
    });

    // 4) Theft alerts
    this.http.get<TheftAlert[]>(`${this.apiBase}/theft-alerts/`).pipe(
      catchError(e => { console.error('[theft-alerts]', e); return of([] as TheftAlert[]); })
    ).subscribe(t => {
      console.log('[theft-alerts] loaded', t.length);
      this.theftAlerts$.next(t);
    });

    // 5) Map points (large payload)
    this.http.get<MapPoint[]>(`${this.apiBase}/map/`).pipe(
      catchError(e => { console.error('[map]', e); return of([] as MapPoint[]); })
    ).subscribe(pts => {
      console.log('[map] loaded', pts.length);
      this.mapPoints$.next(pts);
    });
  }

  // ─── Selectors ────────────────────────────────────────────────────────────────
  getFeeders(): Observable<Feeder[]>           { return this.feeders$.asObservable(); }
  getMapPoints(): Observable<MapPoint[]>       { return this.mapPoints$.asObservable(); }
  getMetrics(): Observable<NetworkMetrics>     { return this.metrics$.asObservable(); }
  getAlerts(): Observable<Alert[]>             { return this.alerts$.asObservable(); }
  getTheftAlerts(): Observable<TheftAlert[]>   { return this.theftAlerts$.asObservable(); }
  getSelectedFeeder(): Observable<Feeder|null> { return this.selectedFeeder$.asObservable(); }

  selectFeeder(feeder: Feeder): void {
    this.selectedFeeder$.next(feeder);
  }

  setViewMode(mode: 'consumption' | 'losses' | 'outages'): void {
    this.viewMode$.next(mode);
  }

  // ─── Time Series (per selected feeder) ───────────────────────────────────────
  getTimeSeries(feederId: number): Observable<TimeSeriesPoint[]> {
    return this.http.get<TimeSeriesPoint[]>(`${this.apiBase}/feeders/${feederId}/chart`).pipe(
      catchError(e => { console.error('[chart]', e); return of([]); })
    );
  }
}