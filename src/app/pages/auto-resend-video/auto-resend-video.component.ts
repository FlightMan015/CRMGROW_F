import { Component, OnInit } from '@angular/core';
import { AUTO_RESEND_DELAY } from '../../constants/variable.constants';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-auto-resend-video',
  templateUrl: './auto-resend-video.component.html',
  styleUrls: ['./auto-resend-video.component.scss']
})
export class AutoResendVideoComponent implements OnInit {
  delays;
  garbage: Garbage = new Garbage();
  constructor(
    public userService: UserService,
    private location: Location,
    private toast: ToastrService
  ) {
    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });
  }

  ngOnInit(): void {
    this.delays = AUTO_RESEND_DELAY;
  }

  changeToggle(evt: any, resend_data: any, type: string): void {
    if (evt.target.checked) {
      if (
        !resend_data.email_canned_message &&
        !resend_data.sms_canned_message
      ) {
        evt.target.checked = false;
        this.toast.error('Please select email or sms template.');
      } else {
        resend_data.enabled = evt.target.checked;
        this.save(type);
      }
    } else {
      resend_data.enabled = evt.target.checked;
      this.save(type);
    }
  }

  save(type: string): void {
    let data;
    switch (type) {
      case 'resend1':
        data = {
          auto_resend: this.garbage.auto_resend
        };
        break;
      case 'resend2':
        data = {
          auto_resend2: this.garbage.auto_resend2
        };
        break;
    }
    this.userService.updateGarbage(data).subscribe(() => {
      // this.toast.success('Auto Resend Video successfully updated.');
      this.userService.updateGarbageImpl(data);
    });
  }
}
