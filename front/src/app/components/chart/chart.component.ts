import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NetworkService } from '../../services/network.service';
import { TimeSeriesPoint } from '../../models/network.models';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private points: TimeSeriesPoint[] = [];
  private currentHourIdx = 0;
  private subs: Subscription[] = [];

  constructor(private networkSvc: NetworkService) {}

  ngAfterViewInit(): void {
    const sub = this.networkSvc.getTimeSeries().subscribe(data => {
      this.points = data;
      this.draw();
    });
    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 16, right: 12, bottom: 24, left: 36 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxCurrent = 300; // Max current in Amps (typical for distribution)
    const pts = this.points;
    const n = pts.length;

    if (n === 0) return;

    const xOf = (i: number) => PAD.left + (i / (n - 1)) * innerW;
    const yOf = (v: number) => PAD.top + innerH - (v / maxCurrent) * innerH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    [0, 100, 200, 300].forEach(v => {
      const y = yOf(v);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '9px monospace';
      ctx.fillText(`${v}A`, 0, y + 3);
    });

    // Current line (blue)
    const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
    grad.addColorStop(0, 'rgba(96,165,250,0.35)');
    grad.addColorStop(1, 'rgba(96,165,250,0.0)');

    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xOf(i); const y = yOf(p.avgCurrentA);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(n - 1), H - PAD.bottom);
    ctx.lineTo(xOf(0), H - PAD.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Current line
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xOf(i); const y = yOf(p.avgCurrentA);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current time marker
    const cx = xOf(this.currentHourIdx);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx, PAD.top); ctx.lineTo(cx, H - PAD.bottom); ctx.stroke();
    ctx.setLineDash([]);

    // X-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    pts.forEach((p, i) => {
      if (i % 3 === 0) {
        const label = p.hour ? new Date(p.hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : `T${i}`;
        ctx.fillText(label, xOf(i), H - 4);
      }
    });
  }
}

