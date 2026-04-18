import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { NetworkService } from '../../services/network.service';
import { TimeSeriesPoint, Feeder } from '../../models/network.models';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  feederName = '';
  private points: TimeSeriesPoint[] = [];
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngAfterViewInit(): void {
    // Reload chart whenever selected feeder changes
    this.subs.push(
      this.networkSvc.getSelectedFeeder().pipe(
        filter((f): f is Feeder => f != null),
        switchMap(f => {
          this.feederName = f.feederName;
          return this.networkSvc.getTimeSeries(f.feederId);
        })
      ).subscribe(data => {
        this.points = data;
        this.draw();
      })
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 16, right: 12, bottom: 24, left: 40 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    const pts = this.points;
    const n = pts.length;
    if (n === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No data', W / 2, H / 2);
      return;
    }

    const maxCurrent = Math.max(...pts.map(p => p.avgCurrentA ?? 0), 1);
    const yScale = maxCurrent * 1.1; // 10% headroom

    const xOf = (i: number) => PAD.left + (i / (n - 1)) * innerW;
    const yOf = (v: number) => PAD.top + innerH - (v / yScale) * innerH;

    // Grid lines + Y labels
    const steps = [0, 0.25, 0.5, 0.75, 1.0];
    steps.forEach(pct => {
      const v = pct * yScale;
      const y = yOf(v);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${v.toFixed(0)}A`, PAD.left - 3, y + 3);
    });

    // Fill gradient
    const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
    grad.addColorStop(0, 'rgba(96,165,250,0.35)');
    grad.addColorStop(1, 'rgba(96,165,250,0.0)');

    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xOf(i);
      const y = yOf(p.avgCurrentA ?? 0);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(n - 1), H - PAD.bottom);
    ctx.lineTo(xOf(0), H - PAD.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xOf(i);
      const y = yOf(p.avgCurrentA ?? 0);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    pts.forEach((p, i) => {
      if (i % 4 === 0 && p.hour) {
        const label = new Date(p.hour).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        ctx.fillText(label, xOf(i), H - 4);
      }
    });
  }
}

