import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NetworkMetrics, Feeder } from '../../models/network.models';
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
    totalFeeders: 0,
    onlineFeeders: 0,
    offlineFeeders: 0,
    avgImbalancePct: 0,
    theftSuspects: 0,
    deadZones: 0
  };

  feeders: Feeder[] = [];
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngOnInit(): void {
    this.subs.push(
      this.networkSvc.getMetrics().subscribe(m => this.metrics = m),
      this.networkSvc.getFeedersFromApi().subscribe(f => this.feeders = f),
    );
  }

  get normalCount(): number { 
    return this.feeders.filter(f => f.angularStatus === 'normal').length; 
  }
  
  get highLoadCount(): number { 
    return this.feeders.filter(f => f.angularStatus === 'high-load').length; 
  }
  
  get overloadedCount(): number { 
    return this.feeders.filter(f => f.angularStatus === 'overloaded').length; 
  }
  
  get offlineCount(): number { 
    return this.feeders.filter(f => f.angularStatus === 'offline').length; 
  }

  get activeFeeders(): number {
    return this.feeders.filter(f => f.angularStatus !== 'offline').length;
  }

  get totalConsumers(): number {
    return this.feeders.reduce((sum, f) => sum + f.activeDSCount, 0);
  }

  get totalLosses(): number {
    if (this.feeders.length === 0) return 0;
    return this.feeders.reduce((sum, f) => sum + f.imbalancePct, 0) / this.feeders.length;
  }

  statusClass(f: Feeder): string { 
    return f.angularStatus; 
  }

  ngOnDestroy(): void { 
    this.subs.forEach(s => s.unsubscribe()); 
  }
}

