import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as L from 'leaflet';
import { MapPoint, Feeder } from '../../models/network.models';
import { NetworkService } from '../../services/network.service';

// Status → color mapping (matches the sidebar legend)
const STATUS_COLOR: Record<string, string> = {
  'normal':    '#22c55e',
  'high-load': '#f59e0b',
  'overloaded':'#ef4444',
  'offline':   '#6b7280',
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
  private markers: L.CircleMarker[] = [];
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngAfterViewInit(): void {
    this.initMap();

    // Render once both feeders and map points arrive, then re-render on any change
    this.subs.push(
      combineLatest([
        this.networkSvc.feeders$,
        this.networkSvc.mapPoints$,
      ]).pipe(
        filter(([feeders, points]) => feeders.length > 0 && points.length > 0)
      ).subscribe(([feeders, points]) => {
        this.renderPoints(points, feeders);
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
  }

  private renderPoints(points: MapPoint[], feeders: Feeder[]): void {
    // Build feeder name → angularStatus lookup
    const feederStatusMap = new Map<string, string>();
    feeders.forEach(f => feederStatusMap.set(f.feederName, f.angularStatus));

    // Clear existing markers
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    points.forEach(point => {
      const lat = point.latitude;
      const lng = point.longitude;

      let color: string;
      let radius: number;
      let fillOpacity: number;
      let popupHtml: string;

      if (point.pointType === 'theft_suspect') {
        // Always bright red for theft suspects
        color = '#ef4444';
        radius = 7;
        fillOpacity = 0.85;
        const riskColor = point.riskLevel === 'HIGH' ? '#ef4444'
          : point.riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e';
        popupHtml = `
          <div style="font-size:12px;padding:4px;min-width:160px;">
            <b style="color:#e5e7eb;">⚠ ${point.name}</b><br/>
            <span style="color:${riskColor};">Risk: ${point.riskLevel ?? 'UNKNOWN'}</span><br/>
            <span style="color:#d1d5db;">Feeder: ${point.feederName}</span><br/>
            ${point.imbalancePct != null
              ? `<span style="color:#f59e0b;">Imbalance: ${point.imbalancePct.toFixed(1)}%</span>`
              : ''}
          </div>`;
      } else {
        // Dead zone — color by feeder status
        const status = feederStatusMap.get(point.feederName) ?? 'normal';
        color = STATUS_COLOR[status] ?? '#6b7280';
        radius = 5;
        fillOpacity = 0.65;
        popupHtml = `
          <div style="font-size:12px;padding:4px;min-width:160px;">
            <b style="color:#e5e7eb;">${point.name}</b><br/>
            <span style="color:#d1d5db;">Zone: ${point.zoneType ?? 'N/A'}</span><br/>
            <span style="color:#d1d5db;">Feeder: ${point.feederName}</span><br/>
            <span style="color:${color};">Status: ${status.replace('-', ' ').toUpperCase()}</span><br/>
            ${point.nameplateKVA != null
              ? `<span style="color:#9ca3af;">${point.nameplateKVA} kVA</span>`
              : ''}
          </div>`;
      }

      const marker = L.circleMarker([lat, lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity,
        weight: 1.5,
      });

      marker.bindPopup(popupHtml);
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());

      // Click on a dead zone → select its feeder
      if (point.pointType === 'dead_zone') {
        marker.on('click', () => {
          const feeder = feeders.find(f => f.feederName === point.feederName);
          if (feeder) this.networkSvc.selectFeeder(feeder);
        });
      }

      marker.addTo(this.map);
      this.markers.push(marker);
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.map?.remove();
  }
}

