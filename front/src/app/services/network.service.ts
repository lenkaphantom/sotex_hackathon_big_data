import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Feeder, MapPoint, NetworkMetrics, TimeSeriesPoint
} from '../models/network.models';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private apiBase = 'http://localhost:8000/api';

  private feeders$ = new BehaviorSubject<Feeder[]>([]);
  private mapPoints$ = new BehaviorSubject<MapPoint[]>([]);
  private metrics$ = new BehaviorSubject<NetworkMetrics | null>(null);

  constructor(private http: HttpClient) {}

  // ─── Feeders ─────────────────────────────────────────────────────────────────
  getFeedersFromApi(): Observable<Feeder[]> {
    return this.http.get<Feeder[]>(`${this.apiBase}/feeders/status`).pipe(
      map(feeders => {
        this.feeders$.next(feeders);
        return feeders;
      }),
      catchError(err => {
        console.warn('Failed to fetch feeders from API', err);
        return of([]);
      })
    );
  }

  getFeeders(): Observable<Feeder[]> {
    return this.feeders$.asObservable();
  }

  // ─── Map Points (Dead Zones + Theft Suspects) ────────────────────────────────
  getMapPoints(): Observable<MapPoint[]> {
    return this.http.get<MapPoint[]>(`${this.apiBase}/map/`).pipe(
      map(points => {
        this.mapPoints$.next(points);
        return points;
      }),
      catchError(err => {
        console.warn('Failed to fetch map points from API', err);
        return of([]);
      })
    );
  }

  // ─── Metrics ──────────────────────────────────────────────────────────────────
  getMetrics(): Observable<NetworkMetrics> {
    return this.http.get<NetworkMetrics>(`${this.apiBase}/feeders/metrics`).pipe(
      map(metrics => {
        this.metrics$.next(metrics);
        return metrics;
      }),
      catchError(err => {
        console.warn('Failed to fetch metrics from API', err);
        return of({
          totalFeeders: 0,
          onlineFeeders: 0,
          offlineFeeders: 0,
          avgImbalancePct: 0,
          theftSuspects: 0,
          deadZones: 0
        });
      })
    );
  }

  // ─── Time Series (for charts) ─────────────────────────────────────────────────
  getTimeSeries(feederId?: number): Observable<TimeSeriesPoint[]> {
    const endpoint = feederId 
      ? `${this.apiBase}/feeders/${feederId}/chart`
      : `${this.apiBase}/feeders/1/chart`; // Default to first feeder
    
    return this.http.get<TimeSeriesPoint[]>(endpoint).pipe(
      catchError(err => {
        console.warn('Failed to fetch time series from API', err);
        return of([]);
      })
    );
  }
}