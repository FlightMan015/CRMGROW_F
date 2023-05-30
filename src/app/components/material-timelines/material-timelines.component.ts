import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DetailActivity } from 'src/app/models/activityDetail.model';
import { Material } from 'src/app/models/material.model';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-material-timelines',
  templateUrl: './material-timelines.component.html',
  styleUrls: ['./material-timelines.component.scss']
})
export class MaterialTimelinesComponent implements OnInit {
  @Input('material') material: Material = new Material();
  @Input('timelines')
  public set timelines(val: DetailActivity[]) {
    this._timelines = val;
    this._timelines.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
    if (this._timelines && this._timelines.length) {
      this.main = this._timelines[0];
      this.sendActivity = this._timelines.filter(
        (e) => e.type === 'videos' || e.type === 'pdfs' || e.type === 'images'
      )[0];
    }
  }
  @Input('expanded') expanded: boolean = false;
  @Input('type') type: string = 'videos';
  @Output() onExpand = new EventEmitter();
  @Output() onCollapse = new EventEmitter();
  user_id: string = '';
  main: DetailActivity;
  sendActivity: DetailActivity;
  _timelines: DetailActivity[] = [];
  SITE = environment.website;
  more = false;

  constructor(private userService: UserService) {
    const profile = this.userService.profile.getValue();
    this.user_id = profile._id;
  }

  ngOnInit(): void {}

  expand(): void {
    this.onExpand.emit();
  }
  collapse(): void {
    this.more = false;
    this.onCollapse.emit();
  }
}
