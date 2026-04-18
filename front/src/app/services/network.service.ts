import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  Feeder, MapPoint, NetworkMetrics, TimeSeriesPoint, Alert, TheftAlert
} from '../models/network.models';

const EMPTY_METRICS: NetworkMetrics = {
  totalFeeders: 0, onlineFeeders: 0, offlineFeeders: 0,
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

  constructor(private http: HttpClient) {}

  // ─── Bootstrap: called ONCE from AppComponent ─────────────────────────────────
  loadAllData(): void {
    // Feeders + metrics in parallel
    forkJoin({
      feeders: this.http.get<Feeder[]>(`${this.apiBase}/feeders/status`).pipe(
        catchError(e => { console.error('[feeders/status]', e); return of([]); })
      ),
      metrics: this.http.get<NetworkMetrics>(`${this.apiBase}/feeders/metrics`).pipe(
        catchError(e => { console.error('[feeders/metrics]', e); return of(EMPTY_METRICS); })
      ),
      alerts: this.http.get<Alert[]>(`${this.apiBase}/feeders/alerts`).pipe(
        catchError(e => { console.error('[feeders/alerts]', e); return of([]); })
      ),
      theftAlerts: this.http.get<TheftAlert[]>(`${this.apiBase}/theft-alerts/`).pipe(
        catchError(e => { console.error('[theft-alerts]', e); return of([]); })
      ),
    }).subscribe(({ feeders, metrics, alerts, theftAlerts }) => {
      this.feeders$.next(feeders as Feeder[]);
      this.metrics$.next(metrics as NetworkMetrics);
      this.alerts$.next(alerts as Alert[]);
      this.theftAlerts$.next(theftAlerts as TheftAlert[]);

      // Default selected feeder: highest imbalance
      const sorted = (feeders as Feeder[])
        .filter(f => f.imbalancePct != null)
        .sort((a, b) => (b.imbalancePct ?? 0) - (a.imbalancePct ?? 0));
      if (sorted.length > 0) this.selectedFeeder$.next(sorted[0]);
    });

    // Map points loaded separately (large payload)
    this.http.get<MapPoint[]>(`${this.apiBase}/map/`).pipe(
      catchError(e => { console.error('[map]', e); return of([]); })
    ).subscribe(pts => this.mapPoints$.next(pts as MapPoint[]));
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

  // ─── Time Series (per selected feeder) ───────────────────────────────────────
  getTimeSeries(feederId: number): Observable<TimeSeriesPoint[]> {
    return this.http.get<TimeSeriesPoint[]>(`${this.apiBase}/feeders/${feederId}/chart`).pipe(
      catchError(e => { console.error('[chart]', e); return of([]); })
    );
  }
}