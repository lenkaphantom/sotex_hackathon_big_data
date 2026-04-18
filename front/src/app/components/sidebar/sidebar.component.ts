import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NetworkMetrics, Feeder, Alert } from '../../models/network.models';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class SidebarComponent implements OnInit, OnDestroy {
  Math = Math;

  metrics: NetworkMetrics = {
    totalFeeders: 0, onlineFeeders: 0, offlineFeeders: 0,
    avgImbalancePct: 0, theftSuspects: 0, deadZones: 0,
  };

  feeders: Feeder[] = [];
  alerts: Alert[] = [];
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngOnInit(): void {
    this.subs.push(
      this.networkSvc.getMetrics().subscribe(m => { this.metrics = m; }),
      this.networkSvc.getFeeders().subscribe(f => { this.feeders = f; }),
      this.networkSvc.getAlerts().subscribe(a => { this.alerts = a; }),
    );
  }

  get normalCount():     number { return this.feeders.filter(f => f.angularStatus === 'normal').length; }
  get highLoadCount():   number { return this.feeders.filter(f => f.angularStatus === 'high-load').length; }
  get overloadedCount(): number { return this.feeders.filter(f => f.angularStatus === 'overloaded').length; }
  get offlineCount():    number { return this.feeders.filter(f => f.angularStatus === 'offline').length; }

  get topFeeders(): Feeder[] {
    return [...this.feeders]
      .filter(f => f.angularStatus !== 'normal')
      .sort((a, b) => (b.imbalancePct ?? 0) - (a.imbalancePct ?? 0))
      .slice(0, 5);
  }

  selectFeeder(f: Feeder): void {
    this.networkSvc.selectFeeder(f);
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}

