import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type ViewMode = 'consumption' | 'losses' | 'outages';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class HeaderComponent {
  @Output() viewModeChange = new EventEmitter<ViewMode>();

  searchQuery = '';
  selectedView: ViewMode = 'consumption';
  isLive = true;

  views: { value: ViewMode; label: string }[] = [
    { value: 'consumption', label: 'Consumption' },
    { value: 'losses',      label: 'Losses' },
    { value: 'outages',     label: 'Outages' },
  ];

  selectView(v: ViewMode): void {
    this.selectedView = v;
    this.viewModeChange.emit(v);
  }
}
