import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NetworkService } from '../../services/network.service';

export type ViewMode = 'consumption' | 'losses' | 'outages';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class HeaderComponent {
  searchQuery = '';
  selectedView: ViewMode = 'consumption';
  isLive = true;

  views: { value: ViewMode; label: string }[] = [
    { value: 'consumption', label: 'Consumption' },
    { value: 'losses',      label: 'Losses' },
    { value: 'outages',     label: 'Outages' },
  ];

  constructor(private networkSvc: NetworkService) {}

  selectView(v: ViewMode): void {
    this.selectedView = v;
    this.networkSvc.setViewMode(v);
  }
}
