import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AppointmentService } from 'src/app/services/appointment.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-calendar-more-event',
  templateUrl: './calendar-more-event.component.html',
  styleUrls: ['./calendar-more-event.component.scss']
})
export class CalendarMoreEventComponent implements OnInit {
  @Input('events') events;
  @Output() onClose: EventEmitter<any> = new EventEmitter(null);

  event: any;
  eventId: string = '';

  calendars = {};
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  @ViewChild('detailPortalContent') detailPortalContent: TemplateRef<unknown>;
  calendarLoadSubscription: Subscription;
  overlayCloseSubscription: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private overlay: Overlay,
    private _viewContainerRef: ViewContainerRef
  ) {
    this.appointmentService.loadCalendars(true);
  }

  ngOnInit(): void {
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.calendarLoadSubscription = this.appointmentService.calendars$.subscribe(
      (data) => {
        this.calendars = {};
        if (data) {
          data.forEach((account) => {
            if (account.data) {
              account.data.forEach((e) => {
                this.calendars[e.id] = e;
              });
            }
          });
        }
      }
    );
  }

  openDetail(event: any, trigger: any): void {
    this.event = event;

    const triggerEl = <HTMLElement>trigger;
    const originBounding = triggerEl.getBoundingClientRect();
    const originX = originBounding.x;
    const originY = originBounding.y;
    const originW = originBounding.width;
    const originH = originBounding.height;
    const originEndX = originX + originW;
    let originEndY = originY + originH;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    originEndY = originEndY > screenH - 30 ? screenH - 30 : originEndY;

    const size = {
      maxWidth: '360px',
      minWidth: '300px',
      maxHeight: 410,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (originX > 380) {
      // Set Right of overlay
      positionStrategy.left(originX - 380 + 'px');
    } else if (originX > 320) {
      positionStrategy.left(10 + 'px');
    } else if (screenW - originEndX > 380) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else if (screenW - originEndX > 320) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 380) {
      positionStrategy.centerVertically();
      // size['height'] = screenH - 40;
    } else if (screenH - originY > 420) {
      positionStrategy.top(originY + 'px');
      // size['height'] = 420;
    } else if (originEndY > 420) {
      positionStrategy.bottom(screenH - originEndY + 'px');
      // size['height'] = 420;
    } else {
      positionStrategy.top('30px');
      // size['height'] = screenH - 50;
    }
    size['height'] = 'unset';

    this.templatePortal = new TemplatePortal(
      this.detailPortalContent,
      this._viewContainerRef
    );

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        this.eventId = '';
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.attach(this.templatePortal);
    }
    if (this.overlayRef) {
      this.overlayCloseSubscription &&
        this.overlayCloseSubscription.unsubscribe();
      this.overlayCloseSubscription = this.overlayRef
        .outsidePointerEvents()
        .subscribe((event) => {
          const targetEl = <HTMLElement>event.target;
          if (targetEl.closest('.cal-event')) {
            return;
          }
          if (targetEl.closest('.cal-month-cell')) {
            return;
          }
          if (targetEl.closest('.event-backdrop')) {
            return;
          }
          if (targetEl.closest('.event-panel')) {
            return;
          }
          this.overlayRef.detach();
          this.eventId = '';
          return;
        });
    }
  }

  closeOverlay(): void {
    this.onClose.emit();
  }
}
