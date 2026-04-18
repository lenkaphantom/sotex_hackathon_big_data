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
    this.subs.push(
      this.networkSvc.getSelectedFeeder().subscribe(f => { this.feeder = f; })
    );
  }

  get loadPercent(): number {
    return Math.min(Math.round(this.feeder?.loadPercent ?? 0), 100);
  }

  get statusColor(): string {
    return ({
      'normal':    '#22c55e',
      'high-load': '#f59e0b',
      'overloaded':'#ef4444',
      'offline':   '#6b7280',
    } as Record<string, string>)[this.feeder?.angularStatus ?? 'normal'] ?? '#6b7280';
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}

