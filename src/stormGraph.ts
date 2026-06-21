import type { OffsetHistoryPoint } from './signal';

export class StormGraph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private maxOffset: number = 20;

  private readonly colors = {
    vhf: '#ff6644',
    uhf: '#44aaff',
    antenna: '#ffaa22'
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width * dpr;
    this.height = rect.height * dpr;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.scale(dpr, dpr);
  }

  setMaxOffset(max: number): void {
    this.maxOffset = max;
  }

  render(history: OffsetHistoryPoint[], currentOffset: { vhfShift: number; uhfShift: number; antennaShift: number }): void {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    const padding = { top: 20, right: 10, bottom: 24, left: 40 };
    const graphW = w - padding.left - padding.right;
    const graphH = h - padding.top - padding.bottom;

    ctx.fillStyle = 'rgba(10, 8, 6, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(100, 80, 60, 0.2)';
    ctx.lineWidth = 1;

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (graphH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    const zeroY = padding.top + graphH / 2;
    ctx.strokeStyle = 'rgba(150, 120, 90, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(w - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(150, 120, 90, 0.6)';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const labels = [
      { value: this.maxOffset, y: padding.top },
      { value: 0, y: zeroY },
      { value: -this.maxOffset, y: padding.top + graphH }
    ];

    for (const label of labels) {
      ctx.fillText(`${label.value > 0 ? '+' : ''}${label.value.toFixed(0)}`, padding.left - 6, label.y);
    }

    const drawLine = (
      data: number[],
      color: string,
      currentValue: number
    ) => {
      if (data.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();

      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphW;
        const normalized = (data[i] + this.maxOffset) / (2 * this.maxOffset);
        const y = padding.top + (1 - Math.max(0, Math.min(1, normalized))) * graphH;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      const lastValue = data[data.length - 1];
      const lastX = padding.left + graphW;
      const lastNormalized = (lastValue + this.maxOffset) / (2 * this.maxOffset);
      const lastY = padding.top + (1 - Math.max(0, Math.min(1, lastNormalized))) * graphH;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = color;
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const valueStr = `${currentValue > 0 ? '+' : ''}${currentValue.toFixed(1)}`;
      ctx.fillText(valueStr, lastX + 6, lastY);
    };

    const vhfData = history.map(p => p.vhfShift);
    const uhfData = history.map(p => p.uhfShift);
    const antennaData = history.map(p => p.antennaShift);

    drawLine(vhfData, this.colors.vhf, currentOffset.vhfShift);
    drawLine(uhfData, this.colors.uhf, currentOffset.uhfShift);
    drawLine(antennaData, this.colors.antenna, currentOffset.antennaShift);

    const legendY = h - 10;
    const legendItems = [
      { label: 'VHF', color: this.colors.vhf },
      { label: 'UHF', color: this.colors.uhf },
      { label: 'ANT', color: this.colors.antenna }
    ];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '11px "Courier New", monospace';

    let legendX = padding.left + 10;
    for (const item of legendItems) {
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 4;
      ctx.fillRect(legendX, legendY - 4, 12, 3);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(180, 150, 120, 0.8)';
      ctx.fillText(item.label, legendX + 30, legendY);
      legendX += 70;
    }

    ctx.fillStyle = 'rgba(180, 150, 120, 0.6)';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('STORM DRIFT', w - padding.right, 12);

    ctx.textAlign = 'left';
    ctx.fillText('← 30s', padding.left, h - 10);
  }
}
