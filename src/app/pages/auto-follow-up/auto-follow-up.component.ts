import { Component, OnInit } from '@angular/core';
import { AUTO_FOLLOW_DELAY } from '../../constants/variable.constants';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auto-follow-up',
  templateUrl: './auto-follow-up.component.html',
  styleUrls: ['./auto-follow-up.component.scss']
})
export class AutoFollowUpComponent implements OnInit {
  watch_delay = '';
  notwatch_delay = '';
  watch_content = '';
  notwatch_content = '';
  delays;
  garbage: Garbage = new Garbage();
  saveDescription: Subscription;

  constructor(
    public userService: UserService,
    public location: Location,
    private toast: ToastrService
  ) {
    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });
  }

  ngOnInit(): void {
    this.delays = AUTO_FOLLOW_DELAY;
  }

  changeToggle(evt: any, follow_data: any, type: string): void {
    follow_data.enabled = evt.target.checked;
    this.save(type);
  }

  save(type: string): void {
    let data;
    switch (type) {
      case 'follow_up1':
        data = {
          auto_follow_up: this.garbage.auto_follow_up
        };
        break;
      case 'follow_up2':
        data = {
          auto_follow_up2: this.garbage.auto_follow_up2
        };
        break;
    }
    this.saveDescription && this.saveDescription.unsubscribe();
    this.saveDescription = this.userService
      .updateGarbage(data)
      .subscribe(() => {
        // this.toast.success('Auto Follow Up successfully updated.');
        this.userService.updateGarbageImpl(data);
      });
  }
}
