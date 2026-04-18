import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NetworkService } from './services/network.service';
import { MapComponent } from './components/map/map.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { ChartComponent } from './components/chart/chart.component';
import { FeederPanelComponent } from './components/feeder-panel/feeder-panel.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MapComponent,
    SidebarComponent,
    HeaderComponent,
    ChartComponent,
    FeederPanelComponent,
  ],
})
export class AppComponent {
  constructor(private networkSvc: NetworkService) {}
}

