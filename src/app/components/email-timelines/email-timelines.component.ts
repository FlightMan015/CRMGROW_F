import { TemplatePortal } from '@angular/cdk/portal';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { DetailActivity } from 'src/app/models/activityDetail.model';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { Contact } from 'src/app/models/contact.model';
import { getContactHTML } from 'src/app/utils/functions';
@Component({
  selector: 'app-email-timelines',
  templateUrl: './email-timelines.component.html',
  styleUrls: ['./email-timelines.component.scss']
})
export class EmailTimelinesComponent implements OnInit {
  getContactHTML = getContactHTML;
  @Input('email') email: any = {};
  @Input('showContact') showContact = false;
  @Input('contacts')
  public set contacts(val: Contact[]) {
    val.forEach((e) => {
      this._contactObj[e._id] = e;
    });
  }
  @Input('timelines')
  public set timelines(val: DetailActivity[]) {
    this._timelines = val || [];
    this._timelines.sort((a, b) =>
      a.type === 'emails' ? 1 : a.created_at > b.created_at ? -1 : 1
    );
    if (this._timelines && this._timelines.length) {
      this.main = this._timelines[0];
    }
    this.basic = this._timelines.filter((e) => e.type === 'emails')[0];
    if (this.basic) {
      if (this.basic.videos instanceof Array) {
        this._includedMaterials = [...this.basic.videos];
      }
      if (this.basic.pdfs instanceof Array) {
        this._includedMaterials = [
          ...this._includedMaterials,
          ...this.basic.pdfs
        ];
      }
      if (this.basic.images instanceof Array) {
        this._includedMaterials = [
          ...this._includedMaterials,
          ...this.basic.images
        ];
      }
      this._firstM = this._includedMaterials[0];
    }
    if (this._includedMaterials.length) {
      this._timelines = this._timelines.filter(
        (e) => e.type !== 'videos' && e.type !== 'pdfs' && e.type !== 'images'
      );
    }
  }
  @Input('expanded') expanded: boolean = false;
  @Input('loading') loading: boolean = false;
  @Input('materials')
  public set materials(val) {
    this._materials = val;
  }
  @Output() onExpand = new EventEmitter();
  @Output() onCollapse = new EventEmitter();
  userId: string = '';
  SITE = environment.website;
  main: DetailActivity;
  basic: DetailActivity;
  _contactObj = {};
  _timelines: DetailActivity[] = [];
  _materials = {};
  _includedMaterials = [];
  _firstM: string;
  more = false;

  @ViewChild('materialDetailPortal') materialDetailPortal: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  detailMaterial;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private userService: UserService
  ) {
    const profile = this.userService.profile.getValue();
    this.userId = profile._id;
  }

  ngOnInit(): void {}

  expand(): void {
    this.onExpand.emit();
  }
  collapse(): void {
    this.more = false;
    this.onCollapse.emit();
  }

  openDetail(id: string, event: any): void {
    this.detailMaterial = this._materials[id];
    const originX = event.clientX;
    const originY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const size = {
      maxWidth: '260px',
      minWidth: '240px',
      maxHeight: 400,
      minHeight: 180
    };
    const positionStrategy = this.overlay.position().global();
    if (screenW - originX > 280) {
      positionStrategy.left(originX + 'px');
    } else if (originX > 280) {
      positionStrategy.left(originX - 280 + 'px');
    } else if (screenW - originX > 260) {
      positionStrategy.left(originX + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 420) {
      positionStrategy.centerVertically();
    } else if (originY < 190) {
      positionStrategy.top('10px');
    } else if (screenH - originY < 190) {
      positionStrategy.top(screenH - 410 + 'px');
    } else {
      positionStrategy.top(originY - 190 + 'px');
    }
    size['height'] = 'unset';
    this.templatePortal = new TemplatePortal(
      this.materialDetailPortal,
      this.viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
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
      this.overlayRef.outsidePointerEvents().subscribe(() => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }
}
