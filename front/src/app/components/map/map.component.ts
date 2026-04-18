import {
  Component, OnDestroy, AfterViewInit,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as L from 'leaflet';
import { MapPoint, Feeder } from '../../models/network.models';
import { NetworkService } from '../../services/network.service';

const STATUS_COLOR: Record<string, string> = {
  'normal':    '#22c55e',
  'high-load': '#f59e0b',
  'overloaded':'#ef4444',
  'offline':   '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  'normal': 'NORMAL',
  'high-load': 'HIGH LOAD',
  'overloaded': 'OVERLOADED',
  'offline': 'OFFLINE',
};

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private markerLayer = L.layerGroup();
  private lineLayer   = L.layerGroup();
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngAfterViewInit(): void {
    this.initMap();

    this.subs.push(
      combineLatest([
        this.networkSvc.feeders$,
        this.networkSvc.mapPoints$,
        this.networkSvc.viewMode$,
      ]).pipe(
        filter(([feeders, points]) => feeders.length > 0 && points.length > 0)
      ).subscribe(([feeders, points, viewMode]) => {
        this.renderAll(points, feeders, viewMode);
      })
    );
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [9.0765, 7.3986],
      zoom: 6,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.lineLayer.addTo(this.map);
    this.markerLayer.addTo(this.map);
  }

  // ── Build a rich popup card for a dead-zone point ──
  private deadZonePopup(point: MapPoint, feeder: Feeder | undefined): string {
    const status = feeder?.angularStatus ?? 'normal';
    const color  = STATUS_COLOR[status] ?? '#6b7280';
    const label  = STATUS_LABEL[status] ?? 'UNKNOWN';
    const load   = feeder ? (feeder.loadPercent ?? 0).toFixed(1) : '—';
    const loadW  = Math.min(Math.round(feeder?.loadPercent ?? 0), 100);
    const imb    = point.imbalancePct != null ? point.imbalancePct.toFixed(1) + '%' : '—';
    const kva    = point.nameplateKVA != null ? point.nameplateKVA + ' kVA' : '—';
    const meters = feeder ? `${feeder.activeDSCount} / ${feeder.totalDSCount}` : '—';

    return `<div class="feeder-popup">
      <div class="popup-header">
        <span class="popup-name">${point.name}</span>
        <span class="popup-status" style="color:${color};">${label}</span>
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">
        Feeder: ${point.feederName}
      </div>
      <div class="popup-grid">
        <div class="popup-metric">
          <span class="label">Load %</span>
          <span class="value">${load}%</span>
        </div>
        <div class="popup-metric">
          <span class="label">Status</span>
          <span class="value" style="color:${color};">${feeder?.status ?? '—'}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Imbalance</span>
          <span class="value" style="color:#f59e0b;">${imb}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Active Meters</span>
          <span class="value">${meters}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Zone</span>
          <span class="value">${point.zoneType ?? 'N/A'}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Capacity</span>
          <span class="value">${kva}</span>
        </div>
      </div>
      <div class="popup-bar-wrap">
        <div class="popup-bar" style="width:${loadW}%;background:${color};"></div>
      </div>
      <div class="popup-bar-label">Load utilization ${load}%</div>
    </div>`;
  }

  // ── Build a rich popup card for a theft-suspect point ──
  private theftPopup(point: MapPoint): string {
    const riskColor = point.riskLevel === 'HIGH' ? '#ef4444'
      : point.riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e';
    const imb = point.imbalancePct != null ? point.imbalancePct.toFixed(1) + '%' : '—';

    return `<div class="feeder-popup">
      <div class="popup-header">
        <span class="popup-name">\u26a0 ${point.name}</span>
        <span class="popup-status" style="color:#ef4444;">THEFT SUSPECT</span>
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">
        Feeder: ${point.feederName}
      </div>
      <div class="popup-grid">
        <div class="popup-metric">
          <span class="label">Risk Level</span>
          <span class="value" style="color:${riskColor};">${point.riskLevel ?? 'UNKNOWN'}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Imbalance</span>
          <span class="value" style="color:#f59e0b;">${imb}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Zone</span>
          <span class="value">${point.zoneType ?? 'N/A'}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Capacity</span>
          <span class="value">${point.nameplateKVA != null ? point.nameplateKVA + ' kVA' : '—'}</span>
        </div>
      </div>
      <div class="popup-alert">
        \u26a0 Suspected energy theft — investigation recommended
      </div>
    </div>`;
  }

  // ── Build a popup card for a feeder polyline ──
  private feederLinePopup(feederName: string, feeder: Feeder | undefined, pointCount: number): string {
    const status = feeder?.angularStatus ?? 'normal';
    const color  = STATUS_COLOR[status] ?? '#6b7280';
    const label  = STATUS_LABEL[status] ?? 'UNKNOWN';
    const load   = feeder ? (feeder.loadPercent ?? 0).toFixed(1) : '—';
    const loadW  = Math.min(Math.round(feeder?.loadPercent ?? 0), 100);
    const imb    = feeder?.imbalancePct != null ? feeder.imbalancePct.toFixed(1) + '%' : '—';
    const meters = feeder ? `${feeder.activeDSCount} / ${feeder.totalDSCount}` : '—';

    return `<div class="feeder-popup">
      <div class="popup-header">
        <span class="popup-name">${feederName}</span>
        <span class="popup-status" style="color:${color};">${label}</span>
      </div>
      <div class="popup-grid">
        <div class="popup-metric">
          <span class="label">Load %</span>
          <span class="value">${load}%</span>
        </div>
        <div class="popup-metric">
          <span class="label">Imbalance</span>
          <span class="value" style="color:#f59e0b;">${imb}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Active Meters</span>
          <span class="value">${meters}</span>
        </div>
        <div class="popup-metric">
          <span class="label">Dead Zones</span>
          <span class="value">${pointCount}</span>
        </div>
      </div>
      <div class="popup-bar-wrap">
        <div class="popup-bar" style="width:${loadW}%;background:${color};"></div>
      </div>
      <div class="popup-bar-label">Load utilization ${load}%</div>
    </div>`;
  }

  private renderAll(points: MapPoint[], feeders: Feeder[], viewMode: string): void {
    const feederStatusMap = new Map<string, string>();
    const feederLookup    = new Map<string, Feeder>();
    feeders.forEach(f => {
      feederStatusMap.set(f.feederName, f.angularStatus);
      feederLookup.set(f.feederName, f);
    });

    const validPoints = points.filter(p => p.latitude != null && p.longitude != null);

    let filtered: MapPoint[];
    if (viewMode === 'outages') {
      const offlineNames = new Set(
        feeders.filter(f => f.angularStatus === 'offline').map(f => f.feederName)
      );
      filtered = validPoints.filter(p =>
        p.pointType === 'theft_suspect' || offlineNames.has(p.feederName)
      );
    } else if (viewMode === 'losses') {
      const problemNames = new Set(
        feeders.filter(f => f.angularStatus !== 'normal').map(f => f.feederName)
      );
      filtered = validPoints.filter(p =>
        p.pointType === 'theft_suspect' || problemNames.has(p.feederName)
      );
    } else {
      filtered = validPoints;
    }

    this.markerLayer.clearLayers();
    this.lineLayer.clearLayers();

    const popupOpts: L.PopupOptions = {
      className: 'custom-popup',
      closeButton: true,
      maxWidth: 280,
      minWidth: 220,
    };

    // Collect dead-zone coords grouped by feeder for polylines
    const feederGroups = new Map<string, L.LatLng[]>();

    filtered.forEach(point => {
      const isTheft = point.pointType === 'theft_suspect';
      const status  = feederStatusMap.get(point.feederName) ?? 'normal';
      const color   = isTheft ? '#ef4444' : (STATUS_COLOR[status] ?? '#6b7280');
      const radius  = isTheft ? 7 : 5;
      const fillOp  = isTheft ? 0.85 : 0.65;

      // Rich popup HTML — opens on CLICK, stays open
      const feeder = feederLookup.get(point.feederName);
      const popupHtml = isTheft
        ? this.theftPopup(point)
        : this.deadZonePopup(point, feeder);

      // Simple tooltip — shows on HOVER
      const tooltipText = isTheft
        ? `\u26a0 ${point.name}`
        : `${point.name} — ${point.feederName}`;

      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius, color, fillColor: color, fillOpacity: fillOp, weight: 1.5,
      });

      marker.bindPopup(popupHtml, popupOpts);
      marker.bindTooltip(tooltipText, {
        className: 'simple-tooltip',
        direction: 'top',
        offset: [0, -8],
      });

      // Click → open popup + select feeder (loads chart)
      marker.on('click', () => {
        if (!isTheft && feeder) {
          this.networkSvc.selectFeeder(feeder);
        }
      });

      this.markerLayer.addLayer(marker);

      // Collect dead zones for polylines
      if (!isTheft) {
        const latlng = L.latLng(point.latitude, point.longitude);
        const group = feederGroups.get(point.feederName);
        if (group) group.push(latlng);
        else feederGroups.set(point.feederName, [latlng]);
      }
    });

    // ── Draw feeder polylines (connection lines) ──
    feederGroups.forEach((coords, feederName) => {
      if (coords.length < 2) return;
      const status = feederStatusMap.get(feederName) ?? 'normal';
      const color = STATUS_COLOR[status] ?? '#6b7280';
      coords.sort((a, b) => a.lat - b.lat);

      const feeder = feederLookup.get(feederName);
      const line = L.polyline(coords, {
        color,
        weight: 2,
        opacity: 0.4,
        dashArray: '4 6',
      });

      // Click on polyline → show feeder card + select feeder
      const linePopup = this.feederLinePopup(feederName, feeder, coords.length);
      line.bindPopup(linePopup, popupOpts);

      line.bindTooltip(feederName, {
        className: 'simple-tooltip',
        sticky: true,
      });

      line.on('click', () => {
        if (feeder) this.networkSvc.selectFeeder(feeder);
      });

      this.lineLayer.addLayer(line);
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.map?.remove();
  }
}

