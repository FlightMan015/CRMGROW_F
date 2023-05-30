import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-play-timelines',
  templateUrl: './play-timelines.component.html',
  styleUrls: ['./play-timelines.component.scss']
})
export class PlayTimelinesComponent implements OnInit, AfterViewInit {
  @Input('data') data: any = {};
  @Input('type') type: string = 'video_trackers';
  @Input('duration') duration: number = 0;
  gaps: any[] = [];
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('startBar') startEl: ElementRef;
  @ViewChild('endBar') endEl: ElementRef;
  completion = 0;
  start = 0;
  end = 0;
  read_pages = 0;
  total_pages = 0;
  constructor() {}

  ngOnInit(): void {
    const duration = Math.ceil(this.duration / 1000);
    const watched = Math.ceil(this.data.duration / 1000);
    this.completion = parseFloat(((watched / duration) * 100).toFixed(0));
    if (watched / duration > 0.98) {
      this.gaps = [[0, duration]];
      this.start = 0;
      this.end = duration;
      return;
    }

    if (this.data.read_pages) {
      this.read_pages = this.data.read_pages;
    }

    if (this.data.total_pages) {
      this.total_pages = this.data.total_pages;
    }

    let start = 0;
    let end = 0;
    if (this.data.start || this.data.end) {
      start = Math.floor(this.data.start);
      end = Math.ceil(this.data.end);
    } else {
      end = Math.ceil(this.data.material_last);
      start = end - watched;
    }
    this.start = start;
    this.end = end;
    this.start = start < 0 ? 0 : start;
    this.end = end < 0 ? duration : end;

    if (this.data.gap && this.data.gap.length) {
      this.gaps = this.data.gap;
    } else {
      if (this.data.start || this.data.end) {
        if (start > end) {
          this.gaps = [
            [0, end],
            [this.data.start, duration]
          ];
        } else {
          this.gaps = [[start, end]];
        }
      } else if (this.data.material_last) {
        if (start < 0) {
          this.gaps = [
            [0, end],
            [duration - start, duration]
          ];
        } else {
          this.gaps = [[start, end]];
        }
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.canvas && this.duration) {
      const duration = Math.ceil(this.duration / 1000);
      const canvas = <HTMLCanvasElement>this.canvas.nativeElement;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      this.gaps.forEach((e) => {
        if (e.length == 2) {
          const start = Math.floor((e[0] / duration) * 300);
          const end = Math.floor((e[1] / duration) * 300);
          ctx.moveTo(start, 2);
          ctx.lineTo(end, 2);
        }
      });
      ctx.stroke();
      const startBar = <HTMLElement>this.startEl.nativeElement;
      const endBar = <HTMLElement>this.endEl.nativeElement;
      let start = this.start || 0;
      let end = this.data.material_last || this.end || duration;
      end = end < 0 ? duration : end;
      endBar.style.left = ((end / duration) * 100).toFixed(2) + '%';
      start = start < 0 ? 0 : start;
      startBar.style.left = ((start / duration) * 100).toFixed(2) + '%';
    }
  }
}
