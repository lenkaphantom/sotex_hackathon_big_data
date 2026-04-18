import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Feeder } from '../../models/network.models';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-feeder-panel',
  templateUrl: './feeder-panel.component.html',
  styleUrls: ['./feeder-panel.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class FeederPanelComponent implements OnInit, OnDestroy {
  feeder: Feeder | null = null;
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngOnInit(): void {
    // Show the first feeder with issues or highest load
    this.subs.push(
      this.networkSvc.getFeedersFromApi().subscribe(feeders => {
        // Show feeder with highest imbalance first
        this.feeder = feeders.sort((a, b) => b.imbalancePct - a.imbalancePct)[0] ?? null;
      })
    );
  }

  get loadPercent(): number {
    if (!this.feeder) return 0;
    return Math.round((this.feeder.loadPercent || 0) * 1);
  }

  get statusColor(): string {
    if (!this.feeder) return '#6b7280';
    return { 
      'normal': '#22c55e', 
      'high-load': '#f59e0b', 
      'overloaded': '#ef4444', 
      'offline': '#6b7280' 
    }[this.feeder.angularStatus] ?? '#6b7280';
  }

  ngOnDestroy(): void { 
    this.subs.forEach(s => s.unsubscribe()); 
  }
}

