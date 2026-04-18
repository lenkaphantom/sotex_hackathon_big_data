import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { MapPoint } from '../../models/network.models';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private deadZoneMarkers: L.CircleMarker[] = [];
  private theftSuspectMarkers: L.CircleMarker[] = [];
  private subs: Subscription[] = [];

  mapPoints: MapPoint[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadFromApi();
  }

  private loadFromApi(): void {
    // Load map points (dead zones + theft suspects)
    this.subs.push(
      this.networkSvc.getMapPoints().subscribe(points => {
        this.mapPoints = points;
        this.renderMapPoints();
      })
    );
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [9.0765, 7.3986], // Nigeria center
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

  private renderMapPoints(): void {
    // Clear all existing markers
    this.deadZoneMarkers.forEach(m => this.map.removeLayer(m));
    this.theftSuspectMarkers.forEach(m => this.map.removeLayer(m));
    this.deadZoneMarkers = [];
    this.theftSuspectMarkers = [];

    this.mapPoints.forEach(point => {
      const lat = point.latitude;
      const lng = point.longitude;

      if (point.pointType === 'dead_zone') {
        // Dead zone - gray marker
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: '#9ca3af',
          fillColor: '#6b7280',
          fillOpacity: 0.7,
          weight: 2,
        });

        const zoneInfo = `
          <div style="font-size: 12px; padding: 4px;">
            <b style="color: #e5e7eb;">${point.name}</b><br/>
            <span style="color: #d1d5db;">Zone: ${point.zoneType || 'N/A'}</span><br/>
            <span style="color: #d1d5db;">Feeder: ${point.feederName}</span><br/>
            ${point.nameplateKVA ? `<span style="color: #9ca3af;">Capacity: ${point.nameplateKVA} kVA</span>` : ''}
          </div>
        `;

        marker.bindPopup(zoneInfo);
        marker.on('mouseover', () => marker.openPopup());
        marker.on('mouseout', () => marker.closePopup());
        marker.addTo(this.map);
        this.deadZoneMarkers.push(marker);

      } else if (point.pointType === 'theft_suspect') {
        // Theft suspect - red marker
        const marker = L.circleMarker([lat, lng], {
          radius: 7,
          color: '#ef4444',
          fillColor: '#dc2626',
          fillOpacity: 0.8,
          weight: 2,
        });

        const riskColor = point.riskLevel === 'HIGH' ? '#ef4444' : point.riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e';
        const theftInfo = `
          <div style="font-size: 12px; padding: 4px;">
            <b style="color: #e5e7eb;">${point.name}</b><br/>
            <span style="color: ${riskColor};">⚠ Risk: ${point.riskLevel || 'UNKNOWN'}</span><br/>
            <span style="color: #d1d5db;">Feeder: ${point.feederName}</span><br/>
            ${point.imbalancePct ? `<span style="color: #f59e0b;">Imbalance: ${point.imbalancePct.toFixed(2)}%</span><br/>` : ''}
            ${point.nameplateKVA ? `<span style="color: #9ca3af;">Capacity: ${point.nameplateKVA} kVA</span>` : ''}
          </div>
        `;

        marker.bindPopup(theftInfo);
        marker.on('mouseover', () => marker.openPopup());
        marker.on('mouseout', () => marker.closePopup());
        marker.addTo(this.map);
        this.theftSuspectMarkers.push(marker);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
    this.map?.remove();
  }
}


